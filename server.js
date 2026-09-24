import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

/* =========================================================
   ROUTES
========================================================= */

import userRoutes from "./routes/user/userRoutes.js";
import trackingRoutes from "./routes/tracking/trackingRoutes.js";
import driverRoutes from "./routes/sections/driver.js";
import adminRoutes from "./routes/adminRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import vipLiveRoute from "./routes/vipLiveRoute.js";
import videoRoutes from "./routes/videogalleryRoutes.js";
import albumRoutes from "./routes/albumRoutes.js";
import mediaGalleryRoutes from "./routes/mediaGalleryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import joinRoutes from "./routes/joinRoutes.js";
import VolunteerRoutes from "./routes/volunteer/volunteerRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import organisationRoutes from "./routes/organisationRoutes.js";
import morchaRoutes from "./routes/morchaRoutes.js";
import leadershipRoutes from "./routes/leadershipRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import cmsRoutes from "./routes/cmsRoutes.js";
import bainarliveupdate from "./routes/sections/banners.js";
import workerRoutes from "./routes/sections/worker.js";
import routeRoutes from "./routes/route/routeRoutes.js";
import scrollerRoutes from "./routes/scrollerRoutes.js";
import notificationRoutes from "./routes/notification/notificationRoutes.js";
import feedbackRoutes from "./routes/feedback/feedbackRoutes.js";
import paymentRoutes from "./routes/payment/paymentRoutes.js";
import newsRoutes from "./routes/news/newsRoutes.js";
import eventRoutes from "./routes/events/eventRoutes.js";

import grievanceRoutes, {
  adminGrievanceRouter,
} from "./routes/Grievance/Grievanceroutes.js";

import Volunteer from "./models/Volunteer.js";
import mediaRoutes from "./routes/mediaversion/mediaversionRoutes.js";
/* =========================================================
   APP
========================================================= */

const app = express();

const PORT = Number(process.env.PORT) || 9191;

/* =========================================================
   PATH
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   VIEW ENGINE
========================================================= */

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* =========================================================
   SECURITY / GEOLOCATION POLICY
========================================================= */

app.use((req, res, next) => {
  /*
    Browser geolocation ke liye
    current site ko permission.
  */

  res.setHeader(
    "Permissions-Policy",
    "geolocation=(self)"
  );

  next();
});

/* =========================================================
   SESSION
========================================================= */

app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "vipparty",

    resave: false,

    saveUninitialized: false,

    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

/* =========================================================
   STATIC FILES
========================================================= */

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

app.use(
  "/assets",
  express.static(
    path.join(__dirname, "assets")
  )
);

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

/* =========================================================
   NORMAL ROUTES
========================================================= */

/*
  USER ROUTES

  /api/user/save
  /api/user/delete/send-otp
  /api/user/delete/verify-otp
  /api/user/delete/cancel
*/

app.use(userRoutes);

/*
  Existing /api/users routes
*/
app.use("/api/users", userRoutes);

/*
  ADMIN
*/
app.use("/", adminRoutes);

/*
  GENERAL API
*/
app.use("/api", apiRoutes);

app.use("/api", searchRoutes);
app.use("/api", mediaRoutes);
app.use("/api/auth", authRoutes);

app.use("/api", vipLiveRoute);

app.use("/api", videoRoutes);

app.use("/api", albumRoutes);

app.use("/api/join", joinRoutes);

app.use(
  "/api/volunteer",
  VolunteerRoutes
);

/* =========================================================
   AGENT / DELETE ACCOUNT ROUTES
========================================================= */

/*
  IMPORTANT:

  agentRoutes.js currently contains:

  POST /api/user/save
  POST /api/user/delete/send-otp
  POST /api/user/delete/verify-otp
  POST /api/user/delete/cancel

  Therefore DO NOT use:

  app.use("/api/agent", agentRoutes);

  Otherwise final URL becomes:

  /api/agent/api/user/delete/cancel

  Frontend is calling:

  /api/user/delete/cancel

  So we mount it directly.
*/

app.use(agentRoutes);

/*
  ORGANISATION
*/
app.use(
  "/organisation",
  organisationRoutes
);

/*
  CMS
*/
app.use("/cms", cmsRoutes);

/*
  LEADERSHIP
*/
app.use(
  "/leadership",
  leadershipRoutes
);

/*
  MORCHA
*/
app.use("/", morchaRoutes);

/*
  ADMIN USER
*/
app.use("/", adminUserRoutes);

/*
  MEDIA GALLERY
*/
app.use("/", mediaGalleryRoutes);

app.use("/api", mediaGalleryRoutes);

/*
  BANNER
*/
app.use("/", bainarliveupdate);

/*
  GRIEVANCE
*/
app.use(
  "/api/grievances",
  grievanceRoutes
);

app.use(
  "/grievances",
  adminGrievanceRouter
);

/*
  WORKER
*/
app.use("/", workerRoutes);

/*
  DRIVER
*/
app.use("/", driverRoutes);

/* =========================================================
   TRACKING ROUTES

   IMPORTANT:

   /track/:routeId
   /api/tracking/status/:routeId
   /api/tracking/update
========================================================= */

app.use("/", trackingRoutes);

/* =========================================================
   ROUTE MANAGEMENT
========================================================= */

app.use(routeRoutes);

/* =========================================================
   OTHER ROUTES
========================================================= */

app.use(scrollerRoutes);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api",
  feedbackRoutes
);

app.use(
  "/feedback-admin",
  feedbackRoutes
);

app.use(
  "/api/payment",
  paymentRoutes
);

app.use(
  "/",
  newsRoutes
);

app.use(
  "/",
  eventRoutes
);

/* =========================================================
   TRACKING HEALTH CHECK
========================================================= */

app.get(
  "/api/tracking/health",
  (req, res) => {
    return res.json({
      success: true,

      message:
        "Tracking API is working",

      time:
        new Date().toISOString(),

      server:
        "VIP Party Backend",
    });
  }
);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  /*
    API request hai to JSON do.
  */

  if (
    req.path.startsWith("/api/")
  ) {
    return res.status(404).json({
      success: false,

      message:
        "API route not found",

      path: req.path,
    });
  }

  return res
    .status(404)
    .send("Page not found");
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "=========================================="
    );

    console.error(
      "GLOBAL SERVER ERROR"
    );

    console.error(error);

    console.error(
      "=========================================="
    );

    if (res.headersSent) {
      return next(error);
    }

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Internal Server Error",
    });
  }
);

/* =========================================================
   MONGODB
========================================================= */

mongoose
  .connect(process.env.MONGODB_URI)

  .then(() => {
    console.log(
      "✅ MongoDB Connected"
    );
  })

  .catch((error) => {
    console.error(
      "❌ MongoDB Connection Error:"
    );

    console.error(error);
  });

/* =========================================================
   SERVER
========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "=========================================="
    );

    console.log(
      "🚀 Server Running"
    );

    console.log(
      `http://localhost:${PORT}`
    );

    console.log(
      `http://127.0.0.1:${PORT}`
    );

    console.log(
      "=========================================="
    );

    console.log(
      "Tracking health:"
    );

    console.log(
      `http://localhost:${PORT}/api/tracking/health`
    );

    console.log(
      "=========================================="
    );
  }
);