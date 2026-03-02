# Repository Guidelines

## Project Structure & Module Organization
- `core_words_pl.csv` holds the prioritized AAC vocabulary with emoji; CSV shape explained in `README.md`.
- `syllables_data/` is the hierarchical tree of syllables with per-node metadata; preserve its folders and CSV names when editing data.
- `app/` contains the static Preact UI (`index.html`, `app.js`, `data.json`). `data.json` is auto-generated; do not edit it manually.
- Supporting scripts live at the repo root (`generate_syllables_tree.py`, `build_json.py`) and emit CSV/JSON artifacts used by the UI.

## Data Pipeline

```
core_words_pl.csv  →  generate_syllables_tree.py  →  syllables_data/  →  build_json.py  →  app/data.json
```

1. **`core_words_pl.csv`**: Source of truth. Contains 500 Polish words with rank, category, priority, source, and emoji.
2. **`generate_syllables_tree.py`**: Syllabifies words using `pyphen` library and builds hierarchical tree in `syllables_data/`.
   - Single-syllable words are "collapsed" into parent CSV as full words
   - Multi-syllable words create subdirectories (e.g., `po/moc` = "pomoc")
   - Each node tracks weight (priority sum), is_word, full_word, emoji, has_children
3. **`build_json.py`**: Converts CSV hierarchy to single JSON file for UI.
   - Recursively reads all `syllables.csv` files
   - When a node is both a word AND has children (e.g., "ja" → "jasny"), inserts the word as first child option
   - Output: `app/data.json` consumed by the Preact frontend

## Build, Test, and Development Commands
- `python3 generate_syllables_tree.py` - derives the syllable hierarchy under `syllables_data/` from `core_words_pl.csv`
- `python3 build_json.py` - consumes `syllables_data/` and writes `app/data.json`
- Open `app/index.html` in a browser for manual QA; no bundler or server is required.

## Coding Style & Naming Conventions
- Python files use 4 spaces per indentation level, concise inline comments, and descriptive variable names.
- Front-end JS follows 4-space indentation, modern ES modules, and PascalCase for components (see `app/app.js`).
- Keep filenames lowercase with underscores (CSV/JSON) and avoid spaces except when preserved by legacy language characters.

## Testing Guidelines
- There is no automated test suite yet. Verify changes by rerunning the generation scripts above and inspecting `app/data.json` plus the web interface.
- For data updates, sample outputs should be spot-checked for Polish syllable paths and word priority to prevent regressions.

## Commit & Pull Request Guidelines
- Commit messages should stay in present tense; start with a short verb (e.g., `Add`, `Update`, `Regenerate`). Reference the data set affected when relevant.
- PRs should summarize what was regenerated (core list, syllable tree, UI assets), include any manual verification steps, and mention related issues or follow-up work.
