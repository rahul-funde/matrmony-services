// service/paymentService.js
const Razorpay = require("razorpay");

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Charge user automatically using saved Razorpay customer & payment method
 * @param {string} customerId - Razorpay customer ID
 * @param {string} paymentMethodId - Saved payment method ID (card or subscription token)
 * @param {number} amount - Amount in INR (not paise)
 * @param {string} currency - Currency code (default: INR)
 * @param {string} receipt - Receipt string for logging
 * @returns {Promise<object>} - Razorpay payment response
 */
async function processPayment(customerId, paymentMethodId, amount, receipt, currency = "INR") {
  try {
    // 1️⃣ Create an order
    const order = await razorpay.orders.create({
      amount: amount * 100, // convert INR to paise
      currency,
      receipt,
      payment_capture: 1
    });

    // 2️⃣ Capture payment using saved customer method
    const payment = await razorpay.payments.capture(order.id, amount * 100, currency);

    // You can also use a "tokenized" payment method for automatic recurring charge
    // Example: razorpay.paymentLinks.create or subscription API

    return {
      success: true,
      orderId: order.id,
      paymentId: payment.id,
      status: payment.status,
      captured: payment.captured
    };
  } catch (err) {
    console.error("❌ Error in processPayment:", err);
    return { success: false, error: err.message };
  }
}

module.exports = { processPayment };
