const path = require("path");
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { migrate } = require("./db");
const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const postsRoutes = require("./routes/posts");
const productsRoutes = require("./routes/products");
const uploadsRoutes = require("./routes/uploads");
const trackingRoutes = require("./routes/tracking");
const contactRoutes = require("./routes/contact");
const { router: customPagesRoutes } = require("./routes/customPages");
const { router: settingsRoutes } = require("./routes/settings");
const pagesRoutes = require("./routes/pages");

const app = express();

// Views (EJS) for server-rendered pages like blog/legal
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

// Migrate DB on boot
migrate();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // we will set CSP later once we finalize CDN usage (GSAP/FontAwesome/Quill)
  })
);

// Rate limit (general)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(
  session({
    name: "atex.sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true behind HTTPS (or trust proxy)
      maxAge: 1000 * 60 * 60 * 12, // 12h
    },
  })
);

// Static public site
app.use("/assets", express.static(path.join(process.cwd(), "assets")));
app.use("/data", express.static(path.join(process.cwd(), "data")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Admin static (disable directory redirect so /admin can be handled by router)
app.use(
  "/admin",
  express.static(path.join(process.cwd(), "admin"), {
    redirect: false,
  })
);

// APIs
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/custom-pages", customPagesRoutes);
app.use("/api/track", trackingRoutes);
app.use("/api/contact", contactRoutes);

// Pages (SSR later; currently sends static HTML files)
app.use(pagesRoutes);

// Basic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  // If Express/router sets a status (e.g. URIError on malformed % encodings => 400),
  // preserve it instead of always forcing 500.
  const status = Number(err.status || err.statusCode || 500);
  if (status >= 400 && status < 600) {
    return res.status(status).json({ error: status === 500 ? "SERVER_ERROR" : "BAD_REQUEST" });
  }
  return res.status(500).json({ error: "SERVER_ERROR" });
});

const port = Number(process.env.PORT || 5173);
app.listen(port, "127.0.0.1", () => {
  console.log(`[ATEX] server running on http://127.0.0.1:${port}`);
});
