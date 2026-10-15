import Banner from "../models/Banner.js";
import Scroller from "../models/Scroller.js";
import ContactInfo from "../models/ContactInfo.js";
import VipOffice from "../models/VipOffice.js";
import CmsPage from "../models/CmsPage.js";

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

export const getHeroBanners = async (req, res) => {
  try {
    const scrollers = await Scroller.find({ active: true, type: "image" }).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    if (scrollers && scrollers.length > 0) {
      return res.json({
        success: true,
        source: "scroller",
        banners: scrollers.map((s) => ({
          _id: s._id,
          imageUrl: s.mediaUrl,
          title: s.originalName || "Hero Banner",
          displayOrder: s.displayOrder,
        })),
      });
    }

    const banners = await Banner.find({ active: true }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      source: "banner",
      banners: banners.map((b) => ({
        _id: b._id,
        imageUrl: b.imageUrl,
        title: b.title || "Hero Banner",
      })),
    });
  } catch (error) {
    console.error("GET HERO BANNERS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getContact = async (req, res) => {
  try {
    const info = await ContactInfo.findOne();
    const offices = await VipOffice.find();
    res.json({ info, offices });
  } catch (error) {
    console.error("GET CONTACT ERROR:", error?.message || "Unexpected error");
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getCmsPage = async (req, res) => {
  try {
    const { pageKey } = req.params;

    const page = await CmsPage.findOne({
      pageKey,
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    res.json({
      success: true,
      page,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
