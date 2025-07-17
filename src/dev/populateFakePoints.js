const { pushPoints } = require('../services/db');
const { format } = require('date-fns');
const faker = require('@faker-js/faker').faker;

// 🧪 Ustawienia
const COUNT = 200; // ilu użytkowników chcesz dodać
const MAX_PTS = 150; // maksymalna liczba punktów
const today  = format(new Date(), 'yyyy-MM-dd');
const month  = today.slice(0, 7);

function getRandomUser() {
    return faker.internet.userName().toLowerCase().replace(/\W+/g, '');
}

function getRandomPoints() {
    return Math.floor(Math.random() * MAX_PTS) + 1;
}

for (let i = 0; i < COUNT; i++) {
    const user = getRandomUser();
    const pts  = getRandomPoints();
    pushPoints('global', user, pts);
    pushPoints(`month:${month}`, user, pts);
    pushPoints(`day:${today}`, user, pts);
}

console.log(`✅ Dodano ${COUNT} losowych użytkowników do global, month i day`);
