# Lista Słów Rdzeniowych (Core Words) dla AAC - Język Polski

## Opis
Plik `core_words_pl.csv` zawiera 500 kluczowych słów do budowania systemu komunikacji alternatywnej (AAC).

## Metodologia
Słowa zostały dobrane na podstawie hybrydowej analizy:
1. **AAC Super Core** (~100 słów): Słowa o najwyższej użyteczności komunikacyjnej (zaimki, prośby, pytania, negacja), niezbędne do budowania pierwszych zdań.
2. **Frekwencja Korpusowa (SUBTLEX-PL/NKJP)**: Słowa najczęściej występujące w języku polskim, przefiltrowane pod kątem użyteczności (usunięto abstrakcyjne pojęcia słownikowe na rzecz konkretnych czasowników i rzeczowników).

## Struktura Pliku
Plik CSV zawiera kolumny:
- `rank`: Pozycja na liście (1 = najważniejsze).
- `word`: Słowo (w formie podstawowej lub najczęstszej dla AAC).
- `category`: Kategoria gramatyczna/funkcjonalna (social, pronoun, verb, noun, etc.).
- `priority`: Grupa priorytetowa (1 = Super Core, 2 = Core, 3 = High Freq).
- `source`: Źródło pochodzenia słowa w tym zestawieniu.
- `emoji`: Symbol/emoji reprezentujący słowo w UI.

## Uwagi do Sortowania
Lista jest posortowana według **Priorytetu Komunikacyjnego**, a nie surowej frekwencji tekstowej. 
W korpusach tekstowych (gazety, książki) najczęstszymi słowami są przyimki ("w", "z", "na"). 
W mowie AAC najważniejsze są słowa sprawcze ("chcę", "nie", "daj"), dlatego znajdują się one na szczycie listy, mimo że w literaturze mogą występować rzadziej.

## Wykorzystanie
Lista ta pokrywa ok. 80-90% codziennych potrzeb komunikacyjnych i jest zgodna z zasadą SNUG (Spontaneous Novel Utterance Generation).

---

## Pipeline Generowania Danych

```
┌─────────────────────────┐     ┌──────────────────────────────┐     ┌─────────────────────────┐     ┌──────────────────┐
│   core_words_pl.csv     │ ──▶ │ generate_syllables_tree.py   │ ──▶ │     build_json.py       │ ──▶ │   app/data.json   │
│  (500 słów z emoji)     │     │ (sylabifikacja + drzewo)     │     │ (JSON dla UI)           │     │  (dla przeglądarki)│
└─────────────────────────┘     └──────────────────────────────┘     └─────────────────────────┘     └──────────────────┘
```

### Krok 1: `core_words_pl.csv`
Źródłowy plik CSV ze wszystkimi słowami, ich kategoriami, priorytetami i emoji.

### Krok 2: `generate_syllables_tree.py`
Dzieli słowa na sylaby (używając biblioteki `pyphen`) i buduje hierarchiczne drzewo:
- Słowa jednosylabowe są "zwijane" - zapisywane jako pełne słowo w CSV rodzica
- Słowa wielosylabowe tworzą podkatalogi (np. `po/` → `moc` = "pomoc")
- Wynik: folder `syllables_data/` z plikami CSV

### Krok 3: `build_json.py`
Konwertuje hierarchię CSV na pojedynczy plik JSON dla UI:
- Rekursywnie czyta wszystkie pliki `syllables.csv`
- Jeśli element jest zarówno słowem jak i kategorią (np. "ja" → "jasny"), dodaje słowo jako pierwszą opcję w children
- Wynik: `app/data.json`

### Uruchomienie
```bash
python3 generate_syllables_tree.py  # Generuje syllables_data/
python3 build_json.py               # Generuje app/data.json
```

---

## Struktura Katalogów (Sylaby)
Folder `syllables_data/` zawiera hierarchiczne drzewo sylab, pozwalające na budowanie predykcji słów.
- `syllables.csv`: Lista pierwszych sylab (np. "ma", "po").
- `[sylaba]/syllables.csv`: Lista kolejnych sylab (np. w `po/syllables.csv` znajdziesz "moc" dla słowa "pomoc").

Każdy plik CSV w tej strukturze zawiera:
- `syllable`: Treść sylaby lub pełne słowo (jeśli zwinięte).
- `weight`: Sumaryczna waga (priorytet) wszystkich słów w tym poddrzewie.
- `is_word`: Czy ta ścieżka tworzy pełne słowo.
- `word_rank`: Oryginalny ranking słowa (jeśli is_word=True).
- `full_word`: Pełne słowo (jeśli is_word=True).
- `emoji`: Symbol/emoji słowa.
- `has_children`: Czy istnieją kolejne sylaby (podkatalogi).
