const cron = require('node-cron');
const axios = require('axios');

const startExtendFemalePlansCron = () => {
  cron.schedule('0 0 * * *', async () => {
	//cron.schedule('*/5 * * * * *', async () => {
	try {
      console.log('Running extendFemalePlans cron...');

      const res = await axios.post(
        'https://www.sushilmaratha.in/backend/api/admin/extendFemalePlans'
      );

      console.log('Success:', res.data);
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

  console.log('✅ Extend Female Plans Cron Initialized');
};

module.exports = startExtendFemalePlansCron;