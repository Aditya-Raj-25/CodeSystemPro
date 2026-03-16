const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sync', require('./routes/sync'));

app.get('/', (req, res) => res.send('API Running'));

// Initialize Cron Jobs
const startCronJobs = require('./jobs/cronSync');
startCronJobs();

const { MongoMemoryServer } = require('mongodb-memory-server');

// Connect to MongoDB
const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;

        try {
            // First try to connect to the standard local URI or Atlas URI provided
            await mongoose.connect(uri);
            console.log('MongoDB Connected manually');
        } catch (initialErr) {
            console.log('Local MongoDB failed, starting In-Memory MongoDB Server instead...');
            // Fallback to memory server if local install fails (like Xcode brew issues)
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
            await mongoose.connect(uri);
            console.log('MongoDB In-Memory Server Connected');
        }

        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (err) {
        console.error('MongoDB connection error', err);
    }
};

connectDB();
