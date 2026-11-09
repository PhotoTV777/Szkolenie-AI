# Szkolenie AI

Repozytorium materiałów szkoleniowych:

| Katalog | Opis |
|---------|------|
| [`Demo - 1`](Demo%20-%201/) | Dzień Otwarty US — strona jednoplikowa |
| [`Demo - 2`](Demo%20-%202/) | Wtyczka WordPress **US Ogłoszenia** |
| [`Demo - 3`](Demo%20-%203/) | Aplikacja **Rezerwacja sal** (Node.js, Express, SQLite) |

Uruchomienie aplikacji z Demo 3:

```powershell
cd "Demo - 3"
npm install
.\dev.ps1
```

Szczegóły techniczne: [`Demo - 3/README.md`](Demo%20-%203/README.md) i [`Demo - 3/PLAN.md`](Demo%20-%203/PLAN.md).

---

## Prompty szkoleniowe

Poniżej oryginalne prompty użyte do budowy poszczególnych ćwiczeń. Każdy prompt odpowiada jednemu katalogowi `Demo - N`.

### Prompt 1 → `Demo - 1`

```
Stwórz jednostronicową stronę wydarzenia „Dzień Otwarty Uniwersytetu Szczecińskiego” (21 marca, kampus przy ul. Mickiewicza).

Technologia: jeden plik index.html, Tailwind CSS z CDN, bez frameworków JS.

Sekcje:
1. Hero z nagłówkiem, krótkim opisem, datą i przyciskiem „Zapisz się”
2. Program dnia jako oś czasu (5 punktów z godzinami)
3. Wydziały do odwiedzenia jako siatka kart (6 kart z ikonami)
4. Formularz zapisu: imię, e-mail, wybór wydziału (bez backendu)
5. Stopka z danymi kontaktowymi

Styl: nowoczesny, dużo przestrzeni, granat i złoto jako kolory akcentu. Teksty po polsku.
```

### Prompt 2 → `Demo - 2`

```
Chcę zrobić wtyczkę WordPress „US Ogłoszenia” do publikowania krótkich ogłoszeń na stronie wydziału.

Wymagania:
- własny typ wpisu „Ogłoszenie” z polami: treść, data ważności, priorytet (normalny/ważny)
- shortcode [us_ogloszenia limit="5"] wyświetlający aktualne ogłoszenia, ważne na górze
- ogłoszenia po dacie ważności nie są wyświetlane
- strona ustawień w adminie: domyślny limit i kolor wyróżnienia ważnych

Najpierw przedstaw strukturę plików i plan, bez pisania kodu.
```

### Prompt 3 → `Demo - 3`

```
Chcę zbudować prostą aplikację webową „Rezerwacja sal” dla pracowników uczelni.

Funkcje:
- lista sal (nazwa, budynek, liczba miejsc, wyposażenie: rzutnik, komputery)
- kalendarz tygodniowy rezerwacji dla wybranej sali
- dodanie rezerwacji (data, godzina od-do, cel, osoba), bez nakładania się terminów
- prosty panel administratora do dodawania sal

Stack: Node.js + Express, SQLite, frontend w czystym HTML/JS + Tailwind.

Nie pisz jeszcze kodu. Przygotuj plik PLAN.md: architektura, model danych, endpointy API i lista kroków implementacji, każdy krok do zrobienia i przetestowania osobno.
```
