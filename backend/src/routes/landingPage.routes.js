// By Rahul Funde
// Date: 2025-03-15
// Purpose: Defines authentication routes including user registration.
const express = require("express");
const { getData,searchProfiles, sendContactMail } = require("../controllers/landingPage.controller");
const router = express.Router();

// Route for getAdmin Dashboard statistics..
router.get('/search', getData);
router.post('/searchProfiles', searchProfiles);
router.post('/contactUs', sendContactMail);


module.exports = router;