import {
  revenueByPlanAndMode,
  revenueSummary,
  revenueByDay,
  revenueByPeriod
} from "../services/report.service.js";

/**
 * GET /api/reports/revenue
 * Revenue by Plan + Payment Mode
 * Optional: planId filter
 */
export const getRevenueReport = async (req, res) => {
  try {
    const { fromDate, toDate, planId } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "fromDate and toDate are required",
      });
    }

    const data = await revenueByPlanAndMode(fromDate, toDate, planId);
    res.json({ success: true, data });

  } catch (err) {
    console.error("Revenue Report Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/reports/revenue/summary
 * Revenue summary for dashboard
 * Optional: planId filter
 */
export const getRevenueSummary = async (req, res) => {
  try {
    const { fromDate, toDate, planId } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "fromDate and toDate are required",
      });
    }

    const data = await revenueSummary(fromDate, toDate, planId);
    res.json({ success: true, data });

  } catch (err) {
    console.error("Revenue Summary Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/reports/revenue/by-day
 * Revenue by Day (charts)
 * Optional: planId filter
 */
export const getRevenueByDay = async (req, res) => {
  try {
    const { fromDate, toDate, planId } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "fromDate and toDate are required",
      });
    }

    const data = await revenueByDay(fromDate, toDate, planId);
    res.json({ success: true, data });

  } catch (err) {
    console.error("Revenue By Day Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export const getRevenueByPeriod = async (req, res) => {
  try {
    const { fromDate, toDate, groupBy } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "fromDate and toDate are required"
      });
    }

    const data = await revenueByPeriod(fromDate, toDate, groupBy);
    res.json({ success: true, data });

  } catch (err) {
    console.error("Revenue By Period Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};