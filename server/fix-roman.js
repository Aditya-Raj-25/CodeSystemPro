const mongoose = require('mongoose');
const Submission = require('./models/Submission');
const { pushToGitHub } = require('./services/github');
require('dotenv').config();

const code = `class Solution:
    def romanToInt(self, s: str) -> int:
        res = 0
        roman = {
            'I': 1,
            'V': 5,
            'X': 10,
            'L': 50,
            'C': 100,
            'D': 500,
            'M': 1000
        }

        for a, b in zip(s, s[1:]):
            if roman[a] < roman[b]:
                res -= roman[a]
            else:
                res += roman[a]

        return res + roman[s[-1]]`;

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const sub = await Submission.findOne({ submissionId: '1948191739' });
    if (!sub) { console.log('Not found'); process.exit(1); }
    sub.code = code;
    await sub.save();
    console.log('DB updated');
    await pushToGitHub(sub.userId, sub);
    console.log('Pushed to GitHub!');
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
