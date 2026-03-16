const mongoose = require('mongoose');
const Submission = require('./models/Submission');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codetrackr';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        const user = await User.findOne({ email: 'adityarajsrivastava227@gmail.com' });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }
        const cfSubs = await Submission.find({ userId: user._id, platform: 'codeforces' });

        const axios = require('axios');
        const cfRes = await axios.get(`https://codeforces.com/api/user.status?handle=${user.platformHandles.codeforces}`);
        const status = cfRes.data.result;

        const metadata = cfSubs.map(s => {
            const item = status.find(i => i.id.toString() === s.submissionId);
            return {
                id: s._id,
                sid: s.submissionId,
                cid: item ? item.contestId : null,
                name: s.problemName
            };
        });
        console.log(JSON.stringify(metadata, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
