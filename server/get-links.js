const mongoose = require('mongoose');
const Submission = require('./models/Submission');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codetrackr';

mongoose.connect(MONGO_URI).then(async () => {
    const subs = await Submission.find({
        $or: [
            { code: /not captured/ },
            { code: 'EMPTY' },
            { code: '' },
            { code: null }
        ]
    });
    console.log('--- RECOVERY LINKS ---');
    subs.forEach(s => {
        let url = s.problemURL;
        if (s.platform === 'leetcode') {
            if (s.submissionId) {
                url = `https://leetcode.com/submissions/detail/${s.submissionId}/`;
            }
        } else if (s.platform === 'codeforces') {
            if (s.submissionId) {
                const contestId = s.problemURL.match(/contest\/(\d+)/);
                if (contestId) {
                    url = `https://codeforces.com/contest/${contestId[1]}/submission/${s.submissionId}`;
                }
            }
        }
        console.log(`- [${s.problemName}](${url})`);
    });
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
