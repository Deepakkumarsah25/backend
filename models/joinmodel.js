import mongoose from "mongoose";

const joinSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    uid: { type: String, default: "" },
    legacyVolunteerId: { type: mongoose.Schema.Types.ObjectId, sparse: true, unique: true },

    // Set only when a logged-in agent created this record via Add Member.
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    mode: {
      type: String,
      default: "full",
    },

    type: {
      type: String,
      enum: [
        "party_member",
        "student_member",
        "volunteer_member",
        "quick_member",
        "party",
        "student",
        "volunteer",
      ],
      default: "party_member",
      index: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },

    memberId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },

    remarks: { type: String, default: "" },
    approvedAt: { type: Date, default: null },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    profilePhoto: { type: String, default: "" },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    mobile: { type: String, required: true, trim: true, index: true },

    fatherName: { type: String, default: "", trim: true },
    gender: { type: String, default: "" },
    dob: { type: Date, default: null },
    bloodGroup: { type: String, default: "", trim: true }, // e.g. A+, B+, O+, etc.
    alternateMobile: { type: String, default: "", trim: true },
    whatsappNumber: { type: String, default: "", trim: true },

    address: { type: String, default: "", trim: true },
    village: { type: String, default: "", trim: true },
    state: { type: String, default: "" },
    district: { type: String, default: "" },
    block: { type: String, default: "" },
    policeStation: { type: String, default: "" },
    assembly: { type: String, default: "" },
    pinCode: { type: String, default: "" },

    occupation: { type: String, default: "" },

    // Student fields
    collegeName: { type: String, default: "" },
    course: { type: String, default: "" },
    yearSemester: { type: String, default: "" },
    studentId: { type: String, default: "" },

    // Volunteer fields
    profession: { type: String, default: "" },
    areaOfInterest: { type: String, default: "" },
    availableTime: { type: String, default: "" },
    previousExperience: { type: String, default: "" },
    previousExperienceDetails: { type: String, default: "" },
    volunteerTypes: [{ type: String }],
    otherTypeDetail: { type: String, default: "" },
    skills: { type: String, default: "" },
    availability: { type: String, default: "" },
    groundActivity: { type: Boolean, default: false },

    declarationAccepted: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Join", joinSchema);
