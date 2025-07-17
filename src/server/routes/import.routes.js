const express  = require('express');
const multer   = require('multer');
const fs       = require('fs');
const path     = require('path');
const Database = require('better-sqlite3');
const { storagePath } = require('../../config');
const { pushPoints } = require('../../services/db');

if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });

const dbPath = path.join(storagePath, 'niuss.db');
const db     = new Database(dbPath);
db.pragma('journal_mode = WAL');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
    '/api/import-legacy',
    upload.fields([
        { name: 'unique', maxCount: 1 },
        { name: 'points', maxCount: 1 },
    ]),
    (req, res) => {
        try {
            if (req.files?.unique?.length) {
                const txt = req.files.unique[0].buffer.toString('utf8');
                const insert = db.prepare(
                    `INSERT OR IGNORE INTO word (word, author, first_seen)
                     VALUES (?, ?, ?)`
                );
                txt.split('\n').filter(Boolean).forEach((ln) => {
                    const [d,t,author,word] = ln.split('\t');
                    if (!d || !t || !author || !word) return;
                    const [day,mon,yr] = d.split('.');
                    const ts = Date.parse(`${yr}-${mon}-${day}T${t}Z`)/1000
                        || Math.floor(Date.now()/1000);
                    insert.run(word.toLowerCase(), author.toLowerCase(), ts);
                });
            }

            if (req.files?.points?.length) {
                const json = JSON.parse(req.files.points[0].buffer.toString('utf8'));
                Object.entries(json).forEach(([user,obj]) => {
                    if (!obj?.points) return;
                    pushPoints('global', user.toLowerCase(), obj.points);
                });
            }

            res.json({ ok:true });
        } catch (err) {
            console.error('❌ import-legacy', err);
            res.status(500).json({ error: err.message });
        }
    },
);

module.exports = router;
