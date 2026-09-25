import User from "../../models/User.js";
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
const formatCard = (user) => ({
  type: "self",
  memberId: user.membershipId || PLACEHOLDER,
  fullName: user.name || PLACEHOLDER,
  email: user.email || PLACEHOLDER,
  mobile: user.phone || PLACEHOLDER,
  designation: user.designation || PLACEHOLDER,
  state: user.state || PLACEHOLDER,
  district: user.district || PLACEHOLDER,
  profilePhoto: user.photoURL || "",
  createdAt: user.createdAt,
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

      if (name !== undefined) {
        existingUser.name = name;
      }

      if (verifiedEmail) {
        existingUser.email = verifiedEmail;
      }

      if (photoURL !== undefined) {
        existingUser.photoURL = photoURL;
      }

      if (provider !== undefined) {
        existingUser.provider = provider;
      }

      if (fcmToken !== undefined) {
        existingUser.fcmToken = fcmToken;
      }

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
      {
        new: true,
      },
    );

    // ------------------------------------------
    // Success response
    // ------------------------------------------
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
 * Returns logged-in user's membership card.
 * Automatically creates membershipId if missing.
 *******************************************************/
export const getMyCard = async (req, res) => {
  try {
    let user = req.user;

    // ------------------------------------------
    // Validate logged-in user
    // ------------------------------------------
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    // ------------------------------------------
    // Generate membership ID if missing
    // ------------------------------------------
    if (!user.membershipId) {
      const membershipId = await generateMemberId();

      user = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            membershipId,
          },
        },
        {
          new: true,
        },
      );
    }

    // ------------------------------------------
    // User not found
    // ------------------------------------------
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      data: formatCard(user),
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
 *
 * Updates logged-in user's membership card.
 *******************************************************/
export const updateMyCard = async (req, res) => {
  try {
    const { name, phone, designation, state, district } = req.body;

    const update = {};

    // ------------------------------------------
    // Update basic fields
    // ------------------------------------------
    if (typeof name === "string" && name.trim()) {
      update.name = name.trim();
    }

    if (typeof phone === "string" && phone.trim()) {
      update.phone = phone.trim();
    }

    if (typeof designation === "string" && designation.trim()) {
      update.designation = designation.trim();
    }

    if (state) {
      update.state = state;
    }

    if (district) {
      update.district = district;
    }

    // ------------------------------------------
    // Upload profile photo
    // ------------------------------------------
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);

      update.photoURL = result.secure_url;
    }

    // ------------------------------------------
    // Update user
    // ------------------------------------------
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: update,
      },
      {
        new: true,
      },
    );

    // ------------------------------------------
    // User not found
    // ------------------------------------------
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ------------------------------------------
    // Success
    // ------------------------------------------
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
