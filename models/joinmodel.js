import mongoose from "mongoose";

const joinSchema = new mongoose.Schema(
  {
    // Logged-in User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    uid: {
      type: String,
      required: true,
    },

    // Membership Type
    type: {
      type: String,
      enum: ["party", "student", "volunteer"],
      required: true,
    },

    // =========================
    // Profile Details
    // =========================
    profilePhoto: {
      type: String,
      default: "",
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    // =========================
    // Personal Details
    // =========================
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    alternateMobile: {
      type: String,
      default: "",
      trim: true,
    },

    whatsappNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // Address Details
    // =========================
    address: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
    },

    district: {
      type: String,
      required: true,
    },

    block: {
      type: String,
      default: "",
    },

    policeStation: {
      type: String,
      default: "",
    },

    assembly: {
      type: String,
      required: true,
    },

    pinCode: {
      type: String,
      default: "",
    },

    // =========================
    // Common
    // =========================
    occupation: {
      type: String,
      required: true,
    },

    // =========================
    // Student Member
    // =========================
    collegeName: {
      type: String,
      default: "",
    },

    course: {
      type: String,
      default: "",
    },

    yearSemester: {
      type: String,
      default: "",
    },

    studentId: {
      type: String,
      default: "",
    },

    // =========================
    // Volunteer
    // =========================
    profession: {
      type: String,
      default: "",
    },

    areaOfInterest: {
      type: String,
      default: "",
    },

    availableTime: {
      type: String,
      default: "",
    },

    previousExperience: {
      type: String,
      default: "",
    },

    // =========================
    // Declaration
    // =========================
    declarationAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },

    // =========================
    // Admin
    // =========================
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    memberId: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Join", joinSchema);