import mongoose from "mongoose";
import Worker from "../models/Worker.js";
import cloudinary from "../config/cloudinary.js";

/* =========================================================
   ADD WORKER
========================================================= */

export const addWorker = async (req, res) => {
  try {
    let photoUrl = "";

    /* =========================================
       UPLOAD PHOTO
    ========================================= */

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        req.file.path
      );

      photoUrl = result.secure_url;
    }

    /* =========================================
       WORKER LOCATION
    ========================================= */

    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);

    const validLat = Number.isFinite(lat)
      ? lat
      : null;

    const validLng = Number.isFinite(lng)
      ? lng
      : null;

    console.log(
      "======================================"
    );

    console.log(
      "ADDING WORKER"
    );

    console.log(
      "Name:",
      req.body.fullName
    );

    console.log(
      "Email:",
      req.body.email
    );

    console.log(
      "Latitude:",
      validLat
    );

    console.log(
      "Longitude:",
      validLng
    );

    console.log(
      "======================================"
    );

    /* =========================================
       CREATE WORKER
    ========================================= */

    const worker = await Worker.create({
      fullName:
        req.body.fullName,

      phone:
        req.body.phone,

      email:
        req.body.email,

      state:
        req.body.state,

      district:
        req.body.district,

      village:
        req.body.village,

      wardNo:
        req.body.wardNo,

      photo:
        photoUrl,

      location: {
        lat:
          validLat,

        lng:
          validLng,
      },

      status:
        "Active",
    });

    console.log(
      "WORKER CREATED:"
    );

    console.log(
      "Worker ID:",
      worker._id
    );

    console.log(
      "Saved Location:",
      worker.location
    );

    return res.redirect(
      "/workerlist"
    );

  } catch (error) {

    /* =========================================
       DUPLICATE PHONE
    ========================================= */

    if (error.code === 11000) {
      return res.status(409).send(
        "Phone Number Already Exists"
      );
    }

    console.error(
      "======================================"
    );

    console.error(
      "WORKER ADD ERROR"
    );

    console.error(
      error
    );

    console.error(
      "======================================"
    );

    return res
      .status(500)
      .send(
        "Worker Add Failed"
      );
  }
};


/* =========================================================
   GET WORKERS
========================================================= */

export const getWorkers = async (
  req,
  res
) => {
  try {

    const workers =
      await Worker.find()
        .sort({
          createdAt: -1,
        });

    return res.render(
      "AddWorker/mamber",
      {
        workers,
        geoApiKey:
          process.env.geoapify,
        editMode: false,
        worker: null,
      }
    );

  } catch (error) {

    console.error(
      "GET WORKERS ERROR:",
      error
    );

    return res
      .status(500)
      .send(
        "Worker List Failed"
      );
  }
};


/* =========================================================
   GET WORKER LIST
========================================================= */

export const getWorkerList = async (
  req,
  res
) => {
  try {

    const workers =
      await Worker.find()
        .sort({
          createdAt: -1,
        });

    return res.render(
      "AddWorker/workerlist",
      {
        workers,
      }
    );

  } catch (error) {

    console.error(
      "GET WORKER LIST ERROR:",
      error
    );

    return res
      .status(500)
      .send(
        "Error loading workers"
      );
  }
};


/* =========================================================
   GET SINGLE WORKER FOR EDIT
========================================================= */

export const getWorkerForEdit = async (
  req,
  res
) => {
  try {

    const workerId =
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        workerId
      )
    ) {
      return res
        .status(400)
        .send(
          "Invalid Worker ID"
        );
    }

    const worker =
      await Worker.findById(
        workerId
      );

    if (!worker) {
      return res
        .status(404)
        .send(
          "Worker Not Found"
        );
    }

    return res.render(
      "AddWorker/mamber",
      {
        workers: [],
        worker,
        editMode: true,
        geoApiKey:
          process.env.geoapify,
      }
    );

  } catch (error) {

    console.error(
      "GET WORKER EDIT ERROR:",
      error
    );

    return res
      .status(500)
      .send(
        "Worker Edit Page Failed"
      );
  }
};


/* =========================================================
   UPDATE WORKER
========================================================= */

export const updateWorker = async (
  req,
  res
) => {
  try {

    const workerId =
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        workerId
      )
    ) {
      return res
        .status(400)
        .send(
          "Invalid Worker ID"
        );
    }

    const worker =
      await Worker.findById(
        workerId
      );

    if (!worker) {
      return res
        .status(404)
        .send(
          "Worker Not Found"
        );
    }

    /* =========================================
       BASIC DATA
    ========================================= */

    worker.fullName =
      req.body.fullName;

    worker.phone =
      req.body.phone;

    worker.email =
      req.body.email;

    worker.state =
      req.body.state;

    worker.district =
      req.body.district;

    worker.village =
      req.body.village;

    worker.wardNo =
      req.body.wardNo;

    /* =========================================
       STATUS
    ========================================= */

    worker.status =
      req.body.status ||
      worker.status ||
      "Active";

    /* =========================================
       LOCATION
    ========================================= */

    const lat =
      Number(req.body.lat);

    const lng =
      Number(req.body.lng);

    if (Number.isFinite(lat)) {
      worker.location.lat =
        lat;
    }

    if (Number.isFinite(lng)) {
      worker.location.lng =
        lng;
    }

    /* =========================================
       PHOTO
    ========================================= */

    if (req.file) {

      const result =
        await cloudinary.uploader.upload(
          req.file.path
        );

      worker.photo =
        result.secure_url;
    }

    await worker.save();

    console.log(
      "======================================"
    );

    console.log(
      "WORKER UPDATED"
    );

    console.log(
      "Worker ID:",
      worker._id
    );

    console.log(
      "Worker Name:",
      worker.fullName
    );

    console.log(
      "Location:",
      worker.location
    );

    console.log(
      "======================================"
    );

    return res.redirect(
      "/workerlist"
    );

  } catch (error) {

    if (
      error.code === 11000
    ) {

      return res.status(409).send(
        "Phone Number Already Exists"
      );
    }

    console.error(
      "UPDATE WORKER ERROR:",
      error
    );

    return res
      .status(500)
      .send(
        "Worker Update Failed"
      );
  }
};


/* =========================================================
   DELETE WORKER
========================================================= */

export const deleteWorker = async (
  req,
  res
) => {
  try {

    const workerId =
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        workerId
      )
    ) {
      return res
        .status(400)
        .send(
          "Invalid Worker ID"
        );
    }

    const worker =
      await Worker.findById(
        workerId
      );

    if (!worker) {
      return res
        .status(404)
        .send(
          "Worker Not Found"
        );
    }

    await Worker.findByIdAndDelete(
      workerId
    );

    console.log(
      "WORKER DELETED:",
      workerId
    );

    return res.redirect(
      "/workerlist"
    );

  } catch (error) {

    console.error(
      "DELETE WORKER ERROR:",
      error
    );

    return res
      .status(500)
      .send(
        "Worker Delete Failed"
      );
  }
};