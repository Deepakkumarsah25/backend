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

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "UID is required",
      });
    }

    const existingUser = await User.findOne({ uid });

    // ==========================================
    // USER LOGGED IN DURING DELETION PERIOD
    // ==========================================
    if (
      existingUser &&
      existingUser.deletionRequested
    ) {
      existingUser.deletionRequested = false;
      existingUser.deletionDate = null;

      existingUser.lastLogin = new Date();

      existingUser.name = name ?? existingUser.name;
      existingUser.email = email ?? existingUser.email;
      existingUser.photoURL =
        photoURL ?? existingUser.photoURL;
      existingUser.provider =
        provider ?? existingUser.provider;
      existingUser.fcmToken =
        fcmToken ?? existingUser.fcmToken;

      await existingUser.save();

      return res.json({
        success: true,
        deletionCancelled: true,
        message:
          "Account deletion cancelled because you logged in.",
        user: existingUser,
      });
    }

    // ==========================================
    // NORMAL LOGIN / SAVE
    // ==========================================
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
        lastLogin: new Date(),
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json({
      success: true,
      deletionCancelled: false,
      user,
    });

  } catch (error) {
    console.error("USER SAVE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "User Save Failed",
    });
  }
};