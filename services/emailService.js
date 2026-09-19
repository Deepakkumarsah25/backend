import dotenv from "dotenv";
dotenv.config();

/* =========================================================
   BREVO EMAIL API CONFIGURATION
========================================================= */

const BREVO_API_URL =
  "https://api.brevo.com/v3/smtp/email";

const BREVO_API_KEY =
  process.env.BREVO_API_KEY || "";

const BREVO_FROM_EMAIL =
  process.env.BREVO_FROM_EMAIL || "";

const BREVO_FROM_NAME =
  process.env.BREVO_FROM_NAME || "VIP Party";


/* =========================================================
   CONFIG LOG
========================================================= */

console.log(
  "=========================================="
);

console.log(
  "📧 EMAIL SERVICE INITIALIZING"
);

console.log(
  "EMAIL SERVICE: BREVO API"
);

console.log(
  "BREVO API URL:",
  BREVO_API_URL
);

console.log(
  "BREVO API KEY:",
  BREVO_API_KEY
    ? "✅ SET"
    : "❌ NOT SET"
);

console.log(
  "BREVO FROM EMAIL:",
  BREVO_FROM_EMAIL
    ? BREVO_FROM_EMAIL
    : "❌ NOT SET"
);

console.log(
  "BREVO FROM NAME:",
  BREVO_FROM_NAME
);

console.log(
  "=========================================="
);


/* =========================================================
   CONFIG VALIDATION
========================================================= */

if (!BREVO_API_KEY) {

  console.error(
    "❌ BREVO_API_KEY is missing."
  );

}

if (!BREVO_FROM_EMAIL) {

  console.error(
    "❌ BREVO_FROM_EMAIL is missing."
  );

}


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
       VALIDATE BREVO API KEY
    ----------------------------------------------------- */

    if (!BREVO_API_KEY) {

      throw new Error(
        "BREVO_API_KEY is missing."
      );

    }


    /* -----------------------------------------------------
       VALIDATE SENDER EMAIL
    ----------------------------------------------------- */

    if (!BREVO_FROM_EMAIL) {

      throw new Error(
        "BREVO_FROM_EMAIL is missing."
      );

    }


    /* -----------------------------------------------------
       EMAIL DATA
    ----------------------------------------------------- */

    const payload = {

      sender: {

        name:
          BREVO_FROM_NAME,

        email:
          BREVO_FROM_EMAIL,

      },

      to: [

        {

          email:
            String(to).trim(),

        },

      ],

      subject:
        String(subject || ""),

      htmlContent:
        html || "",

    };


    /* -----------------------------------------------------
       EMAIL LOG
    ----------------------------------------------------- */

    console.log(
      "------------------------------------------"
    );

    console.log(
      "📨 SENDING EMAIL USING BREVO API"
    );

    console.log(
      "TO:",
      payload.to[0].email
    );

    console.log(
      "SUBJECT:",
      payload.subject
    );

    console.log(
      "FROM:",
      payload.sender.email
    );

    console.log(
      "------------------------------------------"
    );


    /* -----------------------------------------------------
       SEND REQUEST
    ----------------------------------------------------- */

    const response =
      await fetch(
        BREVO_API_URL,
        {

          method:
            "POST",

          headers: {

            accept:
              "application/json",

            "api-key":
              BREVO_API_KEY,

            "content-type":
              "application/json",

          },

          body:
            JSON.stringify(payload),

        }
      );


    /* -----------------------------------------------------
       READ RESPONSE
    ----------------------------------------------------- */

    const responseText =
      await response.text();

    let responseData = {};

    try {

      responseData =
        responseText
          ? JSON.parse(responseText)
          : {};

    } catch {

      responseData = {

        raw:
          responseText,

      };

    }


    /* -----------------------------------------------------
       CHECK API ERROR
    ----------------------------------------------------- */

    if (!response.ok) {

      console.error(
        "=========================================="
      );

      console.error(
        "❌ BREVO EMAIL API FAILED"
      );

      console.error(
        "STATUS:",
        response.status
      );

      console.error(
        "RESPONSE:",
        responseData
      );

      console.error(
        "=========================================="
      );

      throw new Error(
        responseData.message ||
        `Brevo API failed with status ${response.status}`
      );

    }


    /* -----------------------------------------------------
       SUCCESS
    ----------------------------------------------------- */

    console.log(
      "=========================================="
    );

    console.log(
      "✅ EMAIL SENT SUCCESSFULLY"
    );

    console.log(
      "BREVO RESPONSE:",
      responseData
    );

    console.log(
      "MESSAGE ID:",
      responseData.messageId ||
        "NOT PROVIDED"
    );

    console.log(
      "=========================================="
    );


    return responseData;

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