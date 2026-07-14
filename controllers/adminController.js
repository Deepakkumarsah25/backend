import Admin from "../models/Admin.js";
import Banner from "../models/Banner.js";
import cloudinary from "../config/cloudinary.js";
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({
      email,
      password,
    });

    if (!admin) {
      return res.render("index", {
        error: "Invalid Email or Password",
      });
    }

    req.session.admin = admin;

    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
  }
};


export const dashboard = async (req, res) => {
  const banners = await Banner.find()
    .sort({ createdAt: -1 });

  res.render("dashboard", { banners });
};

export const addBanner = async (req, res) => {
  try {

    for (const file of req.files) {

      const result =
        await cloudinary.uploader.upload(
          file.path
        );

      await Banner.create({
        imageUrl: result.secure_url,
      });
    }

    res.redirect("/dashboard");

  } catch (error) {

    console.log(error);

    res.status(500).send("Upload Failed");
  }
};

export const deleteBanner = async (req, res) => {

  await Banner.findByIdAndDelete(
    req.params.id
  );

  res.redirect("/dashboard");
};

export const createAdmin = async (req, res) => {
  try {
    const adminExists = await Admin.findOne({
      email: "admin@vipparty.com",
    });

    if (adminExists) {
      return res.send("Admin Already Exists");
    }

    await Admin.create({
      email: "admin@vipparty.com",
      password: "123456",
    });

    res.send("Admin Created Successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error Creating Admin");
  }
};
