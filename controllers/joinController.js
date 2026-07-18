import Join from "../models/joinmodel.js";

/*******************************************************
 * MEMBER ID GENERATOR
 * Format: <TYPE PREFIX><YEAR><6-DIGIT RANDOM>
 * e.g. PM2026483920, SM2026118273, VL2026903841
 *******************************************************/

const generateMemberId = (type) => {
  const prefixMap = {
    party: "PM",
    student: "SM",
    volunteer: "VL",
  };

  const prefix = prefixMap[type] || "MB";
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);

  return `${prefix}${year}${random}`;
};

/*******************************************************
 * CREATE APPLICATION (User submits from Apply screen)
 * POST /api/membership/apply
 *******************************************************/

export const createJoinApplication = async (req, res) => {
  try {
    const userId = req.user?._id;
    const uid = req.user?.uid;

    if (!userId || !uid) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to submit an application.",
      });
    }

    const {
      type,
      profilePhoto,
      fullName,
      email,
      mobile,
      fatherName,
      gender,
      dob,
      alternateMobile,
      whatsappNumber,
      address,
      state,
      district,
      block,
      policeStation,
      assembly,
      pinCode,
      occupation,
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

    if (!["party", "student", "volunteer"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership type.",
      });
    }

    if (!declarationAccepted) {
      return res.status(400).json({
        success: false,
        message: "Declaration must be accepted to submit the application.",
      });
    }

   // Prevent duplicate pending applications of the same type
    const existingPending = await Join.findOne({
      userId,
      type,
      status: "Pending",
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending application of this type.",
      });
    }

    const fields = {
      profilePhoto,
      fullName,
      email,
      mobile,
      fatherName,
      gender,
      dob,
      alternateMobile,
      whatsappNumber,
      address,
      state,
      district,
      block,
      policeStation,
      assembly,
      pinCode,
      occupation,
      collegeName,
      course,
      yearSemester,
      studentId,
      profession,
      areaOfInterest,
      availableTime,
      previousExperience,
      declarationAccepted,
    };

    // Agar user ka pehle se koi Rejected application hai (same type),
    // usi ko update karke wapas Pending kar do — naya document mat banao
    const existingRejected = await Join.findOne({
      userId,
      type,
      status: "Rejected",
    });

    let application;

    if (existingRejected) {
      Object.assign(existingRejected, fields);
      existingRejected.status = "Pending";
      existingRejected.remarks = "";
      existingRejected.memberId = "";

      application = await existingRejected.save();
    } else {
      application = await Join.create({
        userId,
        uid,
        type,
        ...fields,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: application,
    });
  } catch (err) {
    console.error("createJoinApplication error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting the application.",
    });
  }
};

/*******************************************************
 * GET ALL APPLICATIONS (Admin, with filters + pagination)
 * GET /api/admin/join?type=&status=&search=&page=&limit=
 *******************************************************/

export const getAllJoinApplications = async (req, res) => {
  try {
    const {
      type,
      status,
      search = "",
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (type && ["party", "student", "volunteer"].includes(type)) {
      query.type = type;
    }

    if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
      query.status = status;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullName: regex },
        { mobile: regex },
        { email: regex },
        { memberId: regex },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      Join.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Join.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: applications,
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
 * GET SINGLE APPLICATION (Admin)
 * GET /api/admin/join/:id
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
 * UPDATE STATUS — Approve / Reject (Admin)
 * PATCH /api/admin/join/:id/status
 * body: { status: "Approved" | "Rejected", remarks?: string }
 *******************************************************/

export const updateJoinStatus = async (req, res) => {
  try {
    const { status, remarks = "" } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected.",
      });
    }

    const application = await Join.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (application.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}.`,
      });
    }

    application.status = status;
    application.remarks = remarks;

    if (status === "Approved" && !application.memberId) {
      application.memberId = generateMemberId(application.type);
    }

    await application.save();

    return res.status(200).json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully.`,
      data: application,
    });
  } catch (err) {
    console.error("updateJoinStatus error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update application status.",
    });
  }
};

/*******************************************************
 * DELETE APPLICATION (Admin)
 * DELETE /api/admin/join/:id
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
 * PREFILL DATA FOR APPLY SCREEN (Logged-in user)
 * GET /api/join/prefill
 * Returns basic profile fields + user's most recent
 * application (any status), so the mobile form can
 * prefill instead of the user retyping everything.
 *******************************************************/

export const getPrefillData = async (req, res) => {
  try {
    const user = req.user;

    const previousApplication = await Join.findOne({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          photoURL: user.photoURL || "",
        },
        previousApplication: previousApplication || null,
      },
    });
  } catch (err) {
    console.error("getPrefillData error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prefill data.",
    });
  }
};

/*******************************************************
 * RENDER ADMIN JOIN REQUESTS PAGE (EJS)
 * GET /admin/join
 *******************************************************/

export const renderJoinAdminPage = async (req, res) => {
  try {
    const applications = await Join.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const total = await Join.countDocuments({});

    res.render("joinmember", {
      applications,
      total,
      pageTitle: "Membership Applications",
    });
  } catch (err) {
    console.error("renderJoinAdminPage error:", err);
    res.status(500).send("Failed to load join requests page.");
  }
};