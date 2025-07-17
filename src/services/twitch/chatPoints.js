const crypto = require('crypto');
const { pushPoints, getTop } = require('../db');

const msgHashes = new Map();
const CACHE_MS = 3 * 60 * 60 * 1000;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const today = () => new Date().toISOString().slice(0, 10);
const month = () => today().slice(0, 7);

function cleanup() {
    const now = Date.now();
    for (const [h, t] of msgHashes)
        if (now - t > CACHE_MS) msgHashes.delete(h);
}

function calcPoints(msg, includesNiuss) {
    const txt = msg.trim();
    const lower = txt.toLowerCase();
    const words = txt.split(/\s+/);
    let pts = 1;
    if (words.length >= 6) pts += 2;
    if (lower.includes('?')) pts += 2;
    if (/[\u{1F600}-\u{1F64F}]/u.test(txt)) pts += 1;
    if (includesNiuss) pts += 1;
    return Math.min(pts, 5);
}

function handleChatMessage(user, msg, includesNiuss = false) {
    cleanup();
    const hash = sha(`${user}-${msg}`);
    if (msgHashes.has(hash)) return;
    msgHashes.set(hash, Date.now());

    const pts = calcPoints(msg, includesNiuss);

    pushPoints('global', user, pts);
    pushPoints(`month:${month()}`, user, pts);
    pushPoints(`day:${today()}`, user, pts);
}

function getTopChatters(scope = 'global', limit = 8, all = false) {
    const key =
        scope === 'month' ? `month:${month()}` :
            scope === 'day'   ? `day:${today()}` :
                'global';

    return getTop(key, all ? Infinity : limit);
}

module.exports = { handleChatMessage, getTopChatters };
