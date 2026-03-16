const axios = require('axios');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { pushToGitHub } = require('./github');

// Scraping helper for Codeforces
const fetchCFCode = async (contestId, subId) => {
    const url = `https://codeforces.com/contest/${contestId}/submission/${subId}`;
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
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
        console.error(`Scraping failed for CF ${subId}:`, err.message);
        return null;
    }
};

const syncCodeforces = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.platformHandles.codeforces) return;

        const handle = user.platformHandles.codeforces;
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);

        if (response.data.status !== 'OK') {
            throw new Error('Codeforces API failed');
        }

        const submissions = response.data.result;
        const acceptedSubmissions = submissions.filter(sub => sub.verdict === 'OK');

        let newSyncsCount = 0;

        for (let sub of acceptedSubmissions) {
            // Ignore submissions made before the user created their CodeTrackr account
            const subTimeMs = sub.creationTimeSeconds * 1000;
            if (subTimeMs < new Date(user.createdAt).getTime()) {
                continue;
            }

            const problemName = sub.problem.name;
            const contestId = sub.problem.contestId;
            const index = sub.problem.index;
            const problemURL = `https://codeforces.com/contest/${contestId}/problem/${index}`;
            const language = sub.programmingLanguage;

            let difficulty = 'Unknown';
            if (sub.problem.rating) {
                if (sub.problem.rating < 1200) difficulty = 'Easy';
                else if (sub.problem.rating < 1900) difficulty = 'Medium';
                else difficulty = 'Hard';
            }

            const existing = await Submission.findOne({
                userId,
                platform: 'codeforces',
                submissionId: sub.id.toString()
            });

            if (!existing) {
                const code = await fetchCFCode(contestId, sub.id);

                // Skip if Codeforces blocked the scrape (requires login for private submissions)
                if (!code || code.length < 15) {
                    console.log(`[Codeforces] Could not fetch code for "${problemName}" — skipping (login required)`);
                    continue;
                }

                const newSubmission = new Submission({
                    userId,
                    platform: 'codeforces',
                    problemName,
                    problemURL,
                    difficulty,
                    language,
                    code,
                    submissionId: sub.id.toString()
                });

                await newSubmission.save();
                await pushToGitHub(userId, newSubmission);
                newSyncsCount++;
            }
        }

        console.log(`Synced ${newSyncsCount} new Codeforces submissions for user ${handle}`);

    } catch (error) {
        console.error('Error syncing Codeforces:', error.message);
    }
};

module.exports = { syncCodeforces };
