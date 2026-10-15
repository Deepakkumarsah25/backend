import mongoose from "mongoose";
import Join from "../models/joinmodel.js";
import User from "../models/User.js";

/** Move registrations from the retired volunteers collection into Join. */
export const migrateLegacyVolunteers = async () => {
  const volunteers = mongoose.connection.collection("volunteers");
  const exists = await mongoose.connection.db
    .listCollections({ name: "volunteers" }, { nameOnly: true })
    .hasNext();
  if (!exists) return;

  const records = await volunteers.find({}).toArray();
  if (!records.length) {
    await volunteers.drop();
    console.log("Removed empty legacy volunteers collection.");
    return;
  }

  for (const volunteer of records) {
    const user = volunteer.user ? await User.findById(volunteer.user).select("uid").lean() : null;
    const cleanMobile = String(volunteer.mobile || "").replace(/\D/g, "").slice(-10);
    await Join.updateOne(
      { legacyVolunteerId: volunteer._id },
      {
        $setOnInsert: {
          legacyVolunteerId: volunteer._id,
          userId: volunteer.user || null,
          uid: user?.uid || "",
          mode: "full",
          type: "volunteer_member",
          status: "Pending",
          memberId: null,
          profilePhoto: volunteer.photoURL || "",
          fullName: volunteer.fullName || "Volunteer",
          mobile: cleanMobile,
          email: volunteer.email || "",
          gender: volunteer.gender || "",
          dob: volunteer.dob || null,
          whatsappNumber: volunteer.whatsapp || "",
          village: volunteer.village || "",
          address: volunteer.village || "",
          state: volunteer.state || "",
          district: volunteer.district || "",
          assembly: volunteer.assemblyConstituency || "",
          pinCode: volunteer.pinCode || "",
          profession: volunteer.skills || "",
          areaOfInterest: Array.isArray(volunteer.volunteerTypes)
            ? volunteer.volunteerTypes.join(", ")
            : "",
          availableTime: volunteer.availability || "",
          previousExperience: volunteer.previousExperience || "",
          volunteerTypes: volunteer.volunteerTypes || [],
          otherTypeDetail: volunteer.otherTypeDetail || "",
          skills: volunteer.skills || "",
          availability: volunteer.availability || "",
          groundActivity: !!volunteer.groundActivity,
          declarationAccepted: !!volunteer.agreedDeclaration,
          createdAt: volunteer.createdAt || new Date(),
          updatedAt: volunteer.updatedAt || new Date(),
        },
      },
      { upsert: true }
    );
  }

  const migrated = await Join.countDocuments({
    legacyVolunteerId: { $in: records.map(({ _id }) => _id) },
  });
  if (migrated !== records.length) {
    throw new Error(`Legacy volunteer migration incomplete: ${migrated}/${records.length} copied.`);
  }

  await volunteers.drop();
  console.log(`Migrated ${migrated} legacy volunteer registrations into Join and removed the old collection.`);
};
