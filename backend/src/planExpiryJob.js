const cron = require("node-cron");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const couchbase = require("couchbase");
const { connectToCouchbase } = require("./config/db.config");
const { sendEmail, sendSMS } = require("./service/notificationService");

const NOTIFICATION_DAYS = Number(process.env.NOTIFICATION_DAYS || 3);
const CONTACT_BONUS = Number(process.env.CONTACT_BONUS || 5);

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Daily cron job at 2:00 AM
cron.schedule("0 2 * * *", async () => {
  console.log("🔄 Running Master Plan Cron Job...");

  const {
    cluster,
    collection,
    userPlanCollection,
    planLogCollection,
    notificationCollection
  } = await connectToCouchbase();

  const now = new Date();

  try {
    // 1️⃣ Fetch all active plans
    const query = `
      SELECT META(p).id AS docId, p.*
      FROM \`${process.env.COUCHBASE_BUCKET}\`.\`users\`.\`user_plans\` AS p
      WHERE p.status = "active"
    `;
    const result = await cluster.query(query);

    if (result.rows.length === 0) {
      console.log("No active plans found.");
      return;
    }

    for (let plan of result.rows) {
      const userDoc = await collection.get(plan.userId).catch(() => null);
      if (!userDoc) continue;
      const user = userDoc.value;

      const endDate = new Date(plan.endDate);
      const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      /** 🔔 Pre-Expiry Notification **/
      if (diffDays === NOTIFICATION_DAYS) {
        const notifKey = `notif::${plan.userId}::${plan.planId}::${now.toISOString().slice(0, 10)}`;
        const notifDoc = await notificationCollection.get(notifKey).catch(() => null);

        if (!notifDoc) {
          const message = `Hello ${user.personalDetails.firstName || "User"},
Your plan "${plan.planName}" is expiring in ${NOTIFICATION_DAYS} day(s) on ${endDate.toLocaleDateString()}.
Please renew your plan to continue enjoying premium features.
Renew Now: https://yourmatrimony.com/renew/${plan.planId}
Thank you,
Your Matrimony Team`;

          await sendEmail(user.email, "Plan Expiry Notification", message).catch(console.error);
          await sendSMS(user.mobilenumber, message).catch(console.error);

          await notificationCollection.upsert(notifKey, {
            userId: plan.userId,
            planId: plan.planId,
            date: now.toISOString(),
            messageSent: true
          });

          console.log(`✅ Notification sent to user ${plan.userId} for plan ${plan.planName}`);
        }
      }

      /** ⏳ Expire Plan **/
      if (endDate < now) {
        await userPlanCollection.mutateIn(plan.docId, [
          couchbase.MutateInSpec.upsert("status", "expired"),
          couchbase.MutateInSpec.upsert("updatedAt", now.toISOString())
        ]);
        console.log(`⚠️ Plan expired for user ${plan.userId}: ${plan.planName}`);

        /** 🔁 Auto-Renew **/
        if (plan.autoRenew) {
          try {
            // Create Razorpay order
            const paymentResponse = await razorpay.orders.create({
              amount: plan.price * 100, // in paise
              currency: "INR",
              receipt: `plan::${plan.planId}::${plan.userId}`,
              payment_capture: 1
            });

            // Simulate successful payment capture
            const paymentCaptured = true; // In real scenario, verify payment using webhook

            if (paymentCaptured) {
              const newEndDate = new Date();
              newEndDate.setMonth(newEndDate.getMonth() + Number(plan.duration));

              const renewedPlanDoc = {
                ...plan,
                startDate: now.toISOString(),
                endDate: newEndDate.toISOString(),
                status: "active",
                updatedAt: now.toISOString()
              };

              await userPlanCollection.upsert(plan.docId, renewedPlanDoc);

              await planLogCollection.insert(`planlog::${crypto.randomUUID()}`, {
                type: "auto_renew",
                userId: plan.userId,
                planId: plan.planId,
                amount: plan.price,
                razorpayOrderId: paymentResponse.id,
                createdAt: now.toISOString()
              });

              console.log(`🔁 Auto-renewed plan for user ${plan.userId}: ${plan.planName}`);
            } else {
              console.error(`❌ Auto-renew payment failed for user ${plan.userId}`);
            }
          } catch (err) {
            console.error(`❌ Auto-renew failed for user ${plan.userId}:`, err);
          }
        }
      }

      /** ➕ Increment Contact Limit (Optional Bonus) **/
      if (process.env.ENABLE_CONTACT_BONUS === "true") {
        const newLimit = (plan.contactLimit || 0) + CONTACT_BONUS;

        await userPlanCollection.mutateIn(plan.docId, [
          couchbase.MutateInSpec.upsert("contactLimit", newLimit),
          couchbase.MutateInSpec.upsert("updatedAt", now.toISOString())
        ]);

        await planLogCollection.insert(`planlog::${crypto.randomUUID()}`, {
          type: "contact_limit_increment",
          userId: plan.userId,
          oldLimit: plan.contactLimit || 0,
          newLimit: newLimit,
          incrementedBy: CONTACT_BONUS,
          createdAt: now.toISOString()
        });

        console.log(`User ${plan.userId}: contactLimit incremented by ${CONTACT_BONUS}`);
      }
    }

    console.log("✅ Master Plan Cron Job completed successfully.");
  } catch (err) {
    console.error("❌ Error in Master Plan Cron Job:", err);
  }
});
