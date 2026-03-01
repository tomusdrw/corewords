# Repository Guidelines

## Project Structure & Module Organization
- `core_words_pl.csv` holds the prioritized AAC vocabulary; CSV shape explained in `README.md`. `generate_core_words.py` and `build_json.py` churn CSV data into the syllable tree.
- `syllables_data/` is the hierarchical tree of syllables with per-node metadata; preserve its folders and CSV names when editing data.
- `app/` contains the static Preact UI (`index.html`, `app.js`, `data.json`). `data.json` is auto-generated; do not edit it manually unless you regenerate via the scripts.
- Supporting scripts live at the repo root (`generate_core_words.py`, `generate_syllables_tree.py`, `build_json.py`) and emit CSV/JSON artifacts used by the UI.

## Build, Test, and Development Commands
- `python3 generate_core_words.py` rebuilds `core_words_pl.csv` from any annotated source that complements the current methodology.
- `python3 generate_syllables_tree.py` derives the syllable hierarchy under `syllables_data/` once the core words change.
- `python3 build_json.py` consumes `syllables_data/` and writes `app/data.json`; commit the updated JSON after regenerating.
- Open `app/index.html` in a browser for manual QA; no bundler or server is required.

## Coding Style & Naming Conventions
- Python files use 4 spaces per indentation level, concise inline comments, and descriptive variable names (cf. `generate_core_words.py`).
- Front-end JS follows 4-space indentation, modern ES modules, and PascalCase for components (see `app/app.js`).
- Keep filenames lowercase with underscores (CSV/JSON) and avoid spaces except when preserved by legacy language characters.

## Testing Guidelines
- There is no automated test suite yet. Verify changes by rerunning the generation scripts above and inspecting `app/data.json` plus the web interface.
- For data updates, sample outputs should be spot-checked for Polish syllable paths and word priority to prevent regressions.

## Commit & Pull Request Guidelines
- Commit messages should stay in present tense; start with a short verb (e.g., `Add`, `Update`, `Regenerate`). Reference the data set affected when relevant.
- PRs should summarize what was regenerated (core list, syllable tree, UI assets), include any manual verification steps, and mention related issues or follow-up work.
