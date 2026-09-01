import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import Scroller from "../models/Scroller.js";

/* =========================================
   Upload Images / Videos
========================================= */

export const addScrollerMedia = async (req, res) => {
  try {
    console.log("=================================");
    console.log("SCROLLER UPLOAD STARTED");
    console.log("Files:", req.files);
    console.log("=================================");

    if (!req.files || req.files.length === 0) {
      console.log("NO FILE RECEIVED");

      return res.status(400).send(`
        <script>
          alert("No file uploaded");
          window.location.href="/scroller";
        </script>
      `);
    }

    const savedMedia = [];

    for (const file of req.files) {
      try {
        console.log("Uploading file:", file.originalname);
        console.log("File path:", file.path);
        console.log("Mimetype:", file.mimetype);

        const isVideo = file.mimetype.startsWith("video");

        /* ===============================
           Upload to Cloudinary
        =============================== */

        const result = await cloudinary.uploader.upload(
          file.path,
          {
            folder: "ScrollerMedia",
            resource_type: isVideo ? "video" : "image",
          }
        );

        console.log("Cloudinary Upload Success:");
        console.log(result.secure_url);

        /* ===============================
           Save MongoDB
        =============================== */

        const media = await Scroller.create({
          type: isVideo ? "video" : "image",

          mediaUrl: result.secure_url,

          publicId: result.public_id,

          originalName: file.originalname,

          fileSize: file.size,

          active: true,

          displayOrder: 0,
        });

        savedMedia.push(media);

        /* ===============================
           Delete Temporary File
        =============================== */

        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        console.log(
          "Temporary file deleted:",
          file.path
        );
      } catch (fileError) {
        console.log(
          "INDIVIDUAL FILE UPLOAD ERROR:",
          fileError
        );

        if (
          file.path &&
          fs.existsSync(file.path)
        ) {
          fs.unlinkSync(file.path);
        }

        throw fileError;
      }
    }

    console.log(
      "TOTAL MEDIA SAVED:",
      savedMedia.length
    );

    return res.redirect("/scroller");
  } catch (error) {
    console.log(
      "================================="
    );
    console.log("SCROLLER UPLOAD ERROR:");
    console.log(error);
    console.log(
      "================================="
    );

    return res.status(500).send(`
      <script>
        alert("Upload Failed: ${String(
          error.message
        ).replace(/'/g, "\\'")}");
        window.location.href="/scroller";
      </script>
    `);
  }
};

/* =========================================
   Get All Media
========================================= */

export const scrollerPage = async (req, res) => {
  try {
    const media = await Scroller.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });

    res.render(
      "updateScrollerSection/Scroller",
      {
        media,
      }
    );
  } catch (error) {
    console.log(
      "SCROLLER PAGE ERROR:",
      error
    );

    res.render(
      "updateScrollerSection/Scroller",
      {
        media: [],
      }
    );
  }
};

/* =========================================
   React Native API
========================================= */
/* =========================================
   React Native API
========================================= */

export const getScrollerApi = async (req, res) => {
  try {
    const media = await Scroller.find({
      active: true,
    }).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    // IMPORTANT:
    // React Native app direct array expect kar rahi hai
    return res.status(200).json(media);

  } catch (error) {
    console.log(
      "SCROLLER API ERROR:",
      error
    );

    return res.status(500).json([]);
  }
};
/* =========================================
   Delete Media
========================================= */

export const deleteScrollerMedia = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    console.log(
      "DELETE SCROLLER ID:",
      id
    );

    const media =
      await Scroller.findById(id);

    if (!media) {
      return res.status(404).send(
        "Media Not Found"
      );
    }

    console.log(
      "Deleting Cloudinary:",
      media.publicId
    );

    /* ===============================
       Delete from Cloudinary
    =============================== */

    if (media.publicId) {
      await cloudinary.uploader.destroy(
        media.publicId,
        {
          resource_type:
            media.type === "video"
              ? "video"
              : "image",
        }
      );
    }

    /* ===============================
       Delete from MongoDB
    =============================== */

    await Scroller.findByIdAndDelete(id);

    console.log(
      "Media Deleted Successfully"
    );

    return res.redirect("/scroller");
  } catch (error) {
    console.log(
      "DELETE SCROLLER ERROR:",
      error
    );

    return res.status(500).send(
      error.message
    );
  }
};

/* =========================================
   Change Status
========================================= */

export const toggleScrollerStatus = async (
  req,
  res
) => {
  try {
    const media =
      await Scroller.findById(
        req.params.id
      );

    if (!media) {
      return res.status(404).send(
        "Media Not Found"
      );
    }

    media.active = !media.active;

    await media.save();

    return res.redirect(
      "/scroller"
    );
  } catch (error) {
    console.log(
      "STATUS ERROR:",
      error
    );

    return res.status(500).send(
      error.message
    );
  }
};

/* =========================================
   Update Display Order
========================================= */

export const updateDisplayOrder = async (
  req,
  res
) => {
  try {
    const { displayOrder } =
      req.body;

    await Scroller.findByIdAndUpdate(
      req.params.id,
      {
        displayOrder:
          Number(displayOrder) || 0,
      }
    );

    return res.redirect(
      "/scroller"
    );
  } catch (error) {
    console.log(
      "ORDER UPDATE ERROR:",
      error
    );

    return res.status(500).send(
      error.message
    );
  }
};