/**
 * Test Razorpay Webhook Sender
 * By Rahul Funde
 */

const crypto = require("crypto");
const axios = require("axios");

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "test_secret";

// Use same format used in your real flow → plan::<planId>::<userId>
const samplePayload = {
  event: "payment.captured",
  payload: {
    payment: {
      entity: {
        id: "pay_test12345",
        amount: 150000, // INR 1500.00
        currency: "INR",
        status: "captured",
        receipt: "plan::gold123::user789",
        captured: true
      }
    }
  },
  created_at: Date.now()
};

async function sendTestWebhook() {
  const url = "http://localhost:5000/webhooks/razorpay-webhook";

  // Razorpay sends raw body → create raw JSON buffer
  const body = Buffer.from(JSON.stringify(samplePayload), "utf8");

  // Generate signature exactly like Razorpay
  const signature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  try {
    console.log("📤 Sending Test Webhook...");
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": signature,
      },
    });

    console.log("✅ Webhook Delivered Successfully:");
    console.log(response.data);
  } catch (error) {
    console.error("❌ Webhook Error:");
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

sendTestWebhook();
