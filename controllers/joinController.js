
// import User from "../models/User.js";
// import Join from "../models/joinmodel.js";
// import { uploadToCloudinary } from "../config/cloudinary.js";
// import Counter from "../models/Counter.js";
// const generateMemberId = async () => {
//   const counter = await Counter.findOneAndUpdate(
//     { _id: "membershipId" },
//     { $inc: { seq: 1 } },
//     { new: true, upsert: true, setDefaultsOnInsert: true }
//   );

//   return `VIP${String(counter.seq).padStart(7, "0")}`;
// };

// // Non-agent users can add members up to this many before they must
// // request agent verification from admin.
// const MEMBER_LIMIT_WITHOUT_AGENT = 5;

// /*******************************************************
//  * QUICK JOIN — works for guests AND logged-in users
//  * POST /api/join/quick
//  *******************************************************/
// export const quickJoin = async (req, res) => {
//   try {
//     const { fullName, mobile, state, district } = req.body;
//     const uid = req.user?.uid || null;
//     const userId = req.user?._id || null;

//     if (!fullName?.trim()) {
//       return res.status(400).json({ success: false, message: "Full name is required." });
//     }
//     if (!/^[6-9]\d{9}$/.test(mobile || "")) {
//       return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number." });
//     }

//     if (uid) {
//       const byUid = await Join.findOne({ uid });
//       if (byUid) {
//         return res.status(200).json({
//           success: true,
//           message: "Membership already exists for this account.",
//           memberId: byUid.memberId,
//         });
//       }
//     }

//     const existing = await Join.findOne({ mobile: mobile.trim() });
//     if (existing) {
//       return res.status(409).json({
//         success: false,
//         message: "A membership already exists for this mobile number.",
//         memberId: existing.memberId,
//       });
//     }

//     let photoPath = "";
//     if (req.file) {
//       const result = await uploadToCloudinary(req.file.buffer);
//       photoPath = result.secure_url;
//     }

//     const memberId = await generateMemberId();

//     const application = await Join.create({
//       mode: "quick",
//       type: "quick_member",
//       memberId,
//       profilePhoto: photoPath,
//       fullName: fullName.trim(),
//       mobile: mobile.trim(),
//       state: state || "",
//       district: district || "",
//       declarationAccepted: true,
//       ...(uid && { uid }),
//       ...(userId && { userId }),
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Membership created successfully.",
//       memberId: application.memberId,
//     });
//   } catch (err) {
//     console.error("quickJoin error:", err);
//     return res.status(500).json({ success: false, message: "Something went wrong." });
//   }
// };

// /*******************************************************
//  * ADD MEMBER — any logged-in user, up to MEMBER_LIMIT_WITHOUT_AGENT
//  * unless they're a verified agent (unlimited).
//  * POST /api/join/add-member
//  *******************************************************/
// export const addMemberByAgent = async (req, res) => {
//   try {
//     const agentUser = req.user;
//     if (!agentUser?._id) {
//       return res.status(401).json({ success: false, message: "Login required." });
//     }

//     if (!agentUser.isAgent) {
//       const addedCount = await Join.countDocuments({ addedBy: agentUser._id });
//       if (addedCount >= MEMBER_LIMIT_WITHOUT_AGENT) {
//         return res.status(403).json({
//           success: false,
//           code: "AGENT_VERIFICATION_REQUIRED",
//           message: `You've added ${MEMBER_LIMIT_WITHOUT_AGENT} members. Please request agent verification to add more.`,
//         });
//       }
//     }

//     const { fullName, mobile, state, district } = req.body;
//     if (!fullName?.trim()) {
//       return res.status(400).json({ success: false, message: "Full name is required." });
//     }
//     if (!/^[6-9]\d{9}$/.test(mobile || "")) {
//       return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number." });
//     }

//     const existing = await Join.findOne({ mobile: mobile.trim() });
//     if (existing) {
//       return res.status(409).json({
//         success: false,
//         message: "A member with this mobile number already exists.",
//         memberId: existing.memberId,
//       });
//     }

//     let photoPath = "";
//     if (req.file) {
//       const result = await uploadToCloudinary(req.file.buffer);
//       photoPath = result.secure_url;
//     }

//     const memberId = await generateMemberId();

//     const application = await Join.create({
//       mode: "quick",
//       type: "quick_member",
//       memberId,
//       profilePhoto: photoPath,
//       fullName: fullName.trim(),
//       mobile: mobile.trim(),
//       state: state || "",
//       district: district || "",
//       declarationAccepted: true,
//       addedBy: agentUser._id,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Member added successfully.",
//       memberId: application.memberId,
//       data: application,
//     });
//   } catch (err) {
//     console.error("addMemberByAgent error:", err);
//     return res.status(500).json({ success: false, message: "Something went wrong." });
//   }
// };

// /*******************************************************
//  * MY ADDED MEMBERS — any logged-in user (agent or not),
//  * scoped to their own additions.
//  * GET /api/join/my-added-members
//  *******************************************************/
// export const getMyAddedMembers = async (req, res) => {
//   try {
//     const agentId = req.user?._id;
//     if (!agentId) {
//       return res.status(401).json({ success: false, message: "Login required." });
//     }

//     const { search = "", page = 1, limit = 20 } = req.query;
//     const query = { addedBy: agentId };

//     if (search.trim()) {
//       const regex = new RegExp(search.trim(), "i");
//       query.$or = [
//         { fullName: regex },
//         { mobile: regex },
//         { memberId: regex },
//         { district: regex },
//       ];
//     }

//     const pageNum = Math.max(parseInt(page, 10) || 1, 1);
//     const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
//     const skip = (pageNum - 1) * limitNum;

//     const [members, total] = await Promise.all([
//       Join.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
//       Join.countDocuments(query),
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: members,
//       isAgent: !!req.user.isAgent,
//       remainingSlots: req.user.isAgent
//         ? null
//         : Math.max(MEMBER_LIMIT_WITHOUT_AGENT - total, 0),
//       referralCode: req.user.referralCode || null,
//       pagination: {
//         total,
//         page: pageNum,
//         limit: limitNum,
//         totalPages: Math.ceil(total / limitNum),
//       },
//     });
//   } catch (err) {
//     console.error("getMyAddedMembers error:", err);
//     return res.status(500).json({ success: false, message: "Failed to fetch members." });
//   }
// };

// /*******************************************************
//  * ADMIN — list / view / delete
//  *******************************************************/
// export const getAllJoinApplications = async (req, res) => {
//   try {
//     const { search = "", page = 1, limit = 20 } = req.query;
//     const query = {};

//     if (search.trim()) {
//       const regex = new RegExp(search.trim(), "i");
//       query.$or = [{ fullName: regex }, { mobile: regex }, { memberId: regex }];
//     }

//     const pageNum = Math.max(parseInt(page, 10) || 1, 1);
//     const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
//     const skip = (pageNum - 1) * limitNum;

//     const [applications, total] = await Promise.all([
//       Join.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
//       Join.countDocuments(query),
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: applications,
//       pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
//     });
//   } catch (err) {
//     console.error("getAllJoinApplications error:", err);
//     return res.status(500).json({ success: false, message: "Failed to fetch applications." });
//   }
// };

// export const getJoinApplicationById = async (req, res) => {
//   try {
//     const application = await Join.findById(req.params.id);
//     if (!application) {
//       return res.status(404).json({ success: false, message: "Application not found." });
//     }
//     return res.status(200).json({ success: true, data: application });
//   } catch (err) {
//     console.error("getJoinApplicationById error:", err);
//     return res.status(500).json({ success: false, message: "Failed to fetch application." });
//   }
// };

// export const deleteJoinApplication = async (req, res) => {
//   try {
//     const application = await Join.findByIdAndDelete(req.params.id);
//     if (!application) {
//       return res.status(404).json({ success: false, message: "Application not found." });
//     }
//     return res.status(200).json({ success: true, message: "Application deleted successfully." });
//   } catch (err) {
//     console.error("deleteJoinApplication error:", err);
//     return res.status(500).json({ success: false, message: "Failed to delete application." });
//   }
// };

// export const renderJoinAdminPage = async (req, res) => {
//   try {
//     const applications = await Join.find({}).sort({ createdAt: -1 }).limit(20).lean();
//     const total = await Join.countDocuments({});
//     res.render("joinmember", { applications, total, pageTitle: "Membership Applications" });
//   } catch (err) {
//     console.error("renderJoinAdminPage error:", err);
//     res.status(500).send("Failed to load join requests page.");
//   }
// };

// /*******************************************************
//  * PUBLIC CARD LOOKUP — no login required
//  *******************************************************/
// export const getCardByMemberId = async (req, res) => {
//   try {
//     const application = await Join.findOne({ memberId: req.params.memberId }).lean();
//     if (!application) {
//       return res.status(404).json({ success: false, message: "Card not found." });
//     }

//     const {
//       memberId, fullName, profilePhoto, type, mode,
//       state, district, address, createdAt,
//     } = application;

//     return res.status(200).json({
//       success: true,
//       data: { memberId, fullName, profilePhoto, type, mode, state, district, address, createdAt },
//     });
//   } catch (err) {
//     console.error("getCardByMemberId error:", err);
//     return res.status(500).json({ success: false, message: "Failed to fetch card." });
//   }
// };

// /*******************************************************
//  * MY CARD — logged-in user, fetched fresh every time.
//  *******************************************************/
// export const getMyMembershipCard = async (req, res) => {
//   try {
//     const uid = req.user?.uid;
//     if (!uid) {
//       return res.status(401).json({ success: false, message: "Login required" });
//     }

//     const member = await Join.findOne({ uid }).lean();
//     if (!member) {
//       return res.status(404).json({ success: false, message: "Membership not found" });
//     }

//     return res.json({ success: true, data: member });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// /*******************************************************
//  * UPDATE MY CARD
//  * PATCH /api/join/my-card
//  *******************************************************/
// export const updateMyCard = async (req, res) => {
//   try {
//     const uid = req.user?.uid;
//     if (!uid) {
//       return res.status(401).json({ success: false, message: "Login required." });
//     }

//     const { fullName, mobile, state, district } = req.body;
//     const update = {};
//     if (fullName?.trim()) update.fullName = fullName.trim();
//     if (mobile?.trim()) update.mobile = mobile.trim();
//     if (state) update.state = state;
//     if (district) update.district = district;

//     if (req.file) {
//       const result = await uploadToCloudinary(req.file.buffer);
//       update.profilePhoto = result.secure_url;
//     }

//     const member = await Join.findOneAndUpdate({ uid }, { $set: update }, { new: true });
//     if (!member) {
//       return res.status(404).json({ success: false, message: "Membership not found." });
//     }

//     return res.status(200).json({ success: true, message: "Card updated.", data: member });
//   } catch (err) {
//     console.error("updateMyCard error:", err);
//     return res.status(500).json({ success: false, message: "Something went wrong." });
//   }
// };
import Join from "../models/joinmodel.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { generateMemberId } from "../services/memberId.js";

// Non-agent users can add members up to this many before they must
// request agent verification from admin.
const MEMBER_LIMIT_WITHOUT_AGENT = 5;

/*******************************************************
 * ADD MEMBER — any logged-in user, up to MEMBER_LIMIT_WITHOUT_AGENT
 * unless they're a verified agent (unlimited).
 * POST /api/join/add-member
 *******************************************************/
export const addMemberByAgent = async (req, res) => {
  try {
    const agentUser = req.user;
    if (!agentUser?._id) {
      return res.status(401).json({ success: false, message: "Login required." });
    }

    if (!agentUser.isAgent) {
      const addedCount = await Join.countDocuments({ addedBy: agentUser._id });
      if (addedCount >= MEMBER_LIMIT_WITHOUT_AGENT) {
        return res.status(403).json({
          success: false,
          code: "AGENT_VERIFICATION_REQUIRED",
          message: `You've added ${MEMBER_LIMIT_WITHOUT_AGENT} members. Please request agent verification to add more.`,
        });
      }
    }

    const { fullName, mobile, state, district } = req.body;
    if (!fullName?.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }
    if (!/^[6-9]\d{9}$/.test(mobile || "")) {
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number." });
    }

    const existing = await Join.findOne({ mobile: mobile.trim() });
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

    const memberId = await generateMemberId();

    const application = await Join.create({
      mode: "quick",
      type: "quick_member",
      memberId,
      profilePhoto: photoPath,
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      state: state || "",
      district: district || "",
      declarationAccepted: true,
      addedBy: agentUser._id,
    });

    return res.status(201).json({
      success: true,
      message: "Member added successfully.",
      memberId: application.memberId,
      data: application,
    });
  } catch (err) {
    console.error("addMemberByAgent error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

/*******************************************************
 * MY ADDED MEMBERS — any logged-in user (agent or not),
 * scoped to their own additions.
 * GET /api/join/my-added-members
 *******************************************************/
export const getMyAddedMembers = async (req, res) => {
  try {
    const agentId = req.user?._id;
    if (!agentId) {
      return res.status(401).json({ success: false, message: "Login required." });
    }

    const { search = "", page = 1, limit = 20 } = req.query;
    const query = { addedBy: agentId };

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullName: regex },
        { mobile: regex },
        { memberId: regex },
        { district: regex },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [members, total] = await Promise.all([
      Join.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Join.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: members,
      isAgent: !!req.user.isAgent,
      remainingSlots: req.user.isAgent
        ? null
        : Math.max(MEMBER_LIMIT_WITHOUT_AGENT - total, 0),
      referralCode: req.user.referralCode || null,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("getMyAddedMembers error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch members." });
  }
};

/*******************************************************
 * ADMIN — list / view / delete
 *******************************************************/
export const getAllJoinApplications = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const query = {};

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ fullName: regex }, { mobile: regex }, { memberId: regex }];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      Join.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Join.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: applications,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error("getAllJoinApplications error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch applications." });
  }
};

export const getJoinApplicationById = async (req, res) => {
  try {
    const application = await Join.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }
    return res.status(200).json({ success: true, data: application });
  } catch (err) {
    console.error("getJoinApplicationById error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch application." });
  }
};

export const deleteJoinApplication = async (req, res) => {
  try {
    const application = await Join.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }
    return res.status(200).json({ success: true, message: "Application deleted successfully." });
  } catch (err) {
    console.error("deleteJoinApplication error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete application." });
  }
};

export const renderJoinAdminPage = async (req, res) => {
  try {
    const applications = await Join.find({}).sort({ createdAt: -1 }).limit(20).lean();
    const total = await Join.countDocuments({});
    res.render("joinmember", { applications, total, pageTitle: "Membership Applications" });
  } catch (err) {
    console.error("renderJoinAdminPage error:", err);
    res.status(500).send("Failed to load join requests page.");
  }
};

/*******************************************************
 * PUBLIC CARD LOOKUP — no login required. Added members only
 * (self cards live on the User model, not here).
 *******************************************************/
export const getCardByMemberId = async (req, res) => {
  try {
    const application = await Join.findOne({ memberId: req.params.memberId }).lean();
    if (!application) {
      return res.status(404).json({ success: false, message: "Card not found." });
    }

    const {
      memberId, fullName, profilePhoto, type,
      state, district, address, createdAt,
    } = application;

    return res.status(200).json({
      success: true,
      data: { memberId, fullName, profilePhoto, type, state, district, address, createdAt },
    });
  } catch (err) {
    console.error("getCardByMemberId error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch card." });
  }
};