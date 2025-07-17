// src/server/routes/admin.routes.js
const express = require('express');
const { pushPoints } = require('../../services/db');

const router = express.Router();

/*  POST /api/points
    body: { user: "nick", points: 42, scope: "global"|"month"|"day" }
*/
router.post('/api/points', (req, res) => {
    const { user, points, scope = 'global' } = req.body || {};
    if (!user || typeof points !== 'number' || points <= 0)
        return res.status(400).json({ error: 'user & positive points required' });

    pushPoints(scope, user.toLowerCase(), points);
    return res.json({ ok: true });
});

module.exports = router;
