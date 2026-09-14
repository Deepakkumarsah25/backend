import User from "../../models/User.js";

import {
  getApps,
  initializeApp,
  cert,
} from "firebase-admin/app";

import {
  getAuth,
} from "firebase-admin/auth";


// =====================================================
// FIREBASE ADMIN INITIALIZATION
// =====================================================

let firebaseApp;

try {
  const apps = getApps();

  if (apps.length > 0) {
    firebaseApp = apps[0];
  } else {

    let privateKey =
      process.env.FIREBASE_PRIVATE_KEY || "";

    privateKey = privateKey.replace(
      /\\n/g,
      "\n"
    );

    firebaseApp = initializeApp({
      credential: cert({
        projectId:
          process.env.FIREBASE_PROJECT_ID,

        clientEmail:
          process.env.FIREBASE_CLIENT_EMAIL,

        privateKey,
      }),
    });
  }

  console.log(
    "Firebase Admin initialized for Delete Account"
  );

} catch (error) {

  console.error(
    "Firebase Admin initialization error:",
    error.message
  );
}


// =====================================================
// GET DELETE ACCOUNT REQUESTS
// =====================================================

export const renderDeleteAccountPage = async (
  req,
  res
) => {

  try {

    console.log(
      "================================="
    );

    console.log(
      "OPEN DELETE ACCOUNT PAGE"
    );

    console.log(
      "================================="
    );


    const deletionRequests =
      await User.find({
        deletionRequested: true,
      }).sort({
        deletionDate: 1,
      });


    console.log(
      "Pending deletion requests:",
      deletionRequests.length
    );


    return res.render(
      "DeleteAccount/DeleteAccountUser",
      {
        deletionRequests,
      }
    );

  } catch (error) {

    console.error(
      "DELETE ACCOUNT PAGE ERROR:",
      error
    );


    return res.status(500).send(
      `
      <h2>Delete Account Page Error</h2>
      <pre>${error.message}</pre>
      `
    );
  }
};


// =====================================================
// ADMIN DELETE ACCOUNT NOW
// =====================================================

export const adminDeleteAccount = async (
  req,
  res
) => {

  try {

    const { id } = req.params;


    console.log(
      "================================="
    );

    console.log(
      "ADMIN DELETE ACCOUNT"
    );

    console.log(
      "Mongo ID:",
      id
    );

    console.log(
      "================================="
    );


    if (!id) {

      return res.status(400).send(
        "User ID is required"
      );
    }


    const user =
      await User.findById(id);


    if (!user) {

      return res.status(404).send(
        "User not found"
      );
    }


    console.log(
      "User:",
      user.name
    );

    console.log(
      "Email:",
      user.email
    );

    console.log(
      "Firebase UID:",
      user.uid
    );


    // =================================================
    // DELETE FIREBASE AUTH USER
    // =================================================

    try {

      const auth =
        getAuth(firebaseApp);


      await auth.deleteUser(
        user.uid
      );


      console.log(
        "Firebase Auth user deleted:",
        user.uid
      );

    } catch (firebaseError) {

      console.error(
        "Firebase delete error:",
        firebaseError
      );


      // Firebase user already deleted
      if (
        firebaseError?.code ===
        "auth/user-not-found"
      ) {

        console.log(
          "Firebase user was already deleted."
        );

      } else {

        return res.status(500).send(
          `
          <h2>Firebase Account Delete Failed</h2>
          <pre>${firebaseError.message}</pre>
          `
        );
      }
    }


    // =================================================
    // DELETE MONGODB USER
    // =================================================

    await User.deleteOne({
      _id: user._id,
    });


    console.log(
      "MongoDB user deleted:",
      user.email
    );


    console.log(
      "ACCOUNT DELETE COMPLETE"
    );


    return res.redirect(
      "/admin/delete-accounts"
    );

  } catch (error) {

    console.error(
      "ADMIN DELETE ACCOUNT ERROR:",
      error
    );


    return res.status(500).send(
      `
      <h2>Account Deletion Failed</h2>
      <pre>${error.message}</pre>
      `
    );
  }
};


// =====================================================
// ADMIN CANCEL DELETE REQUEST
// =====================================================

export const adminCancelDeleteAccount =
  async (req, res) => {

    try {

      const { id } = req.params;


      console.log(
        "================================="
      );

      console.log(
        "ADMIN CANCEL DELETE REQUEST"
      );

      console.log(
        "Mongo ID:",
        id
      );

      console.log(
        "================================="
      );


      if (!id) {

        return res.status(400).send(
          "User ID is required"
        );
      }


      const user =
        await User.findById(id);


      if (!user) {

        return res.status(404).send(
          "User not found"
        );
      }


      user.deletionRequested =
        false;

      user.deletionDate =
        null;

      user.deleteOtp =
        "";

      user.deleteOtpExpiry =
        null;


      await user.save();


      console.log(
        "Deletion request cancelled:"
      );

      console.log(
        user.email
      );


      return res.redirect(
        "/admin/delete-accounts"
      );

    } catch (error) {

      console.error(
        "ADMIN CANCEL DELETE ERROR:",
        error
      );


      return res.status(500).send(
        `
        <h2>Cancel Delete Request Failed</h2>
        <pre>${error.message}</pre>
        `
      );
    }
  };