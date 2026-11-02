import { randomBytes } from "node:crypto";

export const ADMIN_SESSION_TTL_MS = 30 * 60 * 1000;
export const ADMIN_SESSION_TTL_SECONDS = ADMIN_SESSION_TTL_MS / 1000;

export const createAdminSessionOptions = ({ secret, production, store }) => ({
  name: "connect.sid",
  secret,
  ...(store ? { store } : {}),
  resave: false,
  saveUninitialized: false,
  rolling: false,
  cookie: {
    secure: Boolean(production),
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_MS,
  },
});

export const validateProductionSessionConfig = (env = process.env) => {
  if (env.NODE_ENV !== "production") return;

  if (typeof env.SESSION_SECRET !== "string" || Buffer.byteLength(env.SESSION_SECRET, "utf8") < 32) {
    throw new Error("Production startup blocked: set SESSION_SECRET to a stable random value of at least 32 bytes.");
  }
  if (!env.MONGODB_URI) {
    throw new Error("Production startup blocked: MONGODB_URI is required for the shared admin session store.");
  }
};

export const isAdminSessionExpired = (expiresAt, now = Date.now()) => {
  const expiry = Number(expiresAt);
  return !Number.isFinite(expiry) || expiry <= now;
};

export const pinAdminSessionCookieExpiry = (req, res, next, now = Date.now()) => {
  const currentSession = req.session;
  if (!currentSession?.admin || isAdminSessionExpired(currentSession.adminSessionExpiresAt, now)) {
    return next();
  }

  const expiresAt = Number(currentSession.adminSessionExpiresAt);
  const originalTouch = currentSession.touch.bind(currentSession);
  currentSession.touch = () => {
    originalTouch();
    currentSession.cookie.maxAge = Math.max(0, expiresAt - Date.now());
    currentSession.cookie.expires = new Date(expiresAt);
  };
  res.locals.adminSessionExpiresAt = expiresAt;
  res.locals.adminSessionRemainingMs = Math.max(0, expiresAt - now);
  return next();
};

export const establishAdminSession = (req, admin, now = Date.now()) => new Promise((resolve, reject) => {
  if (!req.session?.regenerate) return reject(new Error("Admin session is unavailable."));

  req.session.regenerate((regenerateError) => {
    if (regenerateError) return reject(regenerateError);

    const expiresAt = now + ADMIN_SESSION_TTL_MS;
    req.session.admin = {
      _id: String(admin._id),
      email: admin.email,
      name: admin.name || "VIP Admin",
      role: admin.role || "Administrator",
    };
    req.session.adminSessionExpiresAt = expiresAt;
    req.session.cookie.maxAge = ADMIN_SESSION_TTL_MS;
    req.session.cookie.expires = new Date(expiresAt);
    const originalTouch = req.session.touch.bind(req.session);
    req.session.touch = () => {
      originalTouch();
      req.session.cookie.maxAge = Math.max(0, expiresAt - Date.now());
      req.session.cookie.expires = new Date(expiresAt);
    };

    req.session.save((saveError) => {
      if (saveError) return reject(saveError);
      resolve(expiresAt);
    });
  });
});

export const createDevelopmentSessionSecret = () => randomBytes(32).toString("hex");
