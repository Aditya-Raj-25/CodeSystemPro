const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { encrypt } = require('../utils/encryption');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const axios = require('axios');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, githubUsername, githubRepo, githubToken, platformHandles } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const encryptedGithubPAT = githubToken ? encrypt(githubToken) : null;

        user = new User({
            name,
            email,
            password: hashedPassword,
            githubUsername,
            githubRepo,
            encryptedGithubPAT,
            platformHandles
        });

        await user.save();

        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, githubUsername: user.githubUsername, githubRepo: user.githubRepo, platformHandles: user.platformHandles } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, githubUsername: user.githubUsername, githubRepo: user.githubRepo, platformHandles: user.platformHandles } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get logged-in user details
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Google Login/Register
router.post('/google', async (req, res) => {
    const { token } = req.body;
    try {
        // Since we are using standard `useGoogleLogin`, we receive an access token, not an ID token.
        // We will fetch the user info from Google's API.
        const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const { sub, email, name, picture } = googleRes.data;

        let user = await User.findOne({ email });

        if (!user) {
            // Register new Google user
            user = new User({
                name,
                email,
                googleId: sub,
                profilePicture: picture
            });
            await user.save();
        } else if (!user.googleId) {
            // Existing user now logging in with Google
            user.googleId = sub;
            user.profilePicture = picture || user.profilePicture;
            await user.save();
        }

        const jwtPayload = { id: user.id };
        const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, profilePicture: user.profilePicture, githubUsername: user.githubUsername, githubRepo: user.githubRepo, platformHandles: user.platformHandles } });
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(500).json({ message: 'Google Authentication failed' });
    }
});

// Update Settings
router.put('/settings', auth, async (req, res) => {
    try {
        const { githubUsername, githubRepo, githubToken, platformHandles } = req.body;
        // console.log(githubUsername, githubRepo, githubToken, platformHandles);
        // Helper to extract username from URL or return as is
        const extractUsername = (input, platform) => {
            if (!input) return '';
            input = input.trim();
            try {
                // If it's a URL, extract the last part
                if (input.startsWith('http')) {
                    const url = new URL(input);
                    const paths = url.pathname.split('/').filter(Boolean);

                    if (platform === 'leetcode' && paths[0] === 'u') return paths[1];
                    if (platform === 'codeforces' && paths[0] === 'profile') return paths[1];
                    if (platform === 'gfg' || platform === 'geeksforgeeks') {
                        if (paths[0] === 'user') return paths[1];
                        if (paths[0] === 'profile') return paths[1];
                    }
                    if (platform === 'codechef' && paths[0] === 'users') return paths[1];

                    return paths[paths.length - 1] || input;
                }
            } catch (e) {
                // Not a valid URL, return as is
            }
            return input;
        };

        const parsedHandles = {
            codeforces: extractUsername(platformHandles?.codeforces, 'codeforces'),
            leetcode: extractUsername(platformHandles?.leetcode, 'leetcode'),
            gfg: extractUsername(platformHandles?.gfg, 'gfg'),
            codechef: extractUsername(platformHandles?.codechef, 'codechef')
        };

        let updateFields = { githubUsername, githubRepo, platformHandles: parsedHandles };

        if (githubToken) {
            updateFields.encryptedGithubPAT = encrypt(githubToken);
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        console.log('Update success', user);
        res.json(user);
    } catch (err) {
        console.error('Settings Update Error:', err.message, err);
        res.status(500).send('Server Error');
    }
});

// Forgot Password
router.post('/forgotpassword', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        // Prevent user enumeration: Always say email sent regardless of existence
        if (!user) {
            return res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        // Create reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set expire: 15 minutes
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        // Create reset url
        // In production, this should be your frontend Vercel/Netlify URL
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a put request to: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password reset token',
                message
            });
            res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
        } catch (err) {
            console.error('Email send failed', err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Reset Password
router.post('/resetpassword/:token', async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        // Find user by token and ensure token is not expired
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);

        // If they had a googleId, setting a new password allows normal login too. 

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        const jwtPayload = { id: user.id };
        const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
            token: jwtToken,
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
