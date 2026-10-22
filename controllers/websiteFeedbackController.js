import Contact from "../models/ContactMessage.js";

/* =========================================================
   1. RENDER WEBSITE FEEDBACK / INQUIRIES ADMIN PAGE
========================================================= */
export const renderWebsiteFeedbackPage = async (req, res) => {
  try {
    const selectedStatus = req.query.status || "all";
    const searchQuery = (req.query.q || "").trim().toLowerCase();

    // Fetch all website contact / feedback messages
    const allMessages = await Contact.find({
      $or: [
        { source: "website" },
        { source: { $exists: false } },
        { source: null },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate live statistics
    const stats = {
      total: allMessages.length,
      new: allMessages.filter((m) => (m.status || "New").toLowerCase() === "new").length,
      inProgress: allMessages.filter((m) => (m.status || "").toLowerCase() === "in progress").length,
      resolved: allMessages.filter((m) => (m.status || "").toLowerCase() === "resolved").length,
    };

    // Filter by status
    let filtered = allMessages;
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (m) => (m.status || "New").toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      const qDigits = searchQuery.replace(/\D/g, "");
      filtered = filtered.filter((m) => {
        const name = (m.name || "").toLowerCase();
        const phone = (m.phone || "").toLowerCase();
        const phoneDigits = String(m.phone || "").replace(/\D/g, "");
        const email = (m.email || "").toLowerCase();
        const subject = (m.subject || "").toLowerCase();
        const message = (m.message || "").toLowerCase();
        const status = (m.status || "").toLowerCase();

        return (
          name.includes(searchQuery) ||
          phone.includes(searchQuery) ||
          (qDigits && phoneDigits.includes(qDigits)) ||
          email.includes(searchQuery) ||
          subject.includes(searchQuery) ||
          message.includes(searchQuery) ||
          status.includes(searchQuery)
        );
      });
    }

    return res.render("website/websiteFeedback", {
      messages: filtered,
      stats,
      selectedStatus,
      searchQuery,
      activeNav: "website-feedback",
    });
  } catch (error) {
    console.error("Error in renderWebsiteFeedbackPage:", error);
    return res.status(500).send("Error loading Website Feedback: " + error.message);
  }
};


/* =========================================================
   2. API: GET WEBSITE FEEDBACK LIST & STATS
========================================================= */
export const getWebsiteFeedbackApi = async (req, res) => {
  try {
    const messages = await Contact.find({
      $or: [
        { source: "website" },
        { source: { $exists: false } },
        { source: null },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      total: messages.length,
      new: messages.filter((m) => (m.status || "New").toLowerCase() === "new").length,
      inProgress: messages.filter((m) => (m.status || "").toLowerCase() === "in progress").length,
      resolved: messages.filter((m) => (m.status || "").toLowerCase() === "resolved").length,
    };

    return res.json({ success: true, messages, stats });
  } catch (error) {
    console.error("Error in getWebsiteFeedbackApi:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


/* =========================================================
   3. API: UPDATE MESSAGE STATUS & ADMIN NOTES
========================================================= */
export const updateWebsiteFeedbackStatus = async (req, res) => {
  try {
    const { id, status, adminNotes } = req.body;

    if (!id || !status) {
      return res.status(400).json({ success: false, message: "ID and Status are required" });
    }

    const updateFields = { status };
    if (typeof adminNotes === "string") {
      updateFields.adminNotes = adminNotes.trim();
    }

    const updated = await Contact.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    return res.json({
      success: true,
      message: "स्थिति सफलतापूर्वक अपडेट कर दी गई।",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateWebsiteFeedbackStatus:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


/* =========================================================
   4. API: DELETE WEBSITE FEEDBACK MESSAGE
========================================================= */
export const deleteWebsiteFeedback = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "Message ID is required" });
    }

    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    return res.json({ success: true, message: "संदेश सफलतापूर्वक हटा दिया गया।" });
  } catch (error) {
    console.error("Error in deleteWebsiteFeedback:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


/* =========================================================
   5. CSV EXPORT FOR WEBSITE MESSAGES
========================================================= */
export const exportWebsiteFeedbackCsv = async (req, res) => {
  try {
    const records = await Contact.find({
      $or: [
        { source: "website" },
        { source: { $exists: false } },
        { source: null },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "ID",
      "Sender Name",
      "Mobile",
      "Email",
      "Subject / Category",
      "Message",
      "Status",
      "Admin Notes",
      "Received Date",
    ];

    const rows = records.map((r) => [
      `"${r._id ? r._id.toString() : ""}"`,
      `"${(r.name || "").replace(/"/g, '""')}"`,
      `"${r.phone || ""}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      `"${(r.subject || "General Inquiry").replace(/"/g, '""')}"`,
      `"${(r.message || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`,
      `"${r.status || "New"}"`,
      `"${(r.adminNotes || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`,
      `"${r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=VIP_Website_Messages_${Date.now()}.csv`
    );
    return res.status(200).send("\uFEFF" + csvContent);
  } catch (error) {
    console.error("Error exporting website feedback CSV:", error);
    return res.status(500).send("Export failed: " + error.message);
  }
};


/* =========================================================
   6. PUBLIC API: SUBMIT WEBSITE MESSAGE / FEEDBACK
   (Called by vippartyin or web clients)
========================================================= */
export const submitWebsiteFeedbackApi = async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;
    const senderName = (name || "").trim();
    const senderPhone = (phone || "").trim();
    const senderEmail = (email || "").trim().toLowerCase();
    const senderSubject = (subject || "सामान्य पूछताछ (General Inquiry)").trim();
    const senderMsg = (message || "").trim();

    if (!senderName || !senderPhone || !senderEmail || !senderMsg) {
      return res.status(400).json({
        success: false,
        message: "कृपया पूरा नाम, मोबाइल नंबर, ईमेल और संदेश अनिवार्य रूप से दर्ज करें।",
      });
    }

    // Prevent duplicate entries submitted within 30 seconds
    const existing = await Contact.findOne({
      phone: senderPhone,
      message: senderMsg,
      createdAt: { $gte: new Date(Date.now() - 30 * 1000) },
    });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "धन्यवाद! आपका संदेश सफलतापूर्वक दर्ज कर लिया गया है।",
        data: existing,
      });
    }

    const doc = await Contact.create({
      name: senderName,
      phone: senderPhone,
      email: senderEmail,
      subject: senderSubject,
      message: senderMsg,
      status: "New",
      source: "website",
    });

    return res.status(201).json({
      success: true,
      message: "धन्यवाद! आपका संदेश सफलतापूर्वक दर्ज कर लिया गया है।",
      data: doc,
    });
  } catch (error) {
    console.error("Error in submitWebsiteFeedbackApi:", error);
    return res.status(500).json({
      success: false,
      message: "सर्वर पर संदेश दर्ज करने में त्रुटि हुई।",
    });
  }
};

