const twilio = require("twilio");
const nodemailer = require("nodemailer");
require("dotenv").config();

// ------------------------
// Twilio SMS
// ------------------------
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMS(to, message) {
  try {
    const msg = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // your Twilio number
      to: to
    });
    console.log("SMS sent:", msg.sid);
    return msg;
  } catch (err) {
    console.error("Error sending SMS:", err);
    throw err;
  }
}

// ------------------------
// Nodemailer Email
// ------------------------
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: `"Your Matrimony" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    console.log("Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}

module.exports = { sendSMS, sendEmail };
