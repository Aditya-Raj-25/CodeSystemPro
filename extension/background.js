// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SYNC_SUBMISSION') {
        chrome.storage.local.get(['token'], (result) => {
            const token = result.token;
            if (!token) {
                console.warn('No authentication token found. Cannot sync submission.');
                sendResponse({ success: false, error: 'Not authenticated' });
                return;
            }

            console.log('Intercepted successful submission:', request.data);

            fetch('http://localhost:8080/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(request.data)
            })
                .then(async response => {
                    const data = await response.json();
                    if (response.ok) {
                        console.log('Submission synced successfully', data);
                        sendResponse({ success: true, data });
                    } else {
                        console.error('Sync failed:', data.message);
                        sendResponse({ success: false, error: data.message || 'Server error' });
                    }
                })
                .catch(error => {
                    console.error('Error syncing submission:', error);
                    sendResponse({ success: false, error: 'Cannot connect to server' });
                });
        });

        return true; // Keep the message channel open for async response
    }
});

// =====================================================
// BACKGROUND AUTO-FIX: Fetch code for Pending entries
// =====================================================
// This runs every 30 seconds. It:
// 1. Asks the server for LeetCode submissions that have no code
// 2. Fetches the actual code from LeetCode's API (using browser cookies)
// 3. POSTs the code back to the server, which pushes it to GitHub
// =====================================================

const fixPendingSubmissions = async () => {
    try {
        const result = await chrome.storage.local.get(['token']);
        const token = result.token;
        if (!token) return; // Not logged in

        // 1. Get list of pending submissions
        const pendingRes = await fetch('http://localhost:8080/api/sync/pending-leetcode', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!pendingRes.ok) return;
        const pendingList = await pendingRes.json();

        if (!pendingList || pendingList.length === 0) return;
        console.log(`[CodeTrackr BG] Found ${pendingList.length} pending submissions to fix`);

        // 2. For each pending submission, try to fetch code from LeetCode API
        for (const sub of pendingList) {
            try {
                const lcRes = await fetch(`https://leetcode.com/submissions/api/detail/${sub.submissionId}/`);
                if (!lcRes.ok) {
                    console.log(`[CodeTrackr BG] Could not fetch code for ${sub.problemName} (${lcRes.status})`);
                    continue;
                }
                const lcData = await lcRes.json();

                if (!lcData || !lcData.code || lcData.code.length < 15) {
                    console.log(`[CodeTrackr BG] No valid code for ${sub.problemName}`);
                    continue;
                }

                console.log(`[CodeTrackr BG] Got code for "${sub.problemName}", pushing to server...`);

                // 3. POST the code back to our sync endpoint
                const syncRes = await fetch('http://localhost:8080/api/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        platform: 'leetcode',
                        problemName: sub.problemName,
                        submissionId: sub.submissionId,
                        language: lcData.lang || 'python3',
                        code: lcData.code
                    })
                });

                if (syncRes.ok) {
                    console.log(`[CodeTrackr BG] ✅ Fixed: ${sub.problemName}`);
                } else {
                    console.log(`[CodeTrackr BG] ❌ Sync failed for ${sub.problemName}`);
                }

                // Small delay between requests to avoid rate limiting
                await new Promise(r => setTimeout(r, 2000));
            } catch (err) {
                console.error(`[CodeTrackr BG] Error fixing ${sub.problemName}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[CodeTrackr BG] fixPendingSubmissions error:', err);
    }
};

// Run every 30 seconds
setInterval(fixPendingSubmissions, 30000);
// Run once 5 seconds after extension loads
setTimeout(fixPendingSubmissions, 5000);
