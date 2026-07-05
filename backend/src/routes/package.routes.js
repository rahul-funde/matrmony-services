const express = require("express");
const {createPackage} = require('../controllers/packages.controller');

const verifyToken = require('../middlewares/jwtMiddleware'); // Import JWT middle
const router = express.Router();

router.post('/createPackage', verifyToken, createPackage);
module.exports = router;