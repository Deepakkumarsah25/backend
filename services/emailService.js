import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";


/* =========================================================
   SMTP CONFIG
========================================================= */

const SMTP_HOST =
  process.env.SMTP_HOST ||
  "smtp.gmail.com";

const SMTP_PORT =
  Number(
    process.env.SMTP_PORT || 587
  );

const SMTP_USERNAME =
  process.env.SMTP_USERNAME ||
  "";

const SMTP_PASSWORD =
  process.env.SMTP_PASSWORD ||
  "";

const SMTP_FROM_EMAIL =
  process.env.SMTP_FROM_EMAIL ||
  SMTP_USERNAME;


/* =========================================================
   LOG CONFIG
========================================================= */

console.log(
  "=========================================="
);

console.log(
  "EMAIL SERVICE"
);

console.log(
  "SMTP_HOST =",
  SMTP_HOST
);

console.log(
  "SMTP_PORT =",
  SMTP_PORT
);

console.log(
  "SMTP_USERNAME =",
  SMTP_USERNAME || "NOT SET"
);

console.log(
  "SMTP_PASSWORD =",
  SMTP_PASSWORD
    ? "SET"
    : "NOT SET"
);

console.log(
  "SMTP_FROM_EMAIL =",
  SMTP_FROM_EMAIL || "NOT SET"
);

console.log(
  "=========================================="
);


/* =========================================================
   VALIDATE CONFIG
========================================================= */

if (
  !SMTP_USERNAME ||
  !SMTP_PASSWORD
) {

  console.error(
    "❌ SMTP username/password missing."
  );

}


/* =========================================================
   TRANSPORTER
========================================================= */

const transporter =
  nodemailer.createTransport({

    host:
      SMTP_HOST,

    port:
      SMTP_PORT,

    secure:
      SMTP_PORT === 465,

    auth: {

      user:
        SMTP_USERNAME,

      pass:
        SMTP_PASSWORD,

    },

    tls: {

      rejectUnauthorized:
        false,

    },

  });


/* =========================================================
   VERIFY SMTP
========================================================= */

transporter.verify(
  (error, success) => {

    if (error) {

      console.error(
        "❌ SMTP CONNECTION FAILED"
      );

      console.error(
        error
      );

    } else {

      console.log(
        "✅ SMTP SERVER READY"
      );

    }

  }
);


/* =========================================================
   SEND EMAIL
========================================================= */

export const sendEmail = async (
  to,
  subject,
  html
) => {

  try {

    if (!to) {

      throw new Error(
        "Recipient email is required."
      );

    }

    if (!SMTP_USERNAME) {

      throw new Error(
        "SMTP_USERNAME is missing."
      );

    }

    if (!SMTP_PASSWORD) {

      throw new Error(
        "SMTP_PASSWORD is missing."
      );

    }


    const mailOptions = {

      from:
        SMTP_FROM_EMAIL,

      to:
        String(to).trim(),

      subject:
        String(subject || ""),

      html:
        html || "",

    };


    console.log(
      "------------------------------------------"
    );

    console.log(
      "SENDING EMAIL"
    );

    console.log(
      "To:",
      mailOptions.to
    );

    console.log(
      "Subject:",
      mailOptions.subject
    );

    console.log(
      "From:",
      mailOptions.from
    );

    console.log(
      "------------------------------------------"
    );


    const info =
      await transporter.sendMail(
        mailOptions
      );


    console.log(
      "✅ EMAIL SENT"
    );

    console.log(
      "Message ID:",
      info.messageId
    );

    console.log(
      "Accepted:",
      info.accepted
    );

    console.log(
      "Rejected:",
      info.rejected
    );

    console.log(
      "------------------------------------------"
    );


    return info;

  } catch (error) {

    console.error(
      "❌ EMAIL SEND ERROR"
    );

    console.error(
      "To:",
      to
    );

    console.error(
      error
    );

    throw error;

  }

};