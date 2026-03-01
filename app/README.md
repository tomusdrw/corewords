# AAC Core Words - Polish

A simple, accessible web app for Augmentative and Alternative Communication (AAC) using Polish core vocabulary.

## Features

- **Grid-based interface**: Large, touch-friendly buttons organized by syllables
- **Hierarchical navigation**: Click through syllable paths to build words
- **Text-to-Speech**: Automatically speaks selected words using browser TTS
- **Auto-return**: Returns to main screen after speaking a complete word
- **Visual indicators**: 
  - Green stripes = has sub-choices
  - Red stripes = is a complete word
  - Both = can navigate deeper OR use as word

## Usage

1. Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge)
2. Click on syllables to navigate the tree
3. When you reach a complete word, it will be spoken and you'll return to start
4. Use the back button or breadcrumb to navigate up

## File Structure

```
app/
├── index.html      # Main application
├── data.json       # Word tree data (generated from CSV)
└── README.md       # This file
```

## Technical Details

- **Data Source**: Built from `core_words_pl.csv` via `build_json.py`
- **TTS**: Uses Web Speech API with Polish voice (`pl-PL`)
- **Responsive**: Works on mobile, tablet, and desktop
- **No dependencies**: Pure HTML/CSS/JS, no build step needed

## Regenerating Data

If you update the CSV files, regenerate the JSON:

```bash
python3 build_json.py
```

This will rebuild `app/data.json` from the `syllables_data/` directory.

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14.5+)

Note: TTS requires internet connection for voice data on some systems.
