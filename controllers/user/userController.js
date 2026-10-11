import User from "../../models/User.js";

import Join from "../../models/joinmodel.js";

import { uploadToCloudinary } from "../../config/cloudinary.js";

import { generateMemberId } from "../../services/memberId.js";

import { getBearerToken, verifyFirebaseToken } from "../../middlewar/firebaseAuth.js";

const PLACEHOLDER = "xxx";

const formatSafeUser = (user) => ({

  id: user._id,

  uid: user.uid,

  name: user.name,

  email: user.email,

  phone: user.phone,

  photoURL: user.photoURL,

  isAgent: user.isAgent || false,

});

/**

 * Format user data for membership card

 */

const getBloodGroup = (...sources) => {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    const value =
      source.bloodGroup ??
      source.blood_group ??
      source.bloodgroup ??
      source.blood_group_type;

    if (typeof value === "string" && value.trim()) {
      return value.trim().toUpperCase();
    }
  }

  return "";
};

const formatCard = (user, joinApp = null) => ({
  type: joinApp?.type || "party_member",
  memberId: joinApp?.memberId || "",
  fullName: joinApp?.fullName || user.name || "",
  email: joinApp?.email || user.email || "",
  mobile: joinApp?.mobile || user.phone || "",
  designation: user.designation || "सक्रिय सदस्य",
  state: joinApp?.state || user.state || "",
  district: joinApp?.district || user.district || "",
  address: joinApp?.address || "",
  bloodGroup: getBloodGroup(joinApp, user),
  dob: joinApp?.dob || null,
  pinCode: joinApp?.pinCode || "",
  profilePhoto: joinApp?.profilePhoto || user.photoURL || "",
  createdAt: joinApp?.createdAt || user.createdAt,
  status: joinApp?.status || "Approved",
});

/*******************************************************

 * SAVE / UPSERT USER

 * Called after login

 *

 * POST /api/users/save-user

 *******************************************************/

export const saveUser = async (req, res) => {

  try {

    const user = req.user;

    if (!user?._id || !user.uid) {

      return res.status(400).json({

        success: false,

        message: "Authenticated user is required",

      });

    }

    const { name, photoURL, provider, fcmToken } = req.body;

    let verifiedEmail;

    const bearer = getBearerToken(req);

    if (!bearer.error) {

      try {

        const decodedToken = await verifyFirebaseToken(bearer.token);

        if (decodedToken.uid === req.user.uid && decodedToken.email_verified === true && typeof decodedToken.email === "string") {

          verifiedEmail = decodedToken.email.trim().toLowerCase();

        }

      } catch {

        // protect already validated the token; keep the stored email if revalidation is unavailable.

      }

    }

    // ------------------------------------------

    // Check existing user

    // ------------------------------------------

    const existingUser = user;

    // ==========================================

    // USER LOGGED IN DURING DELETION PERIOD

    // ==========================================

    if (existingUser && existingUser.deletionRequested) {

      existingUser.deletionRequested = false;

      existingUser.deletionDate = null;

      existingUser.lastLogin = new Date();

      if (name !== undefined) existingUser.name = name;

      if (verifiedEmail) existingUser.email = verifiedEmail;

      if (photoURL !== undefined) existingUser.photoURL = photoURL;

      if (provider !== undefined) existingUser.provider = provider;

      if (fcmToken !== undefined) existingUser.fcmToken = fcmToken;

      existingUser.notificationEnabled = true;

      await existingUser.save();

      return res.json({

        success: true,

        deletionCancelled: true,

        message: "Account deletion cancelled because you logged in.",

        user: formatSafeUser(existingUser),

      });

    }

    // ==========================================

    // NORMAL LOGIN / SAVE / UPSERT

    // ==========================================

    const savedUser = await User.findOneAndUpdate(

      { _id: req.user._id },

      {

        $set: {

          ...(name !== undefined && { name }),

          ...(verifiedEmail && { email: verifiedEmail }),

          ...(photoURL !== undefined && { photoURL }),

          ...(provider !== undefined && { provider }),

          ...(fcmToken !== undefined && { fcmToken }),

          notificationEnabled: true,

          lastLogin: new Date(),

        },

      },

      { new: true }

    );

    return res.json({

      success: true,

      deletionCancelled: false,

      message: "User saved successfully.",

      user: savedUser ? formatSafeUser(savedUser) : null,

    });

  } catch (error) {

    console.error("USER SAVE ERROR:", error);

    return res.status(500).json({

      success: false,

      message: "User save failed.",

    });

  }

};

/*******************************************************

 * MY CARD

 *

 * GET /api/users/my-card

 *

 * Returns logged-in user's membership card if approved.

 * Only returns card if approved by admin.

 *******************************************************/

export const getMyCard = async (req, res) => {

  try {

    let user = req.user;

    if (!user) {

      return res.status(401).json({

        success: false,

        message: "User not authenticated.",

      });

    }

    const queryConditions = [];

    if (user._id) queryConditions.push({ userId: user._id });

    if (user.uid) queryConditions.push({ uid: user.uid });

    if (user.phone) {

      const cleanPhone = String(user.phone).replace(/\D/g, "").slice(-10);

      if (cleanPhone) {

        queryConditions.push({ mobile: cleanPhone });

        queryConditions.push({ mobile: new RegExp(cleanPhone + "$") });

      }

    }

    if (user.email) {

      queryConditions.push({ email: user.email.toLowerCase().trim() });

    }

    if (user.membershipId) {

      queryConditions.push({ memberId: user.membershipId });

    }

    const { mobile } = req.query;

    if (mobile) {

      const cleanQMobile = String(mobile).replace(/\D/g, "").slice(-10);

      if (cleanQMobile) {

        queryConditions.push({ mobile: cleanQMobile });

        queryConditions.push({ mobile: new RegExp(cleanQMobile + "$") });

      }

    }

    if (queryConditions.length === 0) {

      return res.status(200).json({

        success: false,

        hasCard: false,

        status: "NotApplied",

        message: "No membership application found.",

      });

    }

    // Look for approved membership application in Join model

    let joinApp = await Join.findOne({

      $or: queryConditions,

      status: "Approved",

    })

      .sort({ updatedAt: -1, createdAt: -1 })

      .lean();

    // If no approved joinApp with memberId, check if User model already has membershipId

    if ((!joinApp || !joinApp.memberId) && user.membershipId) {

      joinApp = await Join.findOne({

        memberId: user.membershipId,

        status: "Approved",

      }).lean();

    }

    // STRICT CHECK: Membership card is ONLY for admin-approved members with valid memberId!

    if (!joinApp || !joinApp.memberId) {

      const anyApp = await Join.findOne({

        $or: queryConditions,

      })

        .sort({ createdAt: -1 })

        .lean();

      return res.status(200).json({

        success: false,

        hasCard: false,

        status: anyApp ? anyApp.status : "NotApplied",

        application: anyApp

          ? {

              _id: anyApp._id,

              status: anyApp.status,

              memberId: anyApp.memberId || null,

              fullName: anyApp.fullName,

              mobile: anyApp.mobile,

              type: anyApp.type,

              bloodGroup: anyApp.bloodGroup || "",

              dob: anyApp.dob || null,

              pinCode: anyApp.pinCode || "",

              state: anyApp.state || "",

              district: anyApp.district || "",

              address: anyApp.address || "",

              profilePhoto: anyApp.profilePhoto || "",

              remarks: anyApp.remarks || "",

              createdAt: anyApp.createdAt,

              approvedAt: anyApp.approvedAt || null,

            }

          : null,

        message: anyApp

          ? (anyApp.status === "Pending"

              ? "Your membership application is currently under review by admin."

              : "Your membership application was not approved.")

          : "No approved membership card found. Only admin-verified approved members receive a digital membership card.",

      });

    }

    return res.json({

      success: true,

      hasCard: true,

      status: "Approved",

      data: formatCard(user, joinApp),

    });

  } catch (err) {

    console.error("getMyCard error:", err);

    return res.status(500).json({

      success: false,

      message: "Server Error",

    });

  }

};

/*******************************************************

 * UPDATE MY CARD

 *

 * PUT / PATCH /api/users/my-card

 *******************************************************/

export const updateMyCard = async (req, res) => {

  try {

    const { name, phone, designation, state, district } = req.body;

    const update = {};

    if (typeof name === "string" && name.trim()) update.name = name.trim();

    if (typeof phone === "string" && phone.trim()) update.phone = phone.trim();

    if (typeof designation === "string" && designation.trim()) update.designation = designation.trim();

    if (state) update.state = state;

    if (district) update.district = district;

    if (req.file) {

      const result = await uploadToCloudinary(req.file.buffer);

      update.photoURL = result.secure_url;

    }

    const user = await User.findByIdAndUpdate(

      req.user._id,

      { $set: update },

      { new: true }

    );

    if (!user) {

      return res.status(404).json({

        success: false,

        message: "User not found.",

      });

    }

    return res.json({

      success: true,

      message: "Card updated.",

      data: formatCard(user),

    });

  } catch (err) {

    console.error("updateMyCard error:", err);

    return res.status(500).json({

      success: false,

      message: "Something went wrong.",

    });

  }

};
