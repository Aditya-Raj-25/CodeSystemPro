const axios = require('axios');
const User = require('../models/User');
const Submission = require('../models/Submission');

const syncGFG = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.platformHandles.gfg) return;

        const handle = user.platformHandles.gfg;

        // GFG doesn't have a simple public JSON API for recent submissions.
        // Usually requires RSS or scraping. For this service, we'll sync metadata 
        // if passed manually or provide a placeholder for the cron.

        console.log(`GFG sync triggered for handle ${handle}. (Metadata sync via API placeholder)`);

    } catch (error) {
        console.error('Error syncing GFG:', error.message);
    }
};

module.exports = { syncGFG };
