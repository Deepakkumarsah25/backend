import mongoose from "mongoose";

const joinSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    uid: { type: String, default: "" },

    // Set only when a logged-in agent created this record via Add Member.
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Only quick membership exists now — no "full" verified mode.
    mode: {
      type: String,
      enum: ["quick"],
      required: true,
      default: "quick",
    },

    type: {
      type: String,
      enum: ["quick_member"],
      required: true,
      default: "quick_member",
    },

    memberId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    profilePhoto: { type: String, default: "" },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    mobile: { type: String, required: true, trim: true, index: true },

    fatherName: { type: String, default: "", trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    dob: { type: Date, default: null },
    alternateMobile: { type: String, default: "", trim: true },
    whatsappNumber: { type: String, default: "", trim: true },

    address: { type: String, default: "", trim: true },
    // Optional now — can be filled later if user skipped at signup.
    state: { type: String, default: "" },
    district: { type: String, default: "" },
    block: { type: String, default: "" },
    policeStation: { type: String, default: "" },
    assembly: { type: String, default: "" },
    pinCode: { type: String, default: "" },

    occupation: { type: String, default: "" },

    collegeName: { type: String, default: "" },
    course: { type: String, default: "" },
    yearSemester: { type: String, default: "" },
    studentId: { type: String, default: "" },

    profession: { type: String, default: "" },
    areaOfInterest: { type: String, default: "" },
    availableTime: { type: String, default: "" },
    previousExperience: { type: String, default: "" },

    declarationAccepted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Join", joinSchema);