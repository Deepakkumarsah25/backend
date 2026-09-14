import Worker from "../models/Worker.js";

/* =========================================================
   HAVERSINE DISTANCE
   Distance in KM
========================================================= */

const calculateDistanceKm = (
  lat1,
  lng1,
  lat2,
  lng2
) => {
  const toRadians = (value) =>
    (value * Math.PI) / 180;

  const R = 6371;

  const dLat =
    toRadians(lat2 - lat1);

  const dLng =
    toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +

    Math.cos(
      toRadians(lat1)
    ) *

    Math.cos(
      toRadians(lat2)
    ) *

    Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
};


/* =========================================================
   FIND NEARBY WORKERS
========================================================= */

export const findNearbyWorkers = async (
  vehicleLat,
  vehicleLng,
  radiusKm = 10
) => {
  try {

    /* =========================================
       VEHICLE COORDINATES
    ========================================= */

    const lat = Number(vehicleLat);
    const lng = Number(vehicleLng);
    const radius = Number(radiusKm);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      console.log(
        "NEARBY WORKER SEARCH: Invalid vehicle coordinates"
      );

      return [];
    }

    /* 0,0 ko invalid maanenge */
    if (
      lat === 0 &&
      lng === 0
    ) {
      console.log(
        "NEARBY WORKER SEARCH: Vehicle GPS is 0,0"
      );

      return [];
    }


    console.log(
      "=========================================="
    );

    console.log(
      "NEARBY WORKER SEARCH"
    );

    console.log(
      "Vehicle Latitude:",
      lat
    );

    console.log(
      "Vehicle Longitude:",
      lng
    );

    console.log(
      "Radius:",
      radius,
      "KM"
    );

    console.log(
      "=========================================="
    );


    /* =========================================
       GET ALL WORKERS

       IMPORTANT:
       Worker location nested hai:

       worker.location.lat
       worker.location.lng
    ========================================= */

    const workers =
      await Worker.find({})
        .lean();


    console.log(
      "Total Workers:",
      workers.length
    );


    /* =========================================
       CHECK WORKER LOCATIONS
    ========================================= */

    const workersWithLocation =
      workers.filter(
        (worker) => {

          const workerLat =
            Number(
              worker.location?.lat
            );

          const workerLng =
            Number(
              worker.location?.lng
            );

          const valid =
            Number.isFinite(workerLat) &&
            Number.isFinite(workerLng) &&
            !(
              workerLat === 0 &&
              workerLng === 0
            );

          if (!valid) {

            console.log(
              "WORKER LOCATION INVALID:",
              worker.fullName,
              worker.location
            );

          }

          return valid;
        }
      );


    console.log(
      "Workers with valid coordinates:",
      workersWithLocation.length
    );


    /* =========================================
       CALCULATE DISTANCE
    ========================================= */

    const nearbyWorkers =
      workersWithLocation
        .map(
          (worker) => {

            /* =====================================
               IMPORTANT:
               NESTED LOCATION SE READ KARNA HAI
            ===================================== */

            const workerLat =
              Number(
                worker.location?.lat
              );

            const workerLng =
              Number(
                worker.location?.lng
              );


            /* =====================================
               DISTANCE
            ===================================== */

            const distanceKm =
              calculateDistanceKm(
                lat,
                lng,
                workerLat,
                workerLng
              );


            return {

              ...worker,

              /* Frontend ke liye root lat/lng */
              lat:
                workerLat,

              lng:
                workerLng,

              /* Original nested location */
              location: {
                lat:
                  workerLat,

                lng:
                  workerLng,
              },

              distanceKm:
                Number(
                  distanceKm.toFixed(2)
                ),

            };
          }
        )

        /* =====================================
           ONLY WITHIN 10 KM
        ===================================== */

        .filter(
          (worker) =>
            worker.distanceKm <= radius
        )

        /* Nearest worker first */
        .sort(
          (a, b) =>
            a.distanceKm -
            b.distanceKm
        );


    /* =========================================
       LOG RESULT
    ========================================= */

    console.log(
      "Nearby Workers Found:",
      nearbyWorkers.length
    );


    nearbyWorkers.forEach(
      (worker) => {

        console.log(
          "Worker:",
          worker.fullName || "Worker",

          "| Worker Lat:",
          worker.lat,

          "| Worker Lng:",
          worker.lng,

          "| Distance:",
          worker.distanceKm,
          "KM",

          "| Email:",
          worker.email || "No Email"
        );

      }
    );


    console.log(
      "=========================================="
    );


    return nearbyWorkers;


  } catch (error) {

    console.error(
      "=========================================="
    );

    console.error(
      "NEARBY WORKER SEARCH ERROR"
    );

    console.error(
      error
    );

    console.error(
      "=========================================="
    );

    return [];
  }
};