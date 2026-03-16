const cron = require('node-cron');
const User = require('../models/User');
const { syncCodeforces } = require('../services/codeforces');
const { syncLeetCode } = require('../services/leetcode');
// const { syncGFG } = require('../services/gfg');    // Puppeteer implementation goes here
// const { syncCodeChef } = require('../services/codechef'); // Puppeteer implementation goes here

const startCronJobs = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('[CRON] Starting background sync check...');
        try {
            const users = await User.find({}).select('_id platformHandles');

            for (const user of users) {
                if (user.platformHandles.codeforces) {
                    await syncCodeforces(user._id);
                }
                if (user.platformHandles.leetcode) {
                    await syncLeetCode(user._id);
                }
                // Puppeteer tasks are memory intensive and should ideally be queued (Redis/Bull)
                // await syncGFG(user._id);
                // await syncCodeChef(user._id);
            }
        } catch (err) {
            console.error('[CRON] Error during background sync:', err.message);
        }
    });
    console.log('Cron jobs initialized: syncing every 5 minutes.');
};

module.exports = startCronJobs;
