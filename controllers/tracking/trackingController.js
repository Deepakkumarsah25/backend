import mongoose from "mongoose";

import Tracking from "../../models/Tracking.js";
import Route from "../../models/Route.js";
import Driver from "../../models/Driver.js";
import Worker from "../../models/Worker.js";
import User from "../../models/User.js";

import { findNearbyWorkers } from "../../services/routeMatchingService.js";

import { sendEmail } from "../../services/emailService.js";

import { createMemberNotification } from "../../services/notificationService.js";

import { sendPushNotificationToUser } from "../../services/pushNotificationService.js";

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

    .info-box {
      background: #f8fafc;
      padding: 15px;
      border-radius: 10px;
      margin-top: 15px;
    }

    .btn {
      display: inline-block;
      padding: 14px 24px;
      background: #0d6efd;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin-top: 20px;
    }

    .btn-green {
      background: #16a34a;
    }

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
        आपके क्षेत्र के 10 किलोमीटर
        के दायरे में है।
      </p>

      <p>
        कृपया आवश्यक तैयारी रखें
        और आसपास के लोगों तक
        कार्यक्रम की जानकारी पहुँचाएँ।
      </p>

      <div class="info-box">

        <p>
          <strong>मार्ग:</strong>
          ${route?.routeName || "वीआईपी पार्टी मार्ग"}
        </p>

        <p>
          <strong>गति:</strong>
          ${Number(numericSpeed || 0).toFixed(2)} किमी/घंटा
        </p>

        <p>
          <strong>गंतव्य:</strong>
          ${endLocation}
        </p>

        <p>
          <strong>समय:</strong>
          ${new Date().toLocaleString("hi-IN")}
        </p>

      </div>

      <center>

        <a
          class="btn"
          href="${trackUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >
          📍 लाइव ट्रैकिंग देखें
        </a>

        <br>

        <a
          class="btn btn-green"
          href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            endLocation,
          )}&travelmode=driving"
          target="_blank"
          rel="noopener noreferrer"
        >
          🧭 मार्ग नेविगेशन खोलें
        </a>

      </center>

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

   Worker is an admin/contact record. User is the logged-in
   Firebase account. We match by email first, then phone.
========================================================= */

const findMemberUserForWorker = async (worker) => {
  const email = String(worker?.email || "")
    .trim()
    .toLowerCase();

  const phone = String(worker?.phone || "").trim();

  if (email) {
    const byEmail = await User.findOne({
      email: {
        $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (byEmail) return byEmail;
  }

  if (phone) {
    const byPhone = await User.findOne({
      phone,
    });

    if (byPhone) return byPhone;
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

    if (!user || !user.membershipId) {
      return {
        member: false,
        userId: null,
        notification: null,
      };
    }

    const numericSpeed = Number(speed || 0);

    const destination =
      route?.endLocation || "Destination";

    const title =
      "🚗 VIP पार्टी वाहन अलर्ट";

    const message =
      "VIP पार्टी का वाहन आपके क्षेत्र से लगभग 10 किलोमीटर के दायरे में पहुँच चुका है।";

    const notification =
      await createMemberNotification({
        userId: user._id,

        title,

        message,

        type: "route",

        relatedId: routeId,

        actionType: "tracking",

        deepLink: `/track/${routeId}`,

        actionUrl: trackUrl,

        metadata: {
          workerName:
            worker?.fullName || "",

          routeName:
            route?.routeName ||
            "VIP Party Route",

          speed: numericSpeed,

          destination,

          time: new Date().toISOString(),

          trackUrl,

          navigationUrl,
        },
      });

    await sendPushNotificationToUser({
      userId: user._id,

      title,

      body: message,

      data: {
        type: "route",

        actionType: "tracking",

        routeId: String(routeId),

        deepLink: `/track/${routeId}`,

        actionUrl: trackUrl,

        title,

        message,
      },
    });

    console.log(
      "✅ MEMBER APP NOTIFICATION SENT:",
      {
        worker: worker?.fullName,

        userId: String(user._id),

        membershipId: user.membershipId,
      },
    );

    return {
      member: true,

      userId: user._id,

      notification,
    };
  } catch (error) {
    console.error(
      "MEMBER APP NOTIFICATION ERROR:",
      error,
    );

    return {
      member: false,

      userId: null,

      notification: null,
    };
  }
};

/* =========================================================
   SEND EMAIL TO NEARBY WORKERS
========================================================= */

const sendNearbyWorkerEmails = async ({
  req,
  route,
  routeId,
  nearbyWorkers,
  speed,
}) => {
  const sentIds = new Set(
    (route.emailSentWorkerIds || []).map(
      (id) => String(id),
    ),
  );

  const trackUrl =
    buildTrackUrl(req, routeId);

  let emailSent = 0;
  let emailFailed = 0;

  for (const worker of nearbyWorkers) {
    const workerId =
      String(worker._id);

    if (sentIds.has(workerId)) {
      continue;
    }

    const trackUrlForMember =
      buildTrackUrl(req, routeId);

    const navigationUrlForMember =
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        route?.endLocation ||
          "Destination",
      )}&travelmode=driving`;

    const notificationAlreadySent =
      (
        route.notificationSentWorkerIds ||
        []
      ).some(
        (id) =>
          String(id) ===
          String(worker._id),
      );

    let memberResult = {
      member: false,
    };

    if (!notificationAlreadySent) {
      memberResult =
        await sendMemberAppNotification({
          worker,

          route,

          routeId,

          speed,

          trackUrl:
            trackUrlForMember,

          navigationUrl:
            navigationUrlForMember,
        });

      if (memberResult.member) {
        await Route.findByIdAndUpdate(
          routeId,
          {
            $addToSet: {
              notificationSentWorkerIds:
                worker._id,
            },
          },
        );

        if (
          Array.isArray(
            route.notificationSentWorkerIds,
          )
        ) {
          route.notificationSentWorkerIds.push(
            worker._id,
          );
        }
      }
    }

    if (!worker.email) {
      console.log(
        "SKIP EMAIL - no email:",
        worker.fullName,
      );

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
        }),
      );

      await Worker.findByIdAndUpdate(
        worker._id,
        {
          lastAlertAt: new Date(),
        },
      );

      sentIds.add(workerId);

      await Route.findByIdAndUpdate(
        routeId,
        {
          $addToSet: {
            emailSentWorkerIds:
              worker._id,
          },
        },
      );

      emailSent += 1;

      console.log(
        "✅ EMAIL SENT:",
        worker.email,
      );
    } catch (error) {
      emailFailed += 1;

      console.error(
        "❌ EMAIL SEND FAILED:",
        worker.email,
      );

      console.error(error);
    }
  }

  return {
    emailSent,

    emailFailed,

    sentIds,
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

            10,
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
        10,
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

          10,
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
