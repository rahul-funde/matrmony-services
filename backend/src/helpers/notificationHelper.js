import nodemailer from "nodemailer";
import axios from "axios";

/* =====================================================
   EMAIL HELPER (NodeMailer)
===================================================== */

/**
 * Create SMTP transporter (NO caching – safe for prod)
 */
const createMailTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP environment variables are missing");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

/**
 * Send Email
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  retries = 2,
}) => {
  try {
    const transporter = createMailTransporter();

    return await transporter.sendMail({
	  from: `"Sushil Maratha Matrimony" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying email... attempts left: ${retries}`);
      return sendEmail({ to, subject, html, retries: retries - 1 });
    }

    console.error("❌ Email send failed:", error.message);
    throw error;
  }
};

/* =====================================================
   WHATSAPP HELPER (Meta WhatsApp Business API)
===================================================== */

/**
 * Send WhatsApp message via Meta API
 * Fire-and-forget (never throws)
 */
export const sendWhatsappMessage = async ({
  to,                // number with country code (no +)
  type = "text",     // "text" | "template"
  message = "",
  templateName = "",
  variables = [],
  language = "mr",
  retries = 2,
}) => {
  const phoneNumberId =
    process.env.META_WHATSAPP_PHONE_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  const accessToken =
    process.env.META_WHATSAPP_TOKEN ||
    process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn("⚠️ WhatsApp credentials missing");
    return;
  }

  let payload;

  if (type === "text") {
    payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    };
  } else if (type === "template") {
    payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components: variables.length
          ? [{
              type: "body",
              parameters: variables.map(v => ({
                type: "text",
                text: String(v),
              })),
            }]
          : [],
      },
    };
  } else {
    console.warn("Unsupported WhatsApp message type:", type);
    return;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  try {
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (retries > 0) {
      console.warn(`WhatsApp retry left: ${retries}`);
      return sendWhatsappMessage({
        to,
        type,
        message,
        templateName,
        variables,
        language,
        retries: retries - 1,
      });
    }

    console.error(
      "WhatsApp send error:",
      error.response?.data || error.message
    );
  }
};
