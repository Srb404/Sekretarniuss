// ui/js/dashboard.js
import { escapeHTML } from './utils.js';

async function updateDashboard() {
    try {
        const res  = await fetch('/api/status');
        const data = await res.json();

        /* ---------- Twitch ---------- */
        const twitchStatus = document.getElementById('twitch-status');
        twitchStatus.textContent = data.twitch.connected ? 'Połączony' : 'Rozłączony';
        twitchStatus.className   = `status ${data.twitch.connected ? 'online' : 'offline'}`;
    } catch (err) {
        console.error('❌ Błąd pobierania statusu:', err);
    }
}

async function updateLogs() {
    try {
        // pobieramy ostatnie wpisy unikalniussów
        const res  = await fetch('/api/logs?last=true');
        const data = await res.json();

        const uniqueLog = document.getElementById('unique-log');
        uniqueLog.innerHTML = data.uniqueLog
            .split('\n')
            .filter(Boolean)
            .map((l) => `<div><i class="fas fa-dna"></i> ${escapeHTML(l)}</div>`)
            .join('');
    } catch (err) {
        console.error('❌ Błąd pobierania logów:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    updateLogs();

    setInterval(updateDashboard, 8_000);
    setInterval(updateLogs,      10_000);
});
