import test from "node:test";
import assert from "node:assert/strict";
import { requireAdmin } from "../middlewar/requireAdmin.js";

const makeResponse = () => ({
  headers: {},
  locals: {},
  set(name, value) { this.headers[name] = value; return this; },
  clearCookie(name) { this.clearedCookie = name; return this; },
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; },
  redirect(value) { this.redirectTo = value; return this; },
  send(value) { this.body = value; return this; },
});

test("valid admin sessions pass protected navigation without extending their deadline", () => {
  const expiresAt = Date.now() + 60_000;
  const req = { path: "/dashboard", session: { admin: { _id: "admin-id" }, adminSessionExpiresAt: expiresAt }, get: () => undefined };
  const res = makeResponse();
  let called = false;
  requireAdmin(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(res.locals.adminSessionExpiresAt, expiresAt);
});

test("expired admin AJAX requests destroy the server session and return an expiry signal", () => {
  let destroyed = false;
  const req = { path: "/api/admin/data", xhr: true, session: { admin: { _id: "admin-id" }, adminSessionExpiresAt: Date.now() - 1, destroy(callback) { destroyed = true; callback(); } }, get: () => undefined };
  const res = makeResponse();
  requireAdmin(req, res, () => assert.fail("expired requests must not pass"));
  assert.equal(destroyed, true);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.code, "ADMIN_SESSION_EXPIRED");
  assert.equal(res.headers["X-Admin-Session-Status"], "expired");
  assert.equal(res.clearedCookie, "connect.sid");
});

test("cross-site protected admin requests are rejected", () => {
  const req = { path: "/dashboard", session: { admin: { _id: "admin-id" }, adminSessionExpiresAt: Date.now() + 60_000 }, get: (name) => name === "sec-fetch-site" ? "cross-site" : undefined };
  const res = makeResponse();
  requireAdmin(req, res, () => assert.fail("cross-site request must not pass"));
  assert.equal(res.statusCode, 403);
});
