import mongoose from "mongoose";

const donationRecordSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, unique: true },
    donorName: { type: String, required: true, trim: true },
    donorPhone: { type: String, required: true, trim: true },
    donorEmail: { type: String, default: "", trim: true },
    panNumber: { type: String, default: "", trim: true },
    amount: { type: Number, required: true },
    utrNumber: { type: String, default: "", trim: true },
    paymentMode: { type: String, default: "UPI" },
    state: { type: String, default: "Bihar" },
    district: { type: String, default: "" },
    address: { type: String, default: "" },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending Verification", "Verified", "Receipt Issued", "Rejected"],
      default: "Pending Verification",
    },
  },
  { timestamps: true }
);

export default mongoose.models.DonationRecord ||
  mongoose.model("DonationRecord", donationRecordSchema);
