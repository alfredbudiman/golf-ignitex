# The Ignitex Gobar — Scoring Board

Single-file HTML scoring board for **The Ignitex Gobar** golf tournament
(22 May 2026, Modern Land Golf Club). Stratified Peoria handicap system
with animated awards reveal.

## Quick Start (Tournament Day)

1. Run `./build.sh` once to generate `dist/index.html`. (Or use the pre-built one if shipped.)
2. Open `dist/index.html` in a browser on the admin laptop.
3. Connect laptop to TV/projector via HDMI for the leaderboard display.
4. **Setup tab** → add Flights → add Players. Or click **🎲 Generate Demo Tournament** to test with 24 fake players.
5. Click **Start Tournament**.
6. As each playing flight finishes, switch to that flight in **Score Input** and enter each player's over-par per hole:
   - `0` = par
   - `-1` = birdie
   - `+1` or `1` = bogey
   - Type and press Tab/Enter to advance to next cell
7. When all flights finished: click **🔒 Finalize Scoring**.
8. Click **🎲 Randomize Peoria Holes** — system picks 2 par-3 + 2 par-4 + 2 par-5 holes; computes `handicap = over × 3`.
9. Click **🏆 Awards** tab → click **Reveal Next Winner** for each award in turn (Flight B → Flight A → BNO → BGO).
10. Click **Save Snapshot** anytime to download a self-contained HTML archive of the current state (shareable via email/WA).

## Assets (Logos)

Place logo files in `assets/` (PNG, max 500KB, transparent background recommended):

- `assets/ignitex-logo.png` — primary brand logo (header)
- `assets/event-logo.png` — optional event logo
- `assets/modern-land.png` — optional venue logo

After adding logos, run `./build.sh` again to embed them as base64 in `dist/index.html`.

## Development

```bash
npm install
npm test           # Run logic tests (Peoria, validation, formatting)
npm run test:watch # Watch mode

# Dev iteration (requires a local server because of ES module fetch rules):
python3 -m http.server 8000
# then open http://localhost:8000

# Production build (single self-contained file, opens via file://):
./build.sh         # generates dist/index.html
open dist/index.html
```

## Rules Summary

- **Course par:** 72 (Modern Land: 5-4-3-4-5-3-4-4-4 | 4-3-4-4-5-4-4-3-5)
- **Score cap per hole:** Double par (par 3 max 6, par 4 max 8, par 5 max 10)
- **Peoria 6 holes:** 2 random par-3 + 2 random par-4 + 2 random par-5
- **Handicap:** Σ(stroke − par) on those 6 holes × 3 (no cap)
- **Net:** Gross − Handicap
- **Tie-breaker:** Lower handicap wins; if still tied, alphabetical name
- **Class A/B:** After excluding BGO+BNO winners, split by **handicap** — lower-handicap half = Class A, higher-handicap half = Class B. Ranking/winner **within** each class is by lowest net.
- **DNF:** Players marked DNF may submit partial scores but are excluded from net/handicap, all prizes, and the best-flight (avg-net) standings.
- **Sound:** Synthesized Web Audio SFX play during the Peoria draw (ticking + lock dings) and award reveals (countdown beeps, riser, fanfare + applause; bigger fanfare for the Champion). Toggle with the 🔊/🔇 button in the header (preference saved). No audio files required.
- **Prizes:** BGO, BNO, Class A 1st, Class B 1st (no double prizes)

## Troubleshooting

- **"Save Snapshot" fails when opening dev `index.html` via `file://`** — use `python3 -m http.server 8000` during dev. The built `dist/index.html` doesn't need a server.
- **localStorage full** — click Save Snapshot, then Clear All Data.
- **Browser refresh during input** — state auto-restores from localStorage.

## File Layout

```
Golf Ignitex/
├── index.html               ← Dev entry (uses src/* modules)
├── dist/index.html          ← Production build (single file, gitignored)
├── src/
│   ├── app.js               ← Entry: state, event delegation, actions
│   ├── state.js             ← State shape, localStorage, validation
│   ├── peoria.js            ← Handicap calc, stratified random, flight split
│   ├── format.js            ← Display helpers (over-par formatting)
│   ├── demo.js              ← Demo tournament + fill-random generators
│   ├── snapshot.js          ← Save Snapshot HTML generator
│   ├── ui-header.js         ← Header (logo, status pill, tabs)
│   ├── ui-setup.js          ← Setup tab
│   ├── ui-input.js          ← Score Input tab
│   ├── ui-leaderboard.js    ← Leaderboard (provisional + final)
│   ├── ui-awards.js         ← Awards Ceremony + reveal animation
│   ├── render.js            ← Top-level render dispatch
│   └── styles.css           ← All CSS
├── tests/                   ← Vitest unit tests (logic only)
├── assets/                  ← Logos (user-supplied)
├── snapshots/               ← Downloaded snapshots (gitignored)
├── docs/superpowers/        ← Design spec + implementation plan
├── build.sh                 ← Bundle to dist/index.html
└── package.json
```
