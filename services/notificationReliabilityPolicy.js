export const shouldAttemptDevicePush = (priorDelivery) => !priorDelivery;

export const isCampaignLeaseExpired = (expiresAt, now = Date.now()) => {
  const expiry = expiresAt instanceof Date ? expiresAt.getTime() : Date.parse(expiresAt);
  return Number.isFinite(expiry) && expiry <= now;
};
