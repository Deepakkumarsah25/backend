import Worker from "../models/Worker.js";
import cloudinary from "../config/cloudinary.js";
export const addWorker = async (req, res) => {
  try {
    let photoUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      photoUrl = result.secure_url;
    }

    await Worker.create({
      fullName: req.body.fullName,
      phone: req.body.phone,
      state: req.body.state,
      district: req.body.district,
      village: req.body.village,
      wardNo: req.body.wardNo,
      address: req.body.address,
      photo: photoUrl,
    });

    res.redirect("/workerlist");

  } catch (error) {

    if (error.code === 11000) {
      return res.send("Phone Number Already Exists");
    }

    console.log(error);
    res.send("Worker Add Failed");
  }
};
export const getWorkers = async (req, res) => {

  const workers = await Worker.find()
    .sort({ createdAt: -1 });

  res.render("AddWorker/mamber", {
    workers,
  });
};

export const deleteWorker = async (req, res) => {

  await Worker.findByIdAndDelete(
    req.params.id
  );

  res.redirect("/member");
};