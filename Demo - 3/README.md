# Rezerwacja sal

Prosta aplikacja webowa do przeglądania sal, kalendarza rezerwacji i dodawania terminów (bez nakładania się). Panel administratora służy do dodawania sal.

**Stack:** Node.js, Express, SQLite (`better-sqlite3`), frontend HTML + Tailwind (CDN).

## Wymagania

- Node.js **18+**
- npm

## Uruchomienie

```bash
npm install
npm start
```

Aplikacja: [http://localhost:3000](http://localhost:3000)  
Panel admin: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

### Tryb developerski (auto-restart)

| System | Komenda |
|--------|---------|
| Windows | `.\dev.ps1` |
| Linux / macOS | `./dev.sh` |

Skrypt uruchamia `npm run dev` (`node --watch`). Opcjonalnie wczytuje `.env`.

## Konfiguracja

Skopiuj `.env.example` do `.env` i edytuj według potrzeb:

| Zmienna | Domyślnie | Opis |
|---------|-----------|------|
| `PORT` | `3000` | Port HTTP |
| `DB_PATH` | `data/rooms.db` | Ścieżka do pliku SQLite |
| `ADMIN_SECRET` | — | Jeśli ustawione, `POST /api/rooms` wymaga nagłówka `X-Admin-Key` |

Baza i katalog `data/` tworzą się przy starcie. Przy pustych tabelach ładują się przykładowe sale i rezerwacje (dev).

## API (skrót)

Wszystkie odpowiedzi błędów: `{ "error": "..." }`.

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| `GET` | `/api/health` | Status serwera `{ "ok": true }` |
| `GET` | `/api/rooms` | Lista sal |
| `GET` | `/api/rooms/:id` | Szczegół sali |
| `POST` | `/api/rooms` | Nowa sala (admin, opcjonalnie `X-Admin-Key`) |
| `GET` | `/api/rooms/:roomId/reservations?from=&to=` | Rezerwacje w zakresie dat (`YYYY-MM-DD`) |
| `POST` | `/api/rooms/:roomId/reservations` | Nowa rezerwacja (kolizje → **409**) |

Nieistniejąca ścieżka pod `/api/*` → **404** JSON.

## Struktura

- `src/` — serwer Express, baza, API
- `public/` — frontend (`index.html`, `admin.html`, `js/`)
- `data/` — plik SQLite (w `.gitignore`)
- `PLAN.md` — architektura i kroki implementacji

## Pomocnicze skrypty

```bash
node scripts/check-db.js   # lista tabel w bazie
```
