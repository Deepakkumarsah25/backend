import Join from "../models/joinmodel.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { generateMemberId } from "../services/memberId.js";

/*******************************************************
 * CONSTANTS & HELPERS
 *******************************************************/

const MEMBER_LIMIT_WITHOUT_AGENT = 5;
const MAX_PAGE_LIMIT = 50;
const MAX_SEARCH_LENGTH = 50;

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Normalize membership category type
const normalizeType = (type = "") => {
  const t = String(type).trim().toLowerCase();
  if (t === "student" || t === "student_member") return "student_member";
  if (t === "volunteer" || t === "volunteer_member") return "volunteer_member";
  if (t === "quick" || t === "quick_member") return "quick_member";
  return "party_member";
};

/*******************************************************
 * APPLY FOR MEMBERSHIP (USER FORM)
 *
 * POST /api/join/apply
 *******************************************************/
export const applyForMembership = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id && !user?.uid) {
      return res.status(401).json({
        success: false,
        message: "Login required to apply for membership.",
      });
    }
    const {
      fullName,
      mobile,
      email,
      fatherName,
      gender,
      dob,
      bloodGroup,
      alternateMobile,
      whatsappNumber,
      address,
      village,
      state,
      district,
      block,
      policeStation,
      assembly,
      pinCode,
      occupation,
      type = "party_member",
      collegeName,
      course,
      yearSemester,
      studentId,
      profession,
      areaOfInterest,
      availableTime,
      previousExperience,
      declarationAccepted,
    } = req.body;

    // 1. Validation
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    const cleanMobile = String(mobile || "").trim().replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit Indian mobile number.",
      });
    }

    // 2. Check for existing application by User ID or Mobile
    const queryConditions = [{ mobile: cleanMobile }];
    if (user?._id) {
      queryConditions.push({ userId: user._id });
    }
    if (user?.uid) {
      queryConditions.push({ uid: user.uid });
    }

    const existing = await Join.findOne({ $or: queryConditions });

    if (existing) {
      if (existing.status === "Approved") {
        return res.status(409).json({
          success: false,
          alreadyApplied: true,
          status: "Approved",
          memberId: existing.memberId,
          message:
            "You already have an approved membership card (ID: " +
            existing.memberId +
            ").",
        });
      }

      if (existing.status === "Pending") {
        return res.status(409).json({
          success: false,
          alreadyApplied: true,
          status: "Pending",
          message:
            "Your membership application has already been submitted and is currently pending admin review.",
        });
      }

      // If Rejected, allow updating the existing application with new details
    }

    // 3. Photo Upload
    let photoPath = existing?.profilePhoto || "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      photoPath = result.secure_url;
    } else if (req.body.profilePhoto) {
      photoPath = String(req.body.profilePhoto).trim();
    }

    const normalizedType = normalizeType(type);

    const applicationPayload = {
      userId: user?._id || null,
      uid: user?.uid || "",
      mode: "full",
      type: normalizedType,
      status: "Pending",
      memberId: null, // ONLY created on admin approval!
      profilePhoto: photoPath,
      fullName: fullName.trim(),
      mobile: cleanMobile,
      email: (email || "").trim(),
      fatherName: (fatherName || "").trim(),
      gender: gender || "",
      dob: dob ? new Date(dob) : null,
      bloodGroup: (bloodGroup || "").trim().toUpperCase(),
      alternateMobile: (alternateMobile || "").trim(),
      whatsappNumber: (whatsappNumber || "").trim(),
      village: (village || "").trim(),
      address: (address || village || "").trim(),
      state: (state || "").trim(),
      district: (district || "").trim(),
      block: (block || "").trim(),
      policeStation: (policeStation || "").trim(),
      assembly: (assembly || "").trim(),
      pinCode: (pinCode || "").trim(),
      occupation: (occupation || "").trim(),
      collegeName: (collegeName || "").trim(),
      course: (course || "").trim(),
      yearSemester: (yearSemester || "").trim(),
      studentId: (studentId || "").trim(),
      profession: (profession || "").trim(),
      areaOfInterest: (areaOfInterest || "").trim(),
      availableTime: (availableTime || "").trim(),
      previousExperience: (previousExperience || "").trim(),
      declarationAccepted:
        declarationAccepted === true ||
        declarationAccepted === "true" ||
        declarationAccepted === 1,
      remarks: "",
    };

    let application;
    if (existing && existing.status === "Rejected") {
      application = await Join.findByIdAndUpdate(
        existing._id,
        { $set: applicationPayload },
        { new: true }
      );
    } else {
      application = await Join.create(applicationPayload);
    }

    return res.status(201).json({
      success: true,
      message:
        "Application submitted successfully. Your membership card will be generated once approved by admin.",
      data: application,
    });
  } catch (err) {
    console.error("applyForMembership error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to submit membership application.",
      error: err.message,
    });
  }
};

/*******************************************************
 * CHECK MY APPLICATION STATUS
 *
 * GET /api/join/my-status
 *******************************************************/
export const getMyApplicationStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id && !user?.uid) {
      return res.status(401).json({
        success: false,
        message: "Login required.",
      });
    }
    const queryConditions = [];

    if (user?._id) queryConditions.push({ userId: user._id });
    if (user?.uid) queryConditions.push({ uid: user.uid });
    if (user?.phone) {
      const cleanPhone = String(user.phone).replace(/\D/g, "").slice(-10);
      if (cleanPhone) queryConditions.push({ mobile: cleanPhone });
    }

    const { mobile } = req.query;
    if (mobile) {
      const cleanQMobile = String(mobile).replace(/\D/g, "").slice(-10);
      if (cleanQMobile) queryConditions.push({ mobile: cleanQMobile });
    }

    if (queryConditions.length === 0) {
      return res.status(200).json({
        success: true,
        hasApplication: false,
      });
    }

    const application = await Join.findOne({ $or: queryConditions })
      .sort({ createdAt: -1 })
      .lean();

    if (!application) {
      return res.status(200).json({
        success: true,
        hasApplication: false,
      });
    }

    return res.status(200).json({
      success: true,
      hasApplication: true,
      application: {
        _id: application._id,
        status: application.status,
        memberId: application.memberId || null,
        fullName: application.fullName,
        mobile: application.mobile,
        type: application.type,
        bloodGroup: application.bloodGroup || "",
        dob: application.dob || null,
        pinCode: application.pinCode || "",
        state: application.state || "",
        district: application.district || "",
        address: application.address || "",
        profilePhoto: application.profilePhoto || "",
        remarks: application.remarks || "",
        createdAt: application.createdAt,
        approvedAt: application.approvedAt || null,
      },
    });
  } catch (err) {
    console.error("getMyApplicationStatus error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch application status.",
    });
  }
};

/*******************************************************
 * GET MY MEMBERSHIP CARD
 *
 * GET /api/join/my-card
 *******************************************************/
export const getMyMembershipCard = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Login required.",
      });
    }

    const queryConditions = [{ userId: user._id }];
    if (user.uid) queryConditions.push({ uid: user.uid });
    if (user.phone) {
      const cleanPhone = String(user.phone).replace(/\D/g, "").slice(-10);
      if (cleanPhone) queryConditions.push({ mobile: cleanPhone });
    }

    // Only APPROVED applications with valid memberId get a card!
    const application = await Join.findOne({
      $or: queryConditions,
      status: "Approved",
      memberId: { $ne: null },
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!application) {
      // Check if application is pending or rejected
      const anyApp = await Join.findOne({ $or: queryConditions })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: false,
        hasCard: false,
        status: anyApp ? anyApp.status : "NotApplied",
        message: anyApp
          ? anyApp.status === "Pending"
            ? "Your application is currently under review by admin."
            : "Your application was not approved."
          : "No approved membership card found. Please apply from the Join page.",
      });
    }

    return res.status(200).json({
      success: true,
      hasCard: true,
      data: {
        _id: application._id,
        memberId: application.memberId,
        fullName: application.fullName,
        profilePhoto: application.profilePhoto || "",
        bloodGroup: application.bloodGroup || "",
        dob: application.dob || null,
        pinCode: application.pinCode || "",
        state: application.state || "",
        district: application.district || "",
        address: application.address || "",
        occupation: application.occupation || "",
        type: application.type,
        status: application.status,
        createdAt: application.createdAt,
        approvedAt: application.approvedAt,
      },
    });
  } catch (err) {
    console.error("getMyMembershipCard error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch membership card.",
    });
  }
};

/*******************************************************
 * GET CARD BY MEMBER ID
 *
 * GET /api/join/card/:memberId
 *******************************************************/
export const getCardByMemberId = async (req, res) => {
  try {
    const memberId = String(req.params.memberId || "").trim();

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required.",
      });
    }

    const application = await Join.findOne({ memberId, status: "Approved" }).lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Verified membership card not found. Admin approval is required.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        memberId: application.memberId,
        fullName: application.fullName,
        profilePhoto: application.profilePhoto || "",
        bloodGroup: application.bloodGroup || "",
        dob: application.dob || null,
        pinCode: application.pinCode || "",
        state: application.state || "",
        district: application.district || "",
        address: application.address || "",
        occupation: application.occupation || "",
        type: application.type,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (err) {
    console.error("getCardByMemberId error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch card.",
    });
  }
};

/*******************************************************
 * ADMIN — APPROVE APPLICATION & GENERATE CARD
 *
 * POST /joinmember/:id/approve
 *******************************************************/
export const approveJoinApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Join.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    let memberId = application.memberId;
    if (!memberId) {
      memberId = await generateMemberId();
    }

    application.status = "Approved";
    application.memberId = memberId;
    application.approvedAt = new Date();
    application.approvedBy = req.user?._id || null;
    application.remarks = "";
    await application.save();

    // Sync memberId with User document if available
    if (application.userId) {
      await User.findByIdAndUpdate(application.userId, {
        membershipId: memberId,
        state: application.state || undefined,
        district: application.district || undefined,
      });
    } else if (application.mobile) {
      await User.findOneAndUpdate(
        { phone: new RegExp(application.mobile + "$") },
        {
          membershipId: memberId,
          state: application.state || undefined,
          district: application.district || undefined,
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Application approved successfully. Card generated.",
      memberId,
      data: application,
    });
  } catch (err) {
    console.error("approveJoinApplication error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to approve application.",
      error: err.message,
    });
  }
};

/*******************************************************
 * ADMIN — REJECT APPLICATION
 *
 * POST /joinmember/:id/reject
 *******************************************************/
export const rejectJoinApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks = "Rejected by admin" } = req.body;

    const application = await Join.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    application.status = "Rejected";
    application.remarks = String(remarks).trim();
    await application.save();

    return res.status(200).json({
      success: true,
      message: "Application rejected.",
      data: application,
    });
  } catch (err) {
    console.error("rejectJoinApplication error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to reject application.",
    });
  }
};

/*******************************************************
 * ADMIN — LIST WITH FILTERS & SEARCH
 *
 * GET /joinmember/data
 *******************************************************/
export const getAllJoinApplications = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      type = "",
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
      query.status = status;
    }

    if (type) {
      query.type = normalizeType(type);
    }

    const cleanSearch = String(search || "")
      .trim()
      .slice(0, MAX_SEARCH_LENGTH);

    if (cleanSearch) {
      const regex = new RegExp(escapeRegex(cleanSearch), "i");
      query.$or = [
        { fullName: regex },
        { mobile: regex },
        { email: regex },
        { memberId: regex },
        { district: regex },
        { state: regex },
        { bloodGroup: regex },
        { pinCode: regex },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      MAX_PAGE_LIMIT
    );
    const skip = (pageNum - 1) * limitNum;

    const [applications, total, pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        Join.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        Join.countDocuments(query),
        Join.countDocuments({ status: "Pending" }),
        Join.countDocuments({ status: "Approved" }),
        Join.countDocuments({ status: "Rejected" }),
      ]);

    return res.status(200).json({
      success: true,
      data: applications,
      counts: {
        total,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("getAllJoinApplications error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch applications.",
    });
  }
};

/*******************************************************
 * ADMIN — GET BY ID
 *
 * GET /joinmember/:id
 *******************************************************/
export const getJoinApplicationById = async (req, res) => {
  try {
    const application = await Join.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (err) {
    console.error("getJoinApplicationById error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch application.",
    });
  }
};

/*******************************************************
 * ADMIN — DELETE
 *
 * DELETE /joinmember/:id
 *******************************************************/
export const deleteJoinApplication = async (req, res) => {
  try {
    const application = await Join.findByIdAndDelete(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully.",
    });
  } catch (err) {
    console.error("deleteJoinApplication error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete application.",
    });
  }
};

/*******************************************************
 * ADMIN — RENDER PAGE
 *
 * GET /joinmember
 *******************************************************/
export const renderJoinAdminPage = async (req, res) => {
  try {
    const [applications, total, pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        Join.find({}).sort({ createdAt: -1 }).limit(20).lean(),
        Join.countDocuments({}),
        Join.countDocuments({ status: "Pending" }),
        Join.countDocuments({ status: "Approved" }),
        Join.countDocuments({ status: "Rejected" }),
      ]);

    res.render("joinmember", {
      applications,
      total,
      pendingCount,
      approvedCount,
      rejectedCount,
      pageTitle: "Membership Applications",
    });
  } catch (err) {
    console.error("renderJoinAdminPage error:", err);
    res.status(500).send("Failed to load join requests page.");
  }
};

/*******************************************************
 * AGENT — ADD MEMBER (PRESERVED)
 *
 * POST /api/join/add-member
 *******************************************************/
export const addMemberByAgent = async (req, res) => {
  try {
    const agentUser = req.user;

    if (!agentUser?._id) {
      return res.status(401).json({
        success: false,
        message: "Login required.",
      });
    }

    if (!agentUser.isAgent) {
      const addedCount = await Join.countDocuments({
        addedBy: agentUser._id,
      });

      if (addedCount >= MEMBER_LIMIT_WITHOUT_AGENT) {
        return res.status(403).json({
          success: false,
          code: "AGENT_VERIFICATION_REQUIRED",
          message: `You've added ${MEMBER_LIMIT_WITHOUT_AGENT} members. Please request agent verification to add more.`,
        });
      }
    }

    const {
      fullName,
      mobile,
      state,
      district,
      bloodGroup,
      pinCode,
      dob,
      address,
    } = req.body;

    if (!fullName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!/^[6-9]\d{9}$/.test(mobile || "")) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number.",
      });
    }

    const existing = await Join.findOne({
      mobile: mobile.trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A member with this mobile number already exists.",
        memberId: existing.memberId,
      });
    }

    let photoPath = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      photoPath = result.secure_url;
    }

    // Add Member via Membership Drive: Does NOT auto-generate a card or auto-approve!
    // Card is only issued after admin approval.
    const application = await Join.create({
      mode: "quick",
      type: "quick_member",
      status: "Pending",
      memberId: null,
      profilePhoto: photoPath,
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      state: state || "",
      district: district || "",
      bloodGroup: (bloodGroup || "").trim().toUpperCase(),
      pinCode: pinCode || "",
      dob: dob ? new Date(dob) : null,
      address: address || "",
      declarationAccepted: true,
      addedBy: agentUser._id,
      approvedAt: null,
    });

    return res.status(201).json({
      success: true,
      message: "Member added successfully. Membership card is subject to admin verification and approval.",
      memberId: null,
      data: application,
    });
  } catch (err) {
    console.error("addMemberByAgent error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

/*******************************************************
 * AGENT — MY ADDED MEMBERS (PRESERVED)
 *
 * GET /api/join/my-added-members
 *******************************************************/
export const getMyAddedMembers = async (req, res) => {
  try {
    const agentId = req.user?._id;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Login required.",
      });
    }

    let { search = "", page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const requestedLimit = parseInt(limit, 10) || 10;
    const limitNum = Math.min(Math.max(requestedLimit, 1), 10);

    const cleanSearch = String(search || "")
      .trim()
      .slice(0, MAX_SEARCH_LENGTH);

    const query = { addedBy: agentId };

    if (cleanSearch) {
      const regex = new RegExp(escapeRegex(cleanSearch), "i");
      query.$or = [
        { fullName: regex },
        { mobile: regex },
        { memberId: regex },
        { district: regex },
        { state: regex },
      ];
    }

    const skip = (pageNum - 1) * limitNum;

    const listProjection = {
      _id: 1,
      memberId: 1,
      fullName: 1,
      mobile: 1,
      state: 1,
      district: 1,
      bloodGroup: 1,
      status: 1,
      profilePhoto: 1,
      createdAt: 1,
    };

    const [members, total] = await Promise.all([
      Join.find(query)
        .select(listProjection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Join.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: members,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
      isAgent: !!req.user.isAgent,
      remainingSlots: req.user.isAgent
        ? null
        : Math.max(MEMBER_LIMIT_WITHOUT_AGENT - total, 0),
      referralCode: req.user.referralCode || null,
    });
  } catch (err) {
    console.error("getMyAddedMembers error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch members.",
    });
  }
};