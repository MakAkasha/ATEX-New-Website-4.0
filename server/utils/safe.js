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

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;

    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
  }

  if (value == null) return !!fallback;
  return !!value;
}

function toSqliteBool(value, fallback = false) {
  return parseBoolean(value, fallback) ? 1 : 0;
}

module.exports = {
  safeJsonParse,
  parsePositiveInt,
  nonEmptyString,
  parseBoolean,
  toSqliteBool,
};
