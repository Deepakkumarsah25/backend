import mongoose from "mongoose";

const trackingSchema = new mongoose.Schema({

  routeId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Route"
  },

  driverId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Driver"
  },

  lat:Number,

  lng:Number,

  speed:Number

},{
  timestamps:true
});

export default mongoose.model(
  "Tracking",
  trackingSchema
);