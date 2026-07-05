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
const {updateUserProfile, getUserProfile, searchProfile, searchProfilesAdv, fetchLocationByPincode, saveDraft} = require('../controllers/userprofile.controller');
const {getProfileUtility} = require('../controllers/utility.controller');

const verifyToken = require('../middlewares/jwtMiddleware'); // Import JWT middle
const router = express.Router();

// Reuse Multer setup
// const upload = require('../middlewares/upload.middleware'); // Move Multer config to a reusable file

// router.get("/profile", authenticateToken, (req, res) => {
//     res.json({ message: "Protected profile data", user: req.user });
// });

const multer = require('multer');
const path = require('path');

  // Configure multer
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/'); // Ensure this folder exists and is writable
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
  // const upload = multer({ storage: multer.memoryStorage() }); // or diskStorage if saving to disk


  const upload = multer({ storage });


// router.put('/updateProfile',  verifyToken, upload.any(), updateUserProfile);
router.put('/updateProfile',  verifyToken, updateUserProfile);
router.put('/saveDraft',  verifyToken, saveDraft);

router.get('/getUserProfile', verifyToken, getUserProfile);
router.get('/profileUtility', verifyToken, getProfileUtility);
router.post('/search-profile', verifyToken, searchProfile);
router.post('/AdvprofileSearch', verifyToken, searchProfilesAdv);
router.get("/pincode/:pincode", verifyToken, fetchLocationByPincode);



module.exports = router;
