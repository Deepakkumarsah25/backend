import Volunteer, { VOLUNTEER_TYPE_OPTIONS } from "../../models/Volunteer.js";
import User from "../../models/User.js";

const generateVolunteerId = () =>
  `VOL${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Called when the form first opens — feeds the 6 fields User actually has
export const getVolunteerPrefill = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({
      success: true,
      prefill: {
        fullName: user.name,
        mobile: user.phone,
        email: user.email,
        state: user.state,
        district: user.district,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch profile." });
  }
};

export const joinVolunteer = async (req, res) => {
  try {
    const userId = req.user._id;

    const existing = await Volunteer.findOne({ user: userId });
    if (existing) {
      return res.status(200).json({
        success: true,
        volunteerId: existing.volunteerId,
        alreadyRegistered: true,
      });
    }

    const {
      fullName,
      mobile,
      whatsapp,
      email,
      dob,
      gender,
      state,
      district,
      assemblyConstituency,
      village,
      pinCode,
      volunteerTypes, // JSON stringified array from FormData
      otherTypeDetail,
      skills,
      previousExperience,
      availability,
      groundActivity,
      agreedDeclaration,
    } = req.body;

    if (!fullName || !mobile || !state || !district) {
      return res.status(400).json({
        success: false,
        message: "Name, mobile, state and district are required.",
      });
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: "Invalid mobile number." });
    }

    if (agreedDeclaration !== "true" && agreedDeclaration !== true) {
      return res.status(400).json({ success: false, message: "Please accept the declaration." });
    }

    let parsedTypes = [];
    try {
      parsedTypes = typeof volunteerTypes === "string" ? JSON.parse(volunteerTypes) : volunteerTypes || [];
    } catch {
      parsedTypes = [];
    }
    parsedTypes = parsedTypes.filter((t) => VOLUNTEER_TYPE_OPTIONS.includes(t));

    const volunteer = await Volunteer.create({
      volunteerId: generateVolunteerId(),
      user: userId,
      photoURL: req.file ? req.file.path : req.body.photoURL || "", // [Guessing] adjust if `upload` middleware returns a cloud URL instead of req.file.path
      fullName: fullName.trim(),
      mobile,
      whatsapp: whatsapp || "",
      email: email || "",
      dob: dob || undefined,
      gender: gender || undefined,
      state,
      district,
      assemblyConstituency: assemblyConstituency || "",
      village: village || "",
      pinCode: pinCode || "",
      volunteerTypes: parsedTypes,
      otherTypeDetail: otherTypeDetail || "",
      skills: skills || "",
      previousExperience: previousExperience || "",
      availability: availability || "",
      groundActivity: groundActivity === "true" || groundActivity === true,
      agreedDeclaration: true,
    });

    return res.status(201).json({ success: true, volunteerId: volunteer.volunteerId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to submit registration." });
  }
};

export const getMyVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ user: req.user._id });
    if (!volunteer) {
      return res.status(404).json({ success: false, message: "Not registered yet." });
    }
    return res.json({ success: true, volunteer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch." });
  }
};