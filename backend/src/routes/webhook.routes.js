// File: routes/razorpayWebhook.route.js

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { connectToCouchbase } = require("../config/db.config");

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const BUCKET = process.env.COUCHBASE_BUCKET;

/**
 * =====================================================================
 *  COMMON HELPER — VERIFY SIGNATURE
 * =====================================================================
 */
function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return signature === expected;
}

/**
 * =====================================================================
 *      AUTO-RENEW WEBHOOK: /webhooks/razorpay-webhook
 * =====================================================================
 */
router.post(
  "/razorpay-webhook",
  express.raw({ type: "application/json" }),

  async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      if (!signature) {
        return res.status(400).json({ error: "Missing signature" });
      }

      // Validate signature
      if (!verifyWebhookSignature(req.body, signature)) {
        console.log("❌ Invalid Razorpay signature");
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Parse JSON safely
      let event;
      try {
        event = JSON.parse(req.body.toString());
      } catch (err) {
        console.error("❌ Invalid JSON:", err);
        return res.status(400).json({ error: "Invalid JSON body" });
      }

      const eventType = event.event;
      const payment = event.payload?.payment?.entity;

      console.log(`🔔 Webhook Event Received → ${eventType}`);

      if (eventType !== "payment.captured") {
        return res.json({ success: true, ignored: true });
      }

      if (!payment?.receipt) {
        return res
          .status(400)
          .json({ error: "Receipt missing from payment payload" });
      }

      /**
       * RECEIPT FORMAT:
       *    yourapp::PLANID::USERID
       */
      const parts = payment.receipt.split("::");
      if (parts.length !== 3) {
        return res.status(400).json({ error: "Invalid receipt format" });
      }

      const planId = parts[1];
      const userId = parts[2];
      const paymentId = payment.id;

      // Couchbase Collections
      const { cluster, userPlanCollection, planLogCollection } =
        await connectToCouchbase();

      /**
       * =============================================================
       *              IDEMPOTENCY CHECK
       * =============================================================
       */
      const renewalKey = `renewal::${paymentId}`;

      const alreadyProcessed = await planLogCollection
        .get(renewalKey)
        .catch(() => null);

      if (alreadyProcessed) {
        console.log("⚠️ Duplicate webhook ignored");
        return res.json({ success: true, duplicate: true });
      }

      /**
       * =============================================================
       *        FETCH USER PLAN DOCUMENT
       * =============================================================
       */
      const query = `
        SELECT META(p).id AS docId, p.*
        FROM \`${BUCKET}\`.\`users\`.\`user_plans\` AS p
        WHERE p.userId = $userId AND p.planId = $planId
        LIMIT 1
      `;

      const { rows } = await cluster.query(query, {
        parameters: { userId, planId },
      });

      if (!rows.length) {
        console.log("❌ User plan not found");
        return res.status(404).json({ error: "User plan not found" });
      }

      const planDoc = rows[0];
      const now = new Date();

      const newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + Number(planDoc.duration));

      // Prepare updated plan
      const updatedPlan = {
        ...planDoc,
        startDate: now.toISOString(),
        endDate: newEndDate.toISOString(),
        status: "active",
        updatedAt: now.toISOString(),
        razorpayPaymentId: paymentId,
        lastPaidAmount: payment.amount / 100,
      };

      /**
       * =============================================================
       *     UPDATE USER PLAN + CREATE RENEWAL LOG
       * =============================================================
       */
      await userPlanCollection.upsert(planDoc.docId, updatedPlan);

      await planLogCollection.upsert(renewalKey, {
        type: "auto_renew",
        userId,
        planId,
        amount: payment.amount / 100,
        razorpayPaymentId: paymentId,
        createdAt: now.toISOString(),
      });

      console.log(
        `🔁 Auto-Renew Completed → user=${userId}, plan=${planId}, amount=${
          payment.amount / 100
        }`
      );

      res.json({ success: true });
    } catch (err) {
      console.error("❌ Webhook Error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

/**
 * =====================================================================
 *    BASIC WEBHOOK LOGGER: /webhooks/razorpay (for testing)
 * =====================================================================
 */
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),

  (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];

      if (!verifyWebhookSignature(req.body, signature)) {
        console.log("❌ Invalid signature in /razorpay");
        return res.status(400).json({ error: "Invalid signature" });
      }

      const body = JSON.parse(req.body.toString());
      console.log("🔔 Razorpay Webhook:", body.event);

      res.status(200).json({ status: "ok" });
    } catch (err) {
      console.error("❌ Error in /razorpay:", err);
      res.status(500).json({ error: "Internal error" });
    }
  }
);



module.exports = router;
