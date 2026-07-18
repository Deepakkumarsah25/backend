import express from "express";
import Banner from "../../models/Banner.js";

const router = express.Router();

router.get("/bainar", async (req, res) => {
  const banners = await Banner.find().sort({ createdAt: -1 });

  res.render("LiveUpdatesBanners/banners", {
    banners,
  });
});

router.get("/member",(req,res)=>{
    res.render("AddWorker/mamber")

})

export default router;