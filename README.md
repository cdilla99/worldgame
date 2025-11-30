# worldgame

Lightweight browser game for a geography guessing party experience.

## Run locally

1. Open `index.html` in any modern browser (no build or backend needed).
2. Start a game from the setup panel, choose timer or points mode, and pass the device to the clue-giver.

## Deploy to GitHub Pages

1. Create a public repository and push these files (including `data/countries.js`).
2. In your repository settings, enable **GitHub Pages** and select the **main** branch with the `/ (root)` folder.
3. After Pages finishes building, open the provided URL and the game will load—no build steps are required because everything is static.

## Editing

- Country data lives in `data/countries.js` (125 entries, ready for CSV export).
- Visual styles are in `styles.css`; core logic is in `app.js`.
