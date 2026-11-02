import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_SESSION_TTL_MS,
  createAdminSessionOptions,
  establishAdminSession,
  isAdminSessionExpired,
  validateProductionSessionConfig,
} from "../services/adminSessionPolicy.js";

const createFakeSession = (sessionId) => {
  const cookie = {
    originalMaxAge: ADMIN_SESSION_TTL_MS,
    maxAge: ADMIN_SESSION_TTL_MS,
    expires: null,
  };
  return {
    id: sessionId,
    cookie,
    touch() {
      cookie.expires = new Date(Date.now() + cookie.originalMaxAge);
    },
    save(callback) { callback(null); },
  };
};

test("production startup rejects missing or weak stable session secrets", () => {
  assert.throws(
    () => validateProductionSessionConfig({ NODE_ENV: "production", MONGODB_URI: "configured" }),
    /SESSION_SECRET/,
  );
  assert.throws(
    () => validateProductionSessionConfig({ NODE_ENV: "production", MONGODB_URI: "configured", SESSION_SECRET: "short" }),
    /SESSION_SECRET/,
  );
  assert.throws(
    () => validateProductionSessionConfig({ NODE_ENV: "production", SESSION_SECRET: "a".repeat(32) }),
    /MONGODB_URI/,
  );
  assert.doesNotThrow(() => validateProductionSessionConfig({
    NODE_ENV: "production",
    MONGODB_URI: "configured",
    SESSION_SECRET: "a".repeat(32),
  }));
  assert.doesNotThrow(() => validateProductionSessionConfig({ NODE_ENV: "development" }));
});

test("production cookie policy uses secure fixed-expiry settings and shared store", () => {
  const store = { kind: "shared" };
  const options = createAdminSessionOptions({ secret: "stable-secret", production: true, store });
  assert.equal(options.store, store);
  assert.equal(options.rolling, false);
  assert.equal(options.cookie.httpOnly, true);
  assert.equal(options.cookie.secure, true);
  assert.equal(options.cookie.sameSite, "strict");
  assert.equal(options.cookie.maxAge, ADMIN_SESSION_TTL_MS);
  assert.equal(options.cookie.path, "/");
});

test("admin login regenerates and saves a server-side session with a fixed 30-minute deadline", async () => {
  let nextSessionId = "anonymous-session";
  const req = {
    session: {
      ...createFakeSession(nextSessionId),
      regenerate(callback) {
        nextSessionId = "rotated-session";
        req.session = createFakeSession(nextSessionId);
        callback(null);
      },
    },
  };
  const loginTime = 1_800_000_000_000;
  const expiresAt = await establishAdminSession(req, {
    _id: "admin-id",
    email: "admin@example.test",
    name: "Admin",
    role: "Administrator",
    password: "must-not-be-copied",
  }, loginTime);

  assert.equal(nextSessionId, "rotated-session");
  assert.equal(expiresAt, loginTime + ADMIN_SESSION_TTL_MS);
  assert.equal(req.session.adminSessionExpiresAt, expiresAt);
  assert.equal(req.session.cookie.expires.getTime(), expiresAt);
  assert.equal(req.session.cookie.originalMaxAge, ADMIN_SESSION_TTL_MS);
  assert.deepEqual(req.session.admin, {
    _id: "admin-id",
    email: "admin@example.test",
    name: "Admin",
    role: "Administrator",
  });
  assert.equal("password" in req.session.admin, false);

  // A request at minute 29 invokes session.touch, but the persisted and browser expiry stay absolute.
  const originalNow = Date.now;
  Date.now = () => loginTime + 29 * 60 * 1000;
  try {
    req.session.touch();
  } finally {
    Date.now = originalNow;
  }
  assert.equal(req.session.cookie.expires.getTime(), expiresAt);
  assert.equal(req.session.cookie.maxAge, 60_000);
});

test("expiry is absolute at the exact deadline and cannot be extended by activity", () => {
  const loginTime = 1_800_000_000_000;
  const expiresAt = loginTime + ADMIN_SESSION_TTL_MS;
  assert.equal(isAdminSessionExpired(expiresAt, expiresAt - 1), false);
  assert.equal(isAdminSessionExpired(expiresAt, expiresAt), true);
  assert.equal(isAdminSessionExpired(expiresAt, expiresAt + 60_000), true);
  assert.equal(isAdminSessionExpired(undefined, loginTime), true);
});
