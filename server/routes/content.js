const express = require("express");
const { getDb } = require("../db");
const { requireAdmin } = require("../auth");
const { normalizeHomeContent } = require("../homeSchema");
const { safeJsonParse } = require("../utils/safe");

const router = express.Router();

router.get("/home", (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT content_json FROM home_content WHERE id = 1").get();
  const content = safeJsonParse(row ? row.content_json : "", null);
  // Always return a normalized, complete object (prevents admin UI crashes)
  res.json({ content: normalizeHomeContent(content) });
});

router.put("/home", requireAdmin, (req, res) => {
  const content = req.body && req.body.content;
  if (!content || typeof content !== "object") return res.status(400).json({ error: "INVALID_CONTENT" });

  const db = getDb();
  const normalized = normalizeHomeContent(content);
  db.prepare("UPDATE home_content SET content_json = ? WHERE id = 1").run(JSON.stringify(normalized));
  res.json({ ok: true });
});

module.exports = router;
