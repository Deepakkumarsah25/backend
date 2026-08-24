import Tracking from "../models/Tracking.js";
import Driver from "../models/Driver.js";

export const updateDriverLocation = async ({
  routeId,
  driverId,
  lat,
  lng,
  speed
}) => {

  await Tracking.create({
    routeId,
    driverId,
    lat,
    lng,
    speed
  });

  await Driver.findByIdAndUpdate(
    driverId,
    {
      currentLat: lat,
      currentLng: lng,
      speed
    }
  );

};