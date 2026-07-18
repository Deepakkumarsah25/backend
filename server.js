import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import adminRoutes from "./routes/adminRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import vipLiveRoute from "./routes/vipLiveRoute.js";
import videoRoutes from "./routes/videogalleryRoutes.js";
import albumRoutes from "./routes/albumRoutes.js";
import mediaGalleryRoutes from "./routes/mediaGalleryRoutes.js";

import joinRoutes from "./routes/joinRoutes.js";
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

app.use("/", adminRoutes);
app.use("/api", apiRoutes);
app.use("/api", vipLiveRoute);
app.use("/api", videoRoutes);
app.use("/api",albumRoutes);
app.use("/api/join", joinRoutes);
app.use("/", mediaGalleryRoutes);
app.use("/api", mediaGalleryRoutes);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(console.error);

app.listen(9191,"0.0.0.0",()=>{
 console.log("🚀 Server Running http://localhost:9191");
});