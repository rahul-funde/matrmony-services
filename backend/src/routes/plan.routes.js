const express = require("express");
const { 
   createPlan,
   getPlans,
   getPlanById,
   updatePlan,
   deletePlan,
   purchasePlan,
   upgradePlan,
   getPlanStatus,
   renewPlan,
   deductContact,
   resetContacts,
   incrementContactLimit,
   expirePlansAPI,
   expirePlansCron 
  } = require("../controllers/plan.controller");
const router = express.Router();
const verifyToken = require('../middlewares/jwtMiddleware'); // Import JWT middle
const { requireAdmin } = require('../middlewares/auth');

// Route for getAdmin Dashboard statistics..
router.post('/createPlan', verifyToken, requireAdmin, createPlan);
router.get('/getPlans', verifyToken, getPlans);
router.get('/getPlansById/:id', getPlanById);
router.put('/updatePlan/:id', verifyToken, requireAdmin, updatePlan);
router.delete('/deletePlan/:id', verifyToken, requireAdmin, deletePlan);
router.post('/purchasePlan', verifyToken, purchasePlan);
router.post('/upgradePlan', verifyToken, upgradePlan);
router.get('/userplanStatus/:userId', verifyToken, getPlanStatus);
router.post('/userplanRenew', verifyToken, renewPlan);
router.post('/deductContact', verifyToken, deductContact);
router.post('/resetContacts', verifyToken, requireAdmin, resetContacts);
router.post("/expirePlans", verifyToken, requireAdmin, expirePlansAPI);

// POST /incrementContactLimit
router.post("/incrementContactLimit", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userIds, planIds, incrementBy } = req.body;

    if (incrementBy && typeof incrementBy !== "number") {
      return res.status(400).json({ error: "incrementBy must be a number" });
    }

    // Call controller function with request parameters
    const updatedPlans = await incrementContactLimit({
      userIds: Array.isArray(userIds) ? userIds : [],
      planIds: Array.isArray(planIds) ? planIds : [],
      incrementBy: incrementBy || 5
    });

    res.json({
      success: true,
      message: "Contact limits incremented successfully.",
      updatedPlans
    });
  } catch (err) {
    console.error("Increment Contact Limit API Error:", err);
    res.status(500).json({ error: err.message });
  }
});
// Trigger Plan Expiry Cron Manually
router.post("/triggerPlanExpiry", verifyToken, requireAdmin, async (req, res) => {
  try {
    await expirePlansCron(); // call the same logic
    res.json({
      success: true,
      message: "Plan Expiry Cron executed successfully"
    });
  } catch (err) {
    console.error("Error executing Plan Expiry Cron:", err);
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
