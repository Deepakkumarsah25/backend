import test from "node:test";
import assert from "node:assert/strict";
import { isCampaignLeaseExpired, shouldAttemptDevicePush } from "../services/notificationReliabilityPolicy.js";

test("a device already attempted by a campaign is not automatically sent again", () => {
  assert.equal(shouldAttemptDevicePush(null), true);
  for (const status of ["processing", "sent", "failed"]) {
    assert.equal(shouldAttemptDevicePush({ status }), false);
  }
});

test("only an expired lease can be reclaimed", () => {
  const now = Date.now();
  assert.equal(isCampaignLeaseExpired(new Date(now - 1), now), true);
  assert.equal(isCampaignLeaseExpired(new Date(now + 1), now), false);
  assert.equal(isCampaignLeaseExpired(null, now), false);
});
