const mongoose = require('mongoose');
const Submission = require('./models/Submission');
const { pushToGitHub } = require('./services/github');
require('dotenv').config();

const solutions = [
    {
        submissionId: '1948263644',
        code: `class Solution:
    def isValid(self, s: str) -> bool:
        par = {")": "(", "}": "{", "]": "["}
        stack = []
        for c in s:
            if c in par:
                if stack and stack[-1] == par[c]:
                    stack.pop()
                else:
                    return False
            else:
                stack.append(c)
        return True if not stack else False`
    },
    {
        submissionId: '1948212103',
        code: `class Solution:
    def longestCommonPrefix(self, strs: List[str]) -> str:
        if not strs:
            return ""
        
        prefix = strs[0]
        for i in range(1, len(strs)):
            while strs[i].find(prefix) != 0:
                prefix = prefix[:-1]
                if not prefix:
                    return ""
        return prefix`
    }
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to MongoDB');
    for (const sol of solutions) {
        const sub = await Submission.findOne({ submissionId: sol.submissionId });
        if (sub) {
            sub.code = sol.code;
            await sub.save();
            console.log(`Updated DB: ${sub.problemName}`);
            await pushToGitHub(sub.userId, sub);
            console.log(`Pushed to GitHub: ${sub.problemName}`);
        } else {
            console.log(`Not found: ${sol.submissionId}`);
        }
    }
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
