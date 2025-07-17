# Sekretarniuss

🎮 System zarządzania czatem i widżetami do streamingu

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-5.x-blue)
![SQLite](https://img.shields.io/badge/SQLite-3-lightblue)
![Twitch](https://img.shields.io/badge/Twitch-API-purple)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-orange)
![OBS](https://img.shields.io/badge/OBS-Widgets-darkgreen)
![Status](https://img.shields.io/badge/Status-In%20Development-red)

## ⚠️ Status projektu

> **Uwaga**: Ten projekt jest obecnie w fazie rozwoju (in development). Funkcjonalności mogą się zmieniać, a stabilność nie jest gwarantowana.

## 📋 Opis

Sekretarniuss to kompletny system do zarządzania czatem Twitch z zaawansowanymi funkcjami gamifikacji i widżetami OBS. Aplikacja umożliwia śledzenie aktywności widzów, zarządzanie "unikalniussami" oraz wyświetlanie rankingów w czasie rzeczywistym.

## ✨ Funkcjonalności

### 🏆 System punktów
- Automatyczne przyznawanie punktów za aktywność w czacie
- Rankingi globalne, miesięczne i dzienne
- Zaawansowany algorytm punktacji uwzględniający:
  - Długość wiadomości
  - Obecność pytań
  - Emotikony
  - Unikalne słowa zawierające "niuss"

### 🧬 Unikalniussy
- Automatyczne wykrywanie nowych słów z sufiksem "niuss"
- Śledzenie autora pierwszego użycia
- Historia wszystkich unikalnych słów
- Powiadomienia w czasie rzeczywistym

### 📊 Panel administracyjny
- Dashboard z podglądem statystyk
- Zarządzanie punktami użytkowników
- Przeglądanie historii unikalniussów
- Monitor połączenia z Twitch

### 🎨 Widżety OBS
- **Top Chat** - ranking najaktywniejszych widzów
- **Niuss Widget** - powiadomienia o nowych unikalniussach
- **Mic Widget** - wizualizacja poziomu mikrofonu
- Responsywny design z animacjami
- Konfigurowalny wygląd i zachowanie

## 🛠️ Technologie

- **Backend**: Node.js, Express.js
- **Database**: SQLite3 (better-sqlite3)
- **WebSocket**: ws
- **Frontend**: Vanilla JavaScript, CSS3
- **Twitch API**: tmi.js
- **UI**: Font Awesome, CSS Grid/Flexbox

## 📁 Struktura plików

```
Sekretarniuss/
├── public/                 # Pliki statyczne
│   ├── dashboard.html     # Panel główny
│   ├── lists/             # Listy rankingów
│   │   ├── ranking.html   # Ranking aktywności
│   │   └── unikalniussy.html # Historia unikalniussów
│   ├── widgets/           # Widżety OBS
│   │   ├── topchat.html   # Widget rankingu
│   │   ├── niuss.html     # Widget powiadomień
│   │   └── mic/           # Widget mikrofonu
│   └── ui/                # Style i skrypty
│       ├── css/           # Arkusze stylów
│       └── js/            # Skrypty JavaScript
├── src/
│   ├── config/            # Konfiguracja aplikacji
│   │   ├── env.js         # Ładowanie zmiennych środowiskowych
│   │   └── index.js       # Główna konfiguracja
│   ├── server/            # Serwer HTTP/WebSocket
│   │   ├── index.js       # Główny serwer
│   │   └── routes/        # Endpointy API
│   ├── services/          # Logika biznesowa
│   │   ├── db.js          # Obsługa bazy danych
│   │   └── twitch/        # Integracja z Twitch
│   └── index.js           # Punkt wejścia aplikacji
├── storage/               # Dane aplikacji
│   └── niuss.db          # Baza danych SQLite
├── .env                   # Zmienne środowiskowe
└── package.json           # Zależności projektu
```

## 🚀 Instalacja

### Wymagania
- Node.js 18+
- npm lub yarn
- Token OAuth Twitch

### Kroki instalacji

1. **Sklonuj repozytorium**
```bash
git clone https://github.com/username/Sekretarniuss.git
cd Sekretarniuss
```

2. **Zainstaluj zależności**
```bash
npm install
```

3. **Skonfiguruj zmienne środowiskowe**
```bash
# Utwórz plik .env w katalogu głównym
TWITCH_USERNAME=twój_bot
TWITCH_OAUTH_TOKEN=oauth:twój_token
TWITCH_CHANNEL=twój_kanał
PORT=3000
```

4. **Uruchom aplikację**
```bash
npm start
```

5. **Otwórz panel**
```
http://localhost:3000
```

## ⚙️ Konfiguracja

### Twitch
1. Uzyskaj token OAuth z [Twitch Token Generator](https://twitchtokengenerator.com/)
2. Dodaj dane do pliku `.env`
3. Restart aplikacji

### Widżety OBS
1. Dodaj **Browser Source** w OBS
2. URL widżetu: `http://localhost:3000/widgets/nazwa_widgetu.html`
3. Ustaw odpowiednią rozdzielczość
4. Konfiguruj parametry przez URL

## 🎮 Widżety OBS

### Top Chat Widget
```
http://localhost:3000/widgets/topchat.html
```
- Automatyczne przełączanie między rankingami
- Konfigurowalne przez `topchat-config.json`
- Animacje i efekty przejść

### Niuss Widget
```
http://localhost:3000/widgets/niuss.html
```
- Powiadomienia o nowych unikalniussach
- Efekty combo dla wielu słów
- Automatyczne znikanie

### Mic Widget
```
http://localhost:3000/widgets/mic/mic_widget.html?mic=Mikrofon&ws=ws://localhost:4455
```
- Wizualizacja poziomu mikrofonu
- Integracja z OBS WebSocket
- Efekty cząsteczkowe dla wysokich poziomów

## 🎮 Główne komendy

### Panel administracyjny
```bash
# Otwórz panel w przeglądarce
http://localhost:3000

# Dashboard z podglądem statystyk
http://localhost:3000/dashboard.html

# Ranking aktywności czatu
http://localhost:3000/lists/ranking.html

# Historia unikalniussów
http://localhost:3000/lists/unikalniussy.html
```

### API do zarządzania punktami
```bash
# Przyznaj punkty użytkownikowi (POST)
curl -X POST http://localhost:3000/api/points \
  -H "Content-Type: application/json" \
  -d '{"user": "nick_gracza", "points": 50, "scope": "global"}'

# Pobierz ranking (GET)
curl http://localhost:3000/api/topchat?scope=global&all=true

# Status systemu (GET)
curl http://localhost:3000/api/status
```

## 🔧 Development

```bash
# Tryb developera z auto-restart
npm run dev

# Linting kodu
npm run lint

# Formatowanie kodu według standardów
npm run format

# Build wersji standalone (executable)
npm run pkg
```

### Dodawanie nowych widżetów
```javascript
// Przykład struktury nowego widżetu
// public/widgets/moj_widget.html
class MojWidget {
    constructor() {
        this.initializeWebSocket();
        this.setupEventHandlers();
    }
    
    initializeWebSocket() {
        this.socket = new WebSocket('ws://localhost:3000');
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
    }
}
```
