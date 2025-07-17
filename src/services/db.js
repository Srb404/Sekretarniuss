const fs   = require('fs');
const path = require('path');
const { storagePath } = require('../config');

if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });

/* --------------------- Ładowanie native binding --------------------- */
function getBetterSqlite3() {
    const isPkg = typeof process.pkg !== 'undefined';
    if (isPkg) {
        // W trybie pkg - plik .node powinien być obok .exe
        const binaryPath = path.join(path.dirname(process.execPath), 'better_sqlite3.node');
        return require(binaryPath);
    } else {
        // W trybie dev - standardowa ścieżka z node_modules
        return require('better-sqlite3');
    }
}
const Database = getBetterSqlite3();

/* --------------------- Inicjalizacja bazy --------------------- */
const dbPath = path.join(storagePath, 'niuss.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS word (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        word       TEXT    NOT NULL UNIQUE,
        author     TEXT    NOT NULL,
        first_seen INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS points (
        scope      TEXT    NOT NULL,
        user       TEXT    NOT NULL,
        points     INTEGER NOT NULL DEFAULT 0,
        last_seen  INTEGER NOT NULL,
        PRIMARY KEY (scope, user)
    );
`);

/* --------------------- Funkcje bazy --------------------- */
const insWord = db.prepare(`
    INSERT OR IGNORE INTO word (word, author, first_seen)
    VALUES (@word, @author, @now)
`);
function isNewWord(word, author) {
    const now = Math.floor(Date.now() / 1000);
    return insWord.run({ word, author, now }).changes === 1;
}

function getUniqueRows(limit = 10) {
    const sql = `
        SELECT author, first_seen, word
        FROM word
        ORDER BY first_seen DESC
            ${limit === Infinity ? '' : 'LIMIT ?'}
    `;
    const rows = limit === Infinity
        ? db.prepare(sql).all()
        : db.prepare(sql).all(limit);

    return rows.map(({ author, first_seen, word }) => {
        const d = new Date(first_seen * 1000);
        const date = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
        const time = d.toTimeString().slice(0, 8);
        return `${date}\t${time}\t${author}\t${word}`;
    });
}

function deleteWord(word) {
    db.prepare(`DELETE FROM word WHERE word = ?`).run(word);
}

const upsertPoints = db.prepare(`
    INSERT INTO points (scope, user, points, last_seen)
    VALUES (@scope, @user, @pts, @now)
        ON CONFLICT(scope,user)
    DO UPDATE SET
        points    = points + excluded.points,
                   last_seen = excluded.last_seen
`);
function pushPoints(scope, user, pts) {
    const now = Math.floor(Date.now() / 1000);
    upsertPoints.run({ scope, user, pts, now });
}

function getTop(scope, limit = 8) {
    const sql = `
        SELECT user, points, last_seen
        FROM points
        WHERE scope = ?
        ORDER BY points DESC
            ${limit === Infinity ? '' : 'LIMIT ?'}
    `;
    return limit === Infinity
        ? db.prepare(sql).all(scope)
        : db.prepare(sql).all(scope, limit);
}

function setPoints(scope, user, points) {
    db.prepare(`
        UPDATE points
        SET points = ?, last_seen = ?
        WHERE scope = ? AND user = ?
    `).run(points, Math.floor(Date.now() / 1000), scope, user);
}

function deletePoints(scope, user) {
    db.prepare(`DELETE FROM points WHERE scope = ? AND user = ?`).run(scope, user);
}

module.exports = {
    isNewWord,
    getUniqueRows,
    deleteWord,
    pushPoints,
    getTop,
    setPoints,
    deletePoints,
};
