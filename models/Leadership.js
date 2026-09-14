import mongoose from "mongoose";

const leadershipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    designation: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["founder", "leader", "leaderss"],
      required: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    // Common
    description: {
      type: String,
      default: "",
    },

    about: {
      type: String,
      default: "",
    },

    // Leaders / MLA
    intro: {
      type: String,
      default: "",
    },

    journey: {
      type: String,
      default: "",
    },

    achievement: {
      type: String,
      default: "",
    },

    // Party Leaders
    role: {
      type: String,
      default: "",
    },

    work: {
      type: String,
      default: "",
    },

    // Founder
    earlyLife: {
      type: String,
      default: "",
    },

    socialThinking: {
      type: String,
      default: "",
    },

    partyFoundation: {
      type: String,
      default: "",
    },

    politicalJourney: {
      type: String,
      default: "",
    },

    vision: {
      type: String,
      default: "",
    },

    message: {
      type: String,
      default: "",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Leadership", leadershipSchema);