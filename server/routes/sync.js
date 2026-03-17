const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { pushToGitHub } = require('../services/github');
const axios = require('axios');

// Get all synced submissions for Repository Page
router.get('/submissions', auth, async (req, res) => {
    try {
        const submissions = await Submission.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get pending LeetCode submissions (no code yet) — used by extension to auto-fetch code
router.get('/pending-leetcode', auth, async (req, res) => {
    try {
        const pending = await Submission.find({
            userId: req.user.id,
            platform: 'leetcode',
            $and: [
                { $or: [{ githubUrl: '' }, { githubUrl: null }] },
                { $or: [{ code: '' }, { code: null }, { code: 'EMPTY' }] }
            ]
        }).select('submissionId problemName');
        res.json(pending);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/sync/stats for Dashboard
router.get('/stats', auth, async (req, res) => {
    try {
        const submissions = await Submission.find({ userId: req.user.id });

        const total = submissions.length;
        const platforms = { codeforces: 0, leetcode: 0, gfg: 0, codechef: 0 };
        const difficulties = { Easy: 0, Medium: 0, Hard: 0, Unknown: 0 };
        const languages = {};

        submissions.forEach(sub => {
            if (platforms[sub.platform] !== undefined) {
                platforms[sub.platform]++;
            }
            if (difficulties[sub.difficulty] !== undefined) {
                difficulties[sub.difficulty]++;
            } else {
                difficulties['Unknown']++; // map weird difficulties to unknown
            }
            if (!languages[sub.language]) {
                languages[sub.language] = 0;
            }
            languages[sub.language]++;
        });

        res.json({ total, platforms, difficulties, languages });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/sync from Chrome Extension
router.post('/', auth, async (req, res) => {
    try {
        const { platform, problemName, language, code, submissionId, difficulty } = req.body;
        console.log(`[Sync] Received ${platform} submission for "${problemName}". Code length: ${code ? code.length : 0}`);

        // Define what "real code" is (must match github.js logic)
        const isRealCode = (c) => {
            if (!c || c.length < 15) return false;
            const placeholders = ['not captured', 'captured in real-time', 'Code not found', 'EMPTY', '// Solution code captured'];
            return !placeholders.some(p => c.toLowerCase().includes(p.toLowerCase()));
        };

        // Prevent duplicates but allow updating if code is missing/placeholder
        let existing = null;
        if (submissionId) {
            existing = await Submission.findOne({ userId: req.user.id, platform, submissionId });
        }
        
        if (!existing) {
            // Case-insensitive name match to avoid duplicates from cron vs extension
            existing = await Submission.findOne({ 
                userId: req.user.id, 
                platform, 
                problemName: { $regex: new RegExp(`^${problemName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } 
            });
        }

        if (existing) {
            const existingHasRealCode = isRealCode(existing.code) && existing.githubUrl;

            if (isRealCode(code) && !existingHasRealCode) {
                console.log(`[Sync] Updating existing entry for "${problemName}" with real code.`);
                existing.code = code;
                if (difficulty) existing.difficulty = difficulty;
                if (submissionId) existing.submissionId = submissionId;
                if (language) existing.language = language;

                pushToGitHub(req.user.id, existing).catch(err => console.error('[BG Update Push] Error:', err.message));
                await existing.save();
                return res.status(200).json({ message: 'Submission update initiated', submission: existing });
            }
            return res.status(200).json({ message: 'Submission already exists', submission: existing });
        }

        const submission = new Submission({
            userId: req.user.id,
            platform,
            problemName,
            language,
            difficulty: difficulty || 'Unknown',
            submissionId: submissionId || `ext-${Date.now()}`
        });
        submission.code = code;

        // Fire and forget push to GitHub (don't await)
        pushToGitHub(req.user.id, submission).catch(pushErr => {
            console.error(`[BG Push] Failed for "${problemName}":`, pushErr.message);
        });

        // Save to DB
        await submission.save();
        res.json({ message: 'Sync initiated', submission });
    } catch (err) {
        console.error('API Sync Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/sync/sync-all for Manual Refresh Button
router.get('/sync-all', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let results = { codeforces: 0, leetcode: 0, gfg: 0, codechef: 0 };

        // 1. Fetch Codeforces
        if (user.platformHandles?.codeforces) {
            try {
                const cfRes = await axios.get(`https://codeforces.com/api/user.status?handle=${user.platformHandles.codeforces}`);
                if (cfRes.data.status === 'OK') {
                    const submissions = cfRes.data.result.filter(sub => sub.verdict === 'OK');
                    for (let sub of submissions) {
                        
                        // Ignore submissions made before the user created their CodeTrackr account
                        const subTimeMs = sub.creationTimeSeconds * 1000;
                        if (subTimeMs < new Date(user.createdAt).getTime()) {
                            continue;
                        }

                        const probName = sub.problem.name;
                        const exists = await Submission.findOne({ userId: user._id, platform: 'codeforces', problemName: probName });
                        if (!exists) {
                            const newSub = new Submission({
                                userId: user._id,
                                platform: 'codeforces',
                                problemName: probName,
                                language: sub.programmingLanguage,
                                difficulty: sub.problem.rating ? 'Medium' : 'Unknown', // Approximate
                                submissionId: sub.id.toString()
                            });
                            await pushToGitHub(user._id, newSub);
                            await newSub.save();
                            results.codeforces++;
                        } else if (!exists.githubUrl) {
                            await pushToGitHub(user._id, exists);
                            results.codeforces++;
                        }
                    }
                }
            } catch (err) {
                console.error('Codeforces sync failed', err.message);
            }
        }

        // 2. Fetch LeetCode — create entries AND try to fetch code server-side
        if (user.platformHandles?.leetcode) {
            try {
                const query = `query recentAcSubmissions($username: String!) { recentAcSubmissionList(username: $username, limit: 50) { id title titleSlug timestamp statusDisplay lang } }`;
                const lcRes = await axios.post('https://leetcode.com/graphql', { query, variables: { username: user.platformHandles.leetcode } });
                if (lcRes.data?.data?.recentAcSubmissionList) {
                    for (let sub of lcRes.data.data.recentAcSubmissionList) {
                        if (sub.statusDisplay !== 'Accepted') continue;
                        
                        // Ignore submissions made before the user created their CodeTrackr account
                        // LeetCode timestamp is in seconds
                        const subTimeMs = parseInt(sub.timestamp) * 1000;
                        if (subTimeMs < new Date(user.createdAt).getTime()) {
                            continue;
                        }

                        const probName = sub.title;
                        // Check by name (case-insensitive) OR submissionId to avoid duplicates
                        let existing = await Submission.findOne({
                            userId: user._id,
                            platform: 'leetcode',
                            $or: [
                                { submissionId: sub.id },
                                { problemName: { $regex: new RegExp(`^${probName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
                            ]
                        });

                        if (!existing) {

                            existing = new Submission({
                                userId: user._id,
                                platform: 'leetcode',
                                problemName: probName,
                                problemURL: `https://leetcode.com/problems/${sub.titleSlug}`,
                                language: sub.lang,
                                difficulty: 'Unknown',
                                submissionId: sub.id
                            });
                            await existing.save();
                            results.leetcode++;
                        }

                        // If no code or no githubUrl, try to fetch code from LeetCode GraphQL
                        if (!existing.code || existing.code.length < 15 || !existing.githubUrl) {
                            try {
                                const codeQuery = `query submissionDetails($submissionId: Int!) { submissionDetails(submissionId: $submissionId) { code lang { name } } }`;
                                const codeRes = await axios.post('https://leetcode.com/graphql', {
                                    query: codeQuery,
                                    variables: { submissionId: parseInt(sub.id) }
                                }, {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Referer': 'https://leetcode.com',
                                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                                    }
                                });

                                const fetchedCode = codeRes.data?.data?.submissionDetails?.code;
                                if (fetchedCode && fetchedCode.length > 15) {
                                    console.log(`[Sync-All] Got code for "${probName}" from LeetCode API`);
                                    existing.code = fetchedCode;
                                    const langName = codeRes.data?.data?.submissionDetails?.lang?.name;
                                    if (langName) existing.language = langName;
                                    await existing.save();
                                    await pushToGitHub(user._id, existing);
                                    results.leetcode++;
                                }
                            } catch (codeErr) {
                                console.log(`[Sync-All] Could not fetch code for "${probName}": ${codeErr.message}`);
                            }
                            // Small delay to avoid rate limiting
                            await new Promise(r => setTimeout(r, 500));
                        }
                    }
                }
            } catch (err) {
                console.error('LeetCode sync failed', err.message);
            }
        }

        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
