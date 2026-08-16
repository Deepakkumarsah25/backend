import Route from "../../models/Route.js";
import Driver from "../../models/Driver.js";
import Notification from "../../models/Notification.js";
import { sendPushNotification } from "../../services/pushNotificationService.js";
// Route Form Page
export const getRoutePage = async (req, res) => {
  try {
    const routes = await Route.find()
.populate("driverId")
.sort({ createdAt: -1 });

const drivers = await Driver.find();

res.render("Route/routeRoads", {
  routes,
  drivers,
  geoApiKey: process.env.geoapify
});
  } catch (error) {
    console.log(error);
    res.send("Error Loading Routes");
  }
};

// Add Route
export const addRoute = async (req, res) => {
  try {

    let wayPoints = [];

    if (req.body.wayPoints) {
      wayPoints = req.body.wayPoints
        .split(",")
        .map(item => item.trim())
        .filter(item => item);
    }

const route = await Route.create({

  routeName: req.body.routeName,

  driverId: req.body.driverId,

  startLocation: req.body.startLocation,

  startLat: req.body.startLat,
  startLng: req.body.startLng,

  endLocation: req.body.endLocation,

  endLat: req.body.endLat,
  endLng: req.body.endLng,

  wayPoints,

  distanceKm: req.body.distanceKm,

  durationMin: req.body.durationMin,

});

await Notification.create({
  title: "New Route Added",
  message: `${route.routeName} route has been added.`,
  type: "route",
  routeId: route._id,
});

await sendPushNotification(
  "VIP Party",
  `${route.routeName} route has been added.`,
  {
    type: "route",
    routeId: route._id.toString(),
  }
);
    res.redirect("/route");

  } catch (error) {
    console.log(error);
    res.send("Route Add Failed");
  }
};
// Delete Route
export const deleteRoute = async (req, res) => {
  try {
    await Route.findByIdAndDelete(req.params.id);

    res.redirect("/route");
  } catch (error) {
    console.log(error);
    res.send("Delete Failed");
  }
};

export const sendRoute = async (req,res)=>{

  try{

    await Route.findByIdAndUpdate(
      req.params.id,
      {
        status:"Running"
      }
    );

    res.redirect("/route");

  }catch(error){

    console.log(error);

    res.send("Send Failed");

  }

};