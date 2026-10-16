import mongoose from "mongoose";

const supportSettingsSchema = new mongoose.Schema(
  {
    pageTitle: { type: String, default: "दान करें / Donate" },
    pageSubtitle: { type: String, default: "पार्टी को मजबूत बनाने में अपना बहुमूल्य योगदान दें" },
    partyNameHindi: { type: String, default: "विकासशील इंसान पार्टी" },
    partyNameEnglish: { type: String, default: "Vikassheel Insaan Party" },
    inspirationalMessage: {
      type: String,
      default:
        "सामाजिक न्याय और बिहार के विकास की इस लड़ाई में अपना बहुमूल्य योगदान दें। आपका हर एक रुपया समाज में सकारात्मक बदलाव ला सकता है।",
    },
    noticeText: {
      type: String,
      default: "कृपया ध्यान दें: केवल इसी आधिकारिक बैंक खाते में दान करें। किसी अन्य व्यक्ति को नकद देने से बचें।",
    },
    accountName: { type: String, default: "Vikassheel Insaan Party" },
    accountNameHindi: { type: String, default: "विकासशील इंसान पार्टी" },
    bankName: { type: String, default: "State Bank of India" },
    bankNameHindi: { type: String, default: "भारतीय स्टेट बैंक" },
    branchName: { type: String, default: "06, Boring Road, Patna, Bihar - 800001" },
    accountNumber: { type: String, default: "41982736450" },
    ifscCode: { type: String, default: "SBIN0001513" },
    upiId: { type: String, default: "vipparty@sbi" },
    qrCodeUrl: { type: String, default: "" },
    taxExemptionNotice: {
      type: String,
      default:
        "आयकर अधिनियम की धारा 80GGC के तहत राजनीतिक दल को दिया गया दान 100% कर मुक्त है। (All donations to VIP are 100% tax exempt under Section 80GGC of the Income Tax Act.)",
    },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.SupportSettings ||
  mongoose.model("SupportSettings", supportSettingsSchema);
