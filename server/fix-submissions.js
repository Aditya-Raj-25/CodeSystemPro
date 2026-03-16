const mongoose = require('mongoose');
const axios = require('axios');
const Submission = require('./models/Submission');
const User = require('./models/User');
const { pushToGitHub } = require('./services/github');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codetrackremote';

const fetchLeetCodeDifficulty = async (titleSlug) => {
    const query = `
    query questionDifficulty($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        difficulty
      }
    }
  `;
    try {
        const res = await axios.post('https://leetcode.com/graphql', {
            query,
            variables: { titleSlug }
        });
        return res.data?.data?.question?.difficulty;
    } catch (err) {
        return null;
    }
};

const fetchCFCode = async (contestId, subId) => {
    const url = `https://codeforces.com/contest/${contestId}/submission/${subId}`;
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        const html = res.data;
        const match = html.match(/<pre id="program-source-text"[^>]*>([\s\S]*?)<\/pre>/);
        if (match) {
            return match[1]
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
        }
        return null;
    } catch (err) {
        return null;
    }
};

const fixSubmissions = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB...');

        const user = await User.findOne({ email: 'adityarajsrivastava227@gmail.com' });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        const subs = await Submission.find({ userId: user._id });
        console.log(`Found ${subs.length} submissions to process.`);

        // Fetch CF status once to get contestIds
        let cfStatus = [];
        if (user.platformHandles.codeforces) {
            console.log('Fetching Codeforces status...');
            const cfRes = await axios.get(`https://codeforces.com/api/user.status?handle=${user.platformHandles.codeforces}`);
            cfStatus = cfRes.data.result;
        }

        for (let sub of subs) {
            console.log(`\nProcessing: ${sub.problemName} (${sub.platform})`);
            let updated = false;

            if (sub.platform === 'leetcode') {
                const titleSlug = sub.problemName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

                if (!sub.problemURL) {
                    sub.problemURL = `https://leetcode.com/problems/${titleSlug}`;
                    updated = true;
                }

                if (sub.difficulty === 'Unknown' || sub.difficulty === 'unknown') {
                    console.log('Updating LeetCode difficulty...');
                    const difficulty = await fetchLeetCodeDifficulty(titleSlug);
                    if (difficulty) {
                        sub.difficulty = difficulty;
                        updated = true;
                    }
                }
            } else if (sub.platform === 'codeforces') {
                const cfSub = cfStatus.find(s => s.id.toString() === sub.submissionId);

                if (cfSub && !sub.problemURL) {
                    sub.problemURL = `https://codeforces.com/contest/${cfSub.contestId}/problem/${cfSub.problem.index}`;
                    updated = true;
                }

                if (sub.difficulty === 'Unknown' || /^\d+$/.test(sub.difficulty)) {
                    console.log('Mapping Codeforces difficulty...');
                    let rating = cfSub ? cfSub.problem.rating : parseInt(sub.difficulty);
                    if (rating) {
                        if (rating < 1200) sub.difficulty = 'Easy';
                        else if (rating < 1900) sub.difficulty = 'Medium';
                        else sub.difficulty = 'Hard';
                        updated = true;
                    }
                }

                if (!sub.code || sub.code.includes('not captured') || sub.code === '') {
                    console.log('Fetching Codeforces code...');
                    const contestId = cfSub ? cfSub.contestId : null;
                    if (contestId) {
                        const code = await fetchCFCode(contestId, sub.submissionId);
                        if (code) {
                            sub.code = code;
                            updated = true;
                        }
                    }
                }
            }

            if (updated || sub.code.includes('not captured') || !sub.githubUrl) {
                console.log('Saving and pushing updated data to GitHub...');
                await sub.save();
                await pushToGitHub(user._id, sub);
                console.log('Success.');
            } else {
                console.log('No update needed.');
            }
        }

        console.log('\n--- DONE ---');
        process.exit(0);
    } catch (err) {
        console.error('Fatal execution error:', err);
        process.exit(1);
    }
};

fixSubmissions();
