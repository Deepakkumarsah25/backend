import SupportSettings from "../models/SupportSettings.js";
import DonationRecord from "../models/DonationRecord.js";

// Helper to get or create support settings
export const getOrCreateSupportSettings = async () => {
  let settings = await SupportSettings.findOne().lean();
  if (!settings) {
    settings = await SupportSettings.create({
      pageTitle: "दान करें / Donate",
      pageSubtitle: "पार्टी को मजबूत बनाने में अपना बहुमूल्य योगदान दें",
      partyNameHindi: "विकासशील इंसान पार्टी",
      partyNameEnglish: "Vikassheel Insaan Party",
      inspirationalMessage:
        "सामाजिक न्याय और बिहार के विकास की इस लड़ाई में अपना बहुमूल्य योगदान दें। आपका हर एक रुपया समाज में सकारात्मक बदलाव ला सकता है।",
      noticeText: "कृपया ध्यान दें: केवल इसी आधिकारिक बैंक खाते में दान करें। किसी अन्य व्यक्ति को नकद देने से बचें।",
      accountName: "Vikassheel Insaan Party",
      accountNameHindi: "विकासशील इंसान पार्टी",
      bankName: "State Bank of India",
      bankNameHindi: "भारतीय स्टेट बैंक",
      branchName: "06, Boring Road, Patna, Bihar - 800001",
      accountNumber: "41982736450",
      ifscCode: "SBIN0001513",
      upiId: "vipparty@sbi",
      qrCodeUrl: "",
      taxExemptionNotice:
        "आयकर अधिनियम की धारा 80GGC के तहत राजनीतिक दल को दिया गया दान 100% कर मुक्त है। (All donations to VIP are 100% tax exempt under Section 80GGC of the Income Tax Act.)",
      isVerified: true,
    });
    settings = settings.toObject();
  }
  return settings;
};

// Render Support / Donate Settings page in Admin
export const renderSupportSettingsPage = async (req, res) => {
  try {
    const settings = await getOrCreateSupportSettings();
    const totalDonationsCount = await DonationRecord.countDocuments().catch(() => 0);
    const totalDonationsAmountResult = await DonationRecord.aggregate([
      { $match: { status: { $in: ["Verified", "Receipt Issued"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).catch(() => []);
    const verifiedAmount =
      totalDonationsAmountResult.length > 0 ? totalDonationsAmountResult[0].total : 0;

    res.render("website/support_settings", {
      settings,
      stats: {
        totalRecords: totalDonationsCount,
        verifiedAmount,
      },
      success: req.query.saved === "1",
      activeNav: "website-support",
    });
  } catch (error) {
    console.error("Error loading support settings:", error);
    res.status(500).send("Error loading support settings: " + error.message);
  }
};

// Update Support / Donate Settings
export const updateSupportSettings = async (req, res) => {
  try {
    const {
      pageTitle,
      pageSubtitle,
      partyNameHindi,
      partyNameEnglish,
      inspirationalMessage,
      noticeText,
      accountName,
      accountNameHindi,
      bankName,
      bankNameHindi,
      branchName,
      accountNumber,
      ifscCode,
      upiId,
      qrCodeUrl,
      taxExemptionNotice,
      isVerified,
    } = req.body;

    let settings = await SupportSettings.findOne();
    if (!settings) {
      settings = new SupportSettings();
    }

    settings.pageTitle = pageTitle || settings.pageTitle;
    settings.pageSubtitle = pageSubtitle || settings.pageSubtitle;
    settings.partyNameHindi = partyNameHindi || settings.partyNameHindi;
    settings.partyNameEnglish = partyNameEnglish || settings.partyNameEnglish;
    settings.inspirationalMessage = inspirationalMessage || settings.inspirationalMessage;
    settings.noticeText = noticeText || settings.noticeText;
    settings.accountName = accountName || settings.accountName;
    settings.accountNameHindi = accountNameHindi || settings.accountNameHindi;
    settings.bankName = bankName || settings.bankName;
    settings.bankNameHindi = bankNameHindi || settings.bankNameHindi;
    settings.branchName = branchName || settings.branchName;
    settings.accountNumber = (accountNumber || settings.accountNumber).replace(/\s+/g, "");
    settings.ifscCode = (ifscCode || settings.ifscCode).replace(/\s+/g, "").toUpperCase();
    settings.upiId = (upiId || settings.upiId).trim();
    settings.qrCodeUrl = qrCodeUrl !== undefined ? qrCodeUrl : settings.qrCodeUrl;
    settings.taxExemptionNotice = taxExemptionNotice || settings.taxExemptionNotice;
    settings.isVerified = isVerified === "on" || isVerified === true || isVerified === "true";

    await settings.save();
    console.log("✅ Support Settings updated in vip-a MongoDB successfully!");

    res.redirect("/admin/website/support-settings?saved=1");
  } catch (error) {
    console.error("Error updating support settings:", error);
    res.status(500).send("Error updating support settings: " + error.message);
  }
};

// Render Donations List in Admin
export const renderDonationsListPage = async (req, res) => {
  try {
    const selectedStatus = req.query.status || "all";
    const searchQuery = (req.query.q || "").trim().toLowerCase();

    let query = {};
    if (selectedStatus !== "all") {
      query.status = selectedStatus;
    }

    let records = await DonationRecord.find(query).sort({ createdAt: -1 }).lean();

    if (searchQuery) {
      records = records.filter(
        (r) =>
          (r.donorName && r.donorName.toLowerCase().includes(searchQuery)) ||
          (r.donorPhone && r.donorPhone.toLowerCase().includes(searchQuery)) ||
          (r.receiptNumber && r.receiptNumber.toLowerCase().includes(searchQuery)) ||
          (r.utrNumber && r.utrNumber.toLowerCase().includes(searchQuery)) ||
          (r.district && r.district.toLowerCase().includes(searchQuery))
      );
    }

    const counts = {
      total: await DonationRecord.countDocuments(),
      pending: await DonationRecord.countDocuments({ status: "Pending Verification" }),
      verified: await DonationRecord.countDocuments({ status: "Verified" }),
      receiptIssued: await DonationRecord.countDocuments({ status: "Receipt Issued" }),
    };

    res.render("website/donations_list", {
      records,
      counts,
      selectedStatus,
      searchQuery,
      activeNav: "website-donations",
    });
  } catch (error) {
    console.error("Error rendering donations list:", error);
    res.status(500).send("Error rendering donations: " + error.message);
  }
};

// Update Donation Record Status
export const updateDonationStatus = async (req, res) => {
  try {
    const { id, newStatus } = req.body;
    if (!id || !newStatus) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const updated = await DonationRecord.findByIdAndUpdate(id, { status: newStatus }, { new: true });
    return res.json({ success: true, message: "स्थिति अपडेट कर दी गई", data: updated });
  } catch (error) {
    console.error("Error updating donation status:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Donation Record
export const deleteDonationRecord = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "Missing id" });
    }

    await DonationRecord.findByIdAndDelete(id);
    return res.json({ success: true, message: "दान रिकॉर्ड सफलतापूर्वक हटा दिया गया" });
  } catch (error) {
    console.error("Error deleting donation record:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Export Donations to CSV
export const exportDonationsCsv = async (req, res) => {
  try {
    const records = await DonationRecord.find().sort({ createdAt: -1 }).lean();
    const headers = [
      "Receipt No",
      "Donor Name",
      "Phone",
      "Email",
      "PAN",
      "Amount (INR)",
      "UTR / Ref No",
      "Payment Mode",
      "District",
      "State",
      "Status",
      "Date",
    ];

    const rows = records.map((r) => [
      `"${r.receiptNumber || ""}"`,
      `"${(r.donorName || "").replace(/"/g, '""')}"`,
      `"${r.donorPhone || ""}"`,
      `"${r.donorEmail || ""}"`,
      `"${r.panNumber || ""}"`,
      `"${r.amount || 0}"`,
      `"${r.utrNumber || ""}"`,
      `"${r.paymentMode || "UPI"}"`,
      `"${r.district || ""}"`,
      `"${r.state || "Bihar"}"`,
      `"${r.status || ""}"`,
      `"${r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=VIP_Donations_${Date.now()}.csv`);
    return res.status(200).send("\uFEFF" + csvContent);
  } catch (error) {
    console.error("Error exporting donations CSV:", error);
    return res.status(500).send("Export failed: " + error.message);
  }
};
