
 // PUBLIC NOTICES API
app.get("/api/public/notices", (req, res, next) => {
  try {
    const now = new Date().toISOString();

    const notices = db.prepare(`
      SELECT id, title, body, created_at, expires_at
      FROM notices
      WHERE is_published = 1
        AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY datetime(created_at) DESC, id DESC
    `).all(now);

    res.set("Cache-Control", "no-store");
    res.json(notices);
  } catch (error) {
    next(error);
  }
});



// ============================================================
// ADMIN NOTICES API
// ============================================================
// Only logged-in admins can create, view, or delete notices.

app.get("/api/notices", requireAdmin, (req, res, next) => {
  try {
    const notices = db.prepare(`
      SELECT id, title, body, created_at
      FROM notices
      ORDER BY datetime(created_at) DESC, id DESC
    `).all();

    res.json(notices);
  } catch (error) {
    next(error);
  }
});


app.post("/api/notices", requireAdmin, (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();

    const isPublished =
      req.body.is_published === true ||
      req.body.is_published === 1 ||
      req.body.is_published === "1" ||
      req.body.is_published === "true" ||
      req.body.is_published === "on";

    const expiryInput = String(req.body.expires_at || "").trim();
    let expiresAt = null;

    if (expiryInput) {
      const expiryDate = new Date(expiryInput);

      if (Number.isNaN(expiryDate.getTime())) {
        return res.status(400).json({
          error: "Invalid expiry date and time."
        });
      }

      expiresAt = expiryDate.toISOString();
    }

    if (!title || !body) {
      return res.status(400).json({
        error: "Title and notice text are required."
      });
    }

    if (title.length > 160 || body.length > 5000) {
      return res.status(400).json({
        error: "Title or notice text is too long."
      });
    }

    const result = db.prepare(`
      INSERT INTO notices
        (title, body, is_published, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(title, body, isPublished ? 1 : 0, expiresAt);

    const notice = db.prepare(`
      SELECT id, title, body, created_at, is_published, expires_at
      FROM notices
      WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(notice);
  } catch (error) {
    next(error);
  }
});


app.delete("/api/notices/:id", requireAdmin, (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        error: "Invalid notice ID."
      });
    }

    const result = db.prepare(
      "DELETE FROM notices WHERE id = ?"
    ).run(id);

    if (!result.changes) {
      return res.status(404).json({
        error: "Notice not found."
      });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});