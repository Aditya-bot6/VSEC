require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "ndarba.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

(async () => {
  try {
    const username = (await ask("Choose admin username: ")).trim();
    const password = await ask("Choose admin password (minimum 12 characters): ");
    if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) {
      throw new Error("Username must be 3–40 characters and use only letters, numbers, dot, underscore, or hyphen.");
    }
    if (password.length < 12) throw new Error("Use a password with at least 12 characters.");
    const hash = await bcrypt.hash(password, 12);
    db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(username, hash);
    console.log(`Admin "${username}" created. Keep your password private.`);
  } catch (err) {
    console.error(`Could not create admin: ${err.message}`);
    process.exitCode = 1;
  } finally {
    db.close();
    rl.close();
  }
})();
