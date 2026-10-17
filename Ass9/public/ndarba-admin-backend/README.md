# NDARBA Admin Backend

This project replaces the browser-only `Aditya` / `Aditya` test with server-side username/password authentication.

## Requirements
- Node.js 18 or newer
- npm

## Run locally

1. Extract the ZIP and open a terminal in this folder.
2. Install packages:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`. Change `SESSION_SECRET` to a long random secret (at least 32 characters). Keep `.env` private and never upload it to GitHub.
4. Create the first administrator:

   ```bash
   npm run create-admin
   ```

   Enter the username you want and a strong password of at least 12 characters. The password is stored as a bcrypt hash, not plaintext. There are no default credentials.
5. Start the server:

   ```bash
   npm start
   ```

6. Open `http://localhost:3000/login.html` and sign in using the credentials you created.

## What is included
- `public/login.html`: username + password form, Remember Me, error display, and theme toggle.
- `server.js`: Express API, server-side login validation, session cookies, rate limiting, and protected admin route.
- `data/ndarba.db`: created automatically on first admin creation; stores admin hashes and notices.
- SQLite-backed sessions.
- `public/admin.html`: protected starter dashboard with notice create/list/delete.
- `create-admin.js`: interactive admin creation script.

## Important deployment notes
- This ZIP is a backend starter and a login/dashboard implementation, not a full copy of all pages on your existing website. Put your existing website pages/assets into `public/` if you want this server to serve them too.
- The backend must run on a Node.js-capable host. A static-only host cannot run `server.js`.
- Use HTTPS in production. Set `NODE_ENV=production`, set a strong `SESSION_SECRET`, and configure `TRUST_PROXY=true` only if your host is behind a trusted reverse proxy that forwards HTTPS correctly.
- Back up the `data/` directory securely. Never commit `.env`, the database, or session database.
- The public homepage does not yet read the notices API. The dashboard saves notices securely, but showing them on `index.html` requires a separate integration.
- Do not use a weak password or share admin credentials.
