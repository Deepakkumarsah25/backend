import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  decodeNotificationCursor,
  encodeNotificationCursor,
  notificationAudienceFilter,
  notificationPreferenceAllows,
  ownedNotificationFilter,
} from "../services/notificationPolicy.js";

test("campaign audience filters select the requested accounts", () => {
  assert.deepEqual(notificationAudienceFilter({ type: "all" }), { deletionRequested: { $ne: true } });
  assert.deepEqual(notificationAudienceFilter({ type: "agents" }), { deletionRequested: { $ne: true }, isAgent: true });
  assert.deepEqual(notificationAudienceFilter({ type: "users", userIds: ["a"] }), { _id: { $in: ["a"] }, deletionRequested: { $ne: true } });
  assert.equal(notificationAudienceFilter({ type: "members" }).membershipId.$exists, true);
});

test("missing preferences default to eligible; opted-out categories are excluded", () => {
  assert.equal(notificationPreferenceAllows(undefined, "events"), true);
  assert.equal(notificationPreferenceAllows({ events: true }, "events"), true);
  assert.equal(notificationPreferenceAllows({ events: false }, "events"), false);
});

test("notification ownership filters always bind an operation to its user", () => {
  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();
  const notificationId = new mongoose.Types.ObjectId();
  const filterA = ownedNotificationFilter(userA, notificationId);
  const filterB = ownedNotificationFilter(userB, notificationId);
  assert.equal(String(filterA.userId), String(userA));
  assert.equal(String(filterB.userId), String(userB));
  assert.equal(String(filterA._id), String(notificationId));
  assert.notDeepEqual(filterA, filterB);
});

test("notification pagination cursor round-trips and rejects malformed input", () => {
  const item = { _id: new mongoose.Types.ObjectId(), createdAt: new Date("2026-11-01T12:00:00Z") };
  const cursor = encodeNotificationCursor(item);
  const decoded = decodeNotificationCursor(cursor);
  assert.equal(String(decoded.id), String(item._id));
  assert.equal(decoded.createdAt.toISOString(), item.createdAt.toISOString());
  assert.equal(decodeNotificationCursor("not-a-cursor"), null);
});
