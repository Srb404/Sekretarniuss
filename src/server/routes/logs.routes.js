// src/server/routes/logs.routes.js
const express = require('express');
const { getUniqueRows } = require('../../services/db');

const router = express.Router();

router.get('/api/logs', (req, res) => {
    const { full } = req.query;
    if (full === 'true') return res.json({ uniqueLog: getUniqueRows(Infinity).join('\n') });
    // domyślnie  – ostatnie 10
    res.json({ uniqueLog: getUniqueRows(10).join('\n') });
});

module.exports = router;
