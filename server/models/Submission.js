const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    platform: { type: String, required: true, enum: ['codeforces', 'leetcode', 'gfg', 'codechef'] },
    problemName: { type: String, required: true },
    problemURL: { type: String, default: '' },
    difficulty: { type: String, default: 'Unknown' },
    language: { type: String, required: true },
    code: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    syncError: { type: String, default: '' }, // Track reasons for 'Pending'
    submissionId: { type: String, required: true }, // Keep for checking dupes
    createdAt: { type: Date, default: Date.now }
});

// Ensure we don't sync the same submission multiple times per user
submissionSchema.index({ userId: 1, platform: 1, submissionId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
