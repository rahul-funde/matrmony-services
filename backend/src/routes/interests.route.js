
const express = require("express");
const {updateInterestStatus, getInterests} = require('../controllers/interest.controller');

const verifyToken = require('../middlewares/jwtMiddleware'); // Import JWT middle
const router = express.Router();

router.post('/updateInterestStatus', verifyToken, updateInterestStatus);
router.get('/getInterests', verifyToken, getInterests);
module.exports = router;