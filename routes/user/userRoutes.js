// import express from "express";
// import { saveUser } from "../../controllers/user/userController.js";

// const router = express.Router();

// router.post("/api/user/save", saveUser);

// export default router;
import express from "express";
import upload from "../../middlewar/upload.js";
import { protect } from "../../middlewar/firebaseAuth.js";
import { saveUser, getMyCard, updateMyCard } from "../../controllers/user/userController.js";

const router = express.Router();

router.post("/save-user", protect, saveUser);

router.get("/me", protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      uid: req.user.uid,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      photoURL: req.user.photoURL,
      isAgent: req.user.isAgent || false,
    },
  });
});

router.get("/my-card", protect, getMyCard);
router.patch("/my-card", protect, upload.single("photo"), updateMyCard);

export default router;
