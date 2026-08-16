import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({

  name: String,

  phone: String,

  vehicleNumber: String,

  currentLat: Number,

  currentLng: Number,

  speed: Number

},{
  timestamps:true
});

export default mongoose.model(
  "Driver",
  driverSchema
);