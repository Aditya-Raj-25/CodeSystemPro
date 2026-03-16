const axios = require('axios');

async function run() {
    try {
        const res1 = await axios.post('http://localhost:8080/api/auth/register', {
            name: "Test User",
            email: "test_settings@example.com",
            password: "password123"
        });
        const token = res1.data.token;
        console.log("Registered, got token");

        const res2 = await axios.put('http://localhost:8080/api/auth/settings', {
            githubUsername: "testGit",
            githubRepo: "testRepo",
            githubToken: "ghp_123456789012345678901234567890123456",
            platformHandles: {
                leetcode: "testLC"
            }
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Settings update:", res2.data);
    } catch (e) {
        if (e.response) {
            console.error(e.response.status, e.response.data);
        } else {
            console.error(e);
        }
    }
}
run();
