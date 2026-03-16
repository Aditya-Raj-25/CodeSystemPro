const axios = require('axios');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { pushToGitHub } = require('./github');

const syncLeetCode = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.platformHandles.leetcode) return;

        const handle = user.platformHandles.leetcode;

        // LeetCode GraphQL API wrapper
        const query = `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    `;

        const response = await axios.post('https://leetcode.com/graphql', {
            query,
            variables: { username: handle, limit: 50 } // fetching last 50 ACs
        });

        if (response.data.errors) {
            throw new Error('LeetCode GraphQL failed');
        }

        const fetchQuestionDifficulty = async (titleSlug) => {
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
                console.error(`Failed to fetch difficulty for ${titleSlug}`, err.message);
                return 'Unknown';
            }
        };

        const submissions = response.data.data.recentAcSubmissionList;
        let newSyncsCount = 0;

        for (let sub of submissions) {
            if (sub.statusDisplay !== 'Accepted') continue;

            // Ignore submissions made before the user created their CodeTrackr account
            const subTimeMs = parseInt(sub.timestamp) * 1000;
            if (subTimeMs < new Date(user.createdAt).getTime()) {
                continue;
            }

            // Check by submissionId OR by problem name (case-insensitive) to avoid duplicates
            const existing = await Submission.findOne({
                userId,
                platform: 'leetcode',
                $or: [
                    { submissionId: sub.id },
                    { problemName: { $regex: new RegExp(`^${sub.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
                ]
            });

            if (!existing) {
                // DO NOT create an entry without code — it just shows as "Pending"
                // The extension will create the entry WITH code when the user visits the submission page
                console.log(`[LeetCode Cron] Skipping "${sub.title}" — no code available server-side. Extension will handle it.`);
                newSyncsCount++;
            }
        }

        console.log(`[LeetCode Cron] Found ${newSyncsCount} new submissions for ${handle} (extension will sync code)`);

    } catch (error) {
        console.error('Error syncing LeetCode:', error.message);
    }
};

module.exports = { syncLeetCode };
