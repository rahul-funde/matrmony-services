// By Rahul Funde
// Date: 2025-03-15
// Purpose: Defines authentication routes including user registration.
const rateLimit = require('express-rate-limit');

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 registration requests per windowMs
  message: "Too many registration attempts from this IP, please try again later.",
});

const express = require("express");
const { 
      registerUser, 
      loginUser, 
      logoutUser,
      authenticateToken, 
      forgotPassword, 
      resetPassword, 
      registerUserAdmin,
      loginUserAdmin,
	  verifyUserOtp,
	  resendUserOtp,
	  refreshToken
  } = require("../controllers/auth.controller");
const router = express.Router();

// Route for user registration
router.post("/register", registerUser);

// Route for user login
router.post("/login", loginUser);

// Route for user logout
router.post("/logout", logoutUser);

// Route for Forgot Password
router.post("/forgot-password", forgotPassword);

// Route for Reset Password
router.post("/reset-password", resetPassword);

// Route for Admin user registration
router.post("/AdminUserRegistration", registerLimiter, registerUserAdmin);

// Route for user login
router.post("/loginUserAdmin", registerLimiter, loginUserAdmin);
router.post("/verify-otp", verifyUserOtp);
router.post("/resend-otp", resendUserOtp);

//router.post("/logout", logoutUser);
router.post("/token", refreshToken);

module.exports = router;
