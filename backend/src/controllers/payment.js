const axios = require('axios');

exports.createOrder = async (req, res) => 
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
