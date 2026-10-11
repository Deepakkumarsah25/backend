import AdminActivity from "../models/AdminActivity.js";
import Admin from "../models/Admin.js";

/**
 * Format relative time (e.g. "Just now", "5 mins ago", "2 hours ago")
 */
export const formatTimeAgo = (date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  if (isNaN(past.getTime())) return "";
  const diffInSeconds = Math.max(0, Math.floor((now - past) / 1000));

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hr${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  return past.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format exact date & time string
 */
export const formatExactDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Automatically determine FontAwesome icon based on section name
 */
export const getSectionIcon = (section = "") => {
  const s = section.toLowerCase();
  if (s.includes("banner")) return "fa-solid fa-house-flag";
  if (s.includes("member") || s.includes("worker")) return "fa-solid fa-users";
  if (s.includes("driver")) return "fa-solid fa-car";
  if (s.includes("route")) return "fa-solid fa-route";
  if (s.includes("news")) return "fa-solid fa-newspaper";
  if (s.includes("event")) return "fa-solid fa-calendar-days";
  if (s.includes("cms") || s.includes("content")) return "fa-solid fa-file-pen";
  if (s.includes("morcha") || s.includes("wing")) return "fa-solid fa-flag";
  if (s.includes("leadership") || s.includes("leader")) return "fa-solid fa-user-tie";
  if (s.includes("media") || s.includes("gallery") || s.includes("photo") || s.includes("album")) return "fa-solid fa-images";
  if (s.includes("video")) return "fa-solid fa-video";
  if (s.includes("agent")) return "fa-solid fa-user-shield";
  if (s.includes("contact")) return "fa-solid fa-address-book";
  if (s.includes("scroller")) return "fa-solid fa-scroll";
  if (s.includes("login") || s.includes("auth")) return "fa-solid fa-right-to-bracket";
  return "fa-solid fa-pen-to-square";
};

/**
 * Log an Admin Activity (Audit Trail)
 */
export const logAdminActivity = async (reqOrUser, {
  section = "General Updates",
  action = "Updated content",
  details = "",
  actionType = "update",
  sectionIcon = "",
}) => {
  try {
    let email = "admin@vipparty.com";
    let name = "VIP Admin";
    let role = "Administrator";
    let ip = "";

    if (reqOrUser) {
      if (reqOrUser.session && reqOrUser.session.admin) {
        email = reqOrUser.session.admin.email || email;
        name = reqOrUser.session.admin.name || name;
        role = reqOrUser.session.admin.role || role;
      } else if (reqOrUser.email) {
        email = reqOrUser.email;
        name = reqOrUser.name || name;
        role = reqOrUser.role || role;
      }

      if (reqOrUser.ip) {
        ip = reqOrUser.ip;
      }

      // Mark request so automated middleware doesn't duplicate log
      reqOrUser._activityLogged = true;
    }

    const icon = sectionIcon || getSectionIcon(section);

    const activity = await AdminActivity.create({
      adminEmail: email.toLowerCase().trim(),
      adminName: name,
      adminRole: role,
      section,
      sectionIcon: icon,
      action,
      details,
      actionType,
      ip,
    });

    console.log(`📝 [Activity Logged] ${email} -> ${section}: ${action}`);
    return activity;
  } catch (error) {
    console.error("❌ Error logging admin activity:", error);
    return null;
  }
};

/**
 * Get the Last 2 Distinct Persons who made updates / changes
 */
export const getLastTwoEditors = async () => {
  try {
    // 1. Try finding distinct editors with actual content changes (non-login)
    const distinctUpdates = await AdminActivity.aggregate([
      {
        $match: {
          actionType: { $ne: "login" },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: { $toLower: { $ifNull: ["$adminEmail", ""] } },
          latestActivity: { $first: "$$ROOT" },
        },
      },
      {
        $sort: { "latestActivity.createdAt": -1 },
      },
      {
        $limit: 2,
      },
    ]);

    let results = distinctUpdates.map((d) => d.latestActivity);

    // If fewer than 2 distinct update editors found, look at all activities (including login or fallback)
    if (results.length < 2) {
      const allDistinct = await AdminActivity.aggregate([
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: { $toLower: { $ifNull: ["$adminEmail", ""] } },
            latestActivity: { $first: "$$ROOT" },
          },
        },
        {
          $sort: { "latestActivity.createdAt": -1 },
        },
        {
          $limit: 2,
        },
      ]);
      results = allDistinct.map((d) => d.latestActivity);
    }

    // Fallback: If still less than 2 distinct records, fill with most recent activities
    if (results.length < 2) {
      const recent = await AdminActivity.find()
        .sort({ createdAt: -1 })
        .limit(2);
      if (recent && recent.length > 0) {
        const existingIds = new Set(results.map((r) => String(r._id || "")));
        for (const act of recent) {
          const actObj = act.toObject ? act.toObject() : act;
          if (!existingIds.has(String(actObj._id)) && results.length < 2) {
            results.push(actObj);
            existingIds.add(String(actObj._id));
          }
        }
      }
    }

    // Format human-friendly time labels
    return results.map((item, index) => {
      const doc = item.toObject ? item.toObject() : item;
      return {
        ...doc,
        rankLabel: index === 0 ? "Latest Modifier (1st Person)" : "Previous Modifier (2nd Person)",
        isLatest: index === 0,
        timeAgo: formatTimeAgo(doc.createdAt) || "Recently",
        exactTime: formatExactDate(doc.createdAt) || "Recent update",
      };
    });
  } catch (error) {
    console.error("❌ Error fetching last two editors:", error);
    return [];
  }
};

/**
 * Get recent activity list
 */
export const getRecentActivities = async (limit = 10) => {
  try {
    const list = await AdminActivity.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return list.map((item) => {
      const doc = item.toObject();
      return {
        ...doc,
        timeAgo: formatTimeAgo(doc.createdAt),
        exactTime: formatExactDate(doc.createdAt),
      };
    });
  } catch (error) {
    console.error("❌ Error fetching recent activities:", error);
    return [];
  }
};

/**
 * Fetch and format last 10 days activities with grouping and statistics
 */
export const getLast10DaysActivities = async (filters = {}) => {
  try {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    tenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Fetch ALL activities in the last 10 days for accurate 4-admin overview cards & global stats
    const allTenDaysRaw = await AdminActivity.find({
      createdAt: { $gte: tenDaysAgo },
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedAll = allTenDaysRaw.map((act) => {
      const d = new Date(act.createdAt);
      return {
        ...act,
        timeAgo: formatTimeAgo(act.createdAt) || "Recently",
        exactTime: formatExactDate(act.createdAt) || "Recent update",
        dateKey: !isNaN(d.getTime())
          ? d.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Recent",
      };
    });

    // 4 Primary Admins definition
    const primaryEmails = [
      {
        email: "admin@vipparty.com",
        name: "Mukesh Sahani",
        role: "Super Admin",
        roleClass: "super",
        avatarBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        icon: "fa-solid fa-crown",
      },
      {
        email: "editor@vipparty.com",
        name: "Vikram Sharma",
        role: "Content Editor",
        roleClass: "editor",
        avatarBg: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        icon: "fa-solid fa-pen-nib",
      },
      {
        email: "manager@vipparty.com",
        name: "Pooja Dhakad",
        role: "Operations Manager",
        roleClass: "manager",
        avatarBg: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
        icon: "fa-solid fa-briefcase",
      },
      {
        email: "media@vipparty.com",
        name: "Ravi Verma",
        role: "Media Coordinator",
        roleClass: "media",
        avatarBg: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
        icon: "fa-solid fa-photo-film",
      },
    ];

    // Build grouped data by admin from FULL 10-day dataset (Unbiased by filters)
    const adminGroups = primaryEmails.map((adm) => {
      const userActs = formattedAll.filter(
        (a) => (a.adminEmail || "").toLowerCase() === adm.email.toLowerCase()
      );

      // Type counts (excluding pure login logs for meaningful change metrics)
      const contentActs = userActs.filter((a) => a.actionType !== "login");
      const creates = userActs.filter((a) => a.actionType === "create").length;
      const updates = userActs.filter((a) => a.actionType === "update").length;
      const deletes = userActs.filter((a) => a.actionType === "delete").length;

      return {
        ...adm,
        totalActions: contentActs.length > 0 ? contentActs.length : userActs.length,
        activities: userActs,
        stats: { creates, updates, deletes },
        lastActiveTime: userActs[0] ? userActs[0].timeAgo : "No activity in last 10 days",
      };
    });

    // 2. Build filtered activities list for initial render
    let filteredActivities = [...formattedAll];

    if (filters.email && filters.email.trim() !== "" && filters.email.trim() !== "all") {
      filteredActivities = filteredActivities.filter(
        (a) => (a.adminEmail || "").toLowerCase() === filters.email.toLowerCase().trim()
      );
    }

    if (filters.section && filters.section.trim() !== "" && filters.section.trim() !== "all") {
      filteredActivities = filteredActivities.filter(
        (a) => (a.section || "").trim() === filters.section.trim()
      );
    }

    if (filters.actionType && filters.actionType.trim() !== "" && filters.actionType.trim() !== "all") {
      filteredActivities = filteredActivities.filter(
        (a) => (a.actionType || "").trim() === filters.actionType.trim()
      );
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filteredActivities = filteredActivities.filter((a) => {
        return (
          (a.action || "").toLowerCase().includes(q) ||
          (a.details || "").toLowerCase().includes(q) ||
          (a.section || "").toLowerCase().includes(q) ||
          (a.adminName || "").toLowerCase().includes(q) ||
          (a.adminEmail || "").toLowerCase().includes(q)
        );
      });
    }

    // Group filtered activities by Date (Day)
    const dateGroups = {};
    filteredActivities.forEach((a) => {
      const k = a.dateKey;
      if (!dateGroups[k]) {
        dateGroups[k] = [];
      }
      dateGroups[k].push(a);
    });

    // Sections list for filtering (distinct sections across last 10 days)
    const allSectionsSet = new Set();
    formattedAll.forEach((a) => {
      if (a.section && a.section !== "Admin Authentication") {
        allSectionsSet.add(a.section);
      }
    });
    const allSections = Array.from(allSectionsSet);

    // Global stats across 10 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = formattedAll.filter((a) => new Date(a.createdAt) >= today && a.actionType !== "login").length;

    // Top modified section
    const secCount = {};
    formattedAll.forEach((a) => {
      if (a.section && a.section !== "Admin Authentication") {
        secCount[a.section] = (secCount[a.section] || 0) + 1;
      }
    });
    let topSection = "Live Updates Banners";
    let maxCount = 0;
    Object.entries(secCount).forEach(([sec, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        topSection = sec;
      }
    });

    return {
      activities: filteredActivities,
      allActivities: formattedAll, // complete dataset for instant client-side filtering
      totalCount: filteredActivities.length,
      adminGroups,
      dateGroups,
      allSections,
      stats: {
        total10Days: formattedAll.filter((a) => a.actionType !== "login").length || formattedAll.length,
        todayCount: todayCount || formattedAll.filter((a) => new Date(a.createdAt) >= today).length,
        activeAdminsCount: adminGroups.filter((g) => g.totalActions > 0).length,
        topSection,
      },
      filters,
    };
  } catch (error) {
    console.error("❌ Error fetching 10 days activities:", error);
    return {
      activities: [],
      totalCount: 0,
      adminGroups: [],
      dateGroups: {},
      allSections: [],
      stats: { total10Days: 0, todayCount: 0, activeAdminsCount: 0, topSection: "N/A" },
      filters,
    };
  }
};

/**
 * Seed multiple admin emails and realistic initial activities across last 10 days
 */
export const seedAdminsAndActivities = async () => {
  try {
    // 4 primary admin credentials with descriptive roles
    const seedAdmins = [
      {
        email: "admin@vipparty.com",
        password: "123456",
        name: "Mukesh Sahani",
        role: "Super Admin",
      },
      {
        email: "editor@vipparty.com",
        password: "123456",
        name: "Vikram Sharma",
        role: "Content Editor",
      },
      {
        email: "manager@vipparty.com",
        password: "123456",
        name: "Pooja Dhakad",
        role: "Operations Manager",
      },
      {
        email: "media@vipparty.com",
        password: "123456",
        name: "Ravi Verma",
        role: "Media Coordinator",
      },
      {
        email: "deepak232a@gmail.com",
        password: "123456",
        name: "Deepak Sahani",
        role: "Technical Administrator",
      },
    ];

    for (const adm of seedAdmins) {
      const existing = await Admin.findOne({ email: adm.email });
      if (!existing) {
        await Admin.create(adm);
        console.log(`✅ Seeded Admin: ${adm.email} (${adm.role})`);
      } else {
        let updated = false;
        if (!existing.name || existing.name === "Admin") {
          existing.name = adm.name;
          updated = true;
        }
        if (!existing.role || existing.role === "admin") {
          existing.role = adm.role;
          updated = true;
        }
        if (existing.password !== adm.password && !existing.password?.startsWith("$2")) {
          existing.password = adm.password;
          updated = true;
        }
        if (updated) {
          await existing.save();
        }
      }
    }

    // Ensure we have realistic activity history across the last 10 days for all 4 emails
    const activityCount = await AdminActivity.countDocuments();
    if (activityCount < 12) {
      const now = Date.now();
      const H = 3600 * 1000;
      const D = 24 * H;

      const sampleActivities = [
        // TODAY
        {
          adminEmail: "editor@vipparty.com",
          adminName: "Vikram Sharma",
          adminRole: "Content Editor",
          section: "Live Updates Banners",
          sectionIcon: "fa-solid fa-house-flag",
          action: "Updated Campaign Banners",
          details: "Uploaded 2 new high-definition banners for upcoming Bihar rally",
          actionType: "update",
          createdAt: new Date(now - 25 * 60 * 1000),
          updatedAt: new Date(now - 25 * 60 * 1000),
        },
        {
          adminEmail: "manager@vipparty.com",
          adminName: "Pooja Dhakad",
          adminRole: "Operations Manager",
          section: "People & Organisation",
          sectionIcon: "fa-solid fa-users",
          action: "Added New Member / Worker",
          details: "Registered active party worker: Rajesh Kumar (Patna District)",
          actionType: "create",
          createdAt: new Date(now - 2 * H),
          updatedAt: new Date(now - 2 * H),
        },
        {
          adminEmail: "admin@vipparty.com",
          adminName: "Mukesh Sahani",
          adminRole: "Super Admin",
          section: "Content Management (CMS)",
          sectionIcon: "fa-solid fa-file-pen",
          action: "Updated Party Constitution Page",
          details: "Amended party mission statement, leadership hierarchy and 2026 core objectives",
          actionType: "update",
          createdAt: new Date(now - 5 * H),
          updatedAt: new Date(now - 5 * H),
        },
        // YESTERDAY (Day 1)
        {
          adminEmail: "editor@vipparty.com",
          adminName: "Vikram Sharma",
          adminRole: "Content Editor",
          section: "News Management",
          sectionIcon: "fa-solid fa-newspaper",
          action: "Published Press Statement: Fishermen Rights",
          details: "Released official party statement regarding state fishermen welfare schemes",
          actionType: "create",
          createdAt: new Date(now - 1 * D - 2 * H),
          updatedAt: new Date(now - 1 * D - 2 * H),
        },
        {
          adminEmail: "media@vipparty.com",
          adminName: "Ravi Verma",
          adminRole: "Media Coordinator",
          section: "Media Gallery",
          sectionIcon: "fa-solid fa-photo-film",
          action: "Uploaded 6 Campaign Graphics",
          details: "Added social media digital creatives and posters for WhatsApp campaign",
          actionType: "create",
          createdAt: new Date(now - 1 * D - 5 * H),
          updatedAt: new Date(now - 1 * D - 5 * H),
        },
        // DAY 2
        {
          adminEmail: "admin@vipparty.com",
          adminName: "Mukesh Sahani",
          adminRole: "Super Admin",
          section: "Leadership Management",
          sectionIcon: "fa-solid fa-user-tie",
          action: "Updated Core Working Committee Roster",
          details: "Assigned 4 new executive committee directors for regional coordination",
          actionType: "update",
          createdAt: new Date(now - 2 * D - 3 * H),
          updatedAt: new Date(now - 2 * D - 3 * H),
        },
        {
          adminEmail: "manager@vipparty.com",
          adminName: "Pooja Dhakad",
          adminRole: "Operations Manager",
          section: "Transport (Driver)",
          sectionIcon: "fa-solid fa-car",
          action: "Assigned Driver to Campaign Vehicle",
          details: "Allocated driver Manoj Yadav to Route #14 Patna-Gaya convoy",
          actionType: "update",
          createdAt: new Date(now - 2 * D - 6 * H),
          updatedAt: new Date(now - 2 * D - 6 * H),
        },
        // DAY 3
        {
          adminEmail: "editor@vipparty.com",
          adminName: "Vikram Sharma",
          adminRole: "Content Editor",
          section: "Photo Gallery",
          sectionIcon: "fa-solid fa-images",
          action: "Created Album: Muzaffarpur Workers Meet",
          details: "Uploaded 12 high-resolution photos of divisional workers convention",
          actionType: "create",
          createdAt: new Date(now - 3 * D - 4 * H),
          updatedAt: new Date(now - 3 * D - 4 * H),
        },
        {
          adminEmail: "media@vipparty.com",
          adminName: "Ravi Verma",
          adminRole: "Media Coordinator",
          section: "VIP Live",
          sectionIcon: "fa-solid fa-tower-broadcast",
          action: "Configured Live Broadcast Stream Key",
          details: "Configured RTMP endpoints and high-definition video test for party president address",
          actionType: "update",
          createdAt: new Date(now - 3 * D - 8 * H),
          updatedAt: new Date(now - 3 * D - 8 * H),
        },
        // DAY 5
        {
          adminEmail: "manager@vipparty.com",
          adminName: "Pooja Dhakad",
          adminRole: "Operations Manager",
          section: "Transport (Route)",
          sectionIcon: "fa-solid fa-route",
          action: "Updated Schedule for Route #09",
          details: "Modified rally route stops and timing checkpoints across Samastipur",
          actionType: "update",
          createdAt: new Date(now - 5 * D - 1 * H),
          updatedAt: new Date(now - 5 * D - 1 * H),
        },
        {
          adminEmail: "admin@vipparty.com",
          adminName: "Mukesh Sahani",
          adminRole: "Super Admin",
          section: "Morcha / Wings",
          sectionIcon: "fa-solid fa-flag",
          action: "Appointed Youth Morcha Divisional Head",
          details: "Designated regional president for Fishermen & Youth Rights Morcha",
          actionType: "create",
          createdAt: new Date(now - 5 * D - 5 * H),
          updatedAt: new Date(now - 5 * D - 5 * H),
        },
        // DAY 7
        {
          adminEmail: "media@vipparty.com",
          adminName: "Ravi Verma",
          adminRole: "Media Coordinator",
          section: "Video Gallery",
          sectionIcon: "fa-solid fa-video",
          action: "Added Video: Address to Youth Cadre at Patna",
          details: "Embedded official recording and key highlights for workers conclave",
          actionType: "create",
          createdAt: new Date(now - 7 * D - 2 * H),
          updatedAt: new Date(now - 7 * D - 2 * H),
        },
        {
          adminEmail: "editor@vipparty.com",
          adminName: "Vikram Sharma",
          adminRole: "Content Editor",
          section: "Banner Scroller",
          sectionIcon: "fa-solid fa-scroll",
          action: "Updated Banner Scroller Ticker",
          details: "Refreshed live marquee bulletin text with rally schedule announcement",
          actionType: "update",
          createdAt: new Date(now - 7 * D - 7 * H),
          updatedAt: new Date(now - 7 * D - 7 * H),
        },
        // DAY 9
        {
          adminEmail: "manager@vipparty.com",
          adminName: "Pooja Dhakad",
          adminRole: "Operations Manager",
          section: "Contact Support",
          sectionIcon: "fa-solid fa-address-book",
          action: "Updated District Helpline Numbers",
          details: "Refreshed official office contact numbers and grievance escalation emails",
          actionType: "update",
          createdAt: new Date(now - 9 * D - 3 * H),
          updatedAt: new Date(now - 9 * D - 3 * H),
        },
      ];

      for (const item of sampleActivities) {
        await AdminActivity.create(item);
      }
      console.log(`✅ Seeded ${sampleActivities.length} realistic activities across last 10 days`);
    }
  } catch (error) {
    console.error("❌ Error in seedAdminsAndActivities:", error);
  }
};
