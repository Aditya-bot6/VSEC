
require("dotenv").config();

const path = require("path");
const readline = require("readline");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

(async () => {
  const db = new Database(
    path.join(__dirname, "data", "ndarba.db")
  );

  try {
    const username = (await ask("Admin username: ")).trim();
    const password = await ask("Enter new password (minimum 12 characters): ");

    if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) {
      throw new Error("Invalid username format.");
    }

    if (password.length < 12) {
      throw new Error("Password must contain at least 12 characters.");
    }

    const admin = db.prepare(
      "SELECT id FROM admins WHERE username = ?"
    ).get(username);

    if (!admin) {
      throw new Error("Admin username not found.");
    }

    const hash = await bcrypt.hash(password, 12);

    db.prepare(
      "UPDATE admins SET password_hash = ? WHERE id = ?"
    ).run(hash, admin.id);

    console.log("Password reset successfully!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    db.close();
    rl.close();
  }
})();
