import User from "../models/User.js";

const PAGE_SIZE = 100;
const MAX_PAGE = 10000;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/*******************************************************
 * RENDER USERS ADMIN PAGE
 * GET /AdminAgent?search=
 * Splits users into pending agent-verification requests
 * (shown in their own section, top of page) and the full
 * user list (shown below, same as before).
 *******************************************************/
export const renderUsersAdminPage = async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    if (search.length > 100) {
      return res.status(400).send("Search must be 100 characters or fewer.");
    }
    const rawPage = req.query.page === undefined ? "1" : String(req.query.page);
    const page = /^\d+$/.test(rawPage) ? Number(rawPage) : NaN;
    if (!Number.isSafeInteger(page) || page < 1 || page > MAX_PAGE) {
      return res.status(400).send("Invalid page number.");
    }
    const query = {};

    if (search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { uid: regex },
      ];
    }

    const [totalUsers, users, pendingRequests] = await Promise.all([
      User.countDocuments(query).maxTimeMS(2000),
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .maxTimeMS(2000)
        .lean(),
      User.find({ ...query, agentRequestPending: true })
        .sort({ createdAt: -1 })
        .limit(PAGE_SIZE)
        .maxTimeMS(2000)
        .lean(),
    ]);

    res.render("AdminAgent", {
      users,
      pendingRequests,
      search,
      page,
      pageSize: PAGE_SIZE,
      totalUsers,
      totalPages: Math.max(1, Math.ceil(totalUsers / PAGE_SIZE)),
      pageTitle: "Manage Users",
    });
  } catch (err) {
    console.error("renderUsersAdminPage error:", err);
    res.status(500).send("Failed to load users page.");
  }
};

/*******************************************************
 * TOGGLE AGENT STATUS
 * POST /AdminAgent/:id/toggle-agent
 *******************************************************/
const generateUniqueReferralCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
    exists = await User.exists({ referralCode: code });
  }

  return code;
};

const redirectBack = (req, res) => {
  const search = req.body.search || "";
  const page = Number(req.body.page);
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (Number.isSafeInteger(page) && page > 1 && page <= MAX_PAGE) params.set("page", String(page));
  const queryString = params.toString();
  const redirectUrl = queryString ? `/AdminAgent?${queryString}` : "/AdminAgent";
  res.redirect(redirectUrl);
};

export const toggleAgentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send("User not found.");
    }

    user.isAgent = !user.isAgent;

    if (user.isAgent && !user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
    }

    // Toggling directly also resolves any pending request either way.
    user.agentRequestPending = false;

    await user.save();

    redirectBack(req, res);
  } catch (err) {
    console.error("toggleAgentStatus error:", err);
    res.status(500).send("Failed to update agent status.");
  }
};

/*******************************************************
 * APPROVE AGENT REQUEST
 * POST /AdminAgent/:id/approve-request
 *******************************************************/
export const approveAgentRequest = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    user.isAgent = true;
    user.agentRequestPending = false;
    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
    }
    await user.save();

    redirectBack(req, res);
  } catch (err) {
    console.error("approveAgentRequest error:", err);
    res.status(500).send("Failed to approve request.");
  }
};

/*******************************************************
 * REJECT AGENT REQUEST
 * POST /AdminAgent/:id/reject-request
 *******************************************************/
export const rejectAgentRequest = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    user.agentRequestPending = false;
    await user.save();

    redirectBack(req, res);
  } catch (err) {
    console.error("rejectAgentRequest error:", err);
    res.status(500).send("Failed to reject request.");
  }
};
