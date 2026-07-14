import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      required: true,
    },
    name: String,
    email: String,
    phone: String,
    photoURL: String,
    provider: String,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);