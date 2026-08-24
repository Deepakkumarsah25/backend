import Worker from "../models/Worker.js";

function distanceKm(lat1,lng1,lat2,lng2){

  const R = 6371;

  const dLat =
  (lat2-lat1) * Math.PI/180;

  const dLng =
  (lng2-lng1) * Math.PI/180;

  const a =
  Math.sin(dLat/2)**2 +
  Math.cos(lat1*Math.PI/180) *
  Math.cos(lat2*Math.PI/180) *
  Math.sin(dLng/2)**2;

  return R * (
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1-a)
    )
  );
}

export const findNearbyWorkers =
async(lat,lng,radius=10)=>{

  const workers =
  await Worker.find();

  return workers.filter(worker=>{

    if(!worker.location) return false;

    const km =
    distanceKm(
      lat,
      lng,
      worker.location.lat,
      worker.location.lng
    );

    return km <= radius;
  });

};