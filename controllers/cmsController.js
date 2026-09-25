import CmsPage from "../models/CmsPage.js";
import cloudinary from "../config/cloudinary.js";


// ======================================================
// CLOUDINARY BUFFER UPLOAD HELPER
// ======================================================
const uploadBufferToCloudinary = (
  buffer,
  folder = "cms"
) => {
  return new Promise(
    (resolve, reject) => {

      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
          },
          (error, result) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(result);
          }
        );

      uploadStream.end(buffer);
    }
  );
};


// ======================================================
// CMS PAGE LIST - ADMIN
// ======================================================
export const getCmsPages = async (
  req,
  res
) => {
  try {

    const pages =
      await CmsPage.find().sort({
        createdAt: -1,
      });

    res.render("cms/index", {
      pages,
    });

  } catch (error) {

    console.log(
      "CMS PAGES ERROR:",
      error
    );

    res.status(500).send(
      "Error loading CMS pages"
    );
  }
};


// ======================================================
// SINGLE CMS PAGE - ADMIN
// ======================================================
export const getCmsPage = async (
  req,
  res
) => {
  try {

    const { pageKey } =
      req.params;

    let page =
      await CmsPage.findOne({
        pageKey,
      });

    if (!page) {

      page =
        await CmsPage.create({
          pageKey,
          title: "",
          introText: "",
          bannerImage: "",
          sections: [],
        });

    }

    res.render(
      "cms/edit-page",
      {
        page,
      }
    );

  } catch (error) {

    console.log(
      "CMS PAGE EDIT ERROR:",
      error
    );

    res.status(500).send(
      "Error loading CMS page"
    );
  }
};


// ======================================================
// CMS PAGE API - MOBILE APP
// GET /cms/api/:pageKey
// ======================================================
export const getCmsPageApi = async (
  req,
  res
) => {
  try {

    const { pageKey } =
      req.params;

    console.log(
      "========================================"
    );

    console.log(
      "CMS API REQUEST"
    );

    console.log(
      "PAGE KEY:",
      pageKey
    );

    const page =
      await CmsPage.findOne({
        pageKey,
      }).lean();

    if (!page) {

      console.log(
        "CMS PAGE NOT FOUND:",
        pageKey
      );

      return res.status(404).json({
        success: false,
        message:
          "CMS page not found",
      });
    }

    console.log(
      "CMS PAGE FOUND:",
      page.pageKey
    );

    console.log(
      "CMS TITLE:",
      page.title
    );

    console.log(
      "CMS SECTIONS:",
      page.sections?.length || 0
    );

    console.log(
      "========================================"
    );

    return res.status(200).json({
      success: true,
      data: page,
    });

  } catch (error) {

    console.log(
      "CMS API ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load CMS page",
    });
  }
};


// ======================================================
// UPDATE PAGE INFORMATION
// POST /cms/:pageKey/update
// ======================================================
export const updateCmsPage = async (
  req,
  res
) => {
  try {

    const { pageKey } =
      req.params;

    const {
      title,
      introText,
    } = req.body;

    console.log(
      "========================================"
    );

    console.log(
      "CMS PAGE UPDATE"
    );

    console.log(
      "PAGE KEY:",
      pageKey
    );

    console.log(
      "TITLE:",
      title
    );

    console.log(
      "INTRO TEXT:",
      introText
    );

    const page =
      await CmsPage.findOneAndUpdate(
        {
          pageKey,
        },
        {
          $set: {
            title:
              title || "",

            introText:
              introText || "",
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    console.log(
      "PAGE UPDATED:",
      page
    );

    console.log(
      "========================================"
    );

    return res.redirect(
      `/cms/${pageKey}`
    );

  } catch (error) {

    console.log(
      "CMS PAGE UPDATE ERROR:",
      error
    );

    return res.status(500).send(
      "Update failed: " +
        error.message
    );
  }
};


// ======================================================
// ADD SECTION
// POST /cms/:pageKey/section/add
// ======================================================
export const addSection = async (
  req,
  res
) => {
  try {

    const { pageKey } =
      req.params;

    console.log(
      "========================================"
    );

    console.log(
      "CMS ADD SECTION"
    );

    console.log(
      "PAGE KEY:",
      pageKey
    );

    console.log(
      "BODY:",
      req.body
    );

    console.log(
      "FILE:",
      req.file
    );

    const page =
      await CmsPage.findOne({
        pageKey,
      });

    if (!page) {

      console.log(
        "PAGE NOT FOUND:",
        pageKey
      );

      return res.redirect(
        "/cms"
      );
    }

    let imageUrl = "";


    // ------------------------------------------
    // Upload image
    // ------------------------------------------

    if (req.file) {

      console.log(
        "Uploading section image..."
      );

      const result =
        await uploadBufferToCloudinary(
          req.file.buffer,
          "cms/sections"
        );

      imageUrl =
        result.secure_url;

      console.log(
        "SECTION IMAGE URL:",
        imageUrl
      );
    }


    // ------------------------------------------
    // Add section
    // ------------------------------------------

    page.sections.push({

      heading:
        req.body.heading || "",

      description:
        req.body.description || "",

      image:
        imageUrl,

      order:
        req.body.order !== undefined &&
        req.body.order !== ""
          ? Number(req.body.order)
          : 0,

    });


    await page.save();


    console.log(
      "SECTION ADDED SUCCESSFULLY"
    );

    console.log(
      "========================================"
    );

    return res.redirect(
      `/cms/${pageKey}`
    );

  } catch (error) {

    console.log(
      "SECTION ADD ERROR:",
      error
    );

    return res.status(500).send(
      "Section Add Failed: " +
        error.message
    );
  }
};


// ======================================================
// EDIT SECTION
// POST /cms/:pageKey/section/edit/:sectionId
// ======================================================
export const editSection = async (
  req,
  res
) => {
  try {

    const {
      pageKey,
      sectionId,
    } = req.params;

    console.log(
      "========================================"
    );

    console.log(
      "CMS SECTION EDIT"
    );

    console.log(
      "PAGE KEY:",
      pageKey
    );

    console.log(
      "SECTION ID:",
      sectionId
    );

    console.log(
      "BODY:",
      req.body
    );

    console.log(
      "FILE:",
      req.file
    );


    // ------------------------------------------
    // Find page
    // ------------------------------------------

    const page =
      await CmsPage.findOne({
        pageKey,
      });

    if (!page) {

      console.log(
        "PAGE NOT FOUND:",
        pageKey
      );

      return res.redirect(
        "/cms"
      );
    }


    // ------------------------------------------
    // Find section
    // ------------------------------------------

    const section =
      page.sections.id(
        sectionId
      );

    if (!section) {

      console.log(
        "SECTION NOT FOUND:",
        sectionId
      );

      return res.redirect(
        `/cms/${pageKey}`
      );
    }


    // ------------------------------------------
    // Update heading
    // ------------------------------------------

    section.heading =
      req.body.heading || "";


    // ------------------------------------------
    // Update description
    // ------------------------------------------

    section.description =
      req.body.description || "";


    // ------------------------------------------
    // Update order
    // ------------------------------------------

    section.order =
      req.body.order !== undefined &&
      req.body.order !== ""
        ? Number(req.body.order)
        : 0;


    // ------------------------------------------
    // Upload new image
    // ------------------------------------------

    if (
      req.file &&
      req.file.buffer
    ) {

      console.log(
        "Uploading new section image..."
      );

      const result =
        await uploadBufferToCloudinary(
          req.file.buffer,
          "cms/sections"
        );

      section.image =
        result.secure_url;

      console.log(
        "NEW SECTION IMAGE:",
        section.image
      );
    }


    // ------------------------------------------
    // Save
    // ------------------------------------------

    await page.save();


    console.log(
      "SECTION UPDATED SUCCESSFULLY"
    );

    console.log(
      "UPDATED SECTION:",
      section
    );

    console.log(
      "========================================"
    );

    return res.redirect(
      `/cms/${pageKey}`
    );

  } catch (error) {

    console.log(
      "SECTION EDIT ERROR:",
      error
    );

    return res.status(500).send(
      "Edit Section Failed: " +
        error.message
    );
  }
};


// ======================================================
// DELETE SECTION
// GET /cms/:pageKey/section/delete/:sectionId
// ======================================================
export const deleteSection = async (
  req,
  res
) => {
  try {

    const {
      pageKey,
      sectionId,
    } = req.params;

    console.log(
      "========================================"
    );

    console.log(
      "CMS DELETE SECTION"
    );

    console.log(
      "PAGE KEY:",
      pageKey
    );

    console.log(
      "SECTION ID:",
      sectionId
    );


    const page =
      await CmsPage.findOne({
        pageKey,
      });

    if (!page) {

      return res.redirect(
        "/cms"
      );
    }


    const section =
      page.sections.id(
        sectionId
      );

    if (!section) {

      return res.redirect(
        `/cms/${pageKey}`
      );
    }


    section.deleteOne();

    await page.save();


    console.log(
      "SECTION DELETED SUCCESSFULLY"
    );

    console.log(
      "========================================"
    );

    return res.redirect(
      `/cms/${pageKey}`
    );

  } catch (error) {

    console.log(
      "SECTION DELETE ERROR:",
      error
    );

    return res.status(500).send(
      "Delete Failed: " +
        error.message
    );
  }
};


// ======================================================
// UPLOAD BANNER
// POST /cms/:pageKey/banner/upload
// ======================================================
export const uploadBanner = async (
  req,
  res
) => {
  try {

    const { pageKey } =
      req.params;

    console.log(
      "========================================"
    );

    console.log(
      "CMS BANNER UPLOAD"
    );

    console.log(
      "PAGE KEY:",
      pageKey
    );

    console.log(
      "FILE:",
      req.file
    );


    if (
      !req.file ||
      !req.file.buffer
    ) {

      console.log(
        "NO BANNER FILE"
      );

      return res.redirect(
        `/cms/${pageKey}`
      );
    }


    // ------------------------------------------
    // Upload buffer to Cloudinary
    // ------------------------------------------

    const result =
      await uploadBufferToCloudinary(
        req.file.buffer,
        "cms/banners"
      );


    console.log(
      "BANNER URL:",
      result.secure_url
    );


    // ------------------------------------------
    // Save banner URL
    // ------------------------------------------

    await CmsPage.findOneAndUpdate(
      {
        pageKey,
      },
      {
        $set: {
          bannerImage:
            result.secure_url,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );


    console.log(
      "BANNER UPDATED SUCCESSFULLY"
    );

    console.log(
      "========================================"
    );


    return res.redirect(
      `/cms/${pageKey}`
    );

  } catch (error) {

    console.log(
      "BANNER UPLOAD ERROR:",
      error
    );

    return res.status(500).send(
      "Banner Upload Failed: " +
        error.message
    );
  }
};