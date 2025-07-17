// src/server/index.js
const express = require('express');
const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const { Server: WebSocketServer } = require('ws');

function startServer() {
    const app  = express();
    const port = process.env.PORT || 3000;

    /* ------- middleware ------- */
    app.use(express.json());

    /* ------- static ------- */
    const basePath  = process.pkg ? path.dirname(process.execPath) : path.join(__dirname, '../..');
    const publicDir = path.join(basePath, 'public');
    app.use(express.static(publicDir));

    /* 👉 zamiast index.html od razu otwieramy dashboard */
    app.get('/', (_req, res) => res.redirect('/dashboard.html'));

    /* ------- dynamic routes ------- */
    const routesDir = path.join(__dirname, 'routes');
    fs.readdirSync(routesDir)
        .filter((f) => f.endsWith('.routes.js'))
        .forEach((file) => app.use(require(path.join(routesDir, file))));

    /* ------- WebSocket ------- */
    const server = http.createServer(app);
    const wss    = new WebSocketServer({ server });
    wss.broadcast = (data) => {
        const payload = JSON.stringify(data);
        wss.clients.forEach((c) => c.readyState === 1 && c.send(payload));
    };

    server.listen(port, () => console.log(`🚀 HTTP+WS ready on http://localhost:${port}`));
    module.exports.wss = wss;
}

module.exports = { startServer };
