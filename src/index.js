// src/index.js
require('./config/env');

const { startServer } = require('./server');
const { connectTwitch } = require('./services/twitch');

(async () => {
    try {
        await connectTwitch();
        startServer();
    } catch (err) {
        console.error('💥 Fatal error during bootstrap:', err);
        process.exit(1);
    }
})();
