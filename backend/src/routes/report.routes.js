const express = require("express");
const {
  getRevenueReport,
  getRevenueSummary,
  getRevenueByDay,
  getRevenueByPeriod
} = require("../controllers/report.controller");

const router = express.Router();

router.get("/revenue", getRevenueReport);
router.get("/revenue/summary", getRevenueSummary);
router.get("/revenue/by-day", getRevenueByDay);
router.get("/revenue/period", getRevenueByPeriod);

module.exports = router;
