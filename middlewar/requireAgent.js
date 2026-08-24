/*******************************************************
 * requireAgent
 * Run AFTER your existing auth middleware (the one that
 * sets req.user to the logged-in User document).
 * Blocks anyone whose User doc doesn't have isAgent: true.
 *******************************************************/
export const requireAgent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Login required." });
  }

  if (!req.user.isAgent) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to add members.",
    });
  }

  next();
};