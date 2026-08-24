import express from "express";
import { saveUser } from "../../controllers/user/userController.js";

const router = express.Router();

router.post("/api/user/save", saveUser);

export default router;