const axios = require('axios');
async function test() {
    const url = 'https://codeforces.com/contest/1703/submission/294884389';
    try {
        console.log('Fetching Codeforces Submission...');
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        console.log('Status:', res.status);
        const match = res.data.match(/<pre id="program-source-text"[^>]*>([\s\S]*?)<\/pre>/);
        if (match) {
            console.log('Code found! Length:', match[1].length);
            console.log('Preview:', match[1].substring(0, 50));
        } else {
            console.log('Code NOT found in HTML. Checking if redirected or restricted...');
            // Check if page contains "Access denied" or "Login"
            if (res.data.includes('Access denied')) console.log('ACCESS DENIED');
            if (res.data.includes('Login')) console.log('LOGIN REQUIRED');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}
test();
