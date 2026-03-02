const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT, "server", "data.sqlite");
const SEED_DIR = path.join(ROOT, "assets", "blog-seed");

const IMAGE_MAP = {
  smart_home_system_saudi_arabia_guide: {
    REPLACE_WITH_FEATURED_IMAGE_URL: "/uploads/images/2026/03/blog/smart-home-featured.jpg",
    REPLACE_WITH_SECTION_IMAGE_1_URL: "/uploads/images/2026/03/blog/smart-home-controls.jpg",
    REPLACE_WITH_SECTION_IMAGE_2_URL: "/uploads/images/2026/03/blog/smart-home-lock.jpg",
    REPLACE_WITH_SECTION_IMAGE_3_URL: "/uploads/images/2026/03/blog/smart-home-security.jpg",
    REPLACE_WITH_SECTION_IMAGE_4_URL: "/uploads/images/2026/03/blog/smart-home-thermostat.jpg",
  },
  smart_building_systems_saudi_arabia: {
    REPLACE_WITH_FEATURED_IMAGE_URL: "/uploads/images/2026/03/blog/smart-building-featured.jpg",
    REPLACE_WITH_SECTION_IMAGE_1_URL: "/uploads/images/2026/03/blog/smart-building-dashboard.jpg",
    REPLACE_WITH_SECTION_IMAGE_2_URL: "/uploads/images/2026/03/blog/smart-building-access.jpg",
    REPLACE_WITH_SECTION_IMAGE_3_URL: "/uploads/images/2026/03/blog/smart-building-security.jpg",
    REPLACE_WITH_SECTION_IMAGE_4_URL: "/uploads/images/2026/03/blog/smart-building-hvac.jpg",
  },
  smart_hotel_systems_saudi_arabia: {
    REPLACE_WITH_FEATURED_IMAGE_URL: "/uploads/images/2026/03/blog/smart-hotel-featured.jpg",
    REPLACE_WITH_SECTION_IMAGE_1_URL: "/uploads/images/2026/03/blog/smart-hotel-panel.jpg",
    REPLACE_WITH_SECTION_IMAGE_2_URL: "/uploads/images/2026/03/blog/smart-hotel-lock.jpg",
    REPLACE_WITH_SECTION_IMAGE_3_URL: "/uploads/images/2026/03/blog/smart-hotel-security.jpg",
    REPLACE_WITH_SECTION_IMAGE_4_URL: "/uploads/images/2026/03/blog/smart-hotel-room-control.jpg",
  },
};

function normalizeSlugKey(slug) {
  return String(slug || "").replace(/-/g, "_");
}

function stripQuotes(value) {
  const v = String(value || "").trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { meta: {}, body: content };

  const frontmatter = match[1];
  const body = content.slice(match[0].length);
  const meta = {};
  let currentArrayKey = null;

  frontmatter.split(/\r?\n/).forEach((line) => {
    const arrayItem = line.match(/^\s*-\s+(.*)$/);
    if (arrayItem && currentArrayKey) {
      if (!Array.isArray(meta[currentArrayKey])) meta[currentArrayKey] = [];
      meta[currentArrayKey].push(stripQuotes(arrayItem[1]));
      return;
    }

    const pair = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!pair) return;

    const key = pair[1];
    const rawValue = pair[2];
    if (!rawValue) {
      meta[key] = meta[key] || [];
      currentArrayKey = key;
      return;
    }

    currentArrayKey = null;
    meta[key] = stripQuotes(rawValue);
  });

  return { meta, body };
}

function inlineMarkdown(text) {
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const out = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      closeList();
      continue;
    }

    if (/^---+$/.test(line)) {
      closeList();
      out.push("<hr />");
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const img = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (img) {
      closeList();
      out.push(`<p><img src="${img[2]}" alt="${img[1]}" loading="lazy" /></p>`);
      continue;
    }

    const li = line.match(/^[-*]\s+(.+)$/);
    if (li) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inlineMarkdown(li[1])}</li>`);
      continue;
    }

    const quote = line.match(/^>\s+(.+)$/);
    if (quote) {
      closeList();
      out.push(`<blockquote><p>${inlineMarkdown(quote[1])}</p></blockquote>`);
      continue;
    }

    closeList();
    out.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  return out.join("\n");
}

function replaceImagePlaceholders(markdown, slug) {
  const key = normalizeSlugKey(slug);
  const map = IMAGE_MAP[key] || {};
  let next = markdown;
  Object.entries(map).forEach(([placeholder, value]) => {
    next = next.split(placeholder).join(value);
  });
  return next;
}

function upsertPost(db, post) {
  const existing = db.prepare("SELECT id FROM posts WHERE slug = ?").get(post.slug);
  if (existing) {
    db.prepare(
      "UPDATE posts SET title = ?, excerpt = ?, cover_image = ?, content_html = ?, tags_json = ?, published = 1 WHERE slug = ?"
    ).run(post.title, post.excerpt, post.cover_image, post.content_html, JSON.stringify(post.tags), post.slug);
    return { action: "updated", slug: post.slug };
  }

  db.prepare(
    "INSERT INTO posts (slug, title, excerpt, cover_image, content_html, tags_json, published) VALUES (?, ?, ?, ?, ?, ?, 1)"
  ).run(post.slug, post.title, post.excerpt, post.cover_image, post.content_html, JSON.stringify(post.tags));
  return { action: "created", slug: post.slug };
}

function run() {
  const files = ["blog_post_no1", "blog_post_no2", "blog_post_no3"].map((f) => path.join(SEED_DIR, f));
  const db = new Database(DB_PATH);

  const changes = [];
  files.forEach((file) => {
    const raw = fs.readFileSync(file, "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const slug = String(meta.slug || "").trim();
    if (!slug) return;

    const bodyWithImages = replaceImagePlaceholders(body, slug);
    const post = {
      slug,
      title: String(meta.title || "").trim(),
      excerpt: String(meta.excerpt || "").trim(),
      cover_image:
        (IMAGE_MAP[normalizeSlugKey(slug)] && IMAGE_MAP[normalizeSlugKey(slug)].REPLACE_WITH_FEATURED_IMAGE_URL) || "",
      content_html: markdownToHtml(bodyWithImages),
      tags: Array.isArray(meta.tags) ? meta.tags : [],
    };

    changes.push(upsertPost(db, post));
  });

  db.close();
  changes.forEach((c) => {
    console.log(`${c.action.toUpperCase()}: ${c.slug}`);
  });
}

run();
