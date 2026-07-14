import Banner from "../models/Banner.js";

export const getBanners = async (
  req,
  res
) => {

  const banners = await Banner.find({
    active: true,
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    banners,
  });
};