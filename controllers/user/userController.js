import User from "../../models/User.js";

export const saveUser = async (req, res) => {
  try {
    const {
      uid,
      name,
      email,
      photoURL,
      provider,
      fcmToken,
    } = req.body;

    const user = await User.findOneAndUpdate(
      { uid },
      {
        uid,
        name,
        email,
        photoURL,
        provider,
        fcmToken,
        notificationEnabled: true,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json({
      success: true,
      user,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "User Save Failed",
    });
  }
};