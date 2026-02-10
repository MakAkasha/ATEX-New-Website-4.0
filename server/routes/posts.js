const express = require("express");
const sanitizeHtml = require("sanitize-html");
const { getDb } = require("../db");
const { requireAdmin } = require("../auth");
const { safeJsonParse, parsePositiveInt, nonEmptyString, toSqliteBool } = require("../utils/safe");

const router = express.Router();

function sanitizePostHtml(html) {
  return sanitizeHtml(html || "", {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "h4", "span"]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      "*": ["style", "class"],
    },
    allowedSchemes: ["http", "https", "data"],
  });
}

// Public list (published only)
router.get("/public", (req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, slug, title, excerpt, cover_image, tags_json, created_at, updated_at FROM posts WHERE published = 1 ORDER BY created_at DESC")
    .all();
  res.json({ posts: rows.map((r) => ({ ...r, tags: safeJsonParse(r.tags_json, []) })) });
});

// Admin list
router.get("/", requireAdmin, (req, res) => {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
  res.json({ posts: rows.map((r) => ({ ...r, tags: safeJsonParse(r.tags_json, []) })) });
});

router.post("/", requireAdmin, (req, res) => {
  const { slug, title, excerpt, cover_image, content_html, tags, published } = req.body || {};
  const cleanSlug = nonEmptyString(slug);
  const cleanTitle = nonEmptyString(title);
  if (!cleanSlug || !cleanTitle) return res.status(400).json({ error: "MISSING_FIELDS" });

  const db = getDb();
  const clean = sanitizePostHtml(content_html);
  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);
  const info = db
    .prepare(
      "INSERT INTO posts (slug, title, excerpt, cover_image, content_html, tags_json, published) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(cleanSlug, cleanTitle, excerpt || "", cover_image || "", clean, tagsJson, toSqliteBool(published));

  res.json({ ok: true, id: info.lastInsertRowid });
});

router.put("/:id", requireAdmin, (req, res) => {
  const id = parsePositiveInt(req.params.id);
  const { slug, title, excerpt, cover_image, content_html, tags, published } = req.body || {};
  const cleanSlug = nonEmptyString(slug);
  const cleanTitle = nonEmptyString(title);
  if (!id || !cleanSlug || !cleanTitle) return res.status(400).json({ error: "MISSING_FIELDS" });

  const db = getDb();
  const clean = sanitizePostHtml(content_html);
  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

  db.prepare(
    "UPDATE posts SET slug=?, title=?, excerpt=?, cover_image=?, content_html=?, tags_json=?, published=? WHERE id=?"
  ).run(cleanSlug, cleanTitle, excerpt || "", cover_image || "", clean, tagsJson, toSqliteBool(published), id);

  res.json({ ok: true });
});

router.delete("/:id", requireAdmin, (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) return res.status(400).json({ error: "INVALID_ID" });
  const db = getDb();
  db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  res.json({ ok: true });
});

module.exports = router;
