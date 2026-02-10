const bcrypt = require("bcrypt");
const { getDb, migrate } = require("../db");

/**
 * Usage:
 *   node server/scripts/create-admin.js <username> <password>
 */

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  if (!username || !password) {
    console.error("Usage: node server/scripts/create-admin.js <username> <password>");
    process.exit(1);
  }

  migrate();
  const db = getDb();

  const hash = bcrypt.hashSync(password, 12);
  try {
    db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(username, hash);
    console.log(`Admin created: ${username}`);
  } catch (e) {
    console.error("Failed to create admin:", e.message || e);
    process.exit(1);
  }
}

main();
