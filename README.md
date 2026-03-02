# ATEX New Website

Official website project for **ATEX** — a Saudi technology company focused on delivering smart, scalable IoT and automation solutions.

## Stack

- Node.js + Express
- EJS SSR views
- Vanilla JS + CSS (RTL)
- SQLite (`better-sqlite3`)

## Quick Start (Development)

```bash
npm install
npm run dev
```

Server default URL: `http://127.0.0.1:5173`

## Production Setup

1. Copy env template:

```bash
copy .env.example .env
```

2. Update required values in `.env`:

- `NODE_ENV=production`
- `SESSION_SECRET` (**required**, 16+ chars)
- `SESSION_COOKIE_SECURE=true` (when using HTTPS)
- `TRUST_PROXY=true` (when behind reverse proxy)

3. Start app:

```bash
npm start
```

## Security & Hardening (implemented)

- Centralized environment config (`server/config.js`)
- Strict production checks for session secret
- Helmet security headers + CSP enabled
- Session hardening (`httpOnly`, `sameSite`, secure cookies in prod)
- Global and route-specific rate limiting (including contact form)
- Request/error structured logging
- Health endpoints:
  - `GET /healthz` (liveness)
  - `GET /readyz` (readiness + DB check)

## Default Admin Bootstrap (Optional)

For first-time setup only (change immediately before production):

```env
DEFAULT_ADMIN_ENABLED=true
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change-me-now
```

Behavior:
- Seeds default admin only when **admins table is empty**.
- If admin(s) already exist, no automatic overwrite.

Manual admin creation is also available:

```bash
npm run create-admin -- <username> <password>
```

## Social Proof Logos Convention

Home page social logos now support auto-discovery from:

`assets/social-logos/partner-1.svg`, `partner-2.svg`, ...

Rules:
- Files matching `partner-<number>.svg` are loaded automatically.
- Display order is numeric ascending.
- If no partner files are found, legacy fallback logos are used.

## Operations

### Database backup

```bash
npm run backup:db
```

Creates timestamped snapshots under `server/backups/` (main DB + WAL/SHM when present).

### Regression (smoke flow)

```bash
npm run regression -- --base http://127.0.0.1:5173 --user <admin-user> --pass <admin-pass>
```

## Scripts

- `npm run dev` — run with nodemon
- `npm start` — run production server
- `npm run backup:db` — backup SQLite files
- `npm run create-admin -- <u> <p>` — create admin account
- `npm run regression -- ...` — run regression script

## Developer

- **Mohamed Okasha**
- Website: **https://okasha.cv**
- GitHub: **https://github.com/MakAkasha**

---

If you need support, enhancements, or custom integrations for this project, please get in touch through the developer website.
