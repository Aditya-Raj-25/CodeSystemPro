// Helper to show visual feedback on the page
const showNotification = (message, status = 'loading') => {
    let notifyEl = document.getElementById('codetrackr-notify');
    if (!notifyEl) {
        notifyEl = document.createElement('div');
        notifyEl.id = 'codetrackr-notify';
        notifyEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        document.body.appendChild(notifyEl);
    }

    notifyEl.style.display = 'flex';
    notifyEl.style.opacity = '1';

    if (status === 'loading') {
        notifyEl.style.backgroundColor = '#2563eb';
        notifyEl.style.color = 'white';
        notifyEl.innerHTML = `<span style="display:inline-block; width:15px; height:15px; border:2px solid white; border-top-color:transparent; border-radius:50%; animation:ct-spin 1s linear infinite;"></span> ${message}`;
    } else if (status === 'success') {
        notifyEl.style.backgroundColor = '#059669';
        notifyEl.style.color = 'white';
        notifyEl.innerText = `✅ ${message}`;
    } else if (status === 'error') {
        notifyEl.style.backgroundColor = '#dc2626';
        notifyEl.style.color = 'white';
        notifyEl.innerText = `❌ ${message}`;
    }

    if (!document.getElementById('codetrackr-style')) {
        const style = document.createElement('style');
        style.id = 'codetrackr-style';
        style.textContent = `@keyframes ct-spin { to { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }

    if (status !== 'loading') {
        setTimeout(() => {
            notifyEl.style.opacity = '0';
            setTimeout(() => { notifyEl.style.display = 'none'; }, 300);
        }, 5000);
    }
};

// Extract code from LeetCode page
const getLeetCodeCode = () => {
    // 1. Monaco editor - the main code editor on /problems/ page
    const lines = document.querySelectorAll('.monaco-editor .view-line');
    if (lines.length > 0) {
        return Array.from(lines).map(line => line.innerText).join('\n');
    }

    // 2. Pre/code block on submission detail pages
    const codeBlock = document.querySelector('pre code') || document.querySelector('code');
    if (codeBlock) {
        return codeBlock.innerText || codeBlock.textContent;
    }

    // 3. Any Monaco container
    const monaco = document.querySelector('.monaco-editor');
    if (monaco) return monaco.innerText || monaco.textContent;

    return null;
};

// Observe LeetCode for "Accepted" submissions
const observeLeetCode = () => {
    console.log('[CodeTrackr] Observing LeetCode for automatic sync...');

    const trySync = async () => {
        const url = window.location.href;

        // Check if "Accepted" is visible anywhere on the page
        const isAccepted = document.body.innerText.includes('Accepted') ||
            !!document.querySelector('[data-e2e-locator="submission-result"]') ||
            !!document.querySelector('.text-success');

        if (!isAccepted) return;

        // 1. Try to get submission ID from URL
        const subIdMatch = url.match(/submissions\/detail\/(\d+)/) || url.match(/submissions\/(\d+)/);
        let submissionId = subIdMatch ? subIdMatch[1] : null;

        // 2. If no ID in URL, look for it on the page
        if (!submissionId) {
            const detailLink = document.querySelector('a[href*="/submissions/detail/"]');
            if (detailLink) {
                const match = detailLink.href.match(/detail\/(\d+)/);
                if (match) submissionId = match[1];
            }
        }

        if (!submissionId) return;

        // Prevent spamming the same ID if it's already successfully synced in this session
        if (window._syncedIds && window._syncedIds.has(submissionId)) return;

        // 3. CODE EXTRACTION
        let code = getLeetCodeCode();
        let language = 'python3';

        // 4. BACKUP METHOD: Fetch directly from LC API
        try {
            const response = await fetch(`https://leetcode.com/submissions/api/detail/${submissionId}/`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.code) {
                    code = data.code;
                    language = data.lang || language;
                }
            }
        } catch (e) {
            console.error('[CodeTrackr] LC API fetch failed:', e);
        }

        if (!code || code.length < 15) {
            console.warn('[CodeTrackr] Code not ready yet, will retry...');
            return;
        }

        // Initialize set if not exists
        if (!window._syncedIds) window._syncedIds = new Set();
        window._syncedIds.add(submissionId);

        // Get problem name
        let problemName = 'leetcode-problem';
        const slugMatch = url.match(/problems\/([^/]+)/);
        if (slugMatch) {
            problemName = slugMatch[1].replace(/-/g, ' ');
        } else {
            const titleEl = document.querySelector('h4 a') ||
                Array.from(document.querySelectorAll('a')).find(a => a.href && a.href.includes('/problems/'));
            if (titleEl) problemName = titleEl.innerText.trim();
        }

        console.log(`[CodeTrackr] Automatically syncing: ${problemName} (${submissionId})`);
        showNotification('Syncing to GitHub...', 'loading');

        const data = {
            platform: 'leetcode',
            problemName,
            submissionId,
            language,
            code
        };

        chrome.runtime.sendMessage({ action: 'SYNC_SUBMISSION', data }, response => {
            if (response?.success) {
                showNotification('Code pushed to GitHub!', 'success');
                console.log('[CodeTrackr] ✅ Automatically synced');
            } else {
                // If failed, remove from synced set so it can retry
                window._syncedIds.delete(submissionId);
                const err = response?.error || 'Sync Failed';
                showNotification(err === 'Not authenticated' ? 'Login CodeTrackr first' : err, 'error');
            }
        });
    };

    // Watch for DOM changes
    const observer = new MutationObserver(() => trySync());
    observer.observe(document.body, { childList: true, subtree: true });

    // Periodic check
    setInterval(trySync, 1500);
    setTimeout(trySync, 500);
};

// Process Codeforces submission page
const processCodeforces = () => {
    const url = window.location.href;
    if (!url.includes('/submission/')) return;

    console.log('[CodeTrackr] Processing Codeforces...');
    const isAccepted = !!document.querySelector('.verdict-accepted') || document.body.innerText.includes('Accepted');
    if (!isAccepted) return;

    // Get code
    const codeEl = document.querySelector('#program-source-text') ||
        document.querySelector('pre.program-source') ||
        document.querySelector('.source-code');
    const code = codeEl ? (codeEl.innerText || codeEl.textContent) : null;
    if (!code) return;

    // Get problem name
    let problemName = 'Unknown Problem';
    const problemLink = document.querySelector('a[href*="/problem/"]');
    if (problemLink) {
        const parts = problemLink.innerText.split('-');
        problemName = parts.length > 1 ? parts.slice(1).join('-').trim() : problemLink.innerText.trim();
    }

    // Get language
    let language = 'C++';
    const rows = document.querySelectorAll('table.online-judge-result td');
    if (rows.length > 3) language = rows[3]?.innerText?.trim() || 'C++';

    // Get submission ID
    const subIdMatch = url.match(/submission\/(\d+)/);
    const submissionId = subIdMatch ? subIdMatch[1] : `cf-${Date.now()}`;

    if (window._lastSyncedSubId === submissionId) return;
    window._lastSyncedSubId = submissionId;

    showNotification('Syncing to GitHub...', 'loading');

    chrome.runtime.sendMessage({
        action: 'SYNC_SUBMISSION',
        data: { platform: 'codeforces', problemName, submissionId, language, code }
    }, response => {
        if (response?.success) {
            showNotification('Code pushed to GitHub!', 'success');
        } else {
            const err = response?.error || 'Sync Failed';
            showNotification(err === 'Not authenticated' ? 'Login to CodeTrackr first' : err, 'error');
        }
    });
};

// Init
const init = () => {
    const host = window.location.hostname;

    if (host === 'localhost') {
        window.addEventListener('message', (event) => {
            if (event.source !== window || !event.data || event.data.type !== 'CODE_TRACKR_SET_TOKEN') return;
            const token = event.data.token;
            if (token) {
                chrome.storage.local.set({ token }, () => {
                    console.log('[CodeTrackr] Token saved');
                    showNotification('Extension Linked!', 'success');
                });
            } else {
                chrome.storage.local.remove('token');
            }
        });
        return;
    }

    if (host.includes('leetcode.com')) {
        observeLeetCode();
    } else if (host.includes('codeforces.com')) {
        setTimeout(processCodeforces, 2000);
    }
};

init();
