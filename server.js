import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
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
import agentRoutes from "./routes/agentRoutes.js";
import organisationRoutes from "./routes/organisationRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import cmsRoutes from "./routes/cmsRoutes.js";
import bainarliveupdate from './routes/sections/banners.js'
import workerRoutes from "./routes/sections/worker.js";
import routeRoutes from "./routes/route/routeRoutes.js";
import scrollerRoutes from "./routes/scrollerRoutes.js";
import notificationRoutes from "./routes/notification/notificationRoutes.js";
import feedbackRoutes from "./routes/feedback/feedbackRoutes.js";
import paymentRoutes from "./routes/payment/paymentRoutes.js";
import newsRoutes from "./routes/news/newsRoutes.js";
import eventRoutes from "./routes/events/eventRoutes.js";
const app = express();
const PORT = process.env.PORT || 9191;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "vipparty",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(userRoutes);
app.use("/", adminRoutes);
app.use("/api", apiRoutes);
app.use("/api", searchRoutes);

app.use("/api/auth", authRoutes);
app.use("/api", vipLiveRoute);
app.use("/api", videoRoutes);
app.use("/api",albumRoutes);
app.use("/api/join", joinRoutes);
app.use("/api/agent", agentRoutes);
app.use("/", adminUserRoutes);
app.use("/", mediaGalleryRoutes);
app.use("/api", mediaGalleryRoutes);
app.use("/organisation", organisationRoutes);
app.use("/cms", cmsRoutes);

app.use("/", bainarliveupdate)
app.use("/", workerRoutes);
app.use("/",driverRoutes);
app.use("/", trackingRoutes);
app.use(scrollerRoutes);
app.use(routeRoutes);
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
app.use("/api/payment", paymentRoutes);
app.use("/", newsRoutes);
app.use("/", eventRoutes);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(console.error);
  
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server Running http://localhost:${PORT}`);
});