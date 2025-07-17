// src/server/routes/status.routes.js
const express = require('express');
const config = require('../../config');
const { getTopChatters } = require('../../services/twitch/chatPoints');

const router = express.Router();

/* ────────────────────────────────────────────────────────────────────────── */
/*  /api/status  – proste informacje dla dashboardu (już bez Spotify)        */
/* ────────────────────────────────────────────────────────────────────────── */
router.get('/api/status', (_req, res) => {
    const status = { twitch: {} };

    /* --------- Twitch --------- */
    status.twitch.connected = !!config.twitch.oauthToken;
    status.twitch.channelStatus = Object.fromEntries(
        config.twitch.channels.map((c) => [c, 'online']),
    );

    res.json(status);
});

/* ────────────────────────────────────────────────────────────────────────── */
/*  /api/topchat  – ranking czatu                                            */
/*                                                                           */
/*  query:                                                                   */
/*    scope=global|month|day   (domyślnie global)                            */
/*    all=true              – zwróć pełną listę                              */
/* ────────────────────────────────────────────────────────────────────────── */
router.get('/api/topchat', (req, res) => {
    const scope = req.query.scope || 'global';            // 'global' | 'month' | 'day'
    const limit = req.query.all === 'true' ? Infinity : 8;
    const all   = req.query.all === 'true';
    const top   = getTopChatters(scope, limit, all);
    res.json({ top });
});

module.exports = router;
