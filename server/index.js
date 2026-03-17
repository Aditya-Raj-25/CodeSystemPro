const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
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
        const uri = process.env.MONGO_URI;
        if (!uri && process.env.NODE_ENV === 'production') {
            throw new Error('MONGO_URI is missing in production environment');
        }

        try {
            if (!uri) throw new Error('No MONGO_URI provided');
            await mongoose.connect(uri);
            console.log('MongoDB Connected successfully');
        } catch (initialErr) {
            if (process.env.NODE_ENV === 'production') {
                console.error('MongoDB connection failed in production:', initialErr.message);
                process.exit(1);
            }
            
            console.log('Local MongoDB failed, starting In-Memory MongoDB Server instead...');
            const mongoServer = await MongoMemoryServer.create();
            const memoryUri = mongoServer.getUri();
            await mongoose.connect(memoryUri);
            console.log('MongoDB In-Memory Server Connected');
        }

        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (err) {
        console.error('SERVER FATAL ERROR:', err.message);
        process.exit(1);
    }
};

connectDB();
