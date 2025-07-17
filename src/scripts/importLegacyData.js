// src/scripts/importLegacyData.js
//
// Jednorazowy importer: unique_niuss.txt  +  chat_points.json
// Uruchom:  npm run import-legacy
// Po imporcie możesz ten plik i stare TXT / JSON usunąć.

const fs        = require('fs');
const path      = require('path');
const Database  = require('better-sqlite3');
const { rootPath } = require('../config');          // <── KLUCZOWA ZMIANA
const { pushPoints } = require('../services/db');

/* ---------- ścieżki ---------- */
const storageDir       = path.join(rootPath, 'storage');
const legacyWordTxt    = path.join(storageDir, 'unique_niuss.txt');
const legacyPointsJson = path.join(storageDir, 'chat_points.json');
const dbPath           = path.join(storageDir, 'niuss.db');

/* ---------- Init DB ---------- */
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

/* ---------- Import unikalniussów ---------- */
function importWords() {
    if (!fs.existsSync(legacyWordTxt)) {
        console.log('ℹ️  unique_niuss.txt nie znaleziony – pomijam.');
        return;
    }
    const insert = db.prepare(
        `INSERT OR IGNORE INTO word (word, author, first_seen)
         VALUES (?, ?, ?)`
    );
    const added = fs
        .readFileSync(legacyWordTxt, 'utf8')
        .split('\n')
        .filter(Boolean)
        .reduce((cnt, line) => {
            const [d, t, author, word] = line.split('\t');
            if (!word) return cnt;
            const [day, mon, yr] = d.split('.');
            const ts =
                Date.parse(`${yr}-${mon}-${day}T${t}Z`) / 1000 ||
                Math.floor(Date.now() / 1000);
            return insert.run(word.toLowerCase(), author.toLowerCase(), ts).changes
                ? cnt + 1
                : cnt;
        }, 0);
    console.log(`✅  Zaimportowano ${added} unikalniussów`);
}

/* ---------- Import punktów ---------- */
function importPoints() {
    if (!fs.existsSync(legacyPointsJson)) {
        console.log('ℹ️  chat_points.json nie znaleziony – pomijam.');
        return;
    }
    const raw = JSON.parse(fs.readFileSync(legacyPointsJson, 'utf8'));
    Object.entries(raw).forEach(([user, o]) => {
        if (o?.points) pushPoints('global', user.toLowerCase(), o.points);
    });
    console.log(`✅  Zaimportowano punkty dla ${Object.keys(raw).length} użytkowników`);
}

/* ---------- RUN ---------- */
importWords();
importPoints();
console.log('🎉  Import zakończony – możesz skasować pliki TXT/JSON.\n');
