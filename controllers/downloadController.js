import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import DownloadItem from "../models/DownloadItem.js";
import { logAdminActivity } from "../services/activityService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadLocalDirBackend = path.resolve(__dirname, "../uploads/downloads");
const uploadLocalDirVip = path.resolve(__dirname, "../../vippartyin/public/uploads/downloads");

[uploadLocalDirBackend, uploadLocalDirVip].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper: Upload buffer to Cloudinary with fallback to local file
const streamUpload = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
      return reject(new Error("Cloudinary not configured"));
    }
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "VIP_Downloads", ...options },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return "1.5 MB";
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Seed initial authentic items if database collection is empty
export const seedInitialDownloads = async () => {
  try {
    const count = await DownloadItem.countDocuments();
    if (count > 0) return;

    console.log("⚡ Seeding authentic initial VIP Download items...");

    const initialItems = [
      // 1. Leaders Photo
      {
        title: "श्री मुकेश सहनी (Son of Mallah) - राष्ट्रीय अध्यक्ष",
        category: "leaders-photo",
        imageUrl: "/images/downloads/mukesh-sahani-leader.svg",
        caption: "संस्थापक एवं राष्ट्रीय अध्यक्ष, विकासशील इंसान पार्टी (VIP), पूर्व मंत्री, बिहार सरकार",
        author: "श्री मुकेश सहनी",
        fileSize: "2.8 MB",
        dimensions: "2400 x 3000",
        format: "SVG / HD",
        displayOrder: 1,
        downloadsCount: 1420,
        tags: ["mukesh-sahani", "vip-president", "leaders-photo", "hd"],
        isPublished: true,
      },
      {
        title: "अमर शहीद जुब्बा सहनी - स्वतंत्रता संग्राम के महानायक",
        category: "leaders-photo",
        imageUrl: "/images/downloads/jubba-sahani-leader.svg",
        caption: "भारतीय स्वाधीनता संग्राम के अमर बलिदानी एवं निषाद कुल गौरव (1906 - 1944)",
        author: "जुब्बा सहनी",
        fileSize: "2.1 MB",
        dimensions: "2000 x 2500",
        format: "SVG / HD",
        displayOrder: 2,
        downloadsCount: 980,
        tags: ["jubba-sahani", "freedom-fighter", "prerna", "hd"],
        isPublished: true,
      },
      {
        title: "वीरांगना फूलन देवी - नारी स्वाभिमान की प्रतीक",
        category: "leaders-photo",
        imageUrl: "/images/downloads/phoolan-devi-leader.svg",
        caption: "अन्याय व शोषण के विरुद्ध संघर्ष की अप्रतिम प्रतिमूर्ति एवं पूर्व सांसद, मिर्ज़ापुर",
        author: "वीरांगना फूलन देवी",
        fileSize: "2.3 MB",
        dimensions: "2000 x 2500",
        format: "SVG / HD",
        displayOrder: 3,
        downloadsCount: 1150,
        tags: ["phoolan-devi", "women-empowerment", "prerna", "hd"],
        isPublished: true,
      },
      {
        title: "बाबा साहेब डॉ. भीमराव अंबेडकर - संविधान निर्माता",
        category: "leaders-photo",
        imageUrl: "/images/downloads/dr-ambedkar-leader.svg",
        caption: "सामाजिक समता, समरसता एवं संवैधानिक अधिकारों के अग्रदूत, भारत रत्न",
        author: "डॉ. बी.आर. अंबेडकर",
        fileSize: "2.5 MB",
        dimensions: "2200 x 2800",
        format: "SVG / HD",
        displayOrder: 4,
        downloadsCount: 1340,
        tags: ["ambedkar", "constitution", "social-justice", "hd"],
        isPublished: true,
      },

      // 2. Infographics & Banner
      {
        title: "निषाद आरक्षण संकल्प महारैली - आधिकारिक डिजिटल बैनर",
        category: "infographics-banner",
        imageUrl: "/images/downloads/nishad-aarakshan-banner.svg",
        caption: "आरक्षण नहीं तो गठबंधन नहीं - ऐतिहासिक संकल्प महारैली (1920x1080 Full HD)",
        author: "VIP सोशल मीडिया विंग",
        fileSize: "1.9 MB",
        dimensions: "1920 x 1080",
        format: "SVG / 16:9",
        displayOrder: 1,
        downloadsCount: 1850,
        tags: ["reservation-rally", "bihar", "banner", "hd"],
        isPublished: true,
      },
      {
        title: "VIP पार्टी चुनाव चिह्न 'नाव' (Boat) - आधिकारिक सिंबल बैनर",
        category: "infographics-banner",
        imageUrl: "/images/downloads/vip-symbol-boat-banner.svg",
        caption: "विकास, विश्वास और सामाजिक स्वाभिमान का प्रतीक - आधिकारिक चुनाव चिह्न",
        author: "विकासशील इंसान पार्टी",
        fileSize: "1.5 MB",
        dimensions: "1920 x 1080",
        format: "SVG / 16:9",
        displayOrder: 2,
        downloadsCount: 1620,
        tags: ["party-symbol", "boat", "naav", "official"],
        isPublished: true,
      },
      {
        title: "अमर शहीद जुब्बा सहनी मेधा छात्रवृत्ति योजना - जागरूकता पोस्टर",
        category: "infographics-banner",
        imageUrl: "/images/downloads/jubba-scholarship-infographic.svg",
        caption: "10वीं, 12वीं एवं स्नातक के मेधावी छात्र-छात्राओं हेतु आर्थिक प्रोत्साहन योजना",
        author: "VIP छात्र विंग",
        fileSize: "1.2 MB",
        dimensions: "1080 x 1080",
        format: "SVG / 1:1",
        displayOrder: 3,
        downloadsCount: 890,
        tags: ["scholarship", "education", "infographic", "welfare"],
        isPublished: true,
      },
      {
        title: "VIP पार्टी सदस्यता महाभियान 2026-27 - डिजिटल ड्राइव",
        category: "infographics-banner",
        imageUrl: "/images/downloads/vip-membership-campaign.svg",
        caption: "बदलाव के साक्षी नहीं, भागीदार बनें! तुरंत डिजिटल आईडी कार्ड प्राप्त करें",
        author: "VIP डिजिटल मीडिया",
        fileSize: "1.4 MB",
        dimensions: "1200 x 1200",
        format: "SVG / 1:1",
        displayOrder: 4,
        downloadsCount: 1280,
        tags: ["membership", "infographic", "social-media"],
        isPublished: true,
      },

      // 3. Quotes
      {
        title: "जिसकी जितनी संख्या भारी, उसकी उतनी हिस्सेदारी",
        category: "quotes",
        imageUrl: "/images/downloads/quote-mukesh-sahani.svg",
        caption: "जब तक हमारे निषाद और पिछड़े समाज को उनका वाजिब संवैधानिक हक नहीं मिल जाता, हमारा संघर्ष नहीं रुकेगा।",
        author: "श्री मुकेश सहनी (सन ऑफ मल्लाह)",
        fileSize: "1.1 MB",
        dimensions: "1080 x 1080",
        format: "SVG / 1:1",
        displayOrder: 1,
        downloadsCount: 2100,
        tags: ["mukesh-sahani", "social-justice", "quotes", "rights"],
        isPublished: true,
      },
      {
        title: "शिक्षा वह शेरनी का दूध है जो पिएगा वह दहाड़ेगा",
        category: "quotes",
        imageUrl: "/images/downloads/quote-ambedkar-education.svg",
        caption: "शिक्षा ही समाज के पिछड़े और वंचित वर्गों की मुक्ति और स्वाभिमान का एकमात्र अस्त्र है।",
        author: "बाबा साहेब डॉ. भीमराव अंबेडकर",
        fileSize: "1.3 MB",
        dimensions: "1080 x 1080",
        format: "SVG / 1:1",
        displayOrder: 2,
        downloadsCount: 1940,
        tags: ["ambedkar", "education", "quotes", "inspiration"],
        isPublished: true,
      },
      {
        title: "हक और अधिकार मांगने से नहीं, छीनने से मिलता है",
        category: "quotes",
        imageUrl: "/images/downloads/quote-phoolan-devi.svg",
        caption: "अपने समाज के मान-सम्मान के लिए कभी किसी जुल्म के आगे मत झुको। हिम्मत ही सबसे बड़ी ताकत है।",
        author: "वीरांगना फूलन देवी",
        fileSize: "1.0 MB",
        dimensions: "1080 x 1080",
        format: "SVG / 1:1",
        displayOrder: 3,
        downloadsCount: 1670,
        tags: ["phoolan-devi", "courage", "struggle", "quotes"],
        isPublished: true,
      },
      {
        title: "स्वाभिमान के साथ कोई समझौता नहीं होगा",
        category: "quotes",
        imageUrl: "/images/downloads/quote-swabhimaan-sangharsh.svg",
        caption: "बिहार के हर गरीब, मजदूर और निषाद भाई के चेहरे पर मुस्कान और आत्मसम्मान लाना ही हमारा संकल्प है।",
        author: "श्री मुकेश सहनी",
        fileSize: "1.2 MB",
        dimensions: "1080 x 1080",
        format: "SVG / 1:1",
        displayOrder: 4,
        downloadsCount: 1780,
        tags: ["mukesh-sahani", "pride", "bihar", "quotes"],
        isPublished: true,
      },

      // 4. Mobile Wallpaper
      {
        title: "VIP पार्टी चुनाव चिह्न 'नाव' - डार्क रॉयल ब्लू 4K मोबाइल वॉलपेपर",
        category: "mobile-wallpaper",
        imageUrl: "/images/downloads/wallpaper-vip-boat-dark.svg",
        caption: "1080x1920 Full HD Mobile Lockscreen & Homescreen Wallpaper",
        author: "VIP डिजिटल विंग",
        fileSize: "1.8 MB",
        dimensions: "1080 x 1920",
        format: "SVG / 9:16",
        displayOrder: 1,
        downloadsCount: 3100,
        tags: ["wallpaper", "boat-symbol", "4k", "mobile"],
        isPublished: true,
      },
      {
        title: "श्री मुकेश सहनी 'सन ऑफ मल्लाह' - लीडरशिप 4K फोन वॉलपेपर",
        category: "mobile-wallpaper",
        imageUrl: "/images/downloads/wallpaper-mukesh-sahani.svg",
        caption: "बिहार के जन-जन की बुलंद आवाज - आधिकारिक मोबाइल वॉलपेपर",
        author: "VIP यूथ विंग",
        fileSize: "2.1 MB",
        dimensions: "1080 x 1920",
        format: "SVG / 9:16",
        displayOrder: 2,
        downloadsCount: 2850,
        tags: ["mukesh-sahani", "wallpaper", "leader", "mobile"],
        isPublished: true,
      },
      {
        title: "स्वाभिमानी बिहार - VIP नव-निर्माण 4K मोबाइल बैकग्राउंड",
        category: "mobile-wallpaper",
        imageUrl: "/images/downloads/wallpaper-bihar-sankalp.svg",
        caption: "सामाजिक समरसता, समान अधिकार व सम्पूर्ण विकास संकल्प वॉलपेपर",
        author: "VIP आईटी सेल",
        fileSize: "1.7 MB",
        dimensions: "1080 x 1920",
        format: "SVG / 9:16",
        displayOrder: 3,
        downloadsCount: 2210,
        tags: ["bihar", "pride", "wallpaper", "mobile"],
        isPublished: true,
      },
      {
        title: "अमर शहीद जुब्बा सहनी अमर रहें - मोबाइल ट्रिब्यूट वॉलपेपर",
        category: "mobile-wallpaper",
        imageUrl: "/images/downloads/wallpaper-jubba-sahani.svg",
        caption: "स्वतंत्रता संग्राम के अमर महानायक की पावन स्मृति में 4K वॉलपेपर",
        author: "VIP डिजिटल आर्ट",
        fileSize: "1.9 MB",
        dimensions: "1080 x 1920",
        format: "SVG / 9:16",
        displayOrder: 4,
        downloadsCount: 2430,
        tags: ["jubba-sahani", "martyr", "wallpaper", "mobile"],
        isPublished: true,
      },
    ];

    await DownloadItem.insertMany(initialItems);
    console.log(`✅ Seeded ${initialItems.length} authentic Download items successfully!`);
  } catch (err) {
    console.error("Error seeding download items:", err);
  }
};

/* =========================================================
   ADMIN CONTROLLER METHODS
========================================================= */

// Render Admin Downloads Page (Strictly 4 sections, no 'all')
export const renderDownloadsPage = async (req, res) => {
  try {
    const validCategories = [
      "leaders-photo",
      "infographics-banner",
      "quotes",
      "mobile-wallpaper",
    ];

    const requestedCategory = req.params.category || req.query.category;
    if (!requestedCategory || !validCategories.includes(requestedCategory)) {
      return res.redirect("/admin/downloads/leaders-photo");
    }
    const currentCategory = requestedCategory;

    const searchQuery = (req.query.q || "").trim();
    const statusFilter = req.query.status || "all";

    const filter = { category: currentCategory };
    if (statusFilter === "published") {
      filter.isPublished = true;
    } else if (statusFilter === "hidden") {
      filter.isPublished = false;
    }

    if (searchQuery) {
      filter.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { caption: { $regex: searchQuery, $options: "i" } },
        { author: { $regex: searchQuery, $options: "i" } },
        { tags: { $in: [new RegExp(searchQuery, "i")] } },
      ];
    }

    const items = await DownloadItem.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Section counts
    const leadersPhotoCount = await DownloadItem.countDocuments({ category: "leaders-photo" });
    const infographicsCount = await DownloadItem.countDocuments({ category: "infographics-banner" });
    const quotesCount = await DownloadItem.countDocuments({ category: "quotes" });
    const wallpaperCount = await DownloadItem.countDocuments({ category: "mobile-wallpaper" });

    res.render("download/index", {
      items,
      currentCategory,
      searchQuery,
      statusFilter,
      stats: {
        leadersPhotoCount,
        infographicsCount,
        quotesCount,
        wallpaperCount,
      },
      successMsg: req.query.success || null,
      errorMsg: req.query.error || null,
    });
  } catch (err) {
    console.error("Error rendering download page:", err);
    res.status(500).render("download/index", {
      items: [],
      currentCategory: "leaders-photo",
      searchQuery: "",
      statusFilter: "all",
      stats: {
        leadersPhotoCount: 0,
        infographicsCount: 0,
        quotesCount: 0,
        wallpaperCount: 0,
      },
      errorMsg: "Error loading data: " + err.message,
    });
  }
};

// Add New Download Item
export const addDownload = async (req, res) => {
  try {
    const {
      title,
      category,
      caption,
      author,
      isPublished,
      tags,
      imageUrl: customUrl,
    } = req.body;

    const validCategories = [
      "leaders-photo",
      "infographics-banner",
      "quotes",
      "mobile-wallpaper",
    ];

    const targetCategory = validCategories.includes(category) ? category : "leaders-photo";

    if (!title || !title.trim()) {
      return res.status(400).redirect(
        `/admin/downloads/${targetCategory}?error=Title is required.`
      );
    }

    let finalImageUrl = (customUrl || "").trim();
    let publicId = "";
    let fileSize = "1.5 MB";

    // Handle File Upload
    if (req.file) {
      fileSize = formatFileSize(req.file.size);

      // Save local backup file
      const ext = path.extname(req.file.originalname) || ".jpg";
      const localFilename = `vip_download_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`;
      try {
        fs.writeFileSync(path.join(uploadLocalDirBackend, localFilename), req.file.buffer);
        fs.writeFileSync(path.join(uploadLocalDirVip, localFilename), req.file.buffer);
        finalImageUrl = `/uploads/downloads/${localFilename}`;
      } catch (localSaveErr) {
        console.warn("Local disk backup note:", localSaveErr.message);
      }

      // Try Cloudinary Upload
      try {
        const cloudResult = await streamUpload(req.file.buffer, {
          folder: "VIP_Downloads",
        });
        if (cloudResult && cloudResult.secure_url) {
          finalImageUrl = cloudResult.secure_url;
          publicId = cloudResult.public_id || "";
        }
      } catch (cloudErr) {
        console.warn("Cloudinary upload note (using local upload instead):", cloudErr.message);
      }
    }

    if (!finalImageUrl) {
      return res.status(400).redirect(
        `/admin/downloads/${targetCategory}?error=Please upload an image file or provide an image URL.`
      );
    }

    // Default dimensions and formats based on section
    let autoDimensions = "HD";
    let autoFormat = "JPG";
    if (targetCategory === "mobile-wallpaper") {
      autoDimensions = "1080x1920";
      autoFormat = "9:16 HD";
    } else if (targetCategory === "leaders-photo") {
      autoDimensions = "2400x3000";
      autoFormat = "HD Portrait";
    } else if (targetCategory === "infographics-banner") {
      autoDimensions = "1920x1080";
      autoFormat = "16:9 Banner";
    } else if (targetCategory === "quotes") {
      autoDimensions = "1080x1080";
      autoFormat = "1:1 Square";
    }

    // Process tags
    const tagList = tags
      ? (Array.isArray(tags) ? tags : tags.split(","))
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const newItem = await DownloadItem.create({
      title: title.trim(),
      category: targetCategory,
      imageUrl: finalImageUrl,
      publicId,
      caption: (caption || "").trim(),
      author: (author || "").trim(),
      fileSize: fileSize || "1.5 MB",
      dimensions: autoDimensions,
      format: autoFormat,
      displayOrder: 0,
      isPublished: isPublished === "true" || isPublished === true || isPublished === "on",
      tags: tagList,
    });

    // Log admin activity
    await logAdminActivity(req, {
      section: "Downloads Management",
      action: "Added New Download Item",
      details: `Added "${newItem.title}" to [${newItem.category}]`,
      actionType: "create",
      sectionIcon: "fa-solid fa-cloud-arrow-down",
    });

    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.json({ success: true, message: "Download item created successfully!", item: newItem });
    }

    return res.redirect(`/admin/downloads/${targetCategory}?success=Download item added successfully!`);
  } catch (err) {
    console.error("Add download error:", err);
    return res.redirect(`/admin/downloads/leaders-photo?error=Error: ${encodeURIComponent(err.message)}`);
  }
};

// Edit / Update Download Item
export const editDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      caption,
      author,
      isPublished,
      tags,
      imageUrl: customUrl,
    } = req.body;

    const item = await DownloadItem.findById(id);
    if (!item) {
      return res.status(404).redirect(`/admin/downloads/leaders-photo?error=Item not found.`);
    }

    if (title) item.title = title.trim();
    if (category) item.category = category;
    if (typeof caption !== "undefined") item.caption = caption.trim();
    if (typeof author !== "undefined") item.author = author.trim();
    item.isPublished = isPublished === "true" || isPublished === true || isPublished === "on";

    if (tags) {
      item.tags = (Array.isArray(tags) ? tags : tags.split(","))
        .map((t) => t.trim())
        .filter(Boolean);
    }

    // Replace Image if new file uploaded or new URL provided
    if (req.file) {
      item.fileSize = formatFileSize(req.file.size);
      const ext = path.extname(req.file.originalname) || ".jpg";
      const localFilename = `vip_download_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`;
      try {
        fs.writeFileSync(path.join(uploadLocalDirBackend, localFilename), req.file.buffer);
        fs.writeFileSync(path.join(uploadLocalDirVip, localFilename), req.file.buffer);
        item.imageUrl = `/uploads/downloads/${localFilename}`;
      } catch (localSaveErr) {
        console.warn("Local disk backup note:", localSaveErr.message);
      }

      try {
        const cloudResult = await streamUpload(req.file.buffer, {
          folder: "VIP_Downloads",
        });
        if (cloudResult && cloudResult.secure_url) {
          item.imageUrl = cloudResult.secure_url;
          item.publicId = cloudResult.public_id || "";
        }
      } catch (cloudErr) {
        console.warn("Cloudinary update note:", cloudErr.message);
      }
    } else if (customUrl && customUrl.trim()) {
      item.imageUrl = customUrl.trim();
    }

    await item.save();

    await logAdminActivity(req, {
      section: "Downloads Management",
      action: "Updated Download Item",
      details: `Updated "${item.title}" [${item.category}]`,
      actionType: "update",
      sectionIcon: "fa-solid fa-cloud-arrow-down",
    });

    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.json({ success: true, message: "Download item updated successfully!", item });
    }

    return res.redirect(`/admin/downloads/${item.category}?success=Download item updated successfully!`);
  } catch (err) {
    console.error("Edit download error:", err);
    return res.redirect(`/admin/downloads/leaders-photo?error=Update error: ${encodeURIComponent(err.message)}`);
  }
};

// Toggle Publish Status
export const toggleDownloadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await DownloadItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    item.isPublished = !item.isPublished;
    await item.save();

    await logAdminActivity(req, {
      section: "Downloads Management",
      action: item.isPublished ? "Published Download Item" : "Hid Download Item",
      details: `Status set to ${item.isPublished ? "Active" : "Hidden"} for "${item.title}"`,
      actionType: "update",
      sectionIcon: "fa-solid fa-cloud-arrow-down",
    });

    return res.json({
      success: true,
      isPublished: item.isPublished,
      message: item.isPublished ? "Item is now Live." : "Item is now Hidden.",
    });
  } catch (err) {
    console.error("Toggle status error:", err);
    return res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};

// Delete Download Item
export const deleteDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await DownloadItem.findById(id);
    if (!item) {
      if (req.xhr || req.headers.accept?.includes("json")) {
        return res.status(404).json({ success: false, message: "Item not found." });
      }
      return res.redirect("/admin/downloads/leaders-photo?error=Item not found.");
    }

    const itemCategory = item.category;
    const itemTitle = item.title;

    // Optional Cloudinary cleanup
    if (item.publicId) {
      try {
        await cloudinary.uploader.destroy(item.publicId);
      } catch (cloudDelErr) {
        console.warn("Cloudinary cleanup note:", cloudDelErr.message);
      }
    }

    await DownloadItem.findByIdAndDelete(id);

    await logAdminActivity(req, {
      section: "Downloads Management",
      action: "Deleted Download Item",
      details: `Deleted "${itemTitle}" from [${itemCategory}]`,
      actionType: "delete",
      sectionIcon: "fa-solid fa-cloud-arrow-down",
    });

    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.json({ success: true, message: "Item deleted successfully." });
    }

    return res.redirect(`/admin/downloads/${itemCategory}?success=Item deleted successfully.`);
  } catch (err) {
    console.error("Delete download error:", err);
    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.status(500).json({ success: false, message: "Delete error: " + err.message });
    }
    return res.redirect(`/admin/downloads/leaders-photo?error=Delete error: ${encodeURIComponent(err.message)}`);
  }
};

// Public API endpoint for Web / Mobile App
export const getDownloadsApi = async (req, res) => {
  try {
    const { category } = req.params;
    const filter = { isPublished: true };
    if (category && category !== "all") {
      filter.category = category;
    }

    const items = await DownloadItem.find(filter)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: items.length,
      category: category || "all",
      data: items,
    });
  } catch (err) {
    console.error("Downloads API error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Track / increment download count
export const trackDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await DownloadItem.findByIdAndUpdate(
      id,
      { $inc: { downloadsCount: 1 } },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    return res.json({
      success: true,
      downloadsCount: item.downloadsCount,
      downloadUrl: item.imageUrl,
    });
  } catch (err) {
    console.error("Track download error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
