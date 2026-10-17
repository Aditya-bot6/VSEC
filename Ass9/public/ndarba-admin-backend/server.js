require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const SQLiteStoreFactory = require("connect-sqlite3");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";
const trustProxy = process.env.TRUST_PROXY === "true";

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error("ERROR: Set SESSION_SECRET in .env to a random string of at least 32 characters.");
  process.exit(1);
}

if (trustProxy) app.set("trust proxy", 1);

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "ndarba.db"));
db.pragma("journal_mode = WAL");
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

const SQLiteStore = SQLiteStoreFactory(session);
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

app.use(session({
  name: "ndarba_admin_session",
  store: new SQLiteStore({
    db: "sessions.db",
    dir: dataDir,
    table: "sessions",
    concurrentDB: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8
  }
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait 15 minutes and try again." }
});

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.adminId) {
    if (req.path.startsWith("/api/")) return res.status(401).json({ error: "Please log in first." });
    return res.redirect("/login.html");
  }
  next();
}

app.get("/", (req, res) => res.redirect("/login.html"));
app.get("/admin.html", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.post("/api/login", loginLimiter, async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const rememberMe = req.body.rememberMe === true || req.body.rememberMe === "true" || req.body.rememberMe === "on";

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const admin = db.prepare("SELECT id, username, password_hash FROM admins WHERE username = ?").get(username);
    const valid = admin ? await bcrypt.compare(password, admin.password_hash) : false;

    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.adminId = admin.id;
      req.session.adminUsername = admin.username;
      req.session.cookie.maxAge = rememberMe
        ? 1000 * 60 * 60 * 24 * 7
        : 1000 * 60 * 60 * 8;

      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.json({ ok: true, redirect: "/admin.html" });
      });
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/me", requireAdmin, (req, res) => {
  res.json({ username: req.session.adminUsername });
});

app.post("/api/logout", requireAdmin, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("ndarba_admin_session", {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction
    });
    res.json({ ok: true, redirect: "/login.html" });
  });
});

// Example admin-only CRUD API for website notices.
// These notices are stored in SQLite; connecting them to your public homepage is a separate integration step.
app.get("/api/notices", requireAdmin, (req, res) => {
  const notices = db.prepare("SELECT id, title, body, created_at FROM notices ORDER BY id DESC").all();
  res.json(notices);
});

app.post("/api/notices", requireAdmin, (req, res) => {
  const title = String(req.body.title || "").trim();
  const body = String(req.body.body || "").trim();
  if (!title || !body) return res.status(400).json({ error: "Title and notice text are required." });
  if (title.length > 160 || body.length > 5000) return res.status(400).json({ error: "Title or notice text is too long." });
  const result = db.prepare("INSERT INTO notices (title, body) VALUES (?, ?)").run(title, body);
  const notice = db.prepare("SELECT id, title, body, created_at FROM notices WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(notice);
});

app.delete("/api/notices/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "Invalid notice ID." });
  const result = db.prepare("DELETE FROM notices WHERE id = ?").run(id);
  if (!result.changes) return res.status(404).json({ error: "Notice not found." });
  res.json({ ok: true });
});

app.get("/api/public-notices", (req, res) => {
  try {
    const now = new Date().toISOString();

    const notices = db.prepare(`
      SELECT id, title, body, created_at, expires_at
      FROM notices
      WHERE is_published = 1
        AND (
          expires_at IS NULL
          OR expires_at > ?
        )
      ORDER BY id DESC
    `).all(now);

    res.set("Cache-Control", "no-store");
    res.json(notices);
  } catch (error) {
    console.error("Error loading public notices:", error);
    res.status(500).json({
      error: "Failed to load public notices"
    });
  }
});

// Static pages are served after the protected /admin.html route.
app.use(express.static(path.join(__dirname, "public"), {
  dotfiles: "deny",
  index: false
}));

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(PORT, () => {
  console.log(`NDARBA admin backend running at http://localhost:${PORT}`);
  console.log("Do not expose this service publicly until .env and HTTPS deployment are configured.");
});

const noticeColumns = db
  .prepare("PRAGMA table_info(notices)")
  .all()
  .map(column => column.name);

if (!noticeColumns.includes("is_published")) {
  db.exec(`
    ALTER TABLE notices
    ADD COLUMN is_published INTEGER NOT NULL DEFAULT 0
  `);
}

if (!noticeColumns.includes("expires_at")) {
  db.exec(`
    ALTER TABLE notices
    ADD COLUMN expires_at TEXT
  `);
}

