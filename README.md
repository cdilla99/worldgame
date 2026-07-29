# Geo Game Table

**Geo Game Table** is a fast, pass-and-play geography battle for teens, friend groups, and classrooms. Players ask smart questions, make bold guesses, and race for the top of the leaderboard.

## Product highlights

- **2–8 players** on one shared device
- **Timer mode** and **race-to-points mode**
- **125 country cards** across easy, medium, and hard difficulty pools
- Lightweight missions, clue options, sound effects, score rankings, and a session recap
- Runs entirely in the browser—no account, install, backend, or build step required

## How to play

1. Open `index.html` in a current desktop or mobile browser.
2. Choose player count, mode, difficulty pool, and player names.
3. One player becomes the clue-giver and sees the country card.
4. Other players ask up to 10 questions or make guesses.
5. A correct guess earns the card's star value; a guess within five questions earns a +1 speed bonus.
6. Use the round controls to reveal, pass, or complete the game. Review the session leaderboard and play again.

## Sound and flags

- Sounds are generated locally with the browser's Web Audio API. Use the Sound toggle and volume slider during play.
- Flags use native emoji, so they render without remote image/CDN dependencies. Appearance can vary slightly by operating system.

## Run locally

Open `index.html` directly in a modern browser. For the best mobile testing experience, use a basic local static server, but it is not required.

## Deploy to GitHub Pages

1. Push the repository files, including `data/countries.js`, to GitHub.
2. In repository settings, enable **GitHub Pages** from the `main` branch and `/ (root)` folder.
3. Open the published URL when the deployment completes.

## Product readiness notes

This repository is a polished static MVP. Before commercial distribution, establish brand identity, verify all country facts/content licensing, test supported browsers and devices, and choose a distribution/payment strategy appropriate to the target market.

## Editing

- Country card content lives in `data/countries.js`.
- Visual styles live in `styles.css`.
- Game logic, sounds, and scoring live in `app.js`.
