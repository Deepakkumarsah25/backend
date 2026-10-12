import { logAdminActivity, getSectionIcon } from "../services/activityService.js";

/**
 * Universal Activity Tracker Middleware
 * Automatically captures mutating actions across the entire admin panel
 */
export const activityTrackerMiddleware = (req, res, next) => {
  // Only track mutating requests (POST, PUT, DELETE) or URLs containing delete
  const isMutatingMethod = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
  const isDeleteRoute = req.path.includes("/delete") || req.path.includes("/remove");

  if (!isMutatingMethod && !isDeleteRoute) {
    return next();
  }

  // Skip non-admin API routes like tracking updates, public APIs, login itself
  const url = req.originalUrl || req.url;
  if (
    url.startsWith("/api/tracking") ||
    url.startsWith("/api/user/save") ||
    url.startsWith("/login") ||
    url.startsWith("/logout")
  ) {
    return next();
  }

  // Wait for the response to finish so we only log successful actions
  res.on("finish", async () => {
    // If already logged by controller or error response, skip
    if (req._activityLogged || res.statusCode >= 400) {
      return;
    }

    try {
      let section = "Admin Panel";
      let action = "Updated content";
      let details = "";
      let actionType = "update";

      const lowerUrl = url.toLowerCase();

      // Section mapping
      if (lowerUrl.includes("bainar") || lowerUrl.includes("banner")) {
        section = "Live Updates Banners";
        action = req.method === "DELETE" || lowerUrl.includes("delete") ? "Deleted a Banner" : "Uploaded Banner(s)";
        actionType = req.method === "DELETE" || lowerUrl.includes("delete") ? "delete" : "update";
      } else if (lowerUrl.includes("worker") || lowerUrl.includes("member")) {
        section = "People & Organisation";
        action = req.method === "DELETE" || lowerUrl.includes("delete") ? "Removed Member / Worker" : "Added / Modified Member";
        actionType = req.method === "DELETE" || lowerUrl.includes("delete") ? "delete" : "create";
        if (req.body?.fullName) details = `Member: ${req.body.fullName}`;
      } else if (lowerUrl.includes("driver")) {
        section = "Transport (Driver)";
        action = req.method === "DELETE" || lowerUrl.includes("delete") ? "Deleted Driver" : "Added / Modified Driver";
        actionType = req.method === "DELETE" || lowerUrl.includes("delete") ? "delete" : "create";
        if (req.body?.name) details = `Driver: ${req.body.name}`;
      } else if (lowerUrl.includes("route")) {
        section = "Transport (Route)";
        action = "Updated Route Schedule / Details";
        actionType = "update";
        if (req.body?.routeName) details = `Route: ${req.body.routeName}`;
      } else if (lowerUrl.includes("news")) {
        section = "News Management";
        action = req.method === "DELETE" || lowerUrl.includes("delete") ? "Deleted News Article" : "Published / Edited News";
        actionType = req.method === "DELETE" || lowerUrl.includes("delete") ? "delete" : "update";
        if (req.body?.title) details = `Title: ${req.body.title}`;
      } else if (lowerUrl.includes("event")) {
        section = "Events Management";
        action = req.method === "DELETE" || lowerUrl.includes("delete") ? "Removed Event" : "Created / Updated Event";
        actionType = req.method === "DELETE" || lowerUrl.includes("delete") ? "delete" : "create";
        if (req.body?.title) details = `Event: ${req.body.title}`;
      } else if (lowerUrl.includes("cms")) {
        section = "Content Management (CMS)";
        action = "Updated CMS Page Content";
        actionType = "update";
        if (req.body?.title) details = `CMS Title: ${req.body.title}`;
      } else if (lowerUrl.includes("morcha")) {
        section = "Morcha / Wings";
        action = "Updated Morcha Wing Information";
        actionType = "update";
        if (req.body?.title) details = `Morcha: ${req.body.title}`;
      } else if (lowerUrl.includes("leadership")) {
        section = "Leadership Management";
        action = "Updated Leadership Roster";
        actionType = "update";
        if (req.body?.name) details = `Leader: ${req.body.name}`;
      } else if (lowerUrl.includes("scroller")) {
        section = "Banner Scroller";
        action = "Updated Scroller Text / News";
        actionType = "update";
      } else if (lowerUrl.includes("album") || lowerUrl.includes("photo")) {
        section = "Photo Gallery";
        action = "Updated Photo Albums";
        actionType = "update";
      } else if (lowerUrl.includes("video")) {
        section = "Video Gallery";
        action = "Updated Video Gallery";
        actionType = "update";
      } else if (lowerUrl.includes("mediagallery")) {
        section = "Media Gallery";
        action = "Uploaded / Updated Media Files";
        actionType = "update";
      } else if (lowerUrl.includes("adminagent") || lowerUrl.includes("agent")) {
        section = "Administration (Admin Agent)";
        action = "Updated Agent Verification Status";
        actionType = "update";
      } else if (lowerUrl.includes("contact")) {
        section = "Contact & Offices";
        action = "Updated Contact Information / Office";
        actionType = "update";
      } else {
        section = "Admin Operations";
        action = `Admin Action (${req.method} ${req.path})`;
      }

      await logAdminActivity(req, {
        section,
        action,
        details: details || `Path: ${req.path}`,
        actionType,
        sectionIcon: getSectionIcon(section),
      });
    } catch (err) {
      console.error("Error in activityTrackerMiddleware:", err);
    }
  });

  next();
};
