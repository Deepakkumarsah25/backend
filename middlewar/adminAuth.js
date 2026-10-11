export const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.admin) {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });

    return res.redirect("/");
  }

  next();
};