# PLAN: Rezerwacja sal (uczelnia)

Aplikacja webowa dla pracowników: przegląd sal, tygodniowy kalendarz rezerwacji dla wybranej sali, dodawanie rezerwacji bez kolizji terminów, prosty panel administratora do zarządzania salami.

**Stack:** Node.js + Express, SQLite (`better-sqlite3` lub `sqlite3`), frontend: statyczny HTML + vanilla JS, stylowanie Tailwind (CDN na start lub build lokalny).

**Poza zakresem MVP (na później):** logowanie użytkowników, edycja/usuwanie rezerwacji przez użytkownika, role RBAC, eksport PDF, powiadomienia e-mail.

---

## 1. Architektura

### 1.1 Ogólny układ

```
┌─────────────────────────────────────────────────────────────┐
│  Przeglądarka (HTML + JS + Tailwind)                        │
│  - lista sal + filtry                                       │
│  - widok tygodnia (kalendarz)                                 │
│  - formularz rezerwacji                                     │
│  - /admin — formularz dodawania sal                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Express (jeden proces)                                     │
│  - static: public/ (index.html, admin.html, app.js, css)    │
│  - REST API: /api/*                                         │
│  - middleware: json, CORS (dev), prosta obsługa błędów      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  SQLite (plik data/rooms.db)                                │
│  - warstwa dostępu: db.js (prepare, transakcje)             │
│  - migracja/init przy starcie (schema.sql)                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Struktura katalogów (docelowa)

```
/
├── package.json
├── PLAN.md
├── .env.example          # PORT, DB_PATH, opcjonalnie ADMIN_SECRET
├── data/                 # .gitignore: *.db (opcjonalnie commitować dev.db)
├── src/
│   ├── server.js         # punkt wejścia Express
│   ├── db.js             # połączenie + init schematu
│   ├── schema.sql
│   ├── routes/
│   │   ├── rooms.js
│   │   └── reservations.js
│   ├── services/
│   │   ├── roomsService.js
│   │   └── reservationsService.js  # logika kolizji
│   └── middleware/
│       ├── errorHandler.js
│       └── adminAuth.js    # opcjonalnie: nagłówek X-Admin-Key
└── public/
    ├── index.html
    ├── admin.html
    ├── js/
    │   ├── api.js          # wrapper fetch
    │   ├── rooms.js
    │   ├── calendar.js     # widok tygodnia
    │   └── admin.js
    └── css/                # opcjonalnie, jeśli nie tylko Tailwind CDN
```

### 1.3 Zasady techniczne

- **Jeden serwer** serwuje API i pliki statyczne (`express.static('public')`).
- **Walidacja** po stronie serwera (źródło prawdy); frontend tylko UX (format dat, komunikaty).
- **Kolizje rezerwacji** sprawdzane w SQL + transakcja przy `INSERT`.
- **Czas:** przechowywanie daty jako `TEXT` ISO (`YYYY-MM-DD`) i godzin jako `HH:MM` (24h) albo jeden `starts_at` / `ends_at` jako ISO datetime — rekomendacja poniżej w modelu danych.
- **Strefa czasowa:** MVP zakłada jedną strefę (np. `Europe/Warsaw`), bez konwersji UTC w UI — dokumentacja w README.

### 1.4 Frontend (widoki)

| Widok | Plik | Opis |
|-------|------|------|
| Główny | `index.html` | Lista sal, wybór sali, kalendarz tygodnia, modal/formularz rezerwacji |
| Admin | `admin.html` | Formularz: nowa sala + lista istniejących (tylko dodawanie w MVP) |

Kalendarz tygodniowy: siatka **7 dni × sloty godzinowe** (np. 8:00–20:00, krok 30 lub 60 min) lub lista bloków rezerwacji w kolumnach dni — prostsze MVP: **lista rezerwacji pogrupowana po dniach** w wybranym tygodniu + wizualne „paski” czasu.

---

## 2. Model danych

### 2.1 Encja: `rooms`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `name` | TEXT NOT NULL | np. „A-101” |
| `building` | TEXT NOT NULL | np. „Budynek A” |
| `capacity` | INTEGER NOT NULL | liczba miejsc, > 0 |
| `has_projector` | INTEGER NOT NULL DEFAULT 0 | 0/1 (boolean) |
| `has_computers` | INTEGER NOT NULL DEFAULT 0 | 0/1 |
| `created_at` | TEXT NOT NULL | ISO datetime |

**Indeksy:** unikalność opcjonalna `(name, building)` — zalecane, żeby uniknąć duplikatów.

### 2.2 Encja: `reservations`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `room_id` | INTEGER NOT NULL FK → `rooms.id` | ON DELETE RESTRICT |
| `date` | TEXT NOT NULL | `YYYY-MM-DD` |
| `time_start` | TEXT NOT NULL | `HH:MM` |
| `time_end` | TEXT NOT NULL | `HH:MM`, musi być > `time_start` |
| `purpose` | TEXT NOT NULL | cel (np. „Spotkanie zespołu”) |
| `person_name` | TEXT NOT NULL | osoba rezerwująca |
| `created_at` | TEXT NOT NULL | ISO datetime |

**Alternatywa (bardziej elastyczna):** kolumny `starts_at`, `ends_at` jako ISO TEXT — wtedy łatwiejsze zapytania o zakres. Dla MVP wystarczy `date` + `time_*`.

### 2.3 Reguły biznesowe (baza + aplikacja)

1. `time_end` > `time_start` (ta sama data).
2. Brak nakładania się w tej samej sali w tym samym dniu:  
   nowa rezerwacja `[start, end)` koliduje, gdy istnieje rekord z  
   `time_start < new_end AND time_end > new_start` (konwencja półotwartych przedziałów).
3. `room_id` musi istnieć.
4. Opcjonalnie: godziny w dozwolonym przedziale (np. 7:00–22:00) — walidacja w serwisie.

### 2.4 Diagram relacji

```
rooms (1) ──────< (N) reservations
```

### 2.5 Przykładowe dane seed (dev)

- 2–3 sale z różnym wyposażeniem.
- Kilka rezerwacji w bieżącym tygodniu (do testu kalendarza i kolizji).

---

## 3. API REST

Konwencja: JSON, błędy `{ "error": "kod lub komunikat", "details": ... }`, kody HTTP zgodne z REST.

### 3.1 Sale

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| `GET` | `/api/rooms` | Lista wszystkich sal |
| `GET` | `/api/rooms/:id` | Jedna sala (404 jeśli brak) |
| `POST` | `/api/rooms` | Utworzenie sali (**admin**) |

**GET `/api/rooms` — odpowiedź 200:**

```json
[
  {
    "id": 1,
    "name": "A-101",
    "building": "Budynek A",
    "capacity": 30,
    "has_projector": true,
    "has_computers": false
  }
]
```

**POST `/api/rooms` — body:**

```json
{
  "name": "A-101",
  "building": "Budynek A",
  "capacity": 30,
  "has_projector": true,
  "has_computers": false
}
```

Walidacja: wymagane pola, `capacity` liczba całkowita > 0, booleany.

Ochrona admin MVP (wybierz jedną opcję w kroku 7):

- **A)** Brak auth — tylko osobna strona `admin.html` (świadome ograniczenie szkoleniowe), lub  
- **B)** Nagłówek `X-Admin-Key` zgodny z `ADMIN_SECRET` w `.env`.

### 3.2 Rezerwacje

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| `GET` | `/api/rooms/:roomId/reservations` | Rezerwacje sali w zakresie dat |
| `POST` | `/api/rooms/:roomId/reservations` | Nowa rezerwacja |
| `GET` | `/api/reservations/:id` | Opcjonalnie MVP — szczegół jednej |

**Query `GET` (wymagane lub domyślne):**

- `from` — `YYYY-MM-DD` (początek tygodnia lub dowolny zakres)
- `to` — `YYYY-MM-DD` włącznie

Przykład: `GET /api/rooms/1/reservations?from=2026-11-09&to=2026-11-15`

**POST body:**

```json
{
  "date": "2026-11-10",
  "time_start": "10:00",
  "time_end": "12:00",
  "purpose": "Wykład gościnny",
  "person_name": "Jan Kowalski"
}
```

**Odpowiedzi:**

- `201` + utworzony obiekt
- `400` — walidacja (zły format, koniec przed startem)
- `404` — nie istnieje sala
- `409` — **konflikt terminu** (nakładanie się)

### 3.3 Health (opcjonalnie, krok 1)

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| `GET` | `/api/health` | `{ "ok": true }` |

---

## 4. Logika kalendarza (frontend)

1. Użytkownik wybiera salę z listy (select lub karty).
2. Nawigacja tygodnia: poprzedni / następny / „dziś” — `from` = poniedziałek tygodnia (lub niedziela, ustalone w PLAN i konsekwentnie w JS).
3. `fetch` rezerwacji dla `roomId` + `from`/`to`.
4. Render: 7 kolumn (dni), w każdej bloki z godzinami i `purpose` / `person_name`.
5. Formularz „Dodaj rezerwację”: pola zgodne z API; po sukcesie odświeżenie widoku; przy `409` — komunikat o zajętym terminie.

---

## 5. Kroki implementacji

Każdy krok = osobny commit (Conventional Commits), uruchomienie i test ręczny lub skryptem. **Nie przechodź dalej, dopóki krok nie przejdzie testów akceptacji.**

### Krok 0: Szkielet projektu

**Zadanie:** `npm init`, zależności (`express`, `better-sqlite3`), skrypty `start` / `dev` (np. `node --watch`), `.gitignore`, `.env.example`, pusty `public/index.html` z „Hello”.

**Test:**

- `npm start` → serwer na `PORT` (domyślnie 3000).
- Przeglądarka: strona statyczna się ładuje.

---

### Krok 1: Express + health + static — **wykonany**

**Zadanie:** `server.js`, `express.static`, route `GET /api/health`.

**Test:**

- `curl http://localhost:3000/api/health` → `{"ok":true}`.
- Plik z `public/` nadal dostępny.

---

### Krok 2: Baza SQLite i schemat — **wykonany**

**Zadanie:** `schema.sql`, `db.js` — utworzenie tabel przy starcie, katalog `data/`.

**Test:**

- Po starcie powstaje `data/rooms.db`.
- SQLite CLI / mały skrypt: `\tables` pokazuje `rooms`, `reservations`.

---

### Krok 3: API — lista i szczegół sal — **wykonany**

**Zadanie:** `roomsService`, `routes/rooms.js`, `GET /api/rooms`, `GET /api/rooms/:id`, seed 2 sale (skrypt seed lub INSERT w init dev).

**Test:**

- `GET /api/rooms` → tablica ≥ 2 elementy z poprawnymi polami.
- `GET /api/rooms/999` → 404.

---

### Krok 4: API — tworzenie sali (admin) — **wykonany**

**Zadanie:** `POST /api/rooms`, walidacja body, opcjonalnie `adminAuth` middleware.

**Test:**

- `POST` z poprawnym JSON → 201, sala w `GET /api/rooms`.
- `POST` z `capacity: 0` → 400.
- Duplikat `(name, building)` → 409 lub 400 (zgodnie z implementacją).

---

### Krok 5: API — lista rezerwacji w zakresie dat — **wykonany**

**Zadanie:** `reservationsService`, `GET /api/rooms/:roomId/reservations?from=&to=`, sortowanie po `date`, `time_start`.

**Test:**

- Seed: 2 rezerwacje w tym samym tygodniu.
- Zapytanie z `from`/`to` obejmującym tydzień → zwraca tylko rezerwacje tej sali w zakresie.
- Zła sala → 404.

---

### Krok 6: API — tworzenie rezerwacji + kolizje — **wykonany**

**Zadanie:** `POST /api/rooms/:roomId/reservations`, zapytanie kolizji, transakcja.

**Test (tabela przypadków):**

| Case | Oczekiwanie |
|------|-------------|
| Poprawna rezerwacja w wolnym slocie | 201 |
| `time_end` ≤ `time_start` | 400 |
| Nakładanie częściowe (10–12 vs 11–13) | 409 |
| Dotykające się końcem/startem (10–12 vs 12–14) | 201 (przy konwencji [start,end)) |
| Ta sama sala, inny dzień | 201 |

---

### Krok 7: Frontend — Tailwind + lista sal — **wykonany**

**Zadanie:** `index.html` (layout), Tailwind CDN, `api.js`, render listy sal (nazwa, budynek, miejsca, ikony/badges wyposażenia).

**Test:**

- Po otwarciu strony widać sale z API.
- Błąd sieci — komunikat użytkownika (prosty).

---

### Krok 8: Frontend — wybór sali + kalendarz tygodnia — **wykonany**

**Zadanie:** `calendar.js` — wyliczanie tygodnia, pobieranie rezerwacji, render 7 dni.

**Test:**

- Zmiana sali przeładowuje kalendarz.
- Przyciski tydzień ±1 zmieniają zakres i dane.
- Rezerwacje seed widoczne we właściwych dniach.

---

### Krok 9: Frontend — formularz rezerwacji — **wykonany**

**Zadanie:** formularz (data, od, do, cel, osoba), `POST`, obsługa 409/400.

**Test:**

- Udane dodanie → nowy wpis w kalendarzu bez ręcznego F5 (odświeżenie po POST).
- Próba kolizji → czytelny komunikat, brak utraty wpisanych pól.

---

### Krok 10: Panel admin — `admin.html` — **wykonany**

**Zadanie:** formularz dodania sali, wywołanie `POST /api/rooms`, lista sal tylko do podglądu.

**Test:**

- Dodanie sali z admina → pojawia się na `index.html` po odświeżeniu.
- Walidacja po stronie klienta (opcjonalnie) + komunikaty błędów z API.

---

### Krok 11: Obsługa błędów i szlify — **wykonany**

**Zadanie:** `errorHandler.js`, spójne JSON błędów, `README.md` (uruchomienie, zmienne env, opis API skrót).

**Test:**

- Nieistniejąca ścieżka API → 404 JSON.
- Błąd serwera → 500 bez wycieku stack trace do klienta (log w konsoli serwera).

---

### Krok 12 (opcjonalny): Testy automatyczne

**Zadanie:** Vitest lub Jest — testy jednostkowe `overlap` / walidacji czasu; supertest dla 2–3 endpointów.

**Test:**

- `npm test` w CI lokalnie — zielone.

---

## 6. Kryteria ukończenia MVP

- [x] Pracownik widzi listę sal i wybiera salę.
- [x] Widzi rezerwacje w widoku tygodnia dla wybranej sali.
- [x] Może dodać rezerwację; system odrzuca nakładające się terminy.
- [x] Administrator może dodać nową salę (panel admin).
- [x] Aplikacja uruchamia się jedną komendą z README (`npm start`).

---

## 7. Uwagi na przyszłość

- Migracja na MariaDB/Postgres — ten sam kształt API, zamiana warstwy `db.js`.
- Docker — opcjonalny `Dockerfile` + wolumen na `data/` (nie jest wymagany do MVP szkoleniowego).
- Autentykacja uczelniana (LDAP/OIDC) — osobny etap po MVP.

---

## 8. Decyzje do potwierdzenia przed kodem

1. **Początek tygodnia w kalendarzu:** poniedziałek vs niedziela (rekomendacja: **poniedziałek**, PL).
2. **Ochrona admina:** bez klucza (szkolenie) vs `ADMIN_SECRET` (rekomendacja: **SECRET** minimalny).
3. **Unikalność sal:** `(name, building)` — tak/nie (rekomendacja: **tak**).

Po zatwierdzeniu planu — implementacja od **Kroku 0** według kolejności powyżej.
