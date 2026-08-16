import ContactInfo from "../../models/ContactInfo.js";
import VipOffice from "../../models/VipOffice.js";

// Page dikhane ke liye
export const renderContactPage = async (req, res) => {  let info = await ContactInfo.findOne();
  if (!info) info = await ContactInfo.create({}); // pehli baar khaali record ban jayega

  const offices = await VipOffice.find().sort({ createdAt: -1 });

  res.render("admin/contact", { info, offices });
};

// General info update
export const updateContactInfo = async (req, res) => {  const {
  phone,
  email,
  address,
  facebook,
  instagram,
  twitter,
  youtube,
  whatsapp,
  telegram,
  googleMapLink,
} = req.body;
  let info = await ContactInfo.findOne();
  if (!info) info = new ContactInfo();

  info.phone = phone;
  info.email = email;
  info.address = address;
  info.facebook = facebook;
  info.instagram = instagram;
  info.twitter = twitter;
  info.youtube = youtube;
  info.whatsapp = whatsapp;
info.telegram = telegram;
info.googleMapLink = googleMapLink;

  await info.save();
  res.redirect("/admin/contact");
};

// Naya office add
export const addOffice = async (req, res) => {
  const {
    name,
    district,
    officeType,
    incharge,
    phone,
    email,
    address,
    lat,
    lng,
  } = req.body;

 await VipOffice.create({
  name,
  district,
  officeType,
  incharge,
  phone,
  email,
  address,
  lat,
  lng,
});

  res.redirect("/admin/contact");
};

// Office edit
export const editOffice = async (req, res) => {
  const { id } = req.params;

const {
  name,
  district,
  officeType,
  incharge,
  phone,
  email,
  address,
  lat,
  lng,
} = req.body;

 await VipOffice.findByIdAndUpdate(id, {
  name,
  district,
  officeType,
  incharge,
  phone,
  email,
  address,
  lat,
  lng,
});

  res.redirect("/admin/contact");
};

// Office delete
export const deleteOffice = async (req, res) => {
  const { id } = req.params;
  await VipOffice.findByIdAndDelete(id);
  res.redirect("/admin/contact");
};