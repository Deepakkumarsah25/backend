import Volunteer from "../models/Volunteer.js";
import Scholarship from "../models/Scholarship.js";
import Candidature from "../models/Candidature.js";
import Join from "../models/joinmodel.js";
import Contact from "../models/ContactMessage.js";
import User from "../models/User.js";

// Helper to normalize items into a unified record
function normalizeItem(doc, type) {
  const d = doc.toObject ? doc.toObject() : doc;
  d._formType = type;

  switch (type) {
    case "volunteer":
      return {
        ...d,
        _id: d._id.toString(),
        _formType: "volunteer",
        _typeLabel: "वालंटियर (Volunteer)",
        _badgeColor: "bg-blue-600 text-white",
        _icon: "fa-handshake-angle",
        _applicantName: d.fullName || "N/A",
        _mobile: d.mobile || "N/A",
        _email: d.email || "",
        _location: [d.district, d.state].filter(Boolean).join(", ") || "Bihar",
        _uniqueId: d.volunteerId || d._id.toString().slice(-6).toUpperCase(),
        _status: d.status || "Pending",
        _date: d.createdAt,
      };

    case "scholarship":
      return {
        ...d,
        _id: d._id.toString(),
        _formType: "scholarship",
        _typeLabel: "छात्रवृत्ति (Scholarship)",
        _badgeColor: "bg-amber-500 text-white",
        _icon: "fa-graduation-cap",
        _applicantName: d.studentName || "N/A",
        _mobile: d.mobile || "N/A",
        _email: d.email || "",
        _location: [d.district, d.assembly].filter(Boolean).join(", ") || "Bihar",
        _uniqueId: d.applicationId || d._id.toString().slice(-6).toUpperCase(),
        _status: d.status || "Pending",
        _date: d.createdAt,
      };

    case "candidature":
      return {
        ...d,
        _id: d._id.toString(),
        _formType: "candidature",
        _typeLabel: "यूपी 2027 उम्मीदवारी",
        _badgeColor: "bg-rose-600 text-white",
        _icon: "fa-vote-yea",
        _applicantName: d.applicantName || "N/A",
        _mobile: d.mobile || "N/A",
        _email: d.email || "",
        _location: [d.assemblyConstituency, d.district, d.state].filter(Boolean).join(", ") || "Uttar Pradesh",
        _uniqueId: d.candidatureId || d._id.toString().slice(-6).toUpperCase(),
        _status: d.status || "Under Review",
        _date: d.createdAt,
      };

    case "join":
      return {
        ...d,
        _id: d._id.toString(),
        _formType: "join",
        _typeLabel: "पार्टी सदस्यता (Join VIP)",
        _badgeColor: "bg-emerald-600 text-white",
        _icon: "fa-id-card",
        _applicantName: d.fullName || "N/A",
        _mobile: d.mobile || "N/A",
        _email: d.email || "",
        _location: [d.district, d.assembly, d.state].filter(Boolean).join(", ") || "Bihar",
        _uniqueId: d.memberId || d._id.toString().slice(-6).toUpperCase(),
        _status: d.status || "Approved",
        _date: d.createdAt,
      };

    case "contact":
      return {
        ...d,
        _id: d._id.toString(),
        _formType: "contact",
        _typeLabel: "संपर्क पूछताछ (Inquiry)",
        _badgeColor: "bg-indigo-600 text-white",
        _icon: "fa-envelope-open-text",
        _applicantName: d.name || "N/A",
        _mobile: d.phone || "N/A",
        _email: d.email || "",
        _location: d.subject || "General Inquiry",
        _uniqueId: "MSG-" + d._id.toString().slice(-6).toUpperCase(),
        _status: d.status || "New",
        _date: d.createdAt,
      };

    case "user":
      return {
        ...d,
        _id: d._id.toString(),
        _formType: "user",
        _typeLabel: "वेब यूजर (Signed Up)",
        _badgeColor: "bg-cyan-600 text-white",
        _icon: "fa-user-check",
        _applicantName: d.name || "User",
        _mobile: d.phone || "N/A",
        _email: d.email || "",
        _location: [d.district, d.state].filter(Boolean).join(", ") || "Web",
        _uniqueId: d.uid || d.membershipId || d._id.toString().slice(-6).toUpperCase(),
        _status: "Active",
        _date: d.createdAt,
      };

    default:
      return d;
  }
}

// Controller to render Forms Hub
export const renderAdminFormsPage = async (req, res) => {
  try {
    const selectedType = req.query.type || "all";
    const selectedStatus = req.query.status || "all";
    const searchQuery = (req.query.q || "").trim().toLowerCase();

    // Fetch collections in parallel
    const [volunteers, scholarships, candidatures, joins, contacts, users] = await Promise.all([
      Volunteer.find().sort({ createdAt: -1 }).lean().catch(() => []),
      Scholarship.find().sort({ createdAt: -1 }).lean().catch(() => []),
      Candidature.find().sort({ createdAt: -1 }).lean().catch(() => []),
      Join.find().sort({ createdAt: -1 }).lean().catch(() => []),
      Contact.find().sort({ createdAt: -1 }).lean().catch(() => []),
      User.find().sort({ createdAt: -1 }).limit(100).lean().catch(() => []),
    ]);

    // Statistics Counts
    const counts = {
      total: volunteers.length + scholarships.length + candidatures.length + joins.length + contacts.length + users.length,
      volunteers: volunteers.length,
      scholarships: scholarships.length,
      candidatures: candidatures.length,
      joins: joins.length,
      contacts: contacts.length,
      users: users.length,
    };

    // Normalize each dataset
    let allItems = [
      ...volunteers.map((item) => normalizeItem(item, "volunteer")),
      ...scholarships.map((item) => normalizeItem(item, "scholarship")),
      ...candidatures.map((item) => normalizeItem(item, "candidature")),
      ...joins.map((item) => normalizeItem(item, "join")),
      ...contacts.map((item) => normalizeItem(item, "contact")),
      ...users.map((item) => normalizeItem(item, "user")),
    ];

    // Sort all by createdAt descending
    allItems.sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0));

    // Filter by type if not 'all'
    if (selectedType !== "all") {
      const typeMap = {
        volunteers: "volunteer",
        scholarships: "scholarship",
        candidatures: "candidature",
        joins: "join",
        contacts: "contact",
        users: "user",
      };
      const matchType = typeMap[selectedType] || selectedType;
      allItems = allItems.filter((i) => i._formType === matchType);
    }

    // Filter by status if not 'all'
    if (selectedStatus !== "all") {
      allItems = allItems.filter(
        (i) => (i._status || "").toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      allItems = allItems.filter((i) => {
        return (
          (i._applicantName && i._applicantName.toLowerCase().includes(searchQuery)) ||
          (i._mobile && i._mobile.toLowerCase().includes(searchQuery)) ||
          (i._uniqueId && i._uniqueId.toLowerCase().includes(searchQuery)) ||
          (i._location && i._location.toLowerCase().includes(searchQuery)) ||
          (i._email && i._email.toLowerCase().includes(searchQuery))
        );
      });
    }

    res.render("forms/admin_forms", {
      items: allItems,
      counts,
      selectedType,
      selectedStatus,
      searchQuery,
      activeNav: "forms",
    });
  } catch (error) {
    console.error("Error in renderAdminFormsPage:", error);
    res.status(500).send("Error loading Forms Admin: " + error.message);
  }
};

// API: Get Full Detail of any Form by Type and ID
export const getFormItemDetail = async (req, res) => {
  try {
    const { formType, id } = req.params;
    let doc = null;

    switch (formType) {
      case "volunteer":
        doc = await Volunteer.findById(id).lean();
        break;
      case "scholarship":
        doc = await Scholarship.findById(id).lean();
        break;
      case "candidature":
        doc = await Candidature.findById(id).lean();
        break;
      case "join":
        doc = await Join.findById(id).lean();
        break;
      case "contact":
        doc = await Contact.findById(id).lean();
        break;
      case "user":
        doc = await User.findById(id).lean();
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid form type" });
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    const normalized = normalizeItem(doc, formType);
    return res.json({ success: true, data: normalized, raw: doc });
  } catch (error) {
    console.error("Error in getFormItemDetail:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API: Update Status
export const updateFormStatus = async (req, res) => {
  try {
    const { formType, id, newStatus } = req.body;
    if (!formType || !id || !newStatus) {
      return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    let updated = null;
    switch (formType) {
      case "volunteer":
        updated = await Volunteer.findByIdAndUpdate(id, { status: newStatus }, { new: true });
        break;
      case "scholarship":
        updated = await Scholarship.findByIdAndUpdate(id, { status: newStatus }, { new: true });
        break;
      case "candidature":
        updated = await Candidature.findByIdAndUpdate(id, { status: newStatus }, { new: true });
        break;
      case "join":
        updated = await Join.findByIdAndUpdate(id, { status: newStatus }, { new: true });
        break;
      case "contact":
        updated = await Contact.findByIdAndUpdate(id, { status: newStatus }, { new: true });
        break;
      default:
        return res.status(400).json({ success: false, message: "Cannot change status for this type" });
    }

    return res.json({ success: true, message: "Status updated successfully", data: updated });
  } catch (error) {
    console.error("Error in updateFormStatus:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API: Delete Form Record
export const deleteFormItem = async (req, res) => {
  try {
    const { formType, id } = req.body;
    if (!formType || !id) {
      return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    switch (formType) {
      case "volunteer":
        await Volunteer.findByIdAndDelete(id);
        break;
      case "scholarship":
        await Scholarship.findByIdAndDelete(id);
        break;
      case "candidature":
        await Candidature.findByIdAndDelete(id);
        break;
      case "join":
        await Join.findByIdAndDelete(id);
        break;
      case "contact":
        await Contact.findByIdAndDelete(id);
        break;
      case "user":
        await User.findByIdAndDelete(id);
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid form type" });
    }

    return res.json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error in deleteFormItem:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API: Export CSV
export const exportFormsCsv = async (req, res) => {
  try {
    const formType = req.params.formType || "all";
    let records = [];

    if (formType === "all" || formType === "volunteers") {
      const v = await Volunteer.find().lean();
      records.push(...v.map((i) => normalizeItem(i, "volunteer")));
    }
    if (formType === "all" || formType === "scholarships") {
      const s = await Scholarship.find().lean();
      records.push(...s.map((i) => normalizeItem(i, "scholarship")));
    }
    if (formType === "all" || formType === "candidatures") {
      const c = await Candidature.find().lean();
      records.push(...c.map((i) => normalizeItem(i, "candidature")));
    }
    if (formType === "all" || formType === "joins") {
      const j = await Join.find().lean();
      records.push(...j.map((i) => normalizeItem(i, "join")));
    }

    records.sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0));

    // Generate CSV string
    const headers = ["ID", "Form Type", "Applicant Name", "Mobile", "Email", "Location", "Status", "Date"];
    const rows = records.map((r) => [
      `"${r._uniqueId || ""}"`,
      `"${r._typeLabel || ""}"`,
      `"${(r._applicantName || "").replace(/"/g, '""')}"`,
      `"${r._mobile || ""}"`,
      `"${r._email || ""}"`,
      `"${(r._location || "").replace(/"/g, '""')}"`,
      `"${r._status || ""}"`,
      `"${r._date ? new Date(r._date).toLocaleString("en-IN") : ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=VIP_Forms_${formType}_${Date.now()}.csv`);
    return res.status(200).send("\uFEFF" + csvContent);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return res.status(500).send("Export failed: " + error.message);
  }
};
