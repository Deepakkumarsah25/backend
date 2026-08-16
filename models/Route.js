import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
{
  routeName: {
    type: String,
    required: true,
  },

  // Driver Assign
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver"
  },

  startLocation: {
    type: String,
    required: true,
  },

  startLat: Number,
  startLng: Number,

  endLocation: {
    type: String,
    required: true,
  },

  endLat: Number,
  endLng: Number,

  wayPoints: [
    {
      type: String,
    }
  ],

  distanceKm: Number,

  durationMin: Number,
  driverId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Driver"
},

currentLat: Number,

currentLng: Number,

currentSpeed: Number,

trackingEnabled: {
  type: Boolean,
  default: false
},

  // Live Tracking Data
  currentLat: {
    type: Number,
    default: 0
  },

  currentLng: {
    type: Number,
    default: 0
  },

  currentSpeed: {
    type: Number,
    default: 0
  },

  trackingEnabled: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: [
      "Pending",
      "Running",
      "Completed"
    ],
    default: "Pending"
  }

},
{
  timestamps: true,
}
);

export default mongoose.model(
  "Route",
  routeSchema
);