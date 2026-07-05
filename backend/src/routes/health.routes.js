const express = require("express");
const { connectToCouchbase } = require("../config/db.config");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

router.get("/ready", async (req, res, next) => {
  try {
    await connectToCouchbase();
    res.json({
      success: true,
      status: "ready",
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  } catch (error) {
    error.status = 503;
    next(error);
  }
});

module.exports = router;
