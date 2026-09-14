import Leadership from "../models/Leadership.js";
import cloudinary from "../config/cloudinary.js";

// ===========================
// Show All Leadership
// ===========================
export const showLeadership = async (req, res) => {
  try {
    const leaders = await Leadership.find().sort({ createdAt: -1 });

    res.render("Leadership/list", {
      leaders,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
};

// ===========================
// Add Page
// ===========================
export const showAddLeadership = (req, res) => {
  res.render("Leadership/add");
};

// ===========================
// Add Leadership
// ===========================
export const addLeadership = async (req, res) => {
  try {
    const {
      name,
      designation,
      category,
      description,
      about,

      intro,
      leaderIntro,
      leaderssIntro,

      journey,
      achievement,
      leaderAchievement,

      role,
      work,

      earlyLife,
      socialThinking,
      partyFoundation,
      politicalJourney,
      vision,
      message,
    } = req.body;

    // Founder category me sirf 1 record allow hoga
if (category === "founder") {
  const founderExists = await Leadership.findOne({
    category: "founder",
    active: true,
  });

  if (founderExists) {
    return res.send(
      "Founder already exists. Please edit the existing founder instead of adding a new one."
    );
  }
}

let imageUrl = "";

if (req.file) {
  const result = await cloudinary.uploader.upload(req.file.path);
  imageUrl = result.secure_url;
}

    await Leadership.create({
      name,
      designation,
      category,
      description,
      about,

      intro: intro || leaderIntro || leaderssIntro || "",

      journey,

      achievement: achievement || leaderAchievement || "",

      role,
      work,

      earlyLife,
      socialThinking,
      partyFoundation,
      politicalJourney,
      vision,
      message,

      imageUrl,
    });

    res.redirect("/leadership");
  } catch (error) {
    console.log(error);
    console.log(req.body);
    res.status(500).send("Leadership Add Failed");
  }
};

// ===========================
// Edit Page
// ===========================
export const editLeadership = async (req, res) => {
  try {
    const leader = await Leadership.findById(req.params.id);

    if (!leader) {
      return res.send("Leadership Not Found");
    }

    res.render("Leadership/edit", {
      leader,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
};

// ===========================
// Update Leadership
// ===========================
export const updateLeadership = async (req, res) => {
  try {
    const {
      name,
      designation,
      category,
      description,
      about,

      intro,
      leaderIntro,
      statecmIntro,

      journey,
      achievement,
      leaderAchievement,

      role,
      work,

      earlyLife,
      socialThinking,
      partyFoundation,
      politicalJourney,
      vision,
      message,
    } = req.body;

    const leader = await Leadership.findById(req.params.id);

    if (!leader) {
      return res.send("Leadership Not Found");
    }

    let imageUrl = leader.imageUrl;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    await Leadership.findByIdAndUpdate(req.params.id, {
      name,
      designation,
      category,
      description,
      about,

      intro: intro || leaderIntro || statecmIntro || "",

      journey,

      achievement: achievement || leaderAchievement || "",

      role,
      work,

      earlyLife,
      socialThinking,
      partyFoundation,
      politicalJourney,
      vision,
      message,

      imageUrl,
    });

    res.redirect("/leadership");
  } catch (error) {
    console.log(error);
    console.log(req.body);
    res.status(500).send("Leadership Update Failed");
  }
};

// ===========================
// Delete Leadership
// ===========================
export const deleteLeadership = async (req, res) => {
  try {
    await Leadership.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Leadership Deleted Successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Delete Failed",
    });
  }
};

// ===========================
// Founders API
// ===========================
export const getFounders = async (req, res) => {
  try {
    const leaders = await Leadership.find({
      category: "founder",
      active: true,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      leaders,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// ===========================
// Leaders API
// ===========================
export const getLeaders = async (req, res) => {
  try {
    const leaders = await Leadership.find({
      category: "leader",
      active: true,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      leaders,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// ===========================
// State CM API
// ===========================
export const getStateCMs = async (req, res) => {
  try {
    const leaders = await Leadership.find({
      category: "leaderss",
      active: true,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      leaders,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// ===========================
// Leaderss API
// ===========================
export const getLeaderss = async (req, res) => {
  try {
    const leaderss = await Leadership.find({
      category: "leaderss",  
      active: true,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      leaderss,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// ===========================
// Single Leadership Details
// ===========================
export const getLeadershipDetails = async (req, res) => {
  try {
    const leader = await Leadership.findById(req.params.id);

    if (!leader) {
      return res.status(404).json({
        success: false,
        message: "Leader not found",
      });
    }

    res.json({
      success: true,
      leader,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};