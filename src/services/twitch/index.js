const tmi = require('tmi.js');
const config = require('../../config');
const { handleChatMessage } = require('./chatPoints');
const { isNewWord } = require('../db');

const IGNORED_USERS = ['streamelements'];

const twitchClient = new tmi.Client({
    connection: { reconnect: true },
    identity  : { username: config.twitch.username, password: config.twitch.oauthToken },
    channels  : config.twitch.channels,
});

twitchClient.on('message', (_ch, tags, message, self) => {
    if (self) return;
    if (IGNORED_USERS.includes(tags.username?.toLowerCase())) return;

    const niussWords = message
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.endsWith('niuss'));

    const newUnique = niussWords.filter((w) => isNewWord(w, tags.username));

    handleChatMessage(tags.username, message, newUnique.length > 0);

    if (newUnique.length) {
        const { wss } = require('../../server');
        if (wss?.clients?.size) {
            wss.broadcast({
                type  : 'unikalniuss',
                data  : newUnique,
                author: tags.username,
            });
        }
    }
});

async function connectTwitch() {
    try {
        await twitchClient.connect();
        console.log('🟣 Twitch: Połączono z czatem');
    } catch (err) {
        console.error('❌ Twitch: błąd połączenia:', err);
    }
}

module.exports = { connectTwitch };
