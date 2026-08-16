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
import bainarliveupdate from './routes/sections/banners.js'
import workerRoutes from "./routes/sections/worker.js";
import routeRoutes from "./routes/route/routeRoutes.js";
import scrollerRoutes from "./routes/scrollerRoutes.js";
import notificationRoutes from "./routes/notification/notificationRoutes.js";
const app = express();
const PORT = process.env.PORT || 9191;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
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
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(console.error);

app.listen(PORT, () => {
  console.log(`🚀 Server Running http://localhost:${PORT}`);
});