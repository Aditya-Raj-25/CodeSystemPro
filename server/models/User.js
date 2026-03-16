const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function () { return !this.googleId; } },
  googleId: { type: String, default: null },
  profilePicture: { type: String, default: '' },
  githubUsername: { type: String, default: '' },
  githubRepo: { type: String, default: '' },
  encryptedGithubPAT: { type: String, default: null },
  platformHandles: {
    codeforces: { type: String, default: '' },
    leetcode: { type: String, default: '' },
    gfg: { type: String, default: '' },
    codechef: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpire: Date
});

module.exports = mongoose.model('User', userSchema);
