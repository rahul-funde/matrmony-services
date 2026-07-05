// By Rahul Funde
// Date: 2025-03-15
// Purpose: Handles user authentication, including logout and password reset.
// Enable environment variables

// Couchbase
import couchbase from 'couchbase';
import { connectToCouchbase } from '../config/db.config.js';

// Utils
import { sendVerificationEmail, sendSms, generateOtp, hashOtp } from '../utils/utils.js';

// Nodemailer
import nodemailer from 'nodemailer';

// Models
import User from '../models/user.model.js';

// Other packages
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import validator from 'validator';
import { sendEmail, sendWhatsappMessage } from "../helpers/notificationHelper.js";

import twilio from 'twilio';
//import dotenv from 'dotenv';
//dotenv.config();

import { MutateInSpec } from 'couchbase';
// Initialize logger
const logger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log' })
  ],
});


// ----------------------------
// 🔹 Helper Functions
// ----------------------------
//const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
//const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

export const registerUser = async (req, res) => {
  try {
	const via = "sms";
	// Validate input
    const { error } = validateUserInput(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }


    // Connect to Couchbase
    const { cluster, collection } = await connectToCouchbase();
    if (!collection || !cluster) {
      return res.status(500).json({ message: "Database connection error" });
    }
	
	// Generate OTP and hash it
    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);
    const otpExpiry = Date.now() + 5 * 60 * 1000;
	
	let whereConditions = [];
	let params = [];

	if (req.body.email && req.body.email.trim() !== '') {
	  whereConditions.push('email = $1');
	  params.push(req.body.email);
	}

	if (req.body.mobilenumber && req.body.mobilenumber.trim() !== '') {
	  whereConditions.push(`mobilenumber = $${params.length + 1}`);
	  params.push(req.body.mobilenumber);
	}

	const checkQuery = `
	  SELECT COUNT(*) AS count
	  FROM \`${process.env.COUCHBASE_BUCKET}\`
	  .\`${process.env.COUCHBASE_SCOPE}\`
	  .\`${process.env.COUCHBASE_COLLECTION}\`
	  WHERE ${whereConditions.join(' OR ')}
	`;

	const result = await cluster.query(checkQuery, {
	  parameters: params
	});

	if (result.rows[0].count > 0) {
	  return res.status(409).json({ message: "User is already registered" });
	}

    // Generate userId and document key
    const userId = await generateUserIdFromLast(req.body.gender, cluster);
	//    const docKey = user::${uuidv4()};

		// Encrypt password
			const hashedPassword = await bcrypt.hash(req.body.password, 10);
		console.log("here");
			if (!process.env.FRONTEND_URL) {
			  //throw new Error('FRONTEND_URL is not defined');
			  console.log('FRONTEND_URL is not defined');
			}
			const baseUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
			const publicUrl = `${baseUrl}/profile/${userId}`;
			
			console.log("userId", userId);
			// Prepare user data
			const userData = {
			  userId,
			  mobilenumber: req.body.mobilenumber,
			  email: req.body.email,
			  termsAccepted: req.body.termsAccepted,
			  password: hashedPassword,
			  plainPassword: req.body.password,
			  language: req.body.language || "mr",
			  otp: hashedOtp,
			  otpExpiry: otpExpiry,
			  createdAt: new Date(),
			  type: 'user',
			  status: "awaiting_verification",
			  plan: 'free',
			  publicUrl : publicUrl,
			  personalDetails: {
				firstName: req.body.firstname,
				middleName: req.body.middlename,
				lastName: req.body.lastname,
				dateOfBirth: req.body.dob,
				gender: req.body.gender,
				mobilenumber: req.body.mobilenumber,
				email: req.body.email,
			  },
			  contactDetails: {
				phoneNumber: req.body.mobilenumber,
				emailAddress: req.body.email,
				whatsappNumber: req.body.whatsappNumber ?? "",
			  },
			  start_date: new Date(),
			  end_date: new Date(),
			};

			console.log("User Data to Insert:", userData);


			// Try inserting user document
			const insertResult = await collection.insert(userId, userData);
			console.log("Insert Result:", insertResult);
				if (req.body.email) {
				  await sendEmail({
					to: req.body.email,
					subject: `${process.env.APP_NAME}- OTP`,
					html: otpEmailTemplate(req.body.firstname, otp, "mr")
				  });
				} 
				if(req.body.mobilenumber) 
				{
				   /*
					expiryMinutes = 15;
					await sendWhatsappMessage({
					  to: `+91${req.body.mobilenumber}`,
					  type: "template",
					  templateName: "smm_otp_verification",
					  variables: [otp, req.body.firstname, expiryMinutes],
					  language: "en"
					});

					*/
				} 
						
					if (req.body.mobilenumber) 
					{
						 // Send OTP via SMS
						//await sendOtpSMS(req.body.mobilenumber, otp);

					}
		
				// Return success (mask sensitive info)
				return res.status(201).json({
				  message: "User registered successfully",
				  user: {
					userId: userId,
					firstname: req.body.firstname,
					lastname: req.body.lastname,
					email: req.body.email,
					mobilenumber: req.body.mobilenumber,
					publicUrl : publicUrl,
					createdAt: userData.createdAt,
					otp: otp
				  },
				});



//    return res.status(201).json({ message: "User created", user: userDoc });

  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const client = twilio(
  process.env.TWILIO_ACCOUNT_SID_SMS,
  process.env.TWILIO_AUTH_TOKEN_SMS
);

export const sendOtpSMS = async (mobilenumber, otp) => {
	
 try {
    const message = await client.messages.create({
      body: `Your VivahNest OTP is: ${otp}`,
      from: "+16203903472", // Twilio verified sender number
      to: `+91${mobilenumber}`, // Indian number format
    });

    console.log("✅ OTP sent successfully, SID:", message.sid);
    return message.sid;
  } 
  catch (error) {
    console.error("❌ Failed to send OTP:", error.message);
    //throw new Error("Failed to send OTP SMS");
  }
  
};

export const verifyUserOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const { collection } = await connectToCouchbase();
    const result = await collection.get(userId);
    const user = result.content;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: "OTP not found or already verified" });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedOtp = hashOtp(otp);
    if (hashedOtp !== user.otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Update user document
    await collection.mutateIn(userId, [
        MutateInSpec.upsert('otp_verified', true),
      // MutateInSpec.replace('status', 'awaiting_verification'),
	  MutateInSpec.remove('otp'),
      MutateInSpec.remove('plainPassword'),
      MutateInSpec.remove('otpExpiry')
    ]);

    // ✅ Send Registration Success Email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `Registration Successful – Welcome to ${process.env.APP_NAME}`,
        html: registrationSuccessEmail(user, user.language)
      });
    }
	
	// 2️⃣ Send admin notification
	if (user.mobilenumber) {
		// Prepare template variables in correct order
		const templateVariables = [
		  user.personalDetails.firstName, 
		  user.userId,                     
		  user.publicUrl,                  
		  user.email,                      
		  user.mobilenumber,               
		  user.plainPassword               
		];

		// Send WhatsApp template message
		/*
		await sendWhatsappMessage({
		  to: `+91${user.mobilenumber}`,
		  type: "template",
		  templateName: "smm_registration_success",
		  variables: templateVariables,
		  language: language
		});
		*/
    }

	await sendEmail({
	  to: `${process.env.CONTACT_EMAIL}`,
	  subject: `New Registration – ${user.userId}`,
	  html: newUserRegistrationAdminEmail(user)
	});

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Registration completed.",
      userId: user.userId,
      status: "active"
    });

  } catch (error) {
    console.error("OTP Verification Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const newUserRegistrationAdminEmail = (user) => {
  return `
  <div style="font-family:Arial, sans-serif; color:#333; max-width:600px; margin:auto;">
    <h2 style="color:#f16b2b;">🆕 New User Registration</h2>

    <p>A new user has successfully registered on <strong>${process.env.APP_NAME}</strong>.</p>

    <table style="border-collapse:collapse; width:100%;">
      <tr>
        <td style="padding:8px; border:1px solid #ddd;"><strong>Matrimony ID</strong></td>
        <td style="padding:8px; border:1px solid #ddd;">${user.userId}</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #ddd;"><strong>Name</strong></td>
        <td style="padding:8px; border:1px solid #ddd;">
          ${user.personalDetails?.firstName || ""} ${user.personalDetails?.lastName || ""}
        </td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #ddd;"><strong>Email</strong></td>
        <td style="padding:8px; border:1px solid #ddd;">${user.email}</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #ddd;"><strong>Mobile</strong></td>
        <td style="padding:8px; border:1px solid #ddd;">${user.mobilenumber}</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #ddd;"><strong>Gender</strong></td>
        <td style="padding:8px; border:1px solid #ddd;">${user.personalDetails?.gender}</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #ddd;"><strong>Registered On</strong></td>
        <td style="padding:8px; border:1px solid #ddd;">
          ${new Date().toLocaleString("en-IN")}
        </td>
      </tr>
    </table>

    <p style="margin-top:16px;">
      👉 Admin panel login to review the profile.
    </p>

    <p style="font-size:12px; color:#777;">
      This is an automated notification from ${process.env.APP_NAME}.
    </p>
  </div>
  `;
};


const registrationSuccessEmail = (user, language = "en") => {
  // Determine text based on language
  const texts = {
    en: {
      greeting: "Dear",
      congrats: "🎉 Congratulations!",
      registrationMsg: "Your registration with",
      matrimony: `${process.env.APP_NAME} has been completed successfully`,
      credentials: "Login Credentials",
      emailLabel: "Email",
      mobileLabel: "Registered Mobile",
      passwordLabel: "Password",
      loginMsg: "You can now log in and start exploring suitable matches.",
      cta: "View & Complete Your Profile",
      profileMsg: "Completing your profile increases your chances of getting better matches.",
      regards: "Warm regards",
      team: `${process.env.APP_NAME} Team`
    },
    mr: {
      greeting: "प्रिय",
      congrats: "🎉 अभिनंदन!",
      registrationMsg: "आपली नोंदणी",
      matrimony: `${process.env.APP_NAME} वर यशस्वीरीत्या पूर्ण झाली आहे.`,
      credentials: "लॉगिन क्रेडेन्शियल्स",
      emailLabel: "ईमेल",
      mobileLabel: "नोंदणीकृत मोबाईल",
      passwordLabel: "पासवर्ड",
      loginMsg: "आपण आता लॉगिन करून योग्य जोडीदार शोधू शकता.",
      cta: "आपले प्रोफाइल पहा आणि पूर्ण करा",
      profileMsg: "आपले प्रोफाइल पूर्ण केल्यास आपल्याला अधिक योग्य जोडीदार मिळण्याची संधी वाढते.",
      regards: "सस्नेह",
      team: `${process.env.APP_NAME} टीम`
    }
  };

  const t = texts[language] || texts.en;

return `
<div style="font-family:'Segoe UI', Arial, sans-serif; color:#333; line-height:1.6; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">

  <!-- Logo -->
  <div style="background:#f8f9fb; padding:16px; text-align:center;">
    <a href="https://sushilmaratha.in" target="_blank">
      <img src="https://sushilmaratha.in/en-US/images/smLogo.png"
        alt="${process.env.APP_NAME || 'Sushil Maratha Matrimony'}"
        style="height:60px; object-fit:contain;">
    </a>
  </div>

  <!-- Greeting -->
  <div style="padding:20px;">
    <p>${t.greeting} <strong>${user.personalDetails.firstName}</strong>,</p>

    <p style="font-size:16px;">
      ${t.congrats}<br/>
      ${t.registrationMsg} <strong>${t.matrimony}</strong>.
    </p>

    <!-- Credentials Section -->
    <div style="background:#f4f6f8; padding:16px; border-radius:6px; margin:18px 0;">
      <p style="margin:4px 0;"><strong>Matrimony ID:</strong> ${user.userId}</p>

      <p style="margin-top:10px;"><strong>${t.credentials}:</strong></p>
      <div style="padding-left:10px;">
        <p style="margin:4px 0;"><strong>${t.emailLabel}:</strong> <span style="color:#555;">${user.email}</span></p>
        <p style="margin:4px 0;"><strong>${t.mobileLabel}:</strong> <span style="color:#555;">${user.mobilenumber}</span></p>
        <p style="margin:4px 0;">
          <strong>${t.passwordLabel}:</strong>
          <span style="color:#555; font-family:monospace;">${user.plainPassword}</span>
        </p>
      </div>
    </div>

    <p style="margin:16px 0;">${t.loginMsg}</p>

    <!-- CTA Button -->
    <p style="text-align:center; margin:24px 0;">
      <a href="https://sushilmaratha.in/en-US/welcome/${user.userId}"
         target="_blank"
         style="background:#f16b2b; color:#fff; text-decoration:none; padding:12px 26px;
                border-radius:6px; font-weight:bold; display:inline-block;">
        ${t.cta}
      </a>
    </p>

    <p>${t.profileMsg}</p>

    <p>
      ${t.regards},<br/>
      <strong>${t.team}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f8f9fb; padding:16px; font-size:12px; color:#555; border-top:1px solid #eee;">

    <p style="margin:6px 0;">
      📞 <strong>Contact:</strong> 9370225218 | 9370220481<br/>
      📧 <strong>Email:</strong> contact@sushilmaratha.in<br/>
      📍 <strong>Address:</strong> Pune – 411045
    </p>

    <p style="margin:10px 0; font-size:11px; color:#777;">
      🔐 <strong>Security Notice:</strong>
      Never share your password, OTP, or reset links with anyone.
      Our team will never ask for your login credentials.
    </p>

    <p style="margin:10px 0; font-size:11px; color:#777;">
      ⚠️ <strong>Disclaimer:</strong>
      This email was sent because you registered on ${process.env.APP_NAME}.
      If this was not you, please contact our support team immediately.
    </p>

    <p style="margin:8px 0; text-align:center; font-size:11px; color:#888;">
      © ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.<br/>
      Visit us:
      <a href="https://sushilmaratha.in"
         target="_blank"
         style="color:#f16b2b; text-decoration:none;">
        https://sushilmaratha.in
      </a>
    </p>

  </div>
</div>
`;
}


export const resendUserOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const { collection } = await connectToCouchbase();
    const result = await collection.get(userId);
    const user = result.content;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Already verified check
    if (user.otp_verified === true) {
      return res.status(400).json({ message: "User already verified" });
    }

    // ✅ Generate OTP
    const otp = generateOtp();
    
	const OTP_EXPIRY_MINUTES = 15;
	const otpExpiry = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;


    // ✅ Save OTP
    await collection.mutateIn(userId, [
      MutateInSpec.upsert('otp', hashOtp(otp)),
      MutateInSpec.upsert('otpExpiry', otpExpiry)
    ]);

    // ✅ Send OTP via Email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `${process.env.APP_NAME} - OTP Verification`,
        html: otpEmailTemplate(user.personalDetails.firstName, otp, "mr")
      });
    }
	
	if(user.mobilenumber) 
	{   
		/*
					expiryMinutes = 15;
					await sendWhatsappMessage({
					  to: `+91${user.mobilenumber}`,
					  type: "template",
					  templateName: "smm_otp_verification",
					  variables: [otp, req.body.firstname, expiryMinutes],
					  language: "en"
					});

		*/
	} 

    // ✅ Optional: Send SMS / WhatsApp
    // await sendOtpSMS(user.mobilenumber, otp);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully"
    });

  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const otpEmailTemplate = (firstName, otp, lang = 'mr') => {

  const t = {
    en: {
      greeting: 'Dear',
      welcome: 'Welcome to',
      instruction: 'To complete your registration, please use the One-Time Password (OTP) below:',
      expiry: 'This OTP will expire in',
      minutes: '15 minutes',
      warning: 'Do not share this OTP with anyone.',
      ignore: 'If you did not initiate this request, please ignore this email or contact our support team.',
      regards: 'Warm regards',
      team: 'Team',
      contact: 'Contact',
      email: 'Email',
      address: 'Address',
      securityTitle: 'Security Notice',
      securityMsg:
        'Never share your OTP, password, or reset links with anyone. Our team will never ask for your credentials.',
      rights: 'All rights reserved',
      visit: 'Visit us'
    },

    mr: {
      greeting: 'प्रिय',
      welcome: 'आपले स्वागत आहे',
      instruction: 'नोंदणी पूर्ण करण्यासाठी खालील एकदाच वापरण्याचा संकेतांक (OTP) वापरा:',
      expiry: 'हा OTP वैध आहे',
      minutes: '१५ मिनिटांसाठी',
      warning: 'हा OTP कोणासोबतही शेअर करू नका.',
      ignore: 'आपण ही विनंती केलेली नसेल, तर कृपया हा ईमेल दुर्लक्षित करा किंवा आमच्या सपोर्ट टीमशी संपर्क साधा.',
      regards: 'सस्नेह',
      team: 'टीम',
      contact: 'संपर्क',
      email: 'ईमेल',
      address: 'पत्ता',
      securityTitle: 'सुरक्षा सूचना',
      securityMsg:
        'आपला OTP, पासवर्ड किंवा रीसेट लिंक कोणासोबतही शेअर करू नका. आमची टीम कधीही तुमची माहिती विचारणार नाही.',
      rights: 'सर्व हक्क राखीव',
      visit: 'आम्हाला भेट द्या'
    }
  };

  const text = t[lang] || t.en;

  return `
<div style="font-family:'Segoe UI', Arial, sans-serif; color:#333; line-height:1.6; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">

  <!-- Logo -->
  <div style="background:#f8f9fb; padding:16px; text-align:center;">
    <a href="https://sushilmaratha.in" target="_blank">
      <img
        src="https://sushilmaratha.in/en-US/images/smLogo.png"
        alt="${process.env.APP_NAME || 'Sushil Maratha Matrimony'}"
        style="height:60px; object-fit:contain;"
      >
    </a>
  </div>

  <!-- Content -->
  <div style="padding:20px;">
    <p>${text.greeting} <strong>${firstName}</strong>,</p>

    <p>
      ${text.welcome} <strong>${process.env.APP_NAME}</strong>!
    </p>

    <p>${text.instruction}</p>

    <!-- OTP Box -->
    <div style="
      font-size:26px;
      font-weight:bold;
      background:#f4f6f8;
      padding:14px 22px;
      display:inline-block;
      border-radius:6px;
      letter-spacing:6px;
      margin:16px 0;
    ">
      ${otp}
    </div>

    <p>
      ${text.expiry} <strong>${text.minutes}</strong>.
    </p>

    <p style="color:#b00020;">
      ⚠️ <strong>${text.warning}</strong>
    </p>

    <p>${text.ignore}</p>

    <p>
      ${text.regards},<br/>
      <strong>${process.env.APP_NAME} ${text.team}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f8f9fb; padding:16px; font-size:12px; color:#555; border-top:1px solid #eee;">
    <p style="margin:6px 0;">
      📞 <strong>${text.contact}:</strong> 9370225218 | 9370220481<br/>
      📧 <strong>${text.email}:</strong> contact@sushilmaratha.in<br/>
      📍 <strong>${text.address}:</strong> Pune – 411045
    </p>

    <p style="margin:10px 0; font-size:11px; color:#777;">
      🔐 <strong>${text.securityTitle}:</strong>
      ${text.securityMsg}
    </p>

    <p style="margin:8px 0; text-align:center; font-size:11px; color:#888;">
      © ${new Date().getFullYear()} ${process.env.APP_NAME}. ${text.rights}.<br/>
      ${text.visit}:
      <a href="https://sushilmaratha.in" target="_blank" style="color:#f16b2b; text-decoration:none;">
        https://sushilmaratha.in
      </a>
    </p>
  </div>

</div>
`;
};


const generateUserIdFromLast = async (gender, cluster) => {
  const prefix = gender.toLowerCase() === 'male' ? 'B' : 'G';

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);

  const checkQuery = `
    SELECT RAW META().id
    FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\`
    WHERE META().id LIKE '${prefix}%'
    ORDER BY TO_NUMBER(
      SUBSTR(
        META().id,
        2,
        POSITION(META().id, '-') - 2
      )
    ) DESC
    LIMIT 1
  `;

  const { rows } = await cluster.query(checkQuery);

  let nextNumber = 1;

  if (rows?.length) {
    const lastId = rows[0];           // e.g. G0007-0126
    const match = lastId.match(/^.\d+-/);

    if (match) {
      nextNumber = parseInt(match[0].slice(1, -1), 10) + 1;
    }
  }

  const counterStr = String(nextNumber).padStart(4, '0');
  return `${prefix}${counterStr}-${month}${year}`;
};


const getLastUserId = async () => {

  const { cluster, collection } = await connectToCouchbase();
  const query = `
    SELECT META(u).id AS id 
    FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u 
    WHERE META(u).id LIKE 'B%' OR META(u).id LIKE 'G%'
    ORDER BY META(u).id DESC 
    LIMIT 1
  `;

  const { rows } = await cluster.query(query);
  return rows.length > 0 ? rows[0].id : null;
};

/**
 * Validate user input
 */
const validateUserInput = (data) => {
  if (!data.firstname || !data.password || !data.confirmPassword) { // || !data.email
    return { error: "Firstname, email, and password fields are required" };
  }
  if (data.email && !validator.isEmail(data.email)) {
    return { error: "Invalid email format" };
  }
  if (data.password !== data.confirmPassword) {
    return { error: "Password and confirm password do not match" };
  }
  // Mobile number validation (Only 10-digit numbers allowed)
  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(data.mobilenumber)) {
    return { error: "Invalid mobile number. It must be a 10-digit number." };
  }

  // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  // if (!passwordRegex.test(data.password)) {
  //   return { error: "Password must contain at least 8 characters, including an uppercase letter, a lowercase letter, a number, and a special character" };
  // }
  return {};
};



// ----------------------------------
// Helper: Hash Refresh Token
// ----------------------------------
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// ----------------------------------
// Cookie Options
// ----------------------------------
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true in production
  sameSite: 'lax',
  path: '/api/auth', // restrict path
};

// ----------------------------------
// 🔐 LOGIN
// ----------------------------------
export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email/Mobile and password are required",
      });
    }

    const { cluster } = await connectToCouchbase();
    if (!cluster) {
      return res.status(500).json({
        message: "Database connection not initialized",
      });
    }

    const query = `
      SELECT META(u).id, u.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u
      WHERE u.status NOT IN ['inactive', 'deleted'] 
      AND (LOWER(u.email) = LOWER($1) OR u.mobilenumber = $2)
      LIMIT 1
    `;

    const { rows } = await cluster.query(query, {
      parameters: [identifier.trim(), identifier.trim()],
    });

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
    const collection = bucket
      .scope(process.env.COUCHBASE_SCOPE)
      .collection(process.env.COUCHBASE_COLLECTION);

    /* =====================================
       🔑 GENERATE TOKENS
    ===================================== */

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    const hashedRefreshToken = hashToken(refreshToken);

    /* =====================================
       💾 STORE HASHED REFRESH TOKEN
    ===================================== */

    await collection.mutateIn(user.id, [
      couchbase.MutateInSpec.upsert(
        "refreshTokens",
        [...(user.refreshTokens || []), hashedRefreshToken],
        { createPath: true }
      ),
    ]);

    /* =====================================
       🍪 COOKIE OPTIONS (PRODUCTION SAFE)
    ===================================== */

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,                 // true in production (HTTPS)
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,       // 7 days
      path: "/"
    });

    /* =====================================
       ✅ RESPONSE
    ===================================== */

    res.status(200).json({
      message: "Login successful",
      accessToken, // frontend keeps this in memory only
      user: {
        userId: user.id,
        firstname: user.personalDetails?.firstname || "",
        lastname: user.personalDetails?.lastName || "",
        email: user.email,
        mobilenumber: user.mobilenumber,
        profileCompletion: user.profileCompletion || 0,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ----------------------------------
// 🔄 REFRESH TOKEN (Rotating + Secure)
// ----------------------------------
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const hashedToken = hashToken(token);

    let payload;

    try {
      payload = jwt.verify(token, process.env.REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    const { cluster } = await connectToCouchbase();
    if (!cluster) {
      return res.status(500).json({ message: "Database connection not initialized" });
    }

    const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
    const collection = bucket
      .scope(process.env.COUCHBASE_SCOPE)
      .collection(process.env.COUCHBASE_COLLECTION);

    const userDoc = await collection.get(payload.id);
    const storedTokens = userDoc.value.refreshTokens || [];

    /* =====================================
       🚨 STOLEN TOKEN DETECTION
    ===================================== */
    if (!storedTokens.includes(hashedToken)) {
      // If token reused → remove ALL tokens (possible theft)
      await collection.mutateIn(payload.id, [
        couchbase.MutateInSpec.upsert("refreshTokens", [])
      ]);

      return res.status(403).json({
        message: "Refresh token reuse detected. Please login again.",
      });
    }

    /* =====================================
       🔄 ROTATE TOKENS
    ===================================== */

    const newAccessToken = jwt.sign(
      { id: payload.id, email: payload.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { id: payload.id, email: payload.email },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    const newHashedToken = hashToken(newRefreshToken);

    // Remove old + Add new
    await collection.mutateIn(payload.id, [
      couchbase.MutateInSpec.arrayRemove("refreshTokens", hashedToken),
      couchbase.MutateInSpec.arrayAppend("refreshTokens", newHashedToken),
    ]);

    /* =====================================
       🍪 UPDATE COOKIE (PRODUCTION SAFE)
    ===================================== */

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    /* =====================================
       ✅ RESPONSE
    ===================================== */

    return res.status(200).json({
      accessToken: newAccessToken,
    });

  } catch (error) {
    console.error("Refresh Error:", error);
    return res.status(403).json({
      message: "Invalid or expired refresh token",
    });
  }
};

// ----------------------------------
// 🚪 LOGOUT (Single Device)
// ----------------------------------
export const logoutUser = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    };

    if (!token) {
      res.clearCookie("refreshToken", cookieOptions);
      return res.status(200).json({ message: "Logged out" });
    }

    let payload;

    try {
      payload = jwt.verify(token, process.env.REFRESH_SECRET);
    } catch (err) {
      // Token expired or invalid — just clear cookie
      res.clearCookie("refreshToken", cookieOptions);
      return res.status(200).json({ message: "Logged out" });
    }

    const hashedToken = hashToken(token);

    const { cluster } = await connectToCouchbase();
    if (cluster) {
      const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
      const collection = bucket
        .scope(process.env.COUCHBASE_SCOPE)
        .collection(process.env.COUCHBASE_COLLECTION);

      await collection.mutateIn(payload.id, [
        couchbase.MutateInSpec.arrayRemove("refreshTokens", hashedToken),
      ]).catch(() => {});
    }

    // Clear cookie properly
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({
      message: "Logged out successfully",
    });

  } catch (error) {
    console.error("Logout Error:", error);

    // Always clear cookie even if error
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logged out",
    });
  }
};


// User Login API
export const loginUser1 = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/Mobile and password are required" });
    }

    // Establish Couchbase connection
    const { cluster } = await connectToCouchbase();
    if (!cluster) {
      return res.status(500).json({ message: "Database connection not initialized" });
    }

    // Retrieve user data using email or mobile number
    const query = `SELECT META(u).id, u.* FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.COUCHBASE_COLLECTION}\` u WHERE u.status != 'inactive' AND u.status != 'deleted'  AND (u.email = $1 OR u.mobilenumber = $2)`;
    const { rows } = await cluster.query(query, { parameters: [identifier, identifier] });
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials OR user is not active!" });
    }

    const user = rows[0];

    // Validate password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log('Login user details' + user.id);
    // Update Last Login value
    
    const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
    const collection = bucket.scope(process.env.COUCHBASE_SCOPE).collection(process.env.COUCHBASE_COLLECTION);

    await collection.mutateIn(user.id, [
      couchbase.MutateInSpec.upsert("lastLogin", new Date().toISOString())
    ]);


    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, id: user.id }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: "1h" } // Token validity
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: 
	  {
		userId : user.id || "",
		firstname: user.personalDetails?.firstname || "",
		lastname: user.personalDetails?.lastName || "",
		email: user.email,
		mobilenumber: user.mobilenumber,
		gender: user.personalDetails?.gender || "",
		profileimg: user?.photoDetails?.profilePicture?.[0]?.filename,
		profileCompletion: user.profileCompletion || "",
		partnerPreferencesDetails : 
		{
			ageRange: user.partnerPreferencesDetails?.ageRange || null,
			religionCastePreferences: user.partnerPreferencesDetails?.religionCastePreferences || null,
			educationPreferences: user.partnerPreferencesDetails?.educationPreferences || null,
			occupationPreferences: user.partnerPreferencesDetails?.occupationPreferences || null,
			locationPreferences: user.partnerPreferencesDetails?.locationPreferences || null,
			languagesPreferences: user.partnerPreferencesDetails?.languagesPreferences || null,
			lifestylePreferences: user.partnerPreferencesDetails?.lifestylePreferences || null
		},
	  }
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

	// Logout API (Token Blacklisting)
	export const logoutUser1 = async (req, res) => {
	  try {
		  const token = req.header("Authorization")?.replace("Bearer ", "");

		  if (!token) {
			  return res.status(400).json({ message: "Token is required for logout" });
		  }

		  // Verify and decode the token
		  let decoded;
		  try {
			  decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode using your JWT secret
		  } catch (err) {
			  return res.status(401).json({ message: "Invalid or expired token" });
		  }

		  const userId = decoded.userId; // Ensure userId is part of the JWT payload
		  const tokenId = `blacklist::${token}`; // Use a unique key for blacklisting tokens

		  const { blacklistCollection } = await connectToCouchbase();
		  // await blacklistCollection.insert(`blacklist::${token}`, { token, blacklistedAt: new Date() }, { expiry: 3600 });
		  
		  // Check if the token is already blacklisted (optional, for preventing redundant operations)
		  const isBlacklisted = await blacklistCollection.get(tokenId).catch(() => null);
		  if (isBlacklisted) {
			  return res.status(409).json({ message: "Token is already blacklisted" });
		  }

		  // Store the blacklisted token in Couchbase with a TTL (time-to-live)
		  await blacklistCollection.insert(tokenId, { token }, { expiry: decoded.exp || 3600 });

		  // Send a success response
		  return res.status(200).json({ message: "Logout successful. Token is blacklisted." });

	  } catch (error) {
		  console.error("Logout Error:", error);
		  return res.status(500).json({ message: "Internal Server Error during logout" });
	  }
	};

  
	// Middleware to check if token is blacklisted
	export const isTokenBlacklisted = async (req, res, next) => {
	  try {
		const token = req.header("Authorization")?.replace("Bearer ", "");
		if (!token) return res.status(401).json({ message: "Unauthorized" });

		const { cluster } = await connectToCouchbase();

		const query = `
		  SELECT token FROM \`${process.env.COUCHBASE_BUCKET}\`
		  .\`${process.env.COUCHBASE_SCOPE}\`
		  .\`blacklisted\`
		  WHERE token = $1 LIMIT 1
		`;

		const { rows } = await cluster.query(query, { parameters: [token] });

		if (rows.length > 0) {
		  return res.status(401).json({
			message: "Token is blacklisted. Please login again."
		  });
		}

		next();
	  } catch (error) {
		console.error("Token Blacklist Check Error:", error);
		res.status(500).json({ message: "Internal Server Error" });
	  }
	};



// Reset Password API - Validate Token & Update Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const { COUCHBASE_BUCKET, COUCHBASE_SCOPE, COUCHBASE_COLLECTION, JWT_SECRET } = process.env;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token and new password are required" });
    }

    // ✅ Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    const userKey = decoded.id;
	console.log('Key = ' + userKey);
    // ✅ Connect to Couchbase
     const { cluster, collection } = await connectToCouchbase();
    if (!cluster || !collection) {
      return res.status(500).json({ success: false, message: "Database connection failed" });
    }

    // ✅ Fetch user document
    let userDoc;
    try {
      const result = await collection.get(userKey);
      userDoc = result.content;
    } catch (err) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
	console.log('Here = ' + userKey);

    // ✅ Validate token info stored in Couchbase
    if (!userDoc.resetToken || userDoc.resetToken !== token) {
      return res.status(400).json({ success: false, message: "Invalid reset token" });
    }

    if (userDoc.used === true) {
      return res.status(400).json({ success: false, message: "Reset token already used" });
    }

    if (new Date(userDoc.tokenexpiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: "Reset token has expired" });
    }

    // ✅ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Update password and mark token as used
    await collection.mutateIn(userKey, [
      couchbase.MutateInSpec.upsert("password", hashedPassword),
      couchbase.MutateInSpec.upsert("used", true),
      couchbase.MutateInSpec.remove("resetToken"),
      couchbase.MutateInSpec.remove("tokencreatedAt"),
      couchbase.MutateInSpec.remove("tokenexpiresAt")
    ]);

    if (userDoc.email) {
	  await sendEmail({
		to: userDoc.email,
		subject: "Your Password Has Been Reset Successfully!",
		html: getPasswordResetSuccessEmailHtml(userDoc, "mr"),
	  });
	}
	
	if (userDoc.contactDetails.whatsappNumber) {
	   /*
		expiryMinutes = 15;
		await sendWhatsappMessage({
			to: `+91${userDoc.contactDetails.whatsappNumber}`,
			type: "template",
			templateName: "smm_otp_verification",
			variables: [otp, req.body.firstname, expiryMinutes],
			language: "en"
		});

		*/
	}
	
    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


// Forgot Password API - Generate Reset Token

export const forgotPassword = async (req, res) => {
  try {
    const {
      COUCHBASE_BUCKET,
      COUCHBASE_SCOPE,
      COUCHBASE_COLLECTION,
      JWT_SECRET,
      APP_BASE_URL,
	  APP_LANG
    } = process.env;

    if (!COUCHBASE_BUCKET || !COUCHBASE_SCOPE || !COUCHBASE_COLLECTION || !JWT_SECRET) {
      return res.status(500).json({ success: false, message: "Missing environment configuration" });
    }

    const { contact } = req.body;
    if (!contact) {
      return res.status(400).json({ success: false, message: "WhatsApp Number or Email is required" });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isPhone = /^(\+?\d{1,3}[- ]?)?\d{10}$/.test(contact);

    if (!isEmail && !isPhone) {
      return res.status(400).json({ success: false, message: "Enter a valid email or WhatsApp number" });
    }

    const { cluster, collection } = await connectToCouchbase();
    if (!cluster || !collection) {
      return res.status(500).json({ success: false, message: "Database connection failed" });
    }

    const query = isEmail
      ? `SELECT META(u).id AS userKey, u.contactDetails.emailAddress AS email, u.personalDetails.firstName as firstname
         FROM \`${COUCHBASE_BUCKET}\`.\`${COUCHBASE_SCOPE}\`.\`${COUCHBASE_COLLECTION}\` u
         WHERE u.contactDetails.emailAddress = $1
         LIMIT 1;`
      : `SELECT META(u).id AS userKey, u.contactDetails.whatsappNumber AS whatsappNumber, u.personalDetails.firstName as firstname
         FROM \`${COUCHBASE_BUCKET}\`.\`${COUCHBASE_SCOPE}\`.\`${COUCHBASE_COLLECTION}\` u
         WHERE u.contactDetails.whatsappNumber = $1
         LIMIT 1;`;

    const { rows } = await cluster.query(query, { parameters: [contact] });
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Unable to find Email ID or WhatsApp number. Please Contact Admin." });
    }

    const user = rows[0];
    const userKey = user.userKey;

    // Generate reset token
    const resetToken = jwt.sign({ id: userKey }, JWT_SECRET, { expiresIn: "15m" });
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);

    await collection.mutateIn(userKey, [
      couchbase.MutateInSpec.upsert("resetToken", resetToken),
      couchbase.MutateInSpec.upsert("tokencreatedAt", startDate.toISOString()),
      couchbase.MutateInSpec.upsert("tokenexpiresAt", endDate.toISOString()),
      couchbase.MutateInSpec.upsert("used", false),
    ]);

    const resetLink = `${APP_BASE_URL || "https://sushilmaratha.in"}/${APP_LANG}/reset-password?token=${resetToken}`;

    if (isEmail) {
	  await sendEmail({
		to: user.email,
		subject: "Password Reset Request",
		html: getPasswordResetEmailHtml({ user, resetLink, lang: 'mr' }),
	  });
	} else 
	{
	  await sendWhatsappMessage({
		to: `+91${user.whatsappNumber}`,
		message: `Hi "${user.firstname}",
		You requested to reset your password.
		Reset link (valid for 15 minutes):
		${resetLink}

		- ${process.env.APP_NAME} Team`,
		  });
	}

    return res.status(200).json({
      success: true,
      message: isEmail
        ? "Password reset email sent successfully. Check your inbox."
        : "Password reset link sent via WhatsApp.",
      resetToken,
      resetLink,
      expiresIn: "15 minutes",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      error: error.message,
    });
  }
};

 // User Registration API with validations
export const registerUserAdmin = async (req, res) => {
  
  try {
    const { username, email, password } = req.body;
    console.log("Incoming Request Body:", req.body); // Debugging log for req.body
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    // Establish Couchbase connection and retrieve collection
    const { cluster,admincollection } = await connectToCouchbase();
    console.log("Collection object:", admincollection); // Debugging log for collection

    if (!admincollection) {
      logger.error("Collection is undefined. Ensure Couchbase connection is correct.");
      return res.status(500).json({ message: "Database collection not initialized" });
    }
    if (!cluster) {
      logger.error("cluster is undefined. Ensure Couchbase connection is correct.");
      return res.status(500).json({ message: "Database cluster not initialized" });
    }
   // Check for existing user by email or mobile number
   const query = `SELECT COUNT(*) AS count FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.ADMINCOUCH_COLLECTION}\` WHERE email = $1 OR mobilenumber = $2`;
   const { rows } = await cluster.query(query, { parameters: [req.body.email, req.body.mobilenumber] });
   if (rows[0].count > 0) {
     return res.status(409).json({ message: "User is already registered" });
   }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    // Prepare user data for insertion
    const userId = `user::${uuidv4()}`; // Generate a unique user ID
    const userData = 
    {
        userId: userId,
        mobilenumber: req.body.mobilenumber,
        email: req.body.email,
        username: req.body.username,
        password: hashedPassword, // Hashed password
        createdAt: new Date(),
    };
    console.log("Admin User Data to Insert:", userData);
    
    // Insert user data
    const insertResult = await admincollection.insert(1, userData);
    console.log("Insert Result:", insertResult);
  
    // Send success response (mask sensitive data)
    return res.status(201).json({
      message: "Admin User registered successfully!",
      user: {
        username: req.body.username,
        email: req.body.email,
        mobilenumber: req.body.mobilenumber,
        createdAt: userData.createdAt
      }
    });
  } catch (error) {
    console.error("Registration Error:", error);
    logger.error(error.message, { timestamp: new Date() }); // Log error with timestamp

    return res.status(500).json({ message: "Internal Server Error" });
  }
};



// User Login API
export const loginUserAdmin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/Mobile and password are required" });
    }

    // Establish Couchbase connection
    const { cluster, admincollection } = await connectToCouchbase();
    if (!cluster) {
      return res.status(500).json({ message: "Database connection not initialized" });
    }

    // Retrieve user data using email or mobile number
    const query = `SELECT META(u).id, u.* FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.ADMINCOUCH_COLLECTION}\` u WHERE u.email = $1 OR u.mobilenumber = $2`;
    const { rows } = await cluster.query(query, { parameters: [identifier, identifier] });
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    // Validate password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log('Login user details' + user.id);

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, id: user.id, role: "admin" }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: "1h" } // Token validity
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        firstname: user.firstname,
        lastname: user.surname,
        email: user.email,
        mobilenumber: user.mobilenumber,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getPasswordResetSuccessEmailHtml = (user, lang = 'en') => {
  const resetTime = new Date().toLocaleString("en-IN");

  const t = {
    en: {
      greeting: 'Hello',
      confirmMsg: 'This is to confirm that your password for',
      success: 'successfully reset',
      matrimonyId: 'Matrimony ID',
      email: 'Email',
      resetTime: 'Reset Time',
      warning:
        'If you did not perform this action, please contact our support team immediately.',
      loginBtn: 'Login to Your Account',
      regards: 'Regards',
      team: 'Team',
      contact: 'Contact',
      address: 'Address',
      securityTitle: 'Security Notice',
      securityMsg:
        'Never share your password, OTP, or reset links with anyone. Our team will never ask for your login credentials.',
      disclaimerTitle: 'Disclaimer',
      disclaimerMsg:
        'This email was sent because your account is registered with',
      rights: 'All rights reserved',
      visit: 'Visit us'
    },

    mr: {
      greeting: 'नमस्कार',
      confirmMsg: 'आपल्या खात्याचा पासवर्ड',
      success: 'यशस्वीरित्या बदलण्यात आला आहे',
      matrimonyId: 'मॅट्रिमोनी आयडी',
      email: 'ईमेल',
      resetTime: 'रीसेट वेळ',
      warning:
        'आपण ही कृती केलेली नसेल, तर कृपया त्वरित आमच्या सपोर्ट टीमशी संपर्क साधा.',
      loginBtn: 'आपल्या खात्यात लॉगिन करा',
      regards: 'सस्नेह',
      team: 'टीम',
      contact: 'संपर्क',
      address: 'पत्ता',
      securityTitle: 'सुरक्षा सूचना',
      securityMsg:
        'आपला पासवर्ड, OTP किंवा रीसेट लिंक कोणासोबतही शेअर करू नका. आमची टीम कधीही तुमची लॉगिन माहिती विचारणार नाही.',
      disclaimerTitle: 'सूचना',
      disclaimerMsg:
        'हा ईमेल आपले खाते नोंदणीकृत असल्यामुळे पाठवण्यात आला आहे',
      rights: 'सर्व हक्क राखीव',
      visit: 'आम्हाला भेट द्या'
    }
  };

  const text = t[lang] || t.en;

  return `
<div style="font-family:'Segoe UI', Arial, sans-serif; color:#333; line-height:1.6; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">

  <!-- Logo -->
  <div style="background:#f8f9fb; padding:16px; text-align:center;">
    <a href="https://sushilmaratha.in" target="_blank">
      <img
        src="https://sushilmaratha.in/en-US/images/smLogo.png"
        alt="${process.env.APP_NAME || 'Sushil Maratha Matrimony'}"
        style="height:60px; object-fit:contain;"
      >
    </a>
  </div>

  <!-- Content -->
  <div style="padding:20px;">
    <p>${text.greeting} <strong>${user.personalDetails.firstName}</strong>,</p>

    <p style="font-size:16px;">
      ${text.confirmMsg}
      <strong>${process.env.APP_NAME}</strong>
      <strong style="color:#28a745;">${text.success}</strong>.
    </p>

    <div style="background:#f4f6f8; padding:16px; border-radius:6px; margin:16px 0;">
      <p style="margin:6px 0;"><strong>${text.matrimonyId}:</strong> ${user.userId}</p>
      <p style="margin:6px 0;"><strong>${text.email}:</strong> ${user.email}</p>
      <p style="margin:6px 0;"><strong>${text.resetTime}:</strong> ${resetTime}</p>
    </div>

    <p>${text.warning}</p>

    <p style="text-align:center; margin:24px 0;">
      <a href="https://sushilmaratha.in/en-US/welcome"
         target="_blank"
         style="background:#f16b2b; color:#fff; text-decoration:none; padding:12px 28px; border-radius:6px; font-weight:bold; display:inline-block;">
        ${text.loginBtn}
      </a>
    </p>

    <p>
      ${text.regards},<br/>
      <strong>${process.env.APP_NAME} ${text.team}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f8f9fb; padding:16px; font-size:12px; color:#555; border-top:1px solid #eee;">
    <p style="margin:6px 0;">
      📞 <strong>${text.contact}:</strong> 9370225218 | 9370220481<br/>
      📧 <strong>${text.email}:</strong> contact@sushilmaratha.in<br/>
      📍 <strong>${text.address}:</strong> Pune – 411045
    </p>

    <p style="margin:10px 0; font-size:11px; color:#777;">
      🔐 <strong>${text.securityTitle}:</strong> ${text.securityMsg}
    </p>

    <p style="margin:10px 0; font-size:11px; color:#777;">
      ⚠️ <strong>${text.disclaimerTitle}:</strong>
      ${text.disclaimerMsg} ${process.env.APP_NAME}.
    </p>

    <p style="margin:8px 0; text-align:center; font-size:11px; color:#888;">
      © ${new Date().getFullYear()} ${process.env.APP_NAME}. ${text.rights}.<br/>
      ${text.visit}:
      <a href="https://sushilmaratha.in" target="_blank" style="color:#f16b2b; text-decoration:none;">
        https://sushilmaratha.in
      </a>
    </p>
  </div>

</div>
`;
};


export const getPasswordResetEmailHtml = ({
  user,
  resetLink,
  lang = 'mr'
}) => {
  const t = {
    en: {
      greeting: 'Hello',
      title: 'Password Reset Request',
      message:
        'We received a request to reset the password for your account on',
      instruction: 'Click the button below to reset your password:',
      button: 'Reset Password',
      expiry: 'This link will expire in 15 minutes.',
      ignore:
        'If you did not request a password reset, please ignore this email.',
      regards: 'Regards',
      team: 'Team',
      contact: 'Contact',
      address: 'Address',
      securityTitle: 'Security Notice',
      securityMsg:
        'Never share your password or reset links with anyone. Our team will never ask for your credentials.',
      visit: 'Visit us'
    },

    mr: {
      greeting: 'नमस्कार',
      title: 'पासवर्ड रीसेट विनंती',
      message:
        'आपल्या खात्यासाठी पासवर्ड बदलण्याची विनंती प्राप्त झाली आहे',
      instruction: 'खालील बटणावर क्लिक करून आपला पासवर्ड बदला:',
      button: 'पासवर्ड रीसेट करा',
      expiry: 'ही लिंक १५ मिनिटांनंतर कालबाह्य होईल.',
      ignore:
        'आपण ही विनंती केलेली नसेल, तर कृपया हा ईमेल दुर्लक्ष करा.',
      regards: 'सस्नेह',
      team: 'टीम',
      contact: 'संपर्क',
      address: 'पत्ता',
      securityTitle: 'सुरक्षा सूचना',
      securityMsg:
        'आपला पासवर्ड किंवा रीसेट लिंक कोणालाही देऊ नका. आमची टीम कधीही तुमची माहिती विचारणार नाही.',
      visit: 'आम्हाला भेट द्या'
    }
  };

  const text = t[lang] || t.en;

  return `
<div style="font-family:'Segoe UI', Arial, sans-serif; color:#333; line-height:1.6; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">

  <!-- Logo -->
  <div style="background:#f8f9fb; padding:16px; text-align:center;">
    <a href="https://sushilmaratha.in" target="_blank">
      <img
        src="https://sushilmaratha.in/en-US/images/smLogo.png"
        alt="${process.env.APP_NAME || 'Sushil Maratha Matrimony'}"
        style="height:60px; object-fit:contain;"
      >
    </a>
  </div>

  <!-- Content -->
  <div style="padding:20px;">
    <p>${text.greeting} <strong>${user.firstname}</strong>,</p>

    <h3 style="margin-top:0; color:#222;">${text.title}</h3>

    <p>
      ${text.message}
      <strong>${process.env.APP_NAME}</strong>.
    </p>

    <p>${text.instruction}</p>

    <p style="text-align:center; margin:24px 0;">
      <a href="${resetLink}"
         target="_blank"
         style="background:#f16b2b; color:#fff; text-decoration:none; padding:12px 30px; border-radius:6px; font-weight:bold; display:inline-block;">
        ${text.button}
      </a>
    </p>

    <p><strong>${text.expiry}</strong></p>

    <p>${text.ignore}</p>

    <p>
      ${text.regards},<br/>
      <strong>${process.env.APP_NAME} ${text.team}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f8f9fb; padding:16px; font-size:12px; color:#555; border-top:1px solid #eee;">
    <p style="margin:6px 0;">
      📞 <strong>${text.contact}:</strong> 9370225218 | 9370220481<br/>
      📧 <strong>Email:</strong> contact@sushilmaratha.in<br/>
      📍 <strong>${text.address}:</strong> Pune – 411045
    </p>

    <p style="margin:10px 0; font-size:11px; color:#777;">
      🔐 <strong>${text.securityTitle}:</strong> ${text.securityMsg}
    </p>

    <p style="margin:8px 0; text-align:center; font-size:11px; color:#888;">
      © ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.<br/>
      ${text.visit}:
      <a href="https://sushilmaratha.in"
         target="_blank"
         style="color:#f16b2b; text-decoration:none;">
        https://sushilmaratha.in
      </a>
    </p>
  </div>

</div>
`;
};
