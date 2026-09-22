import Route from "../../models/Route.js";
import Driver from "../../models/Driver.js";
import Notification from "../../models/Notification.js";
import { sendPushNotification } from "../../services/pushNotificationService.js";
import mongoose from "mongoose";
/* =========================================================
   ROUTE FORM PAGE
========================================================= */

/* =========================================================
   STOP LIVE TRACKING
========================================================= */

/* =========================================================
   STOP LIVE TRACKING
========================================================= */

export const stopTrackingRoute = async (req, res) => {
  try {
    const routeId = req.params.id;

    console.log("========================================");

    console.log("STOP TRACKING REQUEST");

    console.log("Route ID:", routeId);

    console.log("========================================");

    /* =========================================
       VALIDATE ROUTE ID
    ========================================= */

    if (!routeId || !mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Route ID is required",
      });
    }

    /* =========================================
       ATOMIC STOP
       
       Sirf Running route ko stop karega.
       Isse race condition kam hogi.
    ========================================= */

    const stoppedRoute = await Route.findOneAndUpdate(
      {
        _id: routeId,

        /*
            Stop sirf active tracking par
          */

        trackingEnabled: true,

        status: "Running",
      },

      {
        $set: {
          trackingEnabled: false,

          status: "Completed",

          currentSpeed: 0,
        },
      },

      {
        new: true,
      },
    );

    /* =========================================
       ALREADY STOPPED
    ========================================= */

    if (!stoppedRoute) {
      const existingRoute = await Route.findById(routeId);

      if (!existingRoute) {
        return res.status(404).json({
          success: false,
          message: "Route Not Found",
        });
      }

      /*
        Agar already Completed hai
      */

      if (
        existingRoute.status === "Completed" &&
        existingRoute.trackingEnabled === false
      ) {
        return res.status(200).json({
          success: true,

          message: "Tracking is already stopped",

          routeId: existingRoute._id.toString(),

          status: "Completed",

          trackingEnabled: false,

          currentLat: existingRoute.currentLat,

          currentLng: existingRoute.currentLng,
        });
      }

      return res.status(400).json({
        success: false,

        message: "Tracking is not currently running",
      });
    }

    /* =========================================
       DRIVER STOP
    ========================================= */

    if (stoppedRoute.driverId) {
      await Driver.findByIdAndUpdate(
        stoppedRoute.driverId,

        {
          $set: {
            currentLat: stoppedRoute.currentLat ?? null,

            currentLng: stoppedRoute.currentLng ?? null,

            speed: 0,
          },
        },
      );
    }

    console.log("========================================");

    console.log("TRACKING STOPPED SUCCESSFULLY");

    console.log("Route:", stoppedRoute.routeName);

    console.log("Status:", stoppedRoute.status);

    console.log("Tracking Enabled:", stoppedRoute.trackingEnabled);

    console.log(
      "Current GPS:",
      stoppedRoute.currentLat,
      stoppedRoute.currentLng,
    );

    console.log("========================================");

    return res.status(200).json({
      success: true,

      message: "Tracking stopped successfully",

      routeId: stoppedRoute._id.toString(),

      status: stoppedRoute.status,

      trackingEnabled: stoppedRoute.trackingEnabled,

      currentLat: stoppedRoute.currentLat,

      currentLng: stoppedRoute.currentLng,
    });
  } catch (error) {
    console.error("========================================");

    console.error("STOP TRACKING ERROR");

    console.error(error);

    console.error("========================================");

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to stop tracking",
    });
  }
};

export const getRoutePage = async (req, res) => {
  try {
    const routes = await Route.find()
      .populate("driverId")
      .sort({ createdAt: -1 });

    const drivers = await Driver.find();

    res.render("Route/routeRoads", {
      routes,
      drivers,
      geoApiKey: process.env.geoapify,
    });
  } catch (error) {
    console.error("=================================");

    console.error("ROUTE PAGE ERROR");

    console.error(error);

    console.error("=================================");

    res.status(500).send("Error Loading Routes");
  }
};

/* =========================================================
   ADD ROUTE
========================================================= */

export const addRoute = async (req, res) => {
  try {
    /* =========================================
       WAYPOINT NAMES
    ========================================= */

    let wayPoints = [];

    if (req.body.wayPoints) {
      wayPoints = req.body.wayPoints
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    /* =========================================
       WAYPOINT COORDINATES
    ========================================= */

    let wayPointCoords = [];

    if (req.body.wayPointsCoords) {
      try {
        const parsed = JSON.parse(req.body.wayPointsCoords);

        if (Array.isArray(parsed)) {
          wayPointCoords = parsed
            .map((item) => ({
              lat: Number(item.lat),

              lng: Number(item.lng ?? item.lon),

              name: item.name || "",
            }))
            .filter(
              (item) => Number.isFinite(item.lat) && Number.isFinite(item.lng),
            );
        }
      } catch (error) {
        console.error("WAYPOINT PARSE ERROR:", error.message);
      }
    }

    /* =========================================
       ROUTE COORDINATES
    ========================================= */

    const startLat = Number(req.body.startLat);

    const startLng = Number(req.body.startLng);

    const endLat = Number(req.body.endLat);

    const endLng = Number(req.body.endLng);

    /* =========================================
       CREATE ROUTE
    ========================================= */

    const route = await Route.create({
      routeName: req.body.routeName,

      driverId: req.body.driverId,

      startLocation: req.body.startLocation,

      startLat: Number.isFinite(startLat) ? startLat : null,

      startLng: Number.isFinite(startLng) ? startLng : null,

      endLocation: req.body.endLocation,

      endLat: Number.isFinite(endLat) ? endLat : null,

      endLng: Number.isFinite(endLng) ? endLng : null,

      wayPoints,

      wayPointCoords,

      distanceKm: req.body.distanceKm ? Number(req.body.distanceKm) : 0,

      durationMin: req.body.durationMin ? Number(req.body.durationMin) : 0,

      status: "Pending",

      currentLat: null,

      currentLng: null,

      currentSpeed: 0,

      trackingEnabled: false,

      sentAt: null,

      emailSentWorkerIds: [],
      notificationSentWorkerIds: [],
    });

    console.log("=================================");

    console.log("ROUTE CREATED");

    console.log("Route:", route.routeName);

    console.log("Route ID:", route._id);

    console.log("Start:", route.startLat, route.startLng);

    console.log("End:", route.endLat, route.endLng);

    console.log("=================================");

    /* =========================================
       DATABASE NOTIFICATION
    ========================================= */

    try {
      await Notification.create({
        title: "New Route Added",

        message: `${route.routeName} route has been added.`,

        type: "route",

        relatedId: route._id,
      });
    } catch (notificationError) {
      console.error("ROUTE NOTIFICATION ERROR:", notificationError);
    }

    /* =========================================
       PUSH NOTIFICATION
    ========================================= */

    try {
      await sendPushNotification(
        "VIP Party",

        `${route.routeName} route has been added.`,

        {
          type: "route",

          routeId: route._id.toString(),
        },
      );
    } catch (pushError) {
      console.error("PUSH NOTIFICATION ERROR:", pushError);
    }

    return res.redirect("/route");
  } catch (error) {
    console.error("=================================");

    console.error("ROUTE ADD ERROR");

    console.error(error);

    console.error("=================================");

    return res.status(500).send("Route Add Failed");
  }
};

/* =========================================================
   DELETE ROUTE
========================================================= */

export const deleteRoute = async (req, res) => {
  try {
    const routeId = req.params.id;

    if (!routeId) {
      return res.status(400).send("Route ID is required");
    }

    await Route.findByIdAndDelete(routeId);

    console.log("Route deleted:", routeId);

    return res.redirect("/route");
  } catch (error) {
    console.error("ROUTE DELETE ERROR:", error);

    return res.status(500).send("Delete Failed");
  }
};

/* =========================================================
   SEND / SHARE ROUTE
========================================================= */

export const sendRoute = async (req, res) => {
  try {
    const routeId = req.params.id;

    console.log("========================================");

    console.log("SEND ROUTE REQUEST");

    console.log("Route ID:", routeId);

    console.log("Method:", req.method);

    console.log("========================================");

    /* =========================================
       VALIDATE ID
    ========================================= */

    if (!routeId) {
      return res.status(400).json({
        success: false,

        message: "Route ID is required",
      });
    }

    /* =========================================
       FIND ROUTE
    ========================================= */

    const route = await Route.findById(routeId);

    if (!route) {
      return res.status(404).json({
        success: false,

        message: "Route Not Found",
      });
    }

    /* =========================================
       CHECK START COORDINATES
    ========================================= */

    const startLat = Number(route.startLat);

    const startLng = Number(route.startLng);

    if (!Number.isFinite(startLat) || !Number.isFinite(startLng)) {
      return res.status(400).json({
        success: false,

        message: "Route start location coordinates are missing.",
      });
    }

    /* =========================================
       ROUTE RUNNING
    ========================================= */

    route.status = "Running";

    route.sentAt = new Date();

    /*
      IMPORTANT:

      Send ke time start location ko
      initial live location bana rahe hain.

      Baad mein browser GPS isko update karega.
    */

    route.currentLat = startLat;

    route.currentLng = startLng;

    route.currentSpeed = 0;

    /*
      Actual GPS update hote hi
      trackingEnabled true hoga.
    */

    route.trackingEnabled = false;

    /* =========================================
       NEW SEND = RESET EMAIL COUNT
    ========================================= */

    route.emailSentWorkerIds = [];
    route.notificationSentWorkerIds = [];

    await route.save();

    /* =========================================
       BUILD SHARE URL
    ========================================= */

    const baseUrl = (
      process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`
    ).replace(/\/$/, "");

    const shareUrl = `${baseUrl}/track/${route._id}`;

    /* =========================================
       LOG
    ========================================= */

    console.log("========================================");

    console.log("ROUTE SENT SUCCESSFULLY");

    console.log("Route:", route.routeName);

    console.log("Driver ID:", route.driverId);

    console.log("Initial GPS:", route.currentLat, route.currentLng);

    console.log("Status:", route.status);

    console.log("Tracking URL:", shareUrl);

    console.log("========================================");

    /* =========================================
       RETURN JSON
    ========================================= */

    return res.status(200).json({
      success: true,

      message: "Route is ready to share",

      routeId: route._id.toString(),

      routeName: route.routeName,

      driverId: route.driverId ? route.driverId.toString() : null,

      status: route.status,

      currentLat: route.currentLat,

      currentLng: route.currentLng,

      shareUrl,
    });
  } catch (error) {
    console.error("========================================");

    console.error("SEND ROUTE ERROR");

    console.error(error);

    console.error("========================================");

    return res.status(500).json({
      success: false,

      message: error.message || "Route Send Failed",
    });
  }
};
