/**
 * Cleanup script: removes duplicate placeholder submissions and fixes Longest Common Prefix
 */
const mongoose = require('mongoose');
const Submission = require('./models/Submission');
const { pushToGitHub } = require('./services/github');
require('dotenv').config();

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const placeholdersPatterns = [/captured in real-time/, /not captured/, /EMPTY/, /Code not found/];

    // 1. Find all placeholder submissions
    const placeholders = await Submission.find({
        $or: [
            { code: '' },
            { code: null },
            { code: { $in: ['EMPTY', 'Code not found'] } },
            ...placeholdersPatterns.map(p => ({ code: p }))
        ]
    });

    console.log(`Found ${placeholders.length} placeholder submissions\n`);

    let deleted = 0;
    let kept = 0;

    for (const ph of placeholders) {
        // Check if there's a REAL version of this submission (same problem, same platform, has code)
        const realVersion = await Submission.findOne({
            userId: ph.userId,
            platform: ph.platform,
            problemName: { $regex: new RegExp(`^${ph.problemName}$`, 'i') }, // Case-insensitive problem name match
            _id: { $ne: ph._id }, // Not this document
            code: { $exists: true, $ne: '', $nin: ['EMPTY', 'Code not found'], $not: /captured in real-time/, $not: /not captured/ },
            githubUrl: { $exists: true, $ne: null } // Preferably one that is already synced
        });

        if (realVersion && realVersion.code && realVersion.code.length > 20) {
            // Delete the placeholder since we have the real one
            await Submission.deleteOne({ _id: ph._id });
            console.log(`🗑️  Deleted duplicate placeholder: ${ph.problemName} (ID: ${ph.submissionId})`);
            deleted++;
        } else {
            console.log(`⚠️  No real version found for: ${ph.problemName} (ID: ${ph.submissionId}, platform: ${ph.platform})`);
            kept++;
        }
    }

    console.log(`\nDeleted: ${deleted}, Kept: ${kept}`);

    // 2. Check remaining placeholders
    const remaining = await Submission.find({
        $or: [
            { code: '' },
            { code: null },
            { code: /captured in real-time/ }
        ]
    });
    console.log(`\nRemaining placeholder submissions: ${remaining.length}`);
    remaining.forEach(s => console.log(`  - ${s.problemName} (${s.platform}, ID: ${s.submissionId})`));

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
