/**
 * Require the existing server-side administrator session.
 * Admin sessions are created only by the admin login route.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.session?.admin?._id) {
    return res.status(401).send("Administrator login required.");
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
  return next();
};
