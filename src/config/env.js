// src/config/env.js
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadEnv() {
    /* 1)  .env na dysku obok EXE lub projektu */
    const diskPath = path.join(
        process.pkg ? path.dirname(process.execPath) : process.cwd(),
        '.env'
    );
    if (fs.existsSync(diskPath)) {
        dotenv.config({ path: diskPath });
        console.log('✅ .env załadowany z dysku');
        return;
    }

    /* 2)  .env w snapshot →  katalog src/.env  */
    const snapPath = path.join(__dirname, '..', '.env');   // <-- UWAGA: „..”
    if (fs.existsSync(snapPath)) {
        dotenv.config({ path: snapPath });
        console.log('✅ .env załadowany ze snapshotu');
        return;
    }

    console.warn('⚠️  Nie znaleziono pliku .env (disk ani snapshot)');
}

loadEnv();
