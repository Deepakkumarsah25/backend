import { isAdminSessionExpired } from "../services/adminSessionPolicy.js";

const COOKIE_NAME = "connect.sid";

const clearAdminCookie = (res) => res.clearCookie(COOKIE_NAME, {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
});

const isAjaxRequest = (req) => req.xhr ||
  req.path.startsWith("/api/") ||
  req.get("sec-fetch-dest") !== "document" && req.get("sec-fetch-mode") === "cors" ||
  (req.get("accept") || "").includes("application/json");

const rejectAdminSession = (req, res, { expired = false } = {}) => {
  res.set("Cache-Control", "no-store");
  if (expired) {
    res.set("X-Admin-Session-Status", "expired");
    clearAdminCookie(res);
  }

  const finish = () => {
    if (isAjaxRequest(req)) {
      return res.status(401).json({
        success: false,
        code: expired ? "ADMIN_SESSION_EXPIRED" : "ADMIN_LOGIN_REQUIRED",
        message: expired ? "Your admin session has expired. Please sign in again." : "Administrator login required.",
      });
    }
    return res.redirect(expired ? "/?session=expired" : "/");
  };

  if (!expired || !req.session) return finish();
  req.session.destroy(() => finish());
};

/** Require a server-side administrator session with a fixed, absolute deadline. */
export const requireAdmin = (req, res, next) => {
  res.set("Cache-Control", "no-store");
  const admin = req.session?.admin;
  if (!admin?._id) return rejectAdminSession(req, res);
  if (isAdminSessionExpired(req.session.adminSessionExpiresAt)) {
    return rejectAdminSession(req, res, { expired: true });
  }

  const fetchSite = req.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return res.status(403).send("Cross-site administrator requests are not allowed.");
  }

  const origin = req.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== req.get("host")) {
        return res.status(403).send("Cross-origin administrator requests are not allowed.");
      }
    } catch {
      return res.status(403).send("Invalid request origin.");
    }
  }

  res.locals.admin = admin;
  res.locals.adminSessionExpiresAt = Number(req.session.adminSessionExpiresAt);
  res.locals.adminSessionRemainingMs = Math.max(0, Number(req.session.adminSessionExpiresAt) - Date.now());
  return next();
};
