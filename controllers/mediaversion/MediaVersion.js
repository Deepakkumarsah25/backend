import { getMediaVersion } from "../../utils/mediaVersion.js";

export const getMediaVersions = async (req, res) => {
  try {
    const keys = [
      "gallery",
      "videos",
      "news",
      "banners",
      "documents",
    ];

    const versions = {};

    for (const key of keys) {
      versions[key] = String(
        await getMediaVersion(key)
      );
    }

    return res.status(200).json({
      success: true,
      versions,
    });
  } catch (error) {
    console.error("MEDIA VERSION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};