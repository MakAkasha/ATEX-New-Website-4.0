function isAdminSession(req) {
  return !!(req && req.session && req.session.admin && req.session.admin.id);
}

function requireAdmin(req, res, next) {
  if (isAdminSession(req)) return next();
  return res.status(401).json({ error: "UNAUTHORIZED" });
}

function requireAdminPage(req, res, next) {
  if (isAdminSession(req)) return next();
  return res.redirect("/admin-login");
}

module.exports = { isAdminSession, requireAdmin, requireAdminPage };
