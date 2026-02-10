/*
  main.js
  - بنية جاهزة للتوسع: لاحقاً يمكن ربط المنتجات/المدونة/لوحة الإدارة بواجهة API.
  - حالياً: البيانات تأتي من ملفات JSON محلية.
*/

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function initNav() {
  const toggle = qs(".nav__toggle");
  const menu = qs("#navMenu");
  const backdrop = qs("[data-nav-backdrop]");
  if (!toggle || !menu) return;

  // Use GSAP for a premium open/close on mobile (fallback to class toggle)
  const canGsap = !prefersReducedMotion && window.gsap;
  let tl;
  if (canGsap) {
    const gsap = window.gsap;
    tl = gsap.timeline({ paused: true });
    tl.set(menu, { opacity: 0, y: -10, pointerEvents: "none" });
    tl.to(menu, { opacity: 1, y: 0, duration: 0.28, ease: "power2.out", pointerEvents: "auto" });
    tl.from(qsa(".nav__link, .btn", menu), { opacity: 0, y: 8, duration: 0.22, ease: "power2.out", stagger: 0.04 }, "<");
  }

  const close = () => {
    menu.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    if (tl) tl.reverse();
  };

  const open = () => {
    menu.classList.add("is-open");
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    if (tl) tl.play(0);
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    expanded ? close() : open();
  });

  // Close on link click (mobile)
  qsa("a.nav__link", menu).forEach((a) => a.addEventListener("click", close));

  // Close on outside click
  document.addEventListener("click", (e) => {
    const isToggle = toggle.contains(e.target);
    const isMenu = menu.contains(e.target);
    const isBackdrop = backdrop && backdrop.contains(e.target);
    if (isBackdrop) return close();
    if (!isToggle && !isMenu) close();
  });

  // Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function initHeaderMotion() {
  const header = qs(".header");
  const topbar = qs(".topbar");
  if (!header) return;

  const hasHeroVideo = !!qs(".heroVideo");
  document.body.classList.toggle("has-hero-video", hasHeroVideo);

  const syncOverlayTopbarHeight = () => {
    if (!hasHeroVideo || !topbar) return;
    const h = Math.max(0, Math.round(topbar.offsetHeight || 0));
    document.body.style.setProperty("--overlay-topbar-h", `${h}px`);
  };

  const onScroll = () => {
    const scrolled = (window.scrollY || 0) > 18;
    header.classList.toggle("is-scrolled", scrolled);
    if (topbar) topbar.classList.toggle("is-scrolled", scrolled);
  };

  syncOverlayTopbarHeight();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", syncOverlayTopbarHeight);

  // Small nav-link entrance for a modern polished feel
  if (!prefersReducedMotion && window.gsap) {
    const links = qsa(".nav__menu .nav__link");
    if (links.length) {
      window.gsap.from(links, {
        y: -8,
        opacity: 0,
        duration: 0.45,
        ease: "power2.out",
        stagger: 0.035,
        delay: 0.1,
      });
    }
  }
}

function initScrollSpy() {
  const links = qsa("a.nav__link[data-scrollspy]");
  if (!links.length) return;
  const sections = links
    .map((a) => {
      const href = a.getAttribute("href") || "";
      const id = href.includes("#") ? href.split("#")[1] : "";
      const el = id ? document.getElementById(id) : null;
      return { a, id, el };
    })
    .filter((x) => x.el);

  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach((a) => a.classList.remove("is-active"));
    const match = sections.find((s) => s.id === id);
    if (match) match.a.classList.add("is-active");
  };

  const header = qs(".header");
  const rootMarginTop = header ? Math.max(40, header.offsetHeight + 16) : 90;
  const io = new IntersectionObserver(
    (entries) => {
      // Pick the most visible intersecting section
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
      if (visible[0]) setActive(visible[0].target.id);
    },
    {
      root: null,
      threshold: [0.25, 0.35, 0.5, 0.65],
      rootMargin: `-${rootMarginTop}px 0px -55% 0px`,
    }
  );
  sections.forEach((s) => io.observe(s.el));

  // Ensure an initial active
  const first = sections.find((s) => location.hash === `#${s.id}`) || sections[0];
  if (first) setActive(first.id);
}

function initFaq() {
  // Fallback behavior when GSAP isn't available.
  // If GSAP is present, we do a richer height animation inside initGsap().
  if (!prefersReducedMotion && window.gsap) return;

  const items = qsa(".faq__item");
  if (!items.length) return;

  items.forEach((item) => {
    const btn = qs(".faq__q", item);
    const ans = qs(".faq__a", item);
    const icon = qs(".faq__icon", item);
    if (!btn || !ans) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      // close others
      items.forEach((x) => {
        if (x !== item) x.classList.remove("is-open");
      });
      item.classList.toggle("is-open", !isOpen);
      if (icon) icon.textContent = item.classList.contains("is-open") ? "–" : "+";
    });
  });
}

async function loadJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`فشل تحميل البيانات: ${path}`);
  return res.json();
}

function renderProducts(items) {
  const grid = qs("#productsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  items.forEach((p) => {
    const el = document.createElement("article");
    el.className = "item";
    el.setAttribute("data-tilt", "");
    el.innerHTML = `
      <div class="item__media">
        <img src="${p.image}" alt="${p.title}" loading="lazy" />
      </div>
      <div class="item__body">
        <div class="item__tag">${p.category}</div>
        <h3 class="item__title">${p.title}</h3>
        <p class="item__desc">${p.description}</p>
        <div class="item__actions">
          <a class="btn btn--primary btn--small" href="#contact">اطلب عرضاً</a>
          <a class="btn btn--ghost btn--small" href="#" aria-disabled="true" tabindex="-1">تحميل كتيّب (قريباً)</a>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });
}

function renderPosts(items) {
  const grid = qs("#postsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  items.forEach((p) => {
    const el = document.createElement("article");
    el.className = "item";
    el.setAttribute("data-tilt", "");
    el.innerHTML = `
      <div class="item__media">
        <img src="${p.image}" alt="${p.title}" loading="lazy" />
      </div>
      <div class="item__body">
        <div class="item__tag">${p.meta}</div>
        <h3 class="item__title">${p.title}</h3>
        <p class="item__desc">${p.excerpt}</p>
        <div class="item__actions">
          <a class="btn btn--ghost btn--small" href="#contact">اقرأ المزيد (عبر تواصل)</a>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });
}

function initTilt() {
  // Micro-interaction without external libs.
  const cards = qsa("[data-tilt]");
  if (!cards.length) return;

  cards.forEach((card) => {
    let raf = 0;
    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * 7;
      const ry = (px - 0.5) * 9;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
    };

    const reset = () => {
      card.style.transform = "";
    };

    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", reset);
  });
}

function initGsap() {
  if (prefersReducedMotion) return;
  if (!window.gsap) return;

  const gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  // Intro
  gsap.set([".hero__copy > *", ".hero__scene"], { opacity: 0, y: 22 });
  gsap.to(".hero__copy > *", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.08 });
  gsap.to(".hero__scene", { opacity: 1, y: 0, duration: 1.0, ease: "power3.out", delay: 0.2 });

  // Loop orbs
  gsap.to(".orb--a", { y: 18, x: -10, duration: 4.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
  gsap.to(".orb--b", { y: -20, x: 12, duration: 5.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
  gsap.to(".orb--c", { y: 16, x: 10, duration: 3.7, yoyo: true, repeat: -1, ease: "sine.inOut" });
  gsap.to(".glass__sparkline span", { height: "random(8, 42)", duration: 1.1, stagger: 0.08, repeat: -1, yoyo: true, ease: "sine.inOut" });

  // Counters (stats)
  qsa(".stat").forEach((stat) => {
    const target = Number(stat.getAttribute("data-count") || "0");
    const num = qs(".stat__num", stat);
    if (!num) return;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.4,
      ease: "power2.out",
      onUpdate: () => (num.textContent = String(Math.round(obj.v))),
      scrollTrigger: {
        trigger: stat,
        start: "top 85%",
      },
    });
  });

  // Scroll reveal
  const sections = qsa(".section");
  sections.forEach((sec) => {
    const isWhySection = sec.id === "why";
    const items = isWhySection ? qsa(".section__head", sec) : qsa(".section__head, .grid > *, .banner, .cta, .footer", sec);
    if (!items.length) return;

    gsap.from(items, {
      opacity: 0,
      y: 26,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.06,
      scrollTrigger: {
        trigger: sec,
        start: "top 78%",
      },
    });
  });

  // Subtle button hover pop
  qsa(".btn, .chip").forEach((el) => {
    el.addEventListener("mouseenter", () => gsap.to(el, { scale: 1.02, duration: 0.18, ease: "power2.out" }));
    el.addEventListener("mouseleave", () => gsap.to(el, { scale: 1.0, duration: 0.22, ease: "power2.out" }));
  });

  // WHY cards: depth stagger + soft floating loop
  const why = qs("#why");
  if (why) {
    const cards = qsa(".card", why);
    if (cards.length) {
      gsap.from(cards, {
        opacity: 0,
        y: 28,
        rotateX: 8,
        immediateRender: false,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: why, start: "top 75%" },
      });

      cards.forEach((card, i) => {
        // Gentle idle float (phase shifted)
        gsap.to(card, {
          y: i % 2 === 0 ? -6 : -10,
          duration: 2.8 + i * 0.25,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });
    }
  }

  // PROCESS: line progress + dot pulses + item reveal
  const process = qs("#process");
  const timeline = process ? qs(".timeline", process) : null;
  if (timeline && window.ScrollTrigger) {
    const items = qsa(".timeline__item", timeline);
    const dots = qsa(".timeline__dot", timeline);

    gsap.from(items, {
      opacity: 0,
      x: 18,
      duration: 0.7,
      ease: "power2.out",
      stagger: 0.08,
      scrollTrigger: { trigger: timeline, start: "top 75%" },
    });

    // Animate a CSS custom property used by the line pseudo
    gsap.fromTo(
      timeline,
      { "--lineX": 0 },
      {
        "--lineX": 1,
        ease: "none",
        scrollTrigger: {
          trigger: timeline,
          start: "top 80%",
          end: "bottom 40%",
          scrub: true,
        },
      }
    );

    dots.forEach((dot) => {
      gsap.to(dot, {
        scale: 1.2,
        duration: 0.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        scrollTrigger: { trigger: timeline, start: "top 90%", end: "bottom 10%", toggleActions: "play pause resume pause" },
      });
    });
  }

  // INTEGRATIONS: subtle parallax + glow in
  const integrations = qs("#integrations");
  if (integrations && window.ScrollTrigger) {
    const chips = qsa(".marquee__chip", integrations);
    gsap.from(chips, {
      opacity: 0,
      y: 10,
      duration: 0.5,
      ease: "power2.out",
      stagger: 0.02,
      scrollTrigger: { trigger: integrations, start: "top 80%" },
    });

    const bg = qs(".section__head", integrations);
    if (bg) {
      gsap.to(bg, {
        y: -10,
        ease: "none",
        scrollTrigger: { trigger: integrations, start: "top bottom", end: "bottom top", scrub: true },
      });
    }
  }

  // FAQ: height animation + stagger on first view
  const faq = qs("#faq");
  if (faq) {
    const items = qsa(".faq__item", faq);
    if (items.length && window.ScrollTrigger) {
      gsap.from(items, {
        opacity: 0,
        y: 18,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: { trigger: faq, start: "top 78%" },
      });
    }

    // Animate open/close
    items.forEach((item) => {
      const btn = qs(".faq__q", item);
      const ans = qs(".faq__a", item);
      if (!btn || !ans) return;

      // Set initial state for GSAP height animation
      gsap.set(ans, { height: 0, overflow: "hidden", display: "block" });
      const autoH = () => ans.scrollHeight;

      btn.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");
        // Close others (animated)
        items.forEach((x) => {
          if (x === item) return;
          if (!x.classList.contains("is-open")) return;
          x.classList.remove("is-open");
          const a = qs(".faq__a", x);
          if (a) gsap.to(a, { height: 0, duration: 0.28, ease: "power2.out" });
          const ic = qs(".faq__icon", x);
          if (ic) ic.textContent = "+";
        });

        item.classList.toggle("is-open", !isOpen);
        const icon = qs(".faq__icon", item);
        if (icon) icon.textContent = item.classList.contains("is-open") ? "–" : "+";

        gsap.to(ans, {
          height: item.classList.contains("is-open") ? autoH : 0,
          duration: 0.32,
          ease: "power2.out",
        });
      });
    });
  }
}

async function bootstrap() {
  initHeaderMotion();
  initNav();
  initFaq();
  initScrollSpy();

  // Data-driven render
  try {
    const [productsRes, posts] = await Promise.all([
      fetch("/api/products/public", { cache: "no-store" }).then(async (r) => {
        if (!r.ok) throw new Error("PUBLIC_PRODUCTS_API_FAILED");
        return r.json();
      }),
      loadJson("data/posts.json"),
    ]);
    const products = Array.isArray(productsRes?.products) ? productsRes.products : [];
    renderProducts(products);
    renderPosts(posts);
  } catch (e) {
    // Fallback to static JSON if API is unavailable.
    Promise.all([loadJson("data/products.json"), loadJson("data/posts.json")])
      .then(([products, posts]) => {
        renderProducts(products);
        renderPosts(posts);
      })
      .catch((err) => console.warn(err || e));
  }

  initTilt();
  initGsap();
}

document.addEventListener("DOMContentLoaded", bootstrap);
