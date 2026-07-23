import CmsPage from "../models/CmsPage.js";
import cloudinary from "../config/cloudinary.js";

// CMS page list
export const getCmsPages = async (req, res) => {
  try {
    const pages = await CmsPage.find().sort({ createdAt: -1 });

    res.render("cms/index", {
      pages,
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading CMS pages");
  }
};

// Single CMS page edit screen
export const getCmsPage = async (req, res) => {
  try {
    const { pageKey } = req.params;

    let page = await CmsPage.findOne({
      pageKey,
    });

    if (!page) {
      page = await CmsPage.create({
        pageKey,
      });
    }

    res.render("cms/edit-page", {
      page,
    });
  } catch (error) {
    console.log(error);
    res.send("Error");
  }
};

// Update page
export const updateCmsPage = async (req, res) => {
  try {
    const { pageKey } = req.params;

    const {
      title,
      introText,
      bannerImage,
    } = req.body;

    await CmsPage.findOneAndUpdate(
      {
        pageKey,
      },
      {
        title,
        introText,
        bannerImage,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.redirect(`/cms/${pageKey}`);
  } catch (error) {
    console.log(error);
    res.send("Update failed");
  }
};

// Add Section
export const addSection = async (req, res) => {
  try {
    const { pageKey } = req.params;

    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        req.file.path
      );

      imageUrl = result.secure_url;
    }

    const page = await CmsPage.findOne({
      pageKey,
    });

    if (!page) {
      return res.redirect(`/cms/${pageKey}`);
    }

    page.sections.push({
      heading: req.body.heading,
      description: req.body.description,
      image: imageUrl,
      order: req.body.order || 0,
    });

    await page.save();

    res.redirect(`/cms/${pageKey}`);
  } catch (error) {
    console.log(error);
    res.send("Section Add Failed");
  }
};

// Delete Section
export const deleteSection = async (req, res) => {
  try {
    const { pageKey, sectionId } = req.params;

    const page = await CmsPage.findOne({
      pageKey,
    });

    if (!page) {
      return res.redirect("/cms");
    }

    page.sections = page.sections.filter(
      (section) =>
        section._id.toString() !== sectionId
    );

    await page.save();

    res.redirect(`/cms/${pageKey}`);
  } catch (error) {
    console.log(error);
    res.send("Delete Failed");
  }
};

// Upload Banner
export const uploadBanner = async (
  req,
  res
) => {
  try {

    const { pageKey } = req.params;

    if (!req.file) {
      return res.redirect(
        `/cms/${pageKey}`
      );
    }

    const result =
      await cloudinary.uploader.upload(
        req.file.path
      );

    await CmsPage.findOneAndUpdate(
      {
        pageKey,
      },
      {
        bannerImage:
          result.secure_url,
      },
      {
        upsert: true,
      }
    );

    res.redirect(
      `/cms/${pageKey}`
    );

  } catch (error) {

    console.log(error);

    res.send(
      "Banner Upload Failed"
    );
  }
};

export const editSection = async (req, res) => {
  try {

    const { pageKey, sectionId } = req.params;

    const page = await CmsPage.findOne({
      pageKey,
    });

    if (!page) {
      return res.redirect("/cms");
    }

    const section =
      page.sections.id(sectionId);

    if (!section) {
      return res.redirect(
        `/cms/${pageKey}`
      );
    }

    section.heading =
      req.body.heading;

    section.description =
      req.body.description;

    section.order =
      req.body.order || 0;

    if (req.file) {

      const result =
        await cloudinary.uploader.upload(
          req.file.path
        );

      section.image =
        result.secure_url;
    }

    await page.save();

    res.redirect(
      `/cms/${pageKey}`
    );

  } catch (error) {

    console.log(error);

    res.send(
      "Edit Section Failed"
    );
  }
};