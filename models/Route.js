import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    /* =========================================
       ROUTE BASIC INFO
    ========================================= */

    routeName: {
      type: String,
      required: true,
      trim: true,
    },

    /* =========================================
       DRIVER ASSIGN
    ========================================= */

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    /* =========================================
       START LOCATION
    ========================================= */

    startLocation: {
      type: String,
      required: true,
      trim: true,
    },

    startLat: {
      type: Number,
      default: null,
    },

    startLng: {
      type: Number,
      default: null,
    },

    /* =========================================
       END LOCATION
    ========================================= */

    endLocation: {
      type: String,
      required: true,
      trim: true,
    },

    endLat: {
      type: Number,
      default: null,
    },

    endLng: {
      type: Number,
      default: null,
    },

    /* =========================================
       WAYPOINT NAMES
    ========================================= */

    wayPoints: [
      {
        type: String,
        trim: true,
      },
    ],

    /* =========================================
       WAYPOINT COORDINATES

       Example:

       [
         {
           lat: 23.25,
           lng: 77.41,
           name: "Bhopal"
         }
       ]
    ========================================= */

    wayPointCoords: [
      {
        lat: {
          type: Number,
          default: null,
        },

        lng: {
          type: Number,
          default: null,
        },

        name: {
          type: String,
          default: "",
          trim: true,
        },
      },
    ],

    /* =========================================
       ROUTE DISTANCE / TIME
    ========================================= */

    distanceKm: {
      type: Number,
      default: 0,
    },

    durationMin: {
      type: Number,
      default: 0,
    },

    /* =========================================
       LIVE VEHICLE LOCATION
    ========================================= */

    currentLat: {
      type: Number,
      default: null,
    },

    currentLng: {
      type: Number,
      default: null,
    },

    currentSpeed: {
      type: Number,
      default: 0,
    },

    trackingEnabled: {
      type: Boolean,
      default: false,
    },

    /* =========================================
       ROUTE STATUS
    ========================================= */

    status: {
      type: String,

      enum: [
        "Pending",
        "Running",
        "Completed",
      ],

      default: "Pending",
    },

    /* =========================================
       WHEN ROUTE WAS SENT
    ========================================= */

    sentAt: {
      type: Date,
      default: null,
    },

    /* =========================================
       WORKERS WHO ALREADY RECEIVED EMAIL

       This prevents counting same worker again
       for current route.
    ========================================= */

    emailSentWorkerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
      },
    ],
  },

  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Route",
  routeSchema
);