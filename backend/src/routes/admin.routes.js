// By Rahul Funde
// Date: 2025-03-15
// Purpose: Defines authentication routes including user registration.
const rateLimit = require('express-rate-limit');
const verifyToken = require('../middlewares/jwtMiddleware'); // Import JWT middle
const { requireAdmin } = require('../middlewares/auth');

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 registration requests per windowMs
  message: "Too many registration attempts from this IP, please try again later.",
});

const express = require("express");
const { 
    DashboardSummary,
    DashboardUserDetails,
    updateUserPlan,
    updateUserStatus,
    getUserProfile,
	DeleteUserByUserId,
	updateUserProfile,
	updatePasswordByAdmin,
	searchProfiles,
	extendFemalePlans
  } = require("../controllers/admindashboard.controller");
const router = express.Router();

// Route for getAdmin Dashboard statistics..
router.use(verifyToken, requireAdmin);

router.get('/adminStats', DashboardSummary);
router.get('/userDetails', DashboardUserDetails);
router.post('/searchProfiles', searchProfiles);

router.put('/updatePlan', updateUserPlan);
router.put('/updateStatus', updateUserStatus);
router.get('/getUserProfile/:id', getUserProfile);
router.delete('/DeleteUser/:userId', DeleteUserByUserId);
router.put('/updateProfileById/:id', updateUserProfile);
router.put('/updatePasswordByAdmin/:id', updatePasswordByAdmin);
router.post('/extendFemalePlans', extendFemalePlans);

module.exports = router;
