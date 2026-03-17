const axios = require('axios');
const User = require('../models/User');
const { decrypt } = require('./../utils/encryption');

const pushToGitHub = async (userId, submission) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.encryptedGithubPAT || !user.githubRepo || !user.githubUsername) {
            console.warn('User missing GitHub configuration');
            return;
        }

        const token = decrypt(user.encryptedGithubPAT);
        let githubUsername = user.githubUsername.trim();

        // Clean up username if full URL was provided
        githubUsername = githubUsername.replace('https://github.com/', '').replace('http://github.com/', '').split('/')[0];

        const repoName = user.githubRepo.trim();
        console.log(`[GitHub] Attempting push to: ${githubUsername}/${repoName}`);

        const headers = {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'CodeTrackr-Pro-Sync'
        };

        const langLower = submission.language.toLowerCase();
        let ext = 'txt';
        if (langLower.includes('c++') || langLower.includes('cpp')) ext = 'cpp';
        else if (langLower.includes('python')) ext = 'py';
        else if (langLower.includes('java') && !langLower.includes('javascript')) ext = 'java';
        else if (langLower.includes('javascript') || langLower.includes('js')) ext = 'js';
        else if (langLower.includes('rust') || langLower.includes('rs')) ext = 'rs';
        else if (langLower.includes('go')) ext = 'go';

        const safeProblemName = submission.problemName.replace(/\s+/g, '-').replace(/[?#]/g, '');
        const basePath = `${submission.platform}/${safeProblemName}`;
        const codePath = `${basePath}/solution.${ext}`;
        const readmePath = `${basePath}/README.md`;
        const codeMessage = `Sync ${submission.platform} solution: ${submission.problemName} [Code]`;
        const readmeMessage = `Sync ${submission.platform} solution: ${submission.problemName} [README]`;

        const codeContentRaw = submission.code ? submission.code : "";

        // CRITICAL: Check for placeholder text. If found, do NOT push to GitHub.
        const placeholders = [
            'not captured',
            'captured in real-time',
            'Code not found',
            'EMPTY',
            '// Solution code captured'
        ];

        const isPlaceholder = !codeContentRaw || 
                            codeContentRaw.length < 15 || 
                            placeholders.some(p => codeContentRaw.toLowerCase().includes(p.toLowerCase()));

        if (isPlaceholder) {
            console.warn(`[GitHub] Skipping push for "${submission.problemName}": Code appears to be a placeholder or too short.`);
            submission.syncError = `Placeholder detected (Length: ${codeContentRaw ? codeContentRaw.length : 0})`;
            await submission.save();
            return;
        }

        const readmeContentRaw = `# ${submission.problemName}\n\n` +
            `- **Platform:** ${submission.platform}\n` +
            `- **Language:** ${submission.language}\n` +
            `- **Submission ID:** ${submission.submissionId}\n\n` +
            `## Solution Code\n\n` +
            `\`\`\`${ext}\n${codeContentRaw}\n\`\`\``;

        const codeContent = Buffer.from(codeContentRaw).toString('base64');
        const readmeContent = Buffer.from(readmeContentRaw).toString('base64');

        const uploadFile = async (filePath, content, message) => {
            // Encode each segment of the path individually to be safe
            const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
            const githubApiUrl = `https://api.github.com/repos/${githubUsername}/${repoName}/contents/${encodedPath}`;
            console.log(`[GitHub] Uploading file to: ${githubApiUrl}`);
            let sha = undefined;
            try {
            const fileRes = await axios.get(githubApiUrl, {
                headers,
                timeout: 10000
            });
            sha = fileRes.data.sha;
        } catch (e) {
            if (e.response && e.response.status !== 404) {
                console.warn(`[GitHub] File check error for ${filePath}: ${e.message}`);
            }
        }

        const payload = {
            message,
            content,
            ...(sha && { sha })
        };

        const res = await axios.put(githubApiUrl, payload, {
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
        return res;
        };

        const res = await uploadFile(readmePath, readmeContent, readmeMessage);
        await uploadFile(codePath, codeContent, codeMessage);

        console.log(`Successfully pushed ${submission.problemName} to GitHub repository ${repoName}`);

        // Update Submission path (pointing to the README)
        submission.githubUrl = res.data.content.html_url;
        submission.syncError = ''; // Clear any previous error
        await submission.save();

    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error('GitHub Push Error:', errorMsg);
        submission.syncError = `GitHub Error: ${errorMsg}`;
        await submission.save();
    }
};

module.exports = { pushToGitHub };
