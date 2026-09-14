import mongoose from "mongoose";

import Tracking from "../../models/Tracking.js";
import Route from "../../models/Route.js";
import Driver from "../../models/Driver.js";
import Worker from "../../models/Worker.js";

import {
  findNearbyWorkers,
} from "../../services/routeMatchingService.js";

import {
  sendEmail,
} from "../../services/emailService.js";


/* =========================================================
   PUBLIC BASE URL
========================================================= */

const getPublicBaseUrl = (req) => {
  return (
    process.env.PUBLIC_BASE_URL ||
    `${req.protocol}://${req.get("host")}`
  ).replace(/\/$/, "");
};


/* =========================================================
   TRACK URL
========================================================= */

const buildTrackUrl = (
  req,
  routeId
) => {
  return `${getPublicBaseUrl(req)}/track/${routeId}`;
};


/* =========================================================
   GPS VALIDATION
========================================================= */

const isValidGps = (
  lat,
  lng
) => {
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

const getWorkerCoords = (
  worker
) => {
  const lat = Number(
    worker?.location?.lat ??
    worker?.lat
  );

  const lng = Number(
    worker?.location?.lng ??
    worker?.lng
  );

  if (
    !isValidGps(
      lat,
      lng
    )
  ) {
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

  const endLocation =
    route?.endLocation ||
    "Destination";

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
        🚩 VIP Party Vehicle Alert
      </h1>

      <p>
        VIP Party ka vehicle
        aapke area ke paas
        pahunch raha hai.
      </p>

    </div>


    <div class="content">

      <h2>
        Namaskar
        ${worker?.fullName || "Ji"},
      </h2>

      <p>
        VIP Party ka vehicle
        aapke area ke 10 kilometer
        ke dayre mein hai.
      </p>

      <p>
        Kripya avashyak taiyari rakhein
        aur aas-paas ke logon tak
        karyakram ki jankari pahunchayein.
      </p>


      <div class="info-box">

        <p>
          <strong>Route:</strong>
          ${route?.routeName || "VIP Party Route"}
        </p>

        <p>
          <strong>Speed:</strong>
          ${Number(
            numericSpeed || 0
          ).toFixed(2)} km/h
        </p>

        <p>
          <strong>Destination:</strong>
          ${endLocation}
        </p>

        <p>
          <strong>Time:</strong>
          ${new Date().toLocaleString()}
        </p>

      </div>


      <center>

        <a
          class="btn"
          href="${trackUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >
          📍 Open Live Tracking
        </a>

        <br>

        <a
          class="btn btn-green"
          href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            endLocation
          )}&travelmode=driving"
          target="_blank"
          rel="noopener noreferrer"
        >
          🧭 Open Route Navigation
        </a>

      </center>

    </div>


    <div class="footer">

      VIP Party Tracking System

      <br>

      This is an automated notification.

    </div>

  </div>

</body>
</html>
`;
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

  const sentIds =
    new Set(
      (
        route.emailSentWorkerIds ||
        []
      ).map(
        (id) =>
          String(id)
      )
    );

  const trackUrl =
    buildTrackUrl(
      req,
      routeId
    );

  let emailSent = 0;
  let emailFailed = 0;

  for (
    const worker of nearbyWorkers
  ) {

    const workerId =
      String(
        worker._id
      );

    if (
      sentIds.has(
        workerId
      )
    ) {
      continue;
    }

    if (
      !worker.email
    ) {
      console.log(
        "SKIP EMAIL - no email:",
        worker.fullName
      );

      continue;
    }

    try {

      await sendEmail(
        worker.email,

        "🚗 VIP Party Vehicle Alert",

        buildWorkerEmailHtml({
          worker,
          route,
          numericSpeed: speed,
          trackUrl,
        })
      );


      await Worker.findByIdAndUpdate(
        worker._id,
        {
          lastAlertAt:
            new Date(),
        }
      );


      sentIds.add(
        workerId
      );


      await Route.findByIdAndUpdate(
        routeId,
        {
          $addToSet: {
            emailSentWorkerIds:
              worker._id,
          },
        }
      );


      emailSent += 1;

      console.log(
        "✅ EMAIL SENT:",
        worker.email
      );

    } catch (error) {

      emailFailed += 1;

      console.error(
        "❌ EMAIL SEND FAILED:",
        worker.email
      );

      console.error(
        error
      );
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
  res
) => {

  try {

    const {
      routeId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        routeId
      )
    ) {
      return res
        .status(400)
        .send(
          "Invalid Route ID"
        );
    }

    const route =
      await Route.findById(
        routeId
      ).lean();

    if (!route) {
      return res
        .status(404)
        .send(
          "Route Not Found"
        );
    }

    return res.render(
      "Tracking/track",
      {
        route,
      }
    );

  } catch (error) {

    console.error(
      "TRACKING PAGE ERROR:",
      error
    );

    return res
      .status(500)
      .send(
        "Tracking Page Error"
      );
  }
};


/* =========================================================
   LIVE STATUS API

   IMPORTANT:
   Workers array public response me nahi bhej rahe.
========================================================= */

export const trackingStatus = async (
  req,
  res
) => {

  try {

    const {
      routeId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        routeId
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid Route ID",
        });
    }


    const route =
      await Route.findById(
        routeId
      ).lean();

    if (!route) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Route Not Found",
        });
    }


    /* =========================================
       FIND NEARBY WORKERS ONLY FOR COUNT
       Not returned to frontend.
    ========================================= */

    let nearbyWorkers = [];

    if (
      isValidGps(
        route.currentLat,
        route.currentLng
      )
    ) {

      nearbyWorkers =
        await findNearbyWorkers(
          Number(
            route.currentLat
          ),
          Number(
            route.currentLng
          ),
          10
        );
    }


    const sentIds =
      new Set(
        (
          route.emailSentWorkerIds ||
          []
        ).map(
          (id) =>
            String(id)
        )
      );


    const emailSentCount =
      nearbyWorkers.filter(
        (worker) =>
          sentIds.has(
            String(
              worker._id
            )
          )
      ).length;


    const emailRemainingCount =
      Math.max(
        nearbyWorkers.length -
          emailSentCount,
        0
      );


    return res.json({

      success: true,

      route: {

        _id:
          String(
            route._id
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

        /*
          GPS frontend map ke liye
          internal use me aa raha hai.
        */

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


      /*
        Worker list REMOVE
      */

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
      error
    );

    return res
      .status(500)
      .json({

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
  res
) => {

  try {

    const {
      routeId,
    } = req.params;


    if (
      !mongoose.Types.ObjectId.isValid(
        routeId
      )
    ) {

      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid Route ID",
        });
    }


    const route =
      await Route.findById(
        routeId
      );

    if (!route) {

      return res
        .status(404)
        .json({
          success: false,
          message:
            "Route Not Found",
        });
    }


    const startLat =
      Number(
        route.startLat
      );

    const startLng =
      Number(
        route.startLng
      );


    if (
      !isValidGps(
        startLat,
        startLng
      )
    ) {

      return res
        .status(400)
        .json({
          success: false,
          message:
            "Route start GPS is missing.",
        });
    }


    route.status =
      "Running";

    route.sentAt =
      route.sentAt ||
      new Date();

    route.currentLat =
      startLat;

    route.currentLng =
      startLng;

    route.currentSpeed =
      0;

    route.trackingEnabled =
      true;

    route.emailSentWorkerIds =
      [];


    await route.save();


    const selectedDriverId =
      route.driverId
        ? String(
            route.driverId
          )
        : null;


    if (
      selectedDriverId &&
      mongoose.Types.ObjectId.isValid(
        selectedDriverId
      )
    ) {

      await Driver.findByIdAndUpdate(
        selectedDriverId,
        {
          currentLat:
            startLat,

          currentLng:
            startLng,

          speed:
            0,
        }
      );
    }


    await Tracking.create({

      routeId:
        route._id,

      driverId:
        selectedDriverId ||
        null,

      lat:
        startLat,

      lng:
        startLng,

      speed:
        0,

    });


    const nearbyWorkers =
      await findNearbyWorkers(
        startLat,
        startLng,
        10
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
        routeId
      ).lean();


    const sentCount =
      Number(
        updatedRoute
          ?.emailSentWorkerIds
          ?.length || 0
      );


    const emailRemaining =
      Math.max(
        nearbyWorkers.length -
          sentCount,
        0
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

      currentSpeed:
        0,

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
          routeId
        ),

    });

  } catch (error) {

    console.error(
      "START TRACKING ERROR:",
      error
    );

    return res
      .status(500)
      .json({

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
/* =========================================================
   LIVE GPS UPDATE
========================================================= */

export const updateTracking = async (
  req,
  res
) => {

  try {

    console.log(
      "========================================="
    );

    console.log(
      "TRACKING API HIT"
    );

    console.log(
      "REQUEST BODY:",
      req.body
    );

    console.log(
      "========================================="
    );


    /* =========================================
       REQUEST DATA
    ========================================= */

    const {
      routeId,
      driverId,
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
        routeId
      )
    ) {

      return res
        .status(400)
        .json({

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
        numericSpeed
      ) ||
      numericSpeed < 0
    ) {

      numericSpeed = 0;

    }


    if (
      !isValidGps(
        numericLat,
        numericLng
      )
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Valid latitude and longitude are required",

        });

    }


    /* =========================================
       IMPORTANT:
       ACTIVE ROUTE HI FETCH KARO
       
       Completed / stopped route ko
       GPS update nahi milega.
    ========================================= */

    const route =
      await Route.findOne({

        _id: routeId,

        trackingEnabled: true,

        status: "Running",

      });


    /* =========================================
       STOPPED ROUTE
    ========================================= */

    if (!route) {

      console.warn(
        "GPS UPDATE REJECTED - TRACKING STOPPED:",
        routeId
      );

      return res
        .status(409)
        .json({

          success: false,

          stopped: true,

          message:
            "Tracking has been stopped",

        });

    }


    /*
      IMPORTANT:

      Yahan route ACTIVE hone ke baad
      hi GPS save hoga.
    */


    /* =========================================
       DRIVER ID
    ========================================= */

    const actualDriverId =
      driverId ||
      route.driverId ||
      null;


    /* =========================================
       FINAL SAFETY CHECK
       
       Stop button aur GPS request ke beech
       agar state change hui ho to dobara check.
    ========================================= */

    const activeRoute =
      await Route.findOne({

        _id: routeId,

        trackingEnabled: true,

        status: "Running",

      });


    if (!activeRoute) {

      console.warn(
        "GPS UPDATE REJECTED AFTER STOP:",
        routeId
      );

      return res
        .status(409)
        .json({

          success: false,

          stopped: true,

          message:
            "Tracking has been stopped",

        });

    }


    /* =========================================
       SAVE TRACKING HISTORY
    ========================================= */

    await Tracking.create({

      routeId:
        activeRoute._id,

      driverId:
        actualDriverId,

      lat:
        numericLat,

      lng:
        numericLng,

      speed:
        numericSpeed,

    });


    /* =========================================
       IMPORTANT:
       Existing active route update

       NOTE:
       Is request ke andar route ko
       dobara Running set karne ki
       zarurat nahi hai.
    ========================================= */

    const updatedRoute =
      await Route.findOneAndUpdate(

        {
          _id: routeId,

          trackingEnabled:
            true,

          status:
            "Running",

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
        }

      );


    /* =========================================
       STOP HONE KE BAAD RACE CONDITION
    ========================================= */

    if (!updatedRoute) {

      console.warn(
        "GPS UPDATE LOST RACE WITH STOP:",
        routeId
      );


      return res
        .status(409)
        .json({

          success: false,

          stopped: true,

          message:
            "Tracking has been stopped",

        });

    }


    /* =========================================
       DRIVER UPDATE
    ========================================= */

    if (
      actualDriverId &&
      mongoose.Types.ObjectId.isValid(
        String(
          actualDriverId
        )
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

        }

      );

    }


    /* =========================================
       NEARBY WORKERS
    ========================================= */

    const nearbyWorkers =
      await findNearbyWorkers(

        numericLat,

        numericLng,

        10

      );


    console.log(
      "Nearby Workers:",
      nearbyWorkers.length
    );


    /* =========================================
       EMAIL
    ========================================= */

    const emailResult =
      await sendNearbyWorkerEmails({

        req,

        route:
          updatedRoute,

        routeId,

        nearbyWorkers,

        speed:
          numericSpeed,

      });


    /* =========================================
       FINAL ROUTE
    ========================================= */

    const finalRoute =
      await Route.findById(
        routeId
      ).lean();


    /*
      Agar Stop request parallel me aa gayi
      ho to response me latest status check karo.
    */

    if (
      !finalRoute ||
      finalRoute.trackingEnabled !== true ||
      finalRoute.status !== "Running"
    ) {

      console.warn(
        "GPS UPDATE FINISHED AFTER STOP:",
        routeId
      );


      return res
        .status(409)
        .json({

          success: false,

          stopped: true,

          message:
            "Tracking has been stopped",

        });

    }


    /* =========================================
       SENT EMAIL IDs
    ========================================= */

    const sentIds =
      new Set(

        (
          finalRoute
            .emailSentWorkerIds ||
          []

        ).map(

          (id) =>
            String(id)

        )

      );


    const emailSent =
      nearbyWorkers.filter(

        (worker) =>
          sentIds.has(
            String(
              worker._id
            )
          )

      ).length;


    const emailRemaining =
      Math.max(

        nearbyWorkers.length -
          emailSent,

        0

      );


    /* =========================================
       SUCCESS
    ========================================= */

    return res.json({

      success: true,

      currentSpeed:
        numericSpeed,

      nearbyWorkers:
        nearbyWorkers.length,

      emailSent,

      emailFailed:
        emailResult.emailFailed,

      emailRemaining,

      trackUrl:
        buildTrackUrl(
          req,
          routeId
        ),

    });


  } catch (error) {

    console.error(
      "========================================="
    );

    console.error(
      "TRACKING UPDATE ERROR"
    );

    console.error(
      error
    );

    console.error(
      "========================================="
    );


    return res
      .status(500)
      .json({

        success: false,

        message:
          error.message ||
          "Tracking update failed",

      });

  }

};