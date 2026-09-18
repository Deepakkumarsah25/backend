import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

/* =========================================================
   SMTP CONFIGURATION
   ========================================================= */

const SMTP_HOST =
  process.env.SMTP_HOST || "smtp.gmail.com";

const SMTP_PORT = Number(
  process.env.SMTP_PORT || 587
);

const SMTP_USERNAME =
  process.env.SMTP_USERNAME || "";

const SMTP_PASSWORD =
  process.env.SMTP_PASSWORD || "";

const SMTP_FROM_EMAIL =
  process.env.SMTP_FROM_EMAIL ||
  SMTP_USERNAME;


/* =========================================================
   SMTP CONFIG LOG
   ========================================================= */

console.log(
  "=========================================="
);

console.log(
  "📧 EMAIL SERVICE INITIALIZING"
);

console.log(
  "SMTP HOST:",
  SMTP_HOST
);

console.log(
  "SMTP PORT:",
  SMTP_PORT
);

console.log(
  "SMTP USERNAME:",
  SMTP_USERNAME
    ? SMTP_USERNAME
    : "❌ NOT SET"
);

console.log(
  "SMTP PASSWORD:",
  SMTP_PASSWORD
    ? "✅ SET"
    : "❌ NOT SET"
);

console.log(
  "SMTP FROM EMAIL:",
  SMTP_FROM_EMAIL
    ? SMTP_FROM_EMAIL
    : "❌ NOT SET"
);

console.log(
  "=========================================="
);


/* =========================================================
   SMTP CONFIG VALIDATION
   ========================================================= */

if (!SMTP_USERNAME) {
  console.error(
    "❌ SMTP_USERNAME is missing."
  );
}

if (!SMTP_PASSWORD) {
  console.error(
    "❌ SMTP_PASSWORD is missing."
  );
}

if (!SMTP_FROM_EMAIL) {
  console.error(
    "❌ SMTP_FROM_EMAIL is missing."
  );
}


/* =========================================================
   CREATE SMTP TRANSPORTER
   ========================================================= */

const transporter =
  nodemailer.createTransport({
    host: SMTP_HOST,

    port: SMTP_PORT,

    secure:
      SMTP_PORT === 465,

    auth: {
      user: SMTP_USERNAME,
      pass: SMTP_PASSWORD,
    },

    tls: {
      rejectUnauthorized: false,
    },
  });


/* =========================================================
   VERIFY SMTP CONNECTION
   ========================================================= */

transporter.verify(
  (error) => {

    if (error) {

      console.error(
        "=========================================="
      );

      console.error(
        "❌ SMTP CONNECTION FAILED"
      );

      console.error(
        error.message
      );

      console.error(
        "=========================================="
      );

    } else {

      console.log(
        "=========================================="
      );

      console.log(
        "✅ SMTP SERVER READY"
      );

      console.log(
        "=========================================="
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

    /* -----------------------------------------------------
       VALIDATE RECIPIENT
    ----------------------------------------------------- */

    if (!to) {
      throw new Error(
        "Recipient email is required."
      );
    }


    /* -----------------------------------------------------
       VALIDATE SMTP USERNAME
    ----------------------------------------------------- */

    if (!SMTP_USERNAME) {
      throw new Error(
        "SMTP_USERNAME is missing."
      );
    }


    /* -----------------------------------------------------
       VALIDATE SMTP PASSWORD
    ----------------------------------------------------- */

    if (!SMTP_PASSWORD) {
      throw new Error(
        "SMTP_PASSWORD is missing."
      );
    }


    /* -----------------------------------------------------
       MAIL OPTIONS
    ----------------------------------------------------- */

    const mailOptions = {

      from: SMTP_FROM_EMAIL,

      to: String(to).trim(),

      subject:
        String(subject || ""),

      html:
        html || "",
    };


    /* -----------------------------------------------------
       EMAIL LOG
    ----------------------------------------------------- */

    console.log(
      "------------------------------------------"
    );

    console.log(
      "📨 SENDING EMAIL"
    );

    console.log(
      "TO:",
      mailOptions.to
    );

    console.log(
      "SUBJECT:",
      mailOptions.subject
    );

    console.log(
      "FROM:",
      mailOptions.from
    );

    console.log(
      "------------------------------------------"
    );


    /* -----------------------------------------------------
       SEND EMAIL
    ----------------------------------------------------- */

    const info =
      await transporter.sendMail(
        mailOptions
      );


    /* -----------------------------------------------------
       SUCCESS LOG
    ----------------------------------------------------- */

    console.log(
      "=========================================="
    );

    console.log(
      "✅ EMAIL SENT SUCCESSFULLY"
    );

    console.log(
      "MESSAGE ID:",
      info.messageId
    );

    console.log(
      "ACCEPTED:",
      info.accepted
    );

    console.log(
      "REJECTED:",
      info.rejected
    );

    console.log(
      "=========================================="
    );


    return info;

  } catch (error) {

    /* -----------------------------------------------------
       ERROR LOG
    ----------------------------------------------------- */

    console.error(
      "=========================================="
    );

    console.error(
      "❌ EMAIL SEND ERROR"
    );

    console.error(
      "TO:",
      to
    );

    console.error(
      "ERROR:",
      error.message
    );

    console.error(
      "=========================================="
    );


    throw error;
  }
};