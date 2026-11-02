const PROFILE_TO_MEMBERSHIP_FIELDS = Object.freeze({
  name: "fullName",
  phone: "mobile",
  photoURL: "profilePhoto",
});

const DIRECT_APPROVED_FIELDS = Object.freeze({ state: "state", district: "district" });
const REVIEWABLE_MEMBERSHIP_FIELDS = new Set([
  ...Object.values(PROFILE_TO_MEMBERSHIP_FIELDS),
  ...Object.values(DIRECT_APPROVED_FIELDS),
]);

export const buildApprovedIdentityProposal = (approvedRecord, profileUpdates) => {
  const proposal = {};
  for (const [profileField, membershipField] of Object.entries(PROFILE_TO_MEMBERSHIP_FIELDS)) {
    const value = profileUpdates?.[profileField];
    if (typeof value === "string" && value !== approvedRecord?.[membershipField]) proposal[membershipField] = value;
  }
  return proposal;
};

export const buildDirectApprovedMembershipUpdate = (profileUpdates) => {
  const update = {};
  for (const [profileField, membershipField] of Object.entries(DIRECT_APPROVED_FIELDS)) {
    const value = profileUpdates?.[profileField];
    if (typeof value === "string" && value.trim()) update[membershipField] = value.trim();
  }
  return update;
};

export const validateMembershipIdentityProposal = (proposal) => {
  if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) return false;
  if (!Object.keys(proposal).length) return false;
  return Object.entries(proposal).every(([field, value]) => {
    if (!REVIEWABLE_MEMBERSHIP_FIELDS.has(field) || typeof value !== "string") return false;
    if (field === "fullName") return value.trim().length > 0 && value.trim().length <= 100;
    if (field === "mobile") return /^\d{10}$/.test(value);
    if (["state", "district"].includes(field)) return value.trim().length <= 100;
    if (field === "profilePhoto") return value.length <= 2048 && /^https:\/\//i.test(value);
    return false;
  });
};
