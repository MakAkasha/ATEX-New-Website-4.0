function safeJsonParse(text, fallback) {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

function parsePositiveInt(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function nonEmptyString(value) {
  const s = String(value || "").trim();
  return s || null;
}

function toSqliteBool(value) {
  return value ? 1 : 0;
}

module.exports = {
  safeJsonParse,
  parsePositiveInt,
  nonEmptyString,
  toSqliteBool,
};
