import test from "node:test";
import assert from "node:assert/strict";
import { buildApprovedIdentityProposal, validateMembershipIdentityProposal } from "../services/membershipIdentityPolicy.js";

test("ordinary profile edits become a proposal without mutating approved values", () => {
  const approved = { fullName: "Original Name", mobile: "9876543210", state: "MP", district: "Bhopal", profilePhoto: "https://cdn.example/old.jpg" };
  const proposed = buildApprovedIdentityProposal(approved, { name: "Updated Name", phone: "9876543210", state: "MP", designation: "Volunteer" });
  assert.deepEqual(proposed, { fullName: "Updated Name" });
  assert.equal(approved.fullName, "Original Name");
});

test("review rejects mass assignment and validates normalized identity fields", () => {
  assert.equal(validateMembershipIdentityProposal({ fullName: "Updated", mobile: "9876543210", state: "MP" }), true);
  assert.equal(validateMembershipIdentityProposal({ role: "admin" }), false);
  assert.equal(validateMembershipIdentityProposal({ mobile: "123" }), false);
  assert.equal(validateMembershipIdentityProposal({ profilePhoto: "javascript:alert(1)" }), false);
});
