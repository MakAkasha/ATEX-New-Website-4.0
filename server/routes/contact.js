const express = require("express");
const rateLimit = require("express-rate-limit");
const { getDb } = require("../db");
const { getConfig } = require("../config");
const { nonEmptyString } = require("../utils/safe");

const router = express.Router();
const config = getConfig();

const contactLimiter = rateLimit({
  windowMs: config.contactRateLimitWindowMs,
  limit: config.contactRateLimitLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").toLowerCase());
}

function normalizeText(value, maxLen) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLen);
}

router.post("/", contactLimiter, (req, res) => {
  const name = normalizeText(nonEmptyString(req.body?.name) || "", 120);
  const email = normalizeText(nonEmptyString(req.body?.email) || "", 160).toLowerCase();
  const message = normalizeText(nonEmptyString(req.body?.message) || "", 3000);

  if (!name || !email || !message) {
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }
  if (name.length < 2) {
    return res.status(400).json({ error: "INVALID_NAME" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "INVALID_EMAIL" });
  }
  if (message.length < 10) {
    return res.status(400).json({ error: "MESSAGE_TOO_SHORT" });
  }

  const db = getDb();
  db.prepare(
    "INSERT INTO contact_submissions (name, email, message, ip, user_agent) VALUES (?, ?, ?, ?, ?)"
  ).run(
    name,
    email,
    message,
    String(req.ip || ""),
    String(req.headers["user-agent"] || "")
  );

  return res.json({ ok: true });
});

module.exports = router;
