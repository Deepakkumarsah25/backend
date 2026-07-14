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

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(console.error);

app.listen(PORT, () => {
  console.log(`🚀 Server Running http://localhost:${PORT}`);
});