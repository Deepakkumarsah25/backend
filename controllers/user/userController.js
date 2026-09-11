import User from "../../models/User.js";
import { uploadToCloudinary } from "../../config/cloudinary.js";
import { generateMemberId } from "../../services/memberId.js";

const PLACEHOLDER = "xxx";

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
 * SAVE / UPSERT USER (called on login)
 * POST /api/users/save-user
 *******************************************************/
export const saveUser = async (req, res) => {
  try {
    const data = req.body;

    let user = await User.findOne({
      uid: data.uid,
    });

    if (!user) {
      user = await User.create(data);
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*******************************************************
 * MY CARD — self membership card, built straight off the
 * User document. Auto-assigns a membershipId on first fetch.
 * GET /api/users/my-card
 *******************************************************/
export const getMyCard = async (req, res) => {
  try {
    let user = req.user;

    if (!user.membershipId) {
      const membershipId = await generateMemberId();
      user = await User.findByIdAndUpdate(
        user._id,
        { $set: { membershipId } },
        { returnDocument: "after" }
      );
    }

    return res.json({ success: true, data: formatCard(user) });
  } catch (err) {
    console.error("getMyCard error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*******************************************************
 * UPDATE MY CARD — edits the User document directly.
 * Fields the app collects: name, phone, designation, state,
 * district (+ photo). `email` is intentionally excluded — it's
 * a locked field and is never accepted from the client, even
 * if sent in the request body.
 * PATCH /api/users/my-card
 *******************************************************/
export const updateMyCard = async (req, res) => {
  try {
    const { name, phone, designation, state, district } = req.body;
    const update = {};
    if (name?.trim()) update.name = name.trim();
    if (phone?.trim()) update.phone = phone.trim();
    if (designation?.trim()) update.designation = designation.trim();
    if (state) update.state = state;
    if (district) update.district = district;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      update.photoURL = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { returnDocument: "after" });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({ success: true, message: "Card updated.", data: formatCard(user) });
  } catch (err) {
    console.error("updateMyCard error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};