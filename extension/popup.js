document.addEventListener('DOMContentLoaded', () => {
    const mainSec = document.getElementById('main-section');
    const loginSec = document.getElementById('login-section');

    // Checking auth state
    chrome.storage.local.get(['token'], (res) => {
        if (res.token) {
            mainSec.style.display = 'block';
        } else {
            loginSec.style.display = 'block';
        }
    });

    document.getElementById('manual-sync-btn')?.addEventListener('click', () => {
        const btn = document.getElementById('manual-sync-btn');
        btn.innerText = 'Syncing...';

        // In actual implementation we fire a message to background.js
        setTimeout(() => {
            btn.innerText = 'Synced Successfully!';
            setTimeout(() => btn.innerText = 'Trigger Manual Sync', 2000);
        }, 1500);
    });

    document.getElementById('dashboard-btn')?.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://party-five-black.vercel.app' });
    });

    document.getElementById('login-btn')?.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://party-five-black.vercel.app/login' });
    });
});
