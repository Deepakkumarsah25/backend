import { messaging } from "../firebase/firebaseAdmin.js";
import User from "../models/User.js";

const stringifyData = (data = {}) =>
  Object.keys(data).reduce((obj, key) => {
    const value = data[key];
    if (value !== undefined && value !== null) obj[key] = String(value);
    return obj;
  }, {});

const buildMessage = ({ title, body, data = {}, token, tokens }) => ({
  ...(token ? { token } : { tokens }),
  notification: { title, body },
  android: {
    priority: "high",
    notification: {
      channelId: "vip-party",
      sound: "default",
    },
  },
  data: stringifyData(data),
});

// Targeted push: only one logged-in user/member.
export const sendPushNotificationToUser = async ({
  userId,
  title,
  body,
  data = {},
}) => {
  try {
    const user = await User.findById(userId).select(
      "fcmToken notificationEnabled"
    );

    if (!user?.notificationEnabled || !user?.fcmToken) {
      console.log("No enabled FCM token for user.");
      return null;
    }

    const response = await messaging.send(
      buildMessage({
        title,
        body,
        data,
        token: user.fcmToken,
      })
    );

    console.log("Targeted FCM sent.");
    return response;
  } catch (error) {
    console.error("Targeted push failed:", error?.code || "unknown error");

    if (
      error?.code === "messaging/registration-token-not-registered"
    ) {
      await User.findByIdAndUpdate(userId, { $set: { fcmToken: "" } });
    }

    return null;
  }
};

// General push: logged-in users that have registered an FCM token.
export const sendPushNotification = async (title, body, data = {}) => {
  try {
    const users = await User.find({
      notificationEnabled: true,
      fcmToken: { $exists: true, $ne: "" },
    }).select("fcmToken");

    const tokens = users.map((user) => user.fcmToken).filter(Boolean);

    if (!tokens.length) {
      console.log("❌ No FCM Tokens Found");
      return null;
    }

    const response = await messaging.sendEachForMulticast(
      buildMessage({ title, body, data, tokens })
    );

    console.log("=================================");
    console.log("FCM Response");
    console.log("Success:", response.successCount);
    console.log("Failure:", response.failureCount);

    const invalidTokens = [];
    response.responses.forEach((result, index) => {
      if (!result.success) {
        console.log(`Push delivery failed for recipient ${index + 1}:`, result.error?.code || "unknown error");
        if (
          result.error?.code ===
          "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length) {
      await User.updateMany(
        { fcmToken: { $in: invalidTokens } },
        { $set: { fcmToken: "" } }
      );
    }

    console.log("=================================");
    return response;
  } catch (error) {
    console.error("Push notification failed:", error?.code || "unknown error");
    return null;
  }
};
