const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const twilio = require('twilio');
const { exit } = require("process");

/**
 * Send Verification Email
 * @param {string} userEmail - The recipient's email
 * @param {string} userId - The user's ID
 * @returns {boolean} - Returns true if email was sent successfully, false otherwise
 */
const sendVerificationEmail = async (userEmail, userId) => {
  try {
    console.log('step 1='+userEmail);
    exit;
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const verificationLink = `http://yourwebsite.com/verify-email?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      debug: true,
      logger: true,
    });

    await transporter.sendMail({
      from: `"marathimatrimony" <no-reply@marathimatrimony.com>`,
      to: userEmail,
      subject: "Email Verification",
      html: `Please click the link to verify your email: <a href="${verificationLink}">Verify Email</a>`,
    });

    console.log("Verification email sent.");
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};


// Generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
}

// Hash OTP with a secure algorithm
function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

// Validate OTP by comparing the hashed value
function validateOtp(providedOtp, storedHashedOtp) {
  return hashOtp(providedOtp) === storedHashedOtp;
}


// Placeholder function for Aadhaar verification
async function verifyAadhaar(aadhaarNumber, userDetails) {
    // Call Aadhaar API (mocked here for simplicity)
    const isVerified = aadhaarNumber && aadhaarNumber.length === 12 && userDetails;
    if (!isVerified) {
      throw new Error("Aadhaar verification failed.");
    }
    console.log("Aadhaar verified successfully.");
    return true;
}

// Twilio credentials from your Twilio account
const accountSid = 'ACyour_account_sid'; // Replace with your Twilio Account SID
const authToken = 'your_auth_token';   // Replace with your Twilio Auth Token
const twilioPhoneNumber = 'your_twilio_phone_number'; // Replace with your Twilio phone number

const client = twilio(accountSid, authToken);

const sendSms = async (phoneNumber, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: twilioPhoneNumber,
      to: phoneNumber
    });
    console.log("SMS sent successfully:", message.sid);
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
};
  

const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // Or use your email provider's SMTP service
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    const resetLink = `https://your-website.com/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: '"Your App Name" <no-reply@yourapp.com>',
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
      html: `<p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>If you did not request this, please ignore this email.</p>`,
    });

    console.log("Password reset email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send reset email");
  }
};

module.exports = { sendVerificationEmail, sendSms, generateOtp, hashOtp, sendPasswordResetEmail};