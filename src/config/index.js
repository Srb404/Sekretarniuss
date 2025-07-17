const path = require('path');

const rootPath =
    typeof process.pkg !== 'undefined'
        ? path.dirname(process.execPath)
        : path.join(__dirname, '../..');

const storagePath = path.join(rootPath, 'storage');

module.exports = {
    rootPath,
    storagePath,

    twitch: {
        username:   process.env.TWITCH_USERNAME,
        oauthToken: process.env.TWITCH_OAUTH_TOKEN,
        channels:  [process.env.TWITCH_CHANNEL],
    },
};
