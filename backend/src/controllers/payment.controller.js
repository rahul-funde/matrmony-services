import axios from 'axios';
import couchbase from 'couchbase';
import { connectToCouchbase } from '../config/db.config.js';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';


export const createOrder = async (req, res) => 
{
    const { amount, currency } = req.body;

    try {
        const response = await axios.post(
            'https://api.razorpay.com/v1/orders',
            {
                amount: amount * 100, // amount in paise
                currency: currency || 'INR',
                payment_capture: 1,
            },
            {
                auth: {
                    username: process.env.RAZORPAY_KEY_ID,
                    password: process.env.RAZORPAY_KEY_SECRET
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: 'Unable to create order' });
    }
};



// Offline QR payment submission + purchase plan
export const submitOfflineQRPayment = async (req, res) => {
  try {
    const { 
		cluster, 
		paymentCollection,     
		collection,
		planCollection,
		userPlanCollection,
		planLogCollection 
	} = await connectToCouchbase();
    const { userId, planId, amount, paymentMode, remarks, contactPolicy } = req.body;
    const receiptFile = req.file;
	const contactPolicys = JSON.parse(contactPolicy);

    if (!userId || !planId || !amount || !receiptFile) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
	
const pendingCheckQuery = `
  SELECT p.*
  FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.payments AS p
  WHERE p.userId = $userId
    AND p.planId = $planId
    AND p.status = "pending"
  LIMIT 1;
`;

const pendingResult = await cluster.query(pendingCheckQuery, {
  parameters: { userId, planId }
});

// If any pending request exists, block new submission
if (pendingResult.rows.length > 0) {
  return res.status(400).json({
    error: "You already have a pending request for this plan. Please wait for approval."
  });
}


    console.log('req.body', req.body);

    // Ensure public/payments directory exists
    const uploadDir = path.resolve('./public/uploads/payments');
    await fs.mkdir(uploadDir, { recursive: true });

    // Move uploaded file to public/payments
    const fileName = `${Date.now()}_${receiptFile.originalname}`;
    const targetPath = path.join(uploadDir, fileName);
    await fs.rename(receiptFile.path, targetPath);

    // Save relative path so it can be accessed via URL
    const relativePath = `/uploads/payments/${fileName}`;
    console.log('relativePath = ' + relativePath);

    const paymentDoc = {
      type: 'offlineQRPayment',
      userId,
      planId,
      amount: parseFloat(amount),
      paymentMode: paymentMode || 'offline',
      receiptPath: relativePath, // relative path for frontend access
      remarks: remarks || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
	  contactPolicy : contactPolicys || '',
    };

    const paymentKey = `payment::${userId}::${Date.now()}`;
    await paymentCollection.upsert(paymentKey, paymentDoc);

    // -----------------------------
    // Automatically purchase plan
    // -----------------------------


    // Fetch user
    let userDoc;
    try {
      userDoc = await collection.get(userId);
    } catch (err) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userDoc.value;

    // Fetch plan
    let planDoc;
    try {
      planDoc = await planCollection.get(planId);
    } catch (err) {
      return res.status(404).json({ error: "Plan not found" });
    }
    const plan = planDoc.value;

    // Check for active plan
    let activePlan = null;
    try {
      const resQuery = await cluster.query(
        `
        SELECT p.* 
        FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.\`${process.env.USER_PLAN_COLLECTION}\` AS p
        WHERE p.userId = $userId AND p.status = "active"
        LIMIT 1;
        `,
        { parameters: { userId } }
      );
      if (resQuery.rows.length > 0) activePlan = resQuery.rows[0];
    } catch (err) {
      console.error("Failed checking active plan", err);
    }

    if (activePlan && new Date(activePlan.endDate) > new Date()) {
      return res.status(409).json({
        error: "User already has an active plan",
        activePlan
      });
    }

    // Calculate start/end dates
	const startDate = new Date();
	const durationMonths = parseInt(plan.duration, 10);

	// 30 days per month rule
	const daysToAdd = durationMonths * 30;

	const endDate = new Date(startDate);
	endDate.setDate(startDate.getDate() + daysToAdd);


    const userPlanDoc = {
      userId,
      planId,
      planName: plan.name,
      duration: plan.duration,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      contactLimit: plan.contactLimit || 0,
      contactUsed: 0,
      features: plan.features || [],
      price: plan.price,
      status: "pending",
      createdAt: startDate.toISOString(),
      updatedAt: startDate.toISOString(),
      paymentId: paymentKey,
      paymentAmount: parseFloat(amount),
      paymentMode: paymentMode || "offline",
	  contactPolicy : contactPolicys || '',
    };

    const userPlanKey = `userplan::${userId}`;
   // await userPlanCollection.upsert(userPlanKey, userPlanDoc);

    // Add plan log
    const logKey = `planlog::${crypto.randomUUID()}`;
    const logDoc = {
      type: "plan_purchase",
      userId,
      userMobile: user.mobilenumber,
      userEmail: user.email,
      planId,
      planName: plan.name,
      paymentId: paymentKey,
      amount: parseFloat(amount),
      mode: paymentMode || "offline",
      startDate: userPlanDoc.startDate,
      endDate: userPlanDoc.endDate,
      createdAt: new Date().toISOString(),
	  contactPolicy : contactPolicys || '',
    };
    await planLogCollection.insert(logKey, logDoc);

    // -----------------------------
    // Response
    // -----------------------------
    return res.status(201).json({
      success: true,
      message: "Offline payment submitted and plan purchased successfully",
      paymentId: paymentKey,
      receiptUrl: relativePath,
      plan: userPlanDoc
    });

  } catch (error) {
    console.error('Offline QR payment failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to submit offline payment' });
  }
};


export const getPendingOfflinePayments = async (req, res) => {
  try {
	const status = req.query.status || "pending";  // default
	const { 
		cluster, 
		paymentCollection,     
		collection,
		planCollection,
		userPlanCollection,
		planLogCollection 
	} = await connectToCouchbase();
	
    const q = `
      SELECT 
        META(p).id AS paymentId,
        p.*,
        u.name AS userName,
        u.email AS userEmail,
        u.mobilenumber AS userMobile,
        pl.name AS planName,
        pl.price AS planPrice,
        pl.duration AS planDuration
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.payments p
      JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.users u ON KEYS p.userId
      JOIN \`${process.env.COUCHBASE_BUCKET}\`.\`${process.env.COUCHBASE_SCOPE}\`.plans pl ON KEYS p.planId
      WHERE p.type = "offlineQRPayment"
      AND p.status = $status
      ORDER BY p.createdAt DESC;`;
	  
    const result = await cluster.query(q, { parameters: { status } });

    res.json({
      success: true,
      payments: result.rows
    });

  } catch (err) {
    console.error("Error loading payments:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


/*
export const approveOfflinePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const adminId = req.userId || "system"; // if logged in admin

    const { cluster, paymentCollection, userPlanCollection, planCollection, planLogCollection } = await connectToCouchbase();

    // 1️⃣ Fetch payment
    let paymentDoc;
    try {
      paymentDoc = await paymentCollection.get(paymentId);
    } catch {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const payment = paymentDoc.value;

    // Validation
    if (payment.paymentMode !== "offline-qr") {
      return res.status(400).json({ success: false, message: "Only offline payments can be approved" });
    }

    if (payment.adminStatus === "approved") {
      return res.status(400).json({ success: false, message: "Payment already approved" });
    }

    // 2️⃣ Fetch plan
    let planDoc;
    try {
      planDoc = await planCollection.get(payment.planId);
    } catch {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const plan = planDoc.value;

    // 3️⃣ Check if user already has active plan
    const userPlanKey = `userplan::${payment.userId}`;
    let existingPlan = null;

    try {
      const up = await userPlanCollection.get(userPlanKey);
      existingPlan = up.value;
    } catch {
      existingPlan = null;
    }

    const now = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + Number(plan.duration));

    // 4️⃣ Prepare new plan
    const newPlan = {
      userId: payment.userId,
      planId: payment.planId,
      planName: plan.name,
      duration: plan.duration,
      startDate: now.toISOString(),
      endDate: end.toISOString(),
      contactLimit: plan.contactLimit,
	  contactPolicy : plan.contactPolicy,
      contactUsed: 0,
      features: plan.features,
      price: plan.price,
      status: "active",
      paymentId,
      paymentMode: payment.paymentMode,
      createdAt: existingPlan ? existingPlan.createdAt : now.toISOString(),
      updatedAt: now.toISOString()
    };

    // 5️⃣ Insert or Update plan
    await userPlanCollection.upsert(userPlanKey, newPlan);

    // 6️⃣ Update payment status
    await paymentCollection.mutateIn(paymentId, [
      couchbase.MutateInSpec.upsert("status", "approved"),
      couchbase.MutateInSpec.upsert("approvedAt", now.toISOString()),
      couchbase.MutateInSpec.upsert("approvedBy", adminId)
    ]);

// 7️⃣ Add plan log with approval details
	const logKey = `planlog::${crypto.randomUUID()}`;
	const logDoc = {
	  type: "plan_purchase",
	  userId: payment.userId,
	 
	  planId: plan.id || payment.planId,
	  planName: plan.name,
	  paymentId: paymentId,
	  amount: payment.amount || plan.price,
	  mode: payment.paymentMode || "offline",
	  startDate: newPlan.startDate,
	  endDate: newPlan.endDate,
	  status: "approved",
	  approvedAt: now.toISOString(),
	  approvedBy: adminId,
	  createdAt: now.toISOString()
	};
	await planLogCollection.insert(logKey, logDoc);



    res.json({
      success: true,
      message: "Offline payment approved & plan activated successfully",
      plan: newPlan
    });

  } catch (err) {
    console.error("Approve Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}; */


export const approveOfflinePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const adminId = req.userId || "system"; // Admin or system

    const { cluster, paymentCollection, userPlanCollection, planCollection, planLogCollection } = await connectToCouchbase();

    // 1️⃣ Fetch payment
    let paymentDoc;
    try {
      paymentDoc = await paymentCollection.get(paymentId);
    } catch {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    const payment = paymentDoc.value;

    if (payment.paymentMode !== "offline-qr") {
      return res.status(400).json({ success: false, message: "Only offline payments can be approved" });
    }
    if (payment.adminStatus === "approved") {
      return res.status(400).json({ success: false, message: "Payment already approved" });
    }

    // 2️⃣ Fetch plan
    let planDoc;
    try {
      planDoc = await planCollection.get(payment.planId);
    } catch {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }
    const plan = planDoc.value;

    // 3️⃣ Fetch existing user plan (if any)
    const userPlanKey = `userplan::${payment.userId}`;
    let existingPlan = null;
    try {
      const up = await userPlanCollection.get(userPlanKey);
      existingPlan = up.value;
    } catch {
      existingPlan = null;
    }

    // 4️⃣ Prepare dates
    const now = new Date();
    const startDate = now.toISOString();
    const end = new Date();
    end.setMonth(end.getMonth() + Number(plan.duration));
    const endDate = end.toISOString();

    // 5️⃣ Initialize contactUsed with carryForward logic
    const policy = plan.contactPolicy || {};
    const today = startDate.split("T")[0];
    const weekStart = getWeekStartDate(now);
    const month = startDate.slice(0, 7); // YYYY-MM

    const contactUsed = {
      dailyUsed: 0,
      weeklyUsed: 0,
      monthlyUsed: 0,
      totalUsed: 0,
      dailyDate: today,
      weekStartDate: weekStart,
      month: month
    };

    // If user already has a plan and carryForward = true
    if (existingPlan && policy.carryForward) {
      const prevUsage = existingPlan.contactUsed || {};
      // Carry forward unused daily
      if (prevUsage.dailyUsed != null && policy.dailyLimit != null) {
        contactUsed.dailyUsed = Math.max(0, policy.dailyLimit - prevUsage.dailyUsed) * -1;
      }
      // Carry forward unused weekly
      if (prevUsage.weeklyUsed != null && policy.weeklyLimit != null) {
        contactUsed.weeklyUsed = Math.max(0, policy.weeklyLimit - prevUsage.weeklyUsed) * -1;
      }
      // Carry forward unused monthly
      if (prevUsage.monthlyUsed != null && policy.monthlyLimit != null) {
        contactUsed.monthlyUsed = Math.max(0, policy.monthlyLimit - prevUsage.monthlyUsed) * -1;
      }
      // TotalUsed is cumulative
      contactUsed.totalUsed = prevUsage.totalUsed || 0;
    }

    // 6️⃣ Prepare new user plan
    const newPlan = {
      userId: payment.userId,
      planId: payment.planId,
      planName: plan.name,
      duration: plan.duration,
      startDate,
      endDate,
      contactPolicy: policy,
      contactUsed,
      features: plan.features || [],
      price: plan.price,
      status: "active",
      paymentId,
      paymentMode: payment.paymentMode,
      createdAt: existingPlan ? existingPlan.createdAt : startDate,
      updatedAt: now.toISOString()
    };

    // 7️⃣ Upsert user plan
    await userPlanCollection.upsert(userPlanKey, newPlan);

    // 8️⃣ Update payment status
    await paymentCollection.mutateIn(paymentId, [
      couchbase.MutateInSpec.upsert("status", "approved"),
      couchbase.MutateInSpec.upsert("approvedAt", now.toISOString()),
      couchbase.MutateInSpec.upsert("approvedBy", adminId)
    ]);

    // 9️⃣ Add plan log
    const logKey = `planlog::${crypto.randomUUID()}`;
    const logDoc = {
      type: "plan_purchase",
      userId: payment.userId,
      planId: plan.id || payment.planId,
      planName: plan.name,
      paymentId,
      amount: payment.amount || plan.price,
      mode: payment.paymentMode || "offline",
      startDate,
      endDate,
      status: "approved",
      approvedAt: now.toISOString(),
      approvedBy: adminId,
      contactPolicy: policy,
      createdAt: now.toISOString()
    };
    await planLogCollection.insert(logKey, logDoc);

    res.json({
      success: true,
      message: "Offline payment approved & plan activated successfully",
      plan: newPlan
    });

  } catch (err) {
    console.error("Approve Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Helper: get Monday of current week
function getWeekStartDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff)).toISOString().split("T")[0]; // YYYY-MM-DD
}




export const rejectOfflinePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason, userId } = req.body;
	const adminId = userId || "system"; // if logged in admin


    if (!reason) {
      return res.status(400).json({ success: false, message: "Reason is required" });
    }

    const { paymentCollection } = await connectToCouchbase();

    // Fetch payment
    let paymentDoc;
    try {
      paymentDoc = await paymentCollection.get(paymentId);
    } catch {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    // Already approved/rejected?
    if (paymentDoc.value.status === "approved") {
      return res.status(400).json({ success: false, message: "Payment already approved" });
    }
    if (paymentDoc.value.status === "rejected") {
      return res.status(400).json({ success: false, message: "Payment already rejected" });
    }

    // Update payment status
    await paymentCollection.mutateIn(paymentId, [
      couchbase.MutateInSpec.upsert("status", "rejected"),
      couchbase.MutateInSpec.upsert("rejectReason", reason),
      couchbase.MutateInSpec.upsert("rejectedAt", new Date().toISOString()),
	  couchbase.MutateInSpec.upsert("rejectedBy", adminId)
    ]);

    return res.json({
      success: true,
      message: "Payment rejected successfully",
      rejectReason: reason
    });

  } catch (err) {
    console.error("Reject Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

