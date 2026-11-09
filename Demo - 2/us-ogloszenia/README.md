# US Ogłoszenia

Wtyczka WordPress do publikowania krótkich ogłoszeń na stronie wydziału. Ogłoszenia można wyświetlać za pomocą shortcode lub bloku Gutenberga.

## Do czego służy

- Zarządzanie ogłoszeniami w panelu WordPress (osobny typ wpisu **Ogłoszenie**).
- Pola: tytuł, treść, **data ważności** (opcjonalnie), **priorytet** (normalny / ważny).
- Na stronie widoczne są tylko **opublikowane** ogłoszenia, które **nie wygasły** (lub są bezterminowe).
- Ogłoszenia **ważne** są wyświetlane **nad** pozostałymi; wewnątrz grupy — od najnowszych.
- Konfiguracja domyślnego limitu listy i koloru wyróżnienia ważnych ogłoszeń.

Ogłoszenia nie mają publicznych adresów URL — służą wyłącznie do wyświetlania na stronach z shortcode lub blokiem.

## Wymagania

- WordPress 6.0+
- PHP 7.4+

## Instalacja

1. Skopiuj folder `us-ogloszenia` do katalogu `wp-content/plugins/` na serwerze WordPress.
2. W panelu przejdź do **Wtyczki** i **aktywuj** wtyczkę **US Ogłoszenia**.
3. Po aktywacji w menu pojawi się pozycja **Ogłoszenia** (ikona megafonu).

### Odinstalowanie

Przy usunięciu wtyczki przez **Wtyczki → Usuń** usuwane są opcje wtyczki (`domyślny limit`, `kolor ważnych`). Treść ogłoszeń w bazie pozostaje — przed usunięciem warto zarchiwizować lub przenieść wpisy, jeśli są potrzebne.

## Dodawanie ogłoszeń

1. **Ogłoszenia → Dodaj**.
2. Uzupełnij **tytuł** i **treść**.
3. W bocznym panelu **Szczegóły ogłoszenia**:
   - **Data ważności** — po tym dniu ogłoszenie znika z listy na stronie; puste pole = **bezterminowe**.
   - **Priorytet** — **Ważny** wyświetla się wyżej i jest wizualnie wyróżniony.
4. Opublikuj ogłoszenie.

## Wyświetlanie na stronie

### Shortcode

W treści strony lub wpisu wstaw:

```
[us_ogloszenia]
```

Z własnym limitem (maksymalnie 100):

```
[us_ogloszenia limit="5"]
```

Bez atrybutu `limit` używany jest **domyślny limit** z ustawień wtyczki.

### Blok Gutenberga

1. W edytorze bloków dodaj blok **Ogłoszenia** (kategoria **Widżety**).
2. W **panelu bocznym bloku** ustaw suwak **Limit**:
   - **0** — jak shortcode bez `limit` (domyślny limit z ustawień),
   - **1–100** — maksymalna liczba ogłoszeń na liście.

Podgląd w edytorze odpowiada renderowi na froncie.

## Ustawienia wtyczki

**Ogłoszenia → Ustawienia**

| Opcja | Opis |
|--------|------|
| **Domyślny limit** | Liczba ogłoszeń przy shortcode `[us_ogloszenia]` i przy bloku z limitem ustawionym na **0**. Wartość od 1 do 100. |
| **Kolor wyróżnienia ważnych** | Kolor obramowania i akcentu dla ogłoszeń z priorytetem **Ważny** (format `#RRGGBB`, np. `#b45309`). |

## Dla twórców motywów

- Nadpisanie szablonu listy: plik `us-ogloszenia/ogloszenia-list.php` w motywie (aktywnym lub nadrzędnym).
- Filtr ścieżki szablonu: `us_ogloszenia_template_path`.
- Filtr treści HTML na froncie: `us_ogloszenia_content_html`.

W szablonie używaj `US_Ogloszenia\Shortcode::get_post_content_html( $post )` zamiast pełnego `the_content`, aby zachować bezpieczne renderowanie treści.

## Licencja

Wtyczka stworzona na potrzeby wydziału; do użytku wewnętrznego według polityki organizacji.
