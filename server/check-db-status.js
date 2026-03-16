const mongoose = require('mongoose');
const Submission = require('./models/Submission');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codetrackr';

mongoose.connect(MONGO_URI).then(async () => {
    const subs = await Submission.find({});
    console.log('--- Submission Code Status ---');
    const results = subs.map(s => ({
        problem: s.problemName,
        platform: s.platform,
        hasRealCode: s.code && !s.code.includes('not captured') && s.code.length > 50,
        codePreview: s.code ? s.code.substring(0, 50).replace(/\n/g, ' ') + '...' : 'EMPTY'
    }));
    console.table(results);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
