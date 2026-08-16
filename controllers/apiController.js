import Banner from "../models/Banner.js";
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

export const getContact = async (req, res) => {
  try {
    const info = await ContactInfo.findOne();
    const offices = await VipOffice.find();
    res.json({ info, offices });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
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