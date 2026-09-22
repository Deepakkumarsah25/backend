import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    routeName: { type: String, required: true, trim: true },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    startLocation: { type: String, required: true, trim: true },
    startLat: { type: Number, default: null },
    startLng: { type: Number, default: null },

    endLocation: { type: String, required: true, trim: true },
    endLat: { type: Number, default: null },
    endLng: { type: Number, default: null },

    wayPoints: [{ type: String, trim: true }],

    wayPointCoords: [
      {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        name: { type: String, default: "", trim: true },
      },
    ],

    distanceKm: { type: Number, default: 0 },
    durationMin: { type: Number, default: 0 },

    currentLat: { type: Number, default: null },
    currentLng: { type: Number, default: null },
    currentSpeed: { type: Number, default: 0 },
    trackingEnabled: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["Pending", "Running", "Completed"],
      default: "Pending",
    },

    sentAt: { type: Date, default: null },

    // Prevent duplicate email for the same worker during one route run.
    emailSentWorkerIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    ],

    // Prevent duplicate detailed app notification for the same worker.
    notificationSentWorkerIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Route", routeSchema);
