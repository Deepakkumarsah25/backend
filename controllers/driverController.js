import Driver from "../models/Driver.js";
import { logAdminActivity } from "../services/activityService.js";

export const getDrivers = async (req,res)=>{

  const drivers = await Driver.find()
  .sort({createdAt:-1});

  res.render("Driver/addDriver",{
    drivers
  });

};

export const addDriver = async(req,res)=>{

  await Driver.create({

    name:req.body.name,

    phone:req.body.phone,

    vehicleNumber:req.body.vehicleNumber

  });

  await logAdminActivity(req, {
    section: "Transport (Driver)",
    action: "Added New Driver",
    details: `Driver: ${req.body.name || "Driver"} (Vehicle: ${req.body.vehicleNumber || "N/A"})`,
    actionType: "create",
    sectionIcon: "fa-solid fa-car",
  });

  res.redirect("/driver");

};


export const deleteDriver = async(req,res)=>{

  await Driver.findByIdAndDelete(
    req.params.id
  );

  await logAdminActivity(req, {
    section: "Transport (Driver)",
    action: "Deleted Driver",
    details: `Driver ID: ${req.params.id}`,
    actionType: "delete",
    sectionIcon: "fa-solid fa-car",
  });

  res.redirect("/driver");

};


export const getDriverList = async (req,res)=>{

  const drivers = await Driver.find()
  .sort({createdAt:-1});

  res.render(
    "Driver/driverList",
    { drivers }
  );

};