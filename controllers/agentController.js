/*******************************************************
 * REQUEST AGENT VERIFICATION
 * POST /api/agent/request-verification
 * Logged-in, non-agent user asks admin to verify them —
 * shown after they hit the 5-member add limit.
 * Idempotent: resubmitting while already pending is a
 * no-op success, not an error.
 *******************************************************/
export const requestAgentVerification = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Login required." });
    }

    if (user.isAgent) {
      return res.status(200).json({
        success: true,
        message: "You are already a verified agent.",
      });
    }

    if (!user.agentRequestPending) {
      user.agentRequestPending = true;
      user.agentRequestedAt = new Date();
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Verification request submitted. Admin will review it shortly.",
    });
  } catch (err) {
    console.error("requestAgentVerification error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};