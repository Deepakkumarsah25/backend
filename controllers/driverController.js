import Driver from "../models/Driver.js";

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

  res.redirect("/driver");

};


export const deleteDriver = async(req,res)=>{

  await Driver.findByIdAndDelete(
    req.params.id
  );

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