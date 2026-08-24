import User from "../models/User.js";

/*******************************************************
 * RENDER USERS ADMIN PAGE
 * GET /AdminAgent?search=
 * Splits users into pending agent-verification requests
 * (shown in their own section, top of page) and the full
 * user list (shown below, same as before).
 *******************************************************/
export const renderUsersAdminPage = async (req, res) => {
  try {
    const search = req.query.search || "";
    const query = {};

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { uid: regex },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    const pendingRequests = users.filter((u) => u.agentRequestPending);

    res.render("AdminAgent", {
      users,
      pendingRequests,
      search,
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
  const redirectUrl = search
    ? `/AdminAgent?search=${encodeURIComponent(search)}`
    : "/AdminAgent";
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