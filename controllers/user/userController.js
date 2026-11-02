import User from "../../models/User.js";

import Join from "../../models/joinmodel.js";

import { uploadToCloudinary } from "../../config/cloudinary.js";
import {
  buildApprovedIdentityProposal,
  buildDirectApprovedMembershipUpdate,
} from "../../services/membershipIdentityPolicy.js";

import { generateMemberId } from "../../services/memberId.js";


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
  fullName: joinApp?.status === "Approved" ? joinApp.fullName || user.name || "" : user.name || joinApp?.fullName || "",
  email: user.email || joinApp?.email || "",
  mobile: joinApp?.status === "Approved" ? joinApp.mobile || user.phone || "" : user.phone || joinApp?.mobile || "",
  designation: user.designation || "सक्रिय सदस्य",
  state: joinApp?.status === "Approved" ? joinApp.state || user.state || "" : user.state || joinApp?.state || "",
  district: joinApp?.status === "Approved" ? joinApp.district || user.district || "" : user.district || joinApp?.district || "",
  address: joinApp?.address || "",
  bloodGroup: getBloodGroup(joinApp, user),
  dob: joinApp?.dob || null,
  pinCode: joinApp?.pinCode || "",
  profilePhoto: joinApp?.status === "Approved" ? joinApp.profilePhoto || user.photoURL || "" : user.photoURL || joinApp?.profilePhoto || "",
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

    const verifiedEmail =
      req.auth?.email_verified === true && typeof req.auth.email === "string"
        ? req.auth.email.trim().toLowerCase()
        : undefined;

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


    if (user.membershipId) {

      queryConditions.push({ memberId: user.membershipId });

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
    let approvedMembership = null;
    let membershipSyncFailed = false;
    let approvedLocationUpdated = false;
    let identityReviewPending = false;
    const { name, phone, designation, state, district } = req.body || {};
    const update = {};

    if (typeof name === "string" && name.trim()) {
      if (name.trim().length > 100) return res.status(400).json({ success: false, message: "Name is too long." });
      update.name = name.trim();
    }
    if (typeof phone === "string" && phone.trim()) {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      if (!/^\d{10}$/.test(cleanPhone)) return res.status(400).json({ success: false, message: "Enter a valid 10-digit phone number." });
      update.phone = cleanPhone;
    }
    if (typeof designation === "string" && designation.trim()) {
      if (designation.trim().length > 80) return res.status(400).json({ success: false, message: "Designation is too long." });
      update.designation = designation.trim();
    }
    if (typeof state === "string" && state.trim()) {
      if (state.trim().length > 100) return res.status(400).json({ success: false, message: "State is too long." });
      update.state = state.trim();
    }
    if (typeof district === "string" && district.trim()) {
      if (district.trim().length > 100) return res.status(400).json({ success: false, message: "District is too long." });
      update.district = district.trim();
    }

    if (req.file && req.file.buffer) {
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

    // State and district are editable profile fields and should stay in sync on the
    // approved card. Name, phone, and photo changes still go through admin review.
    try {
      const identityProposal = {
        ...(update.name && { fullName: update.name }),
        ...(update.phone && { mobile: update.phone }),
        ...(update.state && { state: update.state }),
        ...(update.district && { district: update.district }),
        ...(update.photoURL && { profilePhoto: update.photoURL }),
      };
      const approvedLocationUpdate = buildDirectApprovedMembershipUpdate(update);
      const identityFields = Object.keys(identityProposal);
      const identityQuery = { $or: [{ userId: req.user._id }, ...(req.user.uid ? [{ uid: req.user.uid }] : [])] };
      if (identityFields.length) {
        const approved = await Join.findOne({ ...identityQuery, status: "Approved" }).select("_id pendingIdentityChange");
        if (approved) {
          approvedMembership = await Join.findById(approved._id).select("fullName mobile state district profilePhoto").lean();
          if (Object.keys(approvedLocationUpdate).length) {
            const locationSyncUpdate = { $set: approvedLocationUpdate };
            if (approved.pendingIdentityChange?.status === "Pending") {
              locationSyncUpdate.$unset = Object.fromEntries(
                Object.keys(approvedLocationUpdate).map((field) => [`pendingIdentityChange.proposed.${field}`, ""]),
              );
            }
            const locationResult = await Join.updateOne(
              { _id: approved._id, status: "Approved" },
              locationSyncUpdate,
            );
            if (!locationResult.matchedCount) throw new Error("Approved membership card could not be updated.");
            approvedMembership = { ...approvedMembership, ...approvedLocationUpdate };
            approvedLocationUpdated = true;
          }
          const proposed = buildApprovedIdentityProposal(approvedMembership, update);
          if (Object.keys(proposed).length) {
            identityReviewPending = true;
            const proposedFields = Object.fromEntries(Object.entries(proposed).map(([field, value]) => [`pendingIdentityChange.proposed.${field}`, value]));
            if (approved.pendingIdentityChange?.status === "Pending") {
              const changed = await Join.updateOne(
                { _id: approved._id, status: "Approved", "pendingIdentityChange.status": "Pending" },
                { $set: proposedFields },
              );
              if (!changed.matchedCount) throw new Error("Pending membership review changed during profile update.");
            } else {
              const pendingChange = { status: "Pending", requestedAt: new Date(), requestedByUid: req.user.uid || "", proposed };
              const created = await Join.updateOne(
                { _id: approved._id, status: "Approved", "pendingIdentityChange.status": { $ne: "Pending" } },
                { $set: { pendingIdentityChange: pendingChange } },
              );
              if (!created.matchedCount) {
                const merged = await Join.updateOne(
                  { _id: approved._id, status: "Approved", "pendingIdentityChange.status": "Pending" },
                  { $set: proposedFields },
                );
                if (!merged.matchedCount) throw new Error("Could not record membership change for review.");
              }
            }
          }
        }
        await Join.updateMany(
          { ...identityQuery, status: { $in: ["Pending", "Rejected"] } },
          { $set: identityProposal },
        );
      }
    } catch (joinSyncErr) {
      membershipSyncFailed = true;
      console.warn("Could not save membership identity change:", joinSyncErr.message);
    }

    if (membershipSyncFailed) {
      return res.status(503).json({ success: false, profileSaved: true, message: "Profile was saved, but membership change review could not be recorded. Please retry." });
    }

    return res.json({
      success: true,
      message: identityReviewPending && approvedLocationUpdated
        ? "Profile updated. State and district are updated on your membership card; other identity changes are pending admin review."
        : identityReviewPending
          ? "Profile updated. Identity changes are pending admin review."
          : approvedLocationUpdated
            ? "Profile and membership card updated."
            : "Card updated.",
      data: formatCard(user, approvedMembership),
    });
  } catch (err) {
    console.error("updateMyCard error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Something went wrong.",
    });
  }
};
