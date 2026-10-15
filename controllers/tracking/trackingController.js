import mongoose from "mongoose";

import Tracking from "../../models/Tracking.js";
import Route from "../../models/Route.js";
import Driver from "../../models/Driver.js";
import Worker from "../../models/Worker.js";
import User from "../../models/User.js";
import Join from "../../models/joinmodel.js";

import { findNearbyWorkers } from "../../services/routeMatchingService.js";

import { sendEmail } from "../../services/emailService.js";

import { createMemberNotification } from "../../services/notificationService.js";

import { sendPushNotificationToUser } from "../../services/pushNotificationService.js";

/* =========================================================
   TRACKING RADIUS (KM)
========================================================= */

const TRACKING_RADIUS_KM = Number(process.env.TRACKING_RADIUS_KM || 20);

/* =========================================================
   PUBLIC BASE URL
========================================================= */

const getPublicBaseUrl = (req) => {
  return (
    process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`
  ).replace(/\/$/, "");
};

/* =========================================================
   TRACK URL
========================================================= */

const buildTrackUrl = (req, routeId) => {
  return `${getPublicBaseUrl(req)}/track/${routeId}`;
};

/* =========================================================
   GPS VALIDATION
========================================================= */

const isValidGps = (lat, lng) => {
  const numericLat = Number(lat);
  const numericLng = Number(lng);

  return (
    Number.isFinite(numericLat) &&
    Number.isFinite(numericLng) &&
    numericLat >= -90 &&
    numericLat <= 90 &&
    numericLng >= -180 &&
    numericLng <= 180 &&
    !(numericLat === 0 && numericLng === 0)
  );
};

/* =========================================================
   WORKER COORDINATES
========================================================= */

const getWorkerCoords = (worker) => {
  const lat = Number(worker?.location?.lat ?? worker?.lat);

  const lng = Number(worker?.location?.lng ?? worker?.lng);

  if (!isValidGps(lat, lng)) {
    return null;
  }

  return {
    lat,
    lng,
  };
};

/* =========================================================
   WORKER EMAIL HTML

   IMPORTANT:
   Latitude / Longitude removed.
========================================================= */

const buildWorkerEmailHtml = ({
  worker,
  route,
  numericSpeed,
  trackUrl,
}) => {
  const endLocation = route?.endLocation || "गंतव्य";

  return `
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <style>

    body {
      margin: 0;
      padding: 0;
      background: #f4f6f9;
      font-family: Arial, sans-serif;
      color: #222;
    }

    .container {
      max-width: 650px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 5px 25px rgba(0,0,0,.15);
    }

    .header {
      background:
        linear-gradient(
          135deg,
          #0d6efd,
          #003c99
        );

      color: #ffffff;
      text-align: center;
      padding: 30px;
    }

    .content {
      padding: 30px;
    }
  </style>

    .footer {
      background: #f1f5f9;
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 13px;
    }

  </style>
</head>

<body>

  <div class="container">

    <div class="header">

      <h1>
        🚩 वीआईपी पार्टी वाहन सूचना
      </h1>

      <p>
        वीआईपी पार्टी का वाहन
        आपके क्षेत्र के पास
        पहुँच रहा है।
      </p>

    </div>

    <div class="content">

      <h2>
        नमस्कार
        ${worker?.fullName || "जी"},
      </h2>

      <p>
        वीआईपी पार्टी का वाहन
        आपके क्षेत्र के 20 किलोमीटर
        के दायरे में है।
      </p>

      <p>
        कृपया आवश्यक तैयारी रखें
        और आसपास के लोगों तक
        कार्यक्रम की जानकारी पहुँचाएँ।
      </p>

    </div>

    <div class="footer">

      वीआईपी पार्टी लाइव ट्रैकिंग सिस्टम

      <br>

      यह एक स्वचालित सूचना है।

    </div>

  </div>

</body>
</html>
`;
};

/* =========================================================
   MEMBER MATCH + DETAILED APP NOTIFICATION

   Worker is an admin/contact record (from /member).
   User is the logged-in app account.
   We match by:
   1. Email (case-insensitive)
   2. Phone (flexible 10-digit match: +91, 91, 0, exact)
   3. Join model (membership applications linked to User)
   4. Full Name + District (fallback)
========================================================= */

const normalizePhone = (val) => {
  if (!val) return "";
  const digits = String(val).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const findMemberUserForWorker = async (worker) => {
  const email = String(worker?.email || "")
    .trim()
    .toLowerCase();

  const rawPhone = String(worker?.phone || "").trim();
  const cleanPhone = normalizePhone(rawPhone);

  // 1. Match by Email first if provided (prefer account with active fcmToken)
  if (email) {
    const byEmail = await User.findOne({
      email: {
        $regex: `^${escapeRegex(email)}$`,
        $options: "i",
      },
    }).sort({ fcmToken: -1, updatedAt: -1, createdAt: -1 });

    if (byEmail) return byEmail;
  }

  // 2. Match by Phone in User collection (flexible match for 10 digits, prefer account with active fcmToken)
  if (cleanPhone && cleanPhone.length === 10) {
    const phoneRegex = new RegExp(`(?:\\+?91|0)?${cleanPhone}$`);
    const byPhone = await User.findOne({
      phone: { $regex: phoneRegex },
    }).sort({ fcmToken: -1, updatedAt: -1, createdAt: -1 });

    if (byPhone) return byPhone;
  } else if (rawPhone) {
    const byRawPhone = await User.findOne({ phone: rawPhone }).sort({
      fcmToken: -1,
      updatedAt: -1,
      createdAt: -1,
    });
    if (byRawPhone) return byRawPhone;
  }

  // 3. Fallback: Match via Join model (membership applications that might have mobile/email linked to userId)
  try {
    const joinQueries = [];
    if (cleanPhone && cleanPhone.length === 10) {
      const phoneRegex = new RegExp(`(?:\\+?91|0)?${cleanPhone}$`);
      joinQueries.push({ mobile: { $regex: phoneRegex } });
      joinQueries.push({ mobile: cleanPhone });
      joinQueries.push({ mobile: `+91${cleanPhone}` });
    }
    if (email) {
      joinQueries.push({
        email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
      });
    }

    if (joinQueries.length > 0) {
      const joinApp = await Join.findOne({ $or: joinQueries }).lean();
      if (joinApp) {
        if (joinApp.userId) {
          const userFromJoin = await User.findById(joinApp.userId);
          if (userFromJoin) return userFromJoin;
        }
        if (joinApp.uid) {
          const userFromJoinUid = await User.findOne({ uid: joinApp.uid }).sort({
            fcmToken: -1,
            updatedAt: -1,
            createdAt: -1,
          });
          if (userFromJoinUid) return userFromJoinUid;
        }
      }
    }
  } catch (joinErr) {
    console.error("JOIN MODEL MATCH ERROR:", joinErr);
  }

  // 4. Fallback: Match by Full Name and District if provided
  if (worker?.fullName && worker?.district) {
    try {
      const byNameDistrict = await User.findOne({
        name: { $regex: `^${escapeRegex(worker.fullName.trim())}$`, $options: "i" },
        district: { $regex: `^${escapeRegex(worker.district.trim())}$`, $options: "i" },
      }).sort({ fcmToken: -1, updatedAt: -1, createdAt: -1 });
      if (byNameDistrict) return byNameDistrict;
    } catch (_) {}
  }

  return null;
};

const sendMemberAppNotification = async ({
  worker,
  route,
  routeId,
  speed,
  trackUrl,
  navigationUrl,
}) => {
  try {
    const user = await findMemberUserForWorker(worker);

    if (!user) {
      console.log(
        "ℹ️ No registered App User found for worker:",
        worker?.fullName,
        "| Phone:",
        worker?.phone,
        "| Email:",
        worker?.email
      );
      return {
        member: false,
        userId: null,
        notification: null,
      };
    }

    const numericSpeed = Number(speed || 0);
    const destination = route?.endLocation || "Destination";
    const routeName = route?.routeName || "वीआईपी पार्टी मार्ग";

    const title = "🚩 वीआईपी पार्टी वाहन सूचना";
    const message = `वीआईपी पार्टी का वाहन आपके क्षेत्र के ${TRACKING_RADIUS_KM} किलोमीटर के दायरे में है (${routeName})। कृपया आवश्यक तैयारी रखें और आसपास के लोगों तक जानकारी पहुँचाएँ।`;

    // 1. Create In-App Notification (always saved in DB for the member's notification screen)
    const notification = await createMemberNotification({
      userId: user._id,
      title,
      message,
      type: "route",
      relatedId: routeId,
      actionType: "tracking",
      deepLink: "",
      actionUrl: trackUrl || "",
      metadata: {
        workerName: worker?.fullName || "",
        routeName,
        speed: Number(numericSpeed || 0).toFixed(2),
        destination,
        trackUrl: trackUrl || "",
        routeId: String(routeId),
        time: new Date().toLocaleString("hi-IN"),
      },
    });

    // 2. Send Push Notification to device (if FCM token is available)
    await sendPushNotificationToUser({
      userId: user._id,
      title,
      body: message,
      data: {
        type: "route",
        actionType: "tracking",
        routeId: String(routeId),
        notificationId: notification?._id ? String(notification._id) : "",
        screen: "/notifications",
        actionUrl: String(trackUrl || ""),
        title,
        message,
      },
    });

    console.log("✅ MEMBER APP NOTIFICATION SENT:", {
      worker: worker?.fullName,
      userId: String(user._id),
      fcmToken: user.fcmToken ? "YES" : "NO",
      membershipId: user.membershipId || "N/A",
    });

    return {
      member: true,
      userId: user._id,
      notification,
    };
  } catch (error) {
    console.error("MEMBER APP NOTIFICATION ERROR:", error);
    return {
      member: false,
      userId: null,
      notification: null,
    };
  }
};

/* =========================================================
   SEND EMAIL & APP NOTIFICATIONS TO NEARBY WORKERS / MEMBERS
   Both operations run independently:
   - App Notification is sent to any member not already notified in this route run.
   - Email is sent to any worker not already emailed in this route run.
========================================================= */

const sendNearbyWorkerEmails = async ({
  req,
  route,
  routeId,
  nearbyWorkers,
  speed,
}) => {
  const emailSentIds = new Set(
    (route.emailSentWorkerIds || []).map((id) => String(id))
  );

  const notifSentIds = new Set(
    (route.notificationSentWorkerIds || []).map((id) => String(id))
  );

  const trackUrl = buildTrackUrl(req, routeId);

  let emailSent = 0;
  let emailFailed = 0;
  let notificationSent = 0;

  for (const worker of nearbyWorkers) {
    const workerId = String(worker._id);

    /* =========================================
       1. APP NOTIFICATION FOR MEMBER (INDEPENDENT)
    ========================================= */
    if (!notifSentIds.has(workerId)) {
      const trackUrlForMember = buildTrackUrl(req, routeId);
      const navigationUrlForMember = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        route?.endLocation || "Destination"
      )}&travelmode=driving`;

      try {
        const memberResult = await sendMemberAppNotification({
          worker,
          route,
          routeId,
          speed,
          trackUrl: trackUrlForMember,
          navigationUrl: navigationUrlForMember,
        });

        if (memberResult.member) {
          await Route.findByIdAndUpdate(routeId, {
            $addToSet: {
              notificationSentWorkerIds: worker._id,
            },
          });

          notifSentIds.add(workerId);

          if (Array.isArray(route.notificationSentWorkerIds)) {
            route.notificationSentWorkerIds.push(worker._id);
          }

          notificationSent += 1;
        }
      } catch (notifErr) {
        console.error("APP NOTIFICATION ERROR FOR WORKER:", worker.fullName, notifErr);
      }
    }

    /* =========================================
       2. EMAIL ALERT FOR WORKER (INDEPENDENT)
    ========================================= */
    if (emailSentIds.has(workerId)) {
      continue;
    }

    if (!worker.email) {
      console.log("SKIP EMAIL - no email:", worker.fullName);
      continue;
    }

    try {
      await sendEmail(
        worker.email,
        "🚗 VIP पार्टी वाहन अलर्ट",
        buildWorkerEmailHtml({
          worker,
          route,
          numericSpeed: speed,
          trackUrl,
        })
      );

      await Worker.findByIdAndUpdate(worker._id, {
        lastAlertAt: new Date(),
      });

      emailSentIds.add(workerId);

      await Route.findByIdAndUpdate(routeId, {
        $addToSet: {
          emailSentWorkerIds: worker._id,
        },
      });

      if (Array.isArray(route.emailSentWorkerIds)) {
        route.emailSentWorkerIds.push(worker._id);
      }

      emailSent += 1;

      console.log("✅ EMAIL SENT:", worker.email);
    } catch (error) {
      emailFailed += 1;
      console.error("❌ EMAIL SEND FAILED:", worker.email);
      console.error(error);
    }
  }

  return {
    emailSent,
    emailFailed,
    notificationSent,
    sentIds: emailSentIds,
  };
};

/* =========================================================
   TRACKING PAGE
========================================================= */

export const trackingPage = async (
  req,
  res,
) => {
  try {
    const { routeId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        routeId,
      )
    ) {
      return res
        .status(400)
        .send("Invalid Route ID");
    }

    const route =
      await Route.findById(
        routeId,
      ).lean();

    if (!route) {
      return res
        .status(404)
        .send("Route Not Found");
    }

    return res.render(
      "Tracking/track",
      {
        route,
      },
    );
  } catch (error) {
    console.error(
      "TRACKING PAGE ERROR:",
      error,
    );

    return res
      .status(500)
      .send(
        "Tracking Page Error",
      );
  }
};

/* =========================================================
   LIVE STATUS API
========================================================= */

export const trackingStatus = async (
  req,
  res,
) => {
  try {
    const { routeId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        routeId,
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid Route ID",
      });
    }

    const route =
      await Route.findById(
        routeId,
      ).lean();

    if (!route) {
      return res.status(404).json({
        success: false,

        message:
          "Route Not Found",
      });
    }

    let nearbyWorkers = [];

    if (
      isValidGps(
        route.currentLat,
        route.currentLng,
      )
    ) {
      try {
        nearbyWorkers =
          await findNearbyWorkers(
            Number(route.currentLat),

            Number(route.currentLng),

            TRACKING_RADIUS_KM,
          );
      } catch (workerError) {
        console.error(
          "TRACKING STATUS WORKER MATCH ERROR:",
          workerError,
        );

        nearbyWorkers = [];
      }
    }

    const trackingHistory =
      await Tracking.find({
        routeId: route._id,
      })
        .sort({
          createdAt: 1,
          _id: 1,
        })
        .limit(1500)
        .select(
          "lat lng speed createdAt",
        )
        .lean();

    const history =
      trackingHistory
        .filter((point) =>
          isValidGps(
            point.lat,
            point.lng,
          ),
        )
        .map((point) => ({
          lat: Number(point.lat),

          lng: Number(point.lng),

          speed: Number(
            point.speed || 0,
          ),

          timestamp:
            point.createdAt ||
            null,
        }));

    const sentIds = new Set(
      (
        route.emailSentWorkerIds ||
        []
      ).map(
        (id) => String(id),
      ),
    );

    const emailSentCount =
      nearbyWorkers.filter(
        (worker) =>
          sentIds.has(
            String(worker._id),
          ),
      ).length;

    const emailRemainingCount =
      Math.max(
        nearbyWorkers.length -
          emailSentCount,

        0,
      );

    return res.json({
      success: true,

      route: {
        _id: String(
          route._id,
        ),

        routeName:
          route.routeName,

        status:
          route.status ||
          "Pending",

        startLocation:
          route.startLocation,

        endLocation:
          route.endLocation,

        startLat:
          route.startLat,

        startLng:
          route.startLng,

        endLat:
          route.endLat,

        endLng:
          route.endLng,

        wayPoints:
          route.wayPoints ||
          [],

        wayPointCoords:
          route.wayPointCoords ||
          [],

        distanceKm:
          route.distanceKm ||
          0,

        durationMin:
          route.durationMin ||
          0,

        currentLat:
          route.currentLat ??
          null,

        currentLng:
          route.currentLng ??
          null,

        currentSpeed:
          route.currentSpeed ??
          0,

        trackingEnabled:
          !!route.trackingEnabled,

        lastUpdated:
          route.updatedAt ||
          null,
      },

      history,

      stats: {
        totalWorkers:
          nearbyWorkers.length,

        nearbyWorkers:
          nearbyWorkers.length,

        emailSent:
          emailSentCount,

        emailRemaining:
          emailRemainingCount,
      },
    });
  } catch (error) {
    console.error(
      "TRACKING STATUS ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Tracking status failed",
    });
  }
};

/* =========================================================
   START TRACKING
========================================================= */

export const startTracking = async (
  req,
  res,
) => {
  try {
    const { routeId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        routeId,
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid Route ID",
      });
    }

    const route =
      await Route.findById(
        routeId,
      );

    if (!route) {
      return res.status(404).json({
        success: false,

        message:
          "Route Not Found",
      });
    }

    const startLat =
      Number(route.startLat);

    const startLng =
      Number(route.startLng);

    if (
      !isValidGps(
        startLat,
        startLng,
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Route start GPS is missing.",
      });
    }

    route.status = "Running";

    route.sentAt =
      route.sentAt ||
      new Date();

    route.currentLat =
      startLat;

    route.currentLng =
      startLng;

    route.currentSpeed = 0;

    route.trackingEnabled =
      true;

    route.emailSentWorkerIds =
      [];

    route.notificationSentWorkerIds =
      [];

    await route.save();

    const selectedDriverId =
      route.driverId
        ? String(route.driverId)
        : null;

    if (
      selectedDriverId &&
      mongoose.Types.ObjectId.isValid(
        selectedDriverId,
      )
    ) {
      await Driver.findByIdAndUpdate(
        selectedDriverId,
        {
          currentLat: startLat,

          currentLng: startLng,

          speed: 0,
        },
      );
    }

    await Tracking.create({
      routeId: route._id,

      driverId:
        selectedDriverId ||
        null,

      lat: startLat,

      lng: startLng,

      speed: 0,
    });

    const nearbyWorkers =
      await findNearbyWorkers(
        startLat,
        startLng,
        TRACKING_RADIUS_KM,
      );

    const emailResult =
      await sendNearbyWorkerEmails({
        req,

        route,

        routeId,

        nearbyWorkers,

        speed: 0,
      });

    const updatedRoute =
      await Route.findById(
        routeId,
      ).lean();

    const sentCount =
      Number(
        updatedRoute
          ?.emailSentWorkerIds
          ?.length || 0,
      );

    const emailRemaining =
      Math.max(
        nearbyWorkers.length -
          sentCount,

        0,
      );

    return res.json({
      success: true,

      message:
        "Tracking started successfully",

      routeId,

      driverId:
        selectedDriverId,

      currentLat:
        startLat,

      currentLng:
        startLng,

      currentSpeed: 0,

      nearbyWorkers:
        nearbyWorkers.length,

      emailSent:
        emailResult.emailSent,

      emailFailed:
        emailResult.emailFailed,

      emailRemaining,

      trackUrl:
        buildTrackUrl(
          req,
          routeId,
        ),
    });
  } catch (error) {
    console.error(
      "START TRACKING ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to start tracking",
    });
  }
};

/* =========================================================
   LIVE GPS UPDATE
========================================================= */

export const updateTracking = async (
  req,
  res,
) => {
  try {
    /* =========================================
       REQUEST DATA
    ========================================= */

    const {
      routeId,
      lat,
      lng,
      speed,
    } = req.body;

    /* =========================================
       VALIDATE ROUTE ID
    ========================================= */

    if (
      !routeId ||
      !mongoose.Types.ObjectId.isValid(
        routeId,
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Valid routeId is required",
      });
    }

    /* =========================================
       GPS
    ========================================= */

    const numericLat =
      Number(lat);

    const numericLng =
      Number(lng);

    let numericSpeed =
      Number(speed);

    if (
      !Number.isFinite(
        numericSpeed,
      ) ||
      numericSpeed < 0
    ) {
      numericSpeed = 0;
    }

    if (
      !isValidGps(
        numericLat,
        numericLng,
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Valid latitude and longitude are required",
      });
    }

    /* =========================================
       IMPORTANT FIX

       Sabse pehle ACTIVE route ko atomically
       update karo.

       Sirf:
         trackingEnabled: true
         status: "Running"

       wala route update hoga.

       Stop ke baad:
         trackingEnabled: false
         status: "Completed"

       hone ki wajah se ye query fail hogi.
    ========================================= */

    const updatedRoute =
      await Route.findOneAndUpdate(
        {
          _id: routeId,

          trackingEnabled: true,

          status: "Running",
        },

        {
          $set: {
            currentLat:
              numericLat,

            currentLng:
              numericLng,

            currentSpeed:
              numericSpeed,
          },
        },

        {
          new: true,
        },
      );

    /* =========================================
       STOPPED ROUTE
    ========================================= */

    if (!updatedRoute) {
      console.warn(
        "GPS UPDATE REJECTED - TRACKING STOPPED:",
        routeId,
      );

      return res.status(409).json({
        success: false,

        stopped: true,

        message:
          "Tracking has been stopped",
      });
    }

    /* =========================================
       DRIVER ID
    ========================================= */

    const actualDriverId = updatedRoute.driverId || null;

    /* =========================================
       SAVE TRACKING HISTORY

       Route active hone ke baad hi history
       create hogi.
    ========================================= */

    let trackingRecord =
      null;

    try {
      trackingRecord =
        await Tracking.create({
          routeId:
            updatedRoute._id,

          driverId:
            actualDriverId,

          lat:
            numericLat,

          lng:
            numericLng,

          speed:
            numericSpeed,
        });
    } catch (trackingError) {
      console.error(
        "TRACKING HISTORY SAVE ERROR:",
        trackingError,
      );
    }

    /* =========================================
       DRIVER UPDATE
    ========================================= */

    if (
      actualDriverId &&
      mongoose.Types.ObjectId.isValid(
        String(actualDriverId),
      )
    ) {
      await Driver.findByIdAndUpdate(
        actualDriverId,

        {
          $set: {
            currentLat:
              numericLat,

            currentLng:
              numericLng,

            speed:
              numericSpeed,
          },
        },
      );
    }

    /* =========================================
       STOP CHECK BEFORE WORKERS
    ========================================= */

    let currentRoute =
      await Route.findOne({
        _id: routeId,

        trackingEnabled: true,

        status: "Running",
      });

    if (!currentRoute) {
      console.warn(
        "GPS UPDATE STOPPED BEFORE WORKER PROCESS:",
        routeId,
      );

      if (
        trackingRecord?._id
      ) {
        await Tracking
          .findByIdAndDelete(
            trackingRecord._id,
          )
          .catch(() => {});
      }

      return res.status(409).json({
        success: false,

        stopped: true,

        message:
          "Tracking has been stopped",
      });
    }

    /* =========================================
       NEARBY WORKERS
    ========================================= */

    let nearbyWorkers = [];

    try {
      nearbyWorkers =
        await findNearbyWorkers(
          numericLat,

          numericLng,

          TRACKING_RADIUS_KM,
        );

      console.log(
        "Nearby Workers:",
        nearbyWorkers.length,
      );
    } catch (workerError) {
      console.error(
        "NEARBY WORKER MATCH ERROR:",
        workerError,
      );

      nearbyWorkers = [];
    }

    /* =========================================
       STOP CHECK BEFORE EMAIL
    ========================================= */

    currentRoute =
      await Route.findOne({
        _id: routeId,

        trackingEnabled: true,

        status: "Running",
      });

    if (!currentRoute) {
      console.warn(
        "GPS UPDATE STOPPED BEFORE EMAIL:",
        routeId,
      );

      if (
        trackingRecord?._id
      ) {
        await Tracking
          .findByIdAndDelete(
            trackingRecord._id,
          )
          .catch(() => {});
      }

      return res.status(409).json({
        success: false,

        stopped: true,

        message:
          "Tracking has been stopped",
      });
    }

    /* =========================================
       EMAIL / MEMBER NOTIFICATION
    ========================================= */

    let emailResult = {
      emailSent: 0,

      emailFailed: 0,
    };

    if (
      nearbyWorkers.length > 0
    ) {
      emailResult =
        await sendNearbyWorkerEmails({
          req,

          route:
            currentRoute,

          routeId,

          nearbyWorkers,

          speed:
            numericSpeed,
        });
    }

    /* =========================================
       FINAL ROUTE CHECK
    ========================================= */

    const finalRoute =
      await Route.findOne({
        _id: routeId,
      }).lean();

    if (
      !finalRoute ||
      finalRoute.trackingEnabled !==
        true ||
      finalRoute.status !==
        "Running"
    ) {
      console.warn(
        "GPS UPDATE FINISHED AFTER STOP:",
        routeId,
      );

      return res.status(409).json({
        success: false,

        stopped: true,

        message:
          "Tracking has been stopped",
      });
    }

    /* =========================================
       SENT EMAIL IDS
    ========================================= */

    const sentIds =
      new Set(
        (
          finalRoute
            .emailSentWorkerIds ||
          []
        ).map(
          (id) =>
            String(id),
        ),
      );

    const emailSent =
      nearbyWorkers.filter(
        (worker) =>
          sentIds.has(
            String(
              worker._id,
            ),
          ),
      ).length;

    const emailRemaining =
      Math.max(
        nearbyWorkers.length -
          emailSent,

        0,
      );

    /* =========================================
       SUCCESS
    ========================================= */

    return res.json({
      success: true,

      currentLat:
        numericLat,

      currentLng:
        numericLng,

      currentSpeed:
        numericSpeed,

      nearbyWorkers:
        nearbyWorkers.length,

      emailSent,

      emailFailed:
        emailResult.emailFailed,

      emailRemaining,

      trackingEnabled:
        true,

      status:
        "Running",

      trackUrl:
        buildTrackUrl(
          req,
          routeId,
        ),
    });
  } catch (error) {
    console.error(
      "=========================================",
    );

    console.error(
      "TRACKING UPDATE ERROR",
    );

    console.error(error);

    console.error(
      "=========================================",
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Tracking update failed",
    });
  }
};
