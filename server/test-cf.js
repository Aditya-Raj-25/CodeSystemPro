const axios = require('axios');
async function test() {
    const url = 'https://codeforces.com/contest/1703/submission/163830000';
    try {
        console.log('Fetching Codeforces...');
        const response = await axios.get(url, { timeout: 10000 });
        const html = response.data;
        const match = html.match(/<pre id="program-source-text"[^>]*>([\s\S]*?)<\/pre>/);
        if (match) {
            console.log('Code found! Length:', match[1].length);
        } else {
            console.log('Code NOT found in HTML');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}
test().then(() => console.log('Done'));
