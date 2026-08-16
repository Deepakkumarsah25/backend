import { messaging } from "../firebase/firebaseAdmin.js";
import User from "../models/User.js";

export const sendPushNotification = async (
  title,
  body,
  data = {}
) => {
  try {
    // Get all users with valid FCM token
    const users = await User.find({
      notificationEnabled: true,
      fcmToken: {
        $exists: true,
        $ne: "",
      },
    });

    const tokens = users
      .map((user) => user.fcmToken)
      .filter(Boolean);

    if (tokens.length === 0) {
      console.log("❌ No FCM Tokens Found");
      return;
    }

    const message = {
      tokens,

      notification: {
        title,
        body,
      },

     android: {
  priority: "high",
  notification: {
    channelId: "vip-party",
    sound: "default",
  },
},

      data: Object.keys(data).reduce((obj, key) => {
        obj[key] = String(data[key]);
        return obj;
      }, {}),
    };

    const response = await messaging.sendEachForMulticast(message);

    console.log("=================================");
    console.log("FCM Response");
    console.log("=================================");
    console.log("Success :", response.successCount);
    console.log("Failure :", response.failureCount);

  response.responses.forEach(async (res, index) => {
  if (res.success) {
    console.log(`✅ Token ${index + 1}: Success`);
  } else {
    console.log(`❌ Token ${index + 1}:`, res.error);

    if (
      res.error?.code ===
      "messaging/registration-token-not-registered"
    ) {
      await User.updateOne(
        {
          fcmToken: tokens[index],
        },
        {
          $set: {
            fcmToken: "",
          },
        }
      );

      console.log("🗑 Invalid token removed");
    }
  }
});

    console.log("=================================");

    return response;
  } catch (error) {
    console.error("Push Notification Error:", error);
  }
};