import Counter from "../models/Counter.js";

export const generateMemberId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "membershipId" },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  return `VIP${String(counter.seq).padStart(7, "0")}`;
};