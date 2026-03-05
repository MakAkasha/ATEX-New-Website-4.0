# Hostinger Deployment Guide — ATEX Website

## ⚠️ Hosting Requirement

This is a **Node.js server application** and requires:
- **Hostinger Node.js Hosting** (or VPS with Node.js)
- Node.js version **22.x** ✅
- **Cannot** run on Shared Hosting or WordPress Hosting

---

## Step 1 — Prepare the ZIP archive

### Files to INCLUDE in the ZIP:
```
admin/
assets/
data/
public/
server/
uploads/
views/
.env                  ← the production env file (MUST include)
.npmrc
index.html
package.json
package-lock.json
```

### Files to EXCLUDE from the ZIP:
```
node_modules/         ← never upload this, Hostinger installs it
.git/
.vscode/
tools/
server/data.sqlite-shm
server/data.sqlite-wal
DEPLOY.md
*.log
```

### How to create the ZIP (Windows PowerShell):
```powershell
# From inside the project folder (c:\Users\m2kak\Documents\at4)
# Select all needed files and compress — exclude node_modules and git

Compress-Archive -Path admin, assets, data, public, server, uploads, views, .env, .npmrc, index.html, package.json, package-lock.json -DestinationPath atex-deploy.zip -Force
```

> **Tip:** Make sure `.env` is visible. Since it starts with a dot, Windows File Explorer may hide it.
> Use PowerShell or 7-Zip to include it.

---

## Step 2 — Upload to Hostinger

1. Go to **Hostinger Dashboard → Websites → atex.sa → Deployments**
2. Click **"Deploy from source files"**
3. Upload `atex-deploy.zip`
4. Set the following deployment settings:

| Setting | Value |
|---|---|
| **Root directory** | `./` |
| **Framework** | Express |
| **Node version** | `22.x` |
| **Build command** | `npm install` |
| **Start command** | `npm start` |

5. Click **Deploy**

---

## Step 3 — Set Environment Variables (Recommended Method)

Instead of relying on the `.env` file, you can also set variables in the Hostinger panel:

**Go to: Websites → atex.sa → Advanced → Environment Variables**

Add the following:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | `5e08b2686549f009135735b7030e6bb477654ce75e43e1bb8d26df6792507987` |
| `SESSION_NAME` | `atex.sid` |
| `SESSION_COOKIE_SECURE` | `true` |
| `SESSION_SAME_SITE` | `lax` |
| `SESSION_MAX_AGE_MS` | `43200000` |
| `TRUST_PROXY` | `true` |
| `HOST` | `0.0.0.0` |
| `ENABLE_REQUEST_LOGS` | `true` |
| `CONTACT_EMAIL_FORWARD_ENABLED` | `true` |
| `CONTACT_EMAIL_TO` | `atexksa.iot@gmail.com` |
| `CSP_REPORT_ONLY` | `false` |

> **Do NOT set `PORT`** — Hostinger injects this automatically.

---

## Step 4 — First Admin Account Setup

After the app is running, create an admin account via **SSH terminal** in Hostinger:

```bash
# Connect to your Hostinger server via SSH, then navigate to the app folder
npm run create-admin -- admin YourStrongPassword123
```

Or alternatively, enable the bootstrap admin **temporarily** in Hostinger's environment variables:
```
DEFAULT_ADMIN_ENABLED=true
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=YourStrongPassword123
```

Then **redeploy**, log in at `/admin`, and **immediately** disable it by setting:
```
DEFAULT_ADMIN_ENABLED=false
```
and redeploy again.

---

## Step 5 — Verify Deployment

Check these URLs after deployment:

| URL | Expected |
|---|---|
| `https://atex.sa/healthz` | `{"ok":true,"env":"production",...}` |
| `https://atex.sa/readyz` | `{"ok":true,"db":true}` |
| `https://atex.sa/` | Homepage loads |
| `https://atex.sa/admin` | Admin login page |

---

## Common Errors & Fixes

### ❌ "Missing required SESSION_SECRET in production"
**Cause:** The `.env` file was not included in the ZIP, or environment variables were not set in Hostinger panel.
**Fix:** Make sure `.env` is in the ZIP root, OR set `SESSION_SECRET` in Hostinger's environment variables panel.

### ❌ Build succeeds but app crashes after 7 seconds
**Cause:** Almost always a missing `SESSION_SECRET`.
**Fix:** See above.

### ❌ "Cannot find module 'better-sqlite3'"
**Cause:** `node_modules` not installed. Hostinger's build command must run `npm install`.
**Fix:** Make sure the **build command** is set to `npm install` in deployment settings.

### ❌ Images not loading / uploads missing
**Cause:** The `uploads/` folder was not included in the ZIP.
**Fix:** Include the `uploads/` directory in the ZIP.

### ❌ Admin login not working
**Cause:** Fresh SQLite database has no admin users.
**Fix:** Run `npm run create-admin -- <username> <password>` via SSH, or use the `DEFAULT_ADMIN_ENABLED` bootstrap method above.

---

## SQLite Database Notes

- The database file is at `server/data.sqlite`
- **Include it in the ZIP** to preserve existing content (blog posts, products, settings)
- **Exclude** `server/data.sqlite-shm` and `server/data.sqlite-wal` (WAL temp files)
- If starting fresh (empty DB), just don't include `data.sqlite` — the app auto-migrates on first boot

---

## Security Checklist

- [ ] `SESSION_SECRET` is set and is 32+ characters
- [ ] `SESSION_COOKIE_SECURE=true` (HTTPS only)
- [ ] `TRUST_PROXY=true` (Hostinger uses a reverse proxy)
- [ ] `DEFAULT_ADMIN_ENABLED=false` after first login
- [ ] Admin password changed from default
- [ ] Domain has HTTPS/SSL enabled in Hostinger dashboard

---

## Folder Structure on Hostinger Server

```
/home/user/htdocs/atex.sa/
├── .env
├── .npmrc
├── index.html
├── package.json
├── package-lock.json
├── node_modules/          ← installed by Hostinger build step
├── admin/
├── assets/
├── data/
├── public/
├── server/
│   ├── app.js
│   ├── data.sqlite        ← your database
│   └── ...
├── uploads/
└── views/
```
