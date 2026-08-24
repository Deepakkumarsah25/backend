import dotenv from "dotenv";

dotenv.config();
import nodemailer from "nodemailer";
console.log("SMTP_HOST =", process.env.SMTP_HOST);
console.log("SMTP_PORT =", process.env.SMTP_PORT);
console.log("SMTP_USERNAME =", process.env.SMTP_USERNAME);
console.log(
  "SMTP_PASSWORD =",
  process.env.SMTP_PASSWORD
    ? "SET"
    : "NOT SET"
);
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (
  to,
  subject,
  html
) => {

  await transporter.sendMail({

    from: process.env.SMTP_FROM_EMAIL,

    to,

    subject,

    html,

  });

};