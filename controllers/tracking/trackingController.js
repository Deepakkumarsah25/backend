import Tracking from "../../models/Tracking.js";
import Route from "../../models/Route.js";
import Worker from "../../models/Worker.js";

import {
  findNearbyWorkers
} from "../../services/routeMatchingService.js";

import {
  sendEmail
} from "../../services/emailService.js";

export const trackingPage = async (req, res) => {

  try {

    const route = await Route.findById(
      req.params.routeId
    );

    if (!route) {
      return res.send("Route Not Found");
    }

    res.render(
      "Tracking/track",
      {
        route
      }
    );

  } catch (error) {

    console.log(error);

    res.send("Tracking Page Error");

  }

};

export const updateTracking = async (req, res) => {

  try {

    console.log("TRACKING API HIT");
    console.log(req.body);

    const {
      routeId,
      driverId,
      lat,
      lng,
      speed
    } = req.body;

    // Save Tracking
    await Tracking.create({
      routeId,
      driverId,
      lat,
      lng,
      speed
    });

    // Update Route
    await Route.findByIdAndUpdate(
      routeId,
      {
        currentLat: lat,
        currentLng: lng,
        currentSpeed: speed,
        trackingEnabled: true
      }
    );

    console.log("Tracking Saved");
    console.log("Lat:", lat);
    console.log("Lng:", lng);
    console.log("Speed:", speed);

    // Find Nearby Workers
    const nearbyWorkers =
    await findNearbyWorkers(
      lat,
      lng,
      10   // km me change karne ke liye yaha change hoga
    );

    console.log(
      "Nearby Workers:",
      nearbyWorkers.length
    );

    // Email Alert Logic
    for (const worker of nearbyWorkers) {

      if (!worker.email) continue;

      const now = Date.now();

      const THIRTY_MINUTES =
      30 * 60 * 1000;

      const canSendEmail =

        !worker.lastAlertAt ||

        (
          now -
          new Date(
            worker.lastAlertAt
          ).getTime()
          >
          THIRTY_MINUTES
        );

      if (!canSendEmail) {

        console.log(
          "Skip Email:",
          worker.email
        );

        continue;

      }

      try {

        await sendEmail(
          worker.email,
          "🚗 VIP Party Vehicle Alert",
          `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<style>

body{
margin:0;
padding:0;
background:#f4f6f9;
font-family:Arial,sans-serif;
}

.container{
max-width:650px;
margin:20px auto;
background:#fff;
border-radius:15px;
overflow:hidden;
box-shadow:0 5px 25px rgba(0,0,0,.15);
}

.header{
background:linear-gradient(
135deg,
#0d6efd,
#003c99
);
color:white;
text-align:center;
padding:30px;
}

.content{
padding:30px;
}

.info-box{
background:#f8fafc;
padding:15px;
border-radius:10px;
margin-top:15px;
}

.btn{
display:inline-block;
padding:14px 24px;
background:#0d6efd;
color:white !important;
text-decoration:none;
border-radius:8px;
font-weight:bold;
margin-top:20px;
}

.footer{
background:#f1f5f9;
text-align:center;
padding:20px;
color:#666;
font-size:13px;
}

</style>

</head>

<body>

<div class="container">

<div class="header">

<h1>
  🚩 विकासशील इंसान पार्टी के सुप्रीमो । पूर्व मंत्री, बिहार सरकार | सन ऑफ मल्लाह | श्री मुकेश साहनी जी का वाहन आपके क्षेत्र में पहुँच चुका है
</h1>

<p>
  VIP Party का वाहन अब आपके क्षेत्र से 10 किलोमीटर के दायरे में है।
  कृपया आवश्यक तैयारी रखें और कार्यक्रम की जानकारी आसपास के लोगों तक पहुँचाएँ।
</p>

</div>

<div class="content">

<h2>
  नमस्कार ${worker.fullName} जी,
</h2>

<p>
  आपको सूचित किया जाता है कि <strong>VIP Party का वाहन</strong> आपके क्षेत्र के निकट पहुँच चुका है।
  कृपया आवश्यक सहयोग प्रदान करें तथा आसपास के लोगों को भी कार्यक्रम की जानकारी दें।
</p>

<p>
  आपके सहयोग और समर्थन के लिए धन्यवाद।
</p>

<p>
  <strong>VIP Party Team</strong>
</p>
<div class="info-box">

<p>
<strong>Speed:</strong>
${speed} km/h
</p>

<p>
<strong>Latitude:</strong>
${lat}
</p>

<p>
<strong>Longitude:</strong>
${lng}
</p>

<p>
<strong>Time:</strong>
${new Date().toLocaleString()}
</p>

</div>

<center>

<a
class="btn"
href="https://maps.google.com/?q=${lat},${lng}"
target="_blank"
>

📍 View Live Location

</a>

</center>

</div>

<div class="footer">

<p>
VIP Party Tracking System
</p>

<p>
This is an automated notification.
</p>

</div>

</div>

</body>

</html>
`
        );

        await Worker.findByIdAndUpdate(
          worker._id,
          {
            lastAlertAt:
            new Date()
          }
        );

        console.log(
          "Email Sent:",
          worker.email
        );

      } catch (emailError) {

        console.log(
          "Email Send Failed:",
          worker.email
        );

        console.log(
          emailError
        );

      }

    }

    res.json({
      success: true
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false
    });

  }

};