# The Ignitex Gobar — Scoring Board Design Spec

**Event:** The Ignitex Gobar (Golf Tournament)
**Venue:** Modern Land Golf Club, Tangerang
**Date:** 22 May 2026
**Spec date:** 16 May 2026

## Goal

Single-file HTML scoring board untuk turnamen golf 20-32 pemain dengan **stratified Peoria handicap system**. Admin tunggal input skor di laptop setelah pemain selesai main; sistem hitung handicap, net score, dan tentukan winner per kategori. Output juga support ceremony reveal mode untuk pengumuman live di clubhouse.

## Tournament Rules

### Scoring System: Stratified Modified Peoria

1. Setiap pemain main 18 hole stroke play normal di Modern Land (par 72).
2. Score per hole di-cap pada **double par**:
   - Par 3 max stroke = 6
   - Par 4 max stroke = 8
   - Par 5 max stroke = 10
3. Setelah semua scoring di-finalize, sistem random pilih **6 hole** dengan komposisi stratified:
   - 2 hole dari pool par 3 (holes 3, 6, 11, 17)
   - 2 hole dari pool par 4 (holes 2, 4, 7, 8, 9, 10, 12, 13, 15, 16)
   - 2 hole dari pool par 5 (holes 1, 5, 14, 18)
4. Untuk tiap pemain:
   - `over = Σ (stroke - par) pada 6 hole terpilih`
   - `handicap = over × 3` (**tanpa cap**)
   - `gross = Σ stroke seluruh 18 hole`
   - `net = gross - handicap`

### Prize Categories

Empat kategori winner, di-reveal dalam ceremony order:

1. **Flight B Winner** — 1st place dari Flight B division
2. **Flight A Winner** — 1st place dari Flight A division
3. **BNO (Best Net Overall)** — net score terendah dari seluruh peserta
4. **BGO (Best Gross Overall)** — gross score terendah dari seluruh peserta

### Flight A / B Division (50/50 net split)

1. Compute net score semua pemain.
2. Identify BGO winner (lowest gross) dan BNO winner (lowest net). **Exclude** kedua pemain ini dari pool flight.
3. Sort sisa pemain by net score ascending.
4. Split 50/50 dengan rounding up untuk Flight A:
   - Flight A = top `ceil(n/2)` pemain (skor net terbaik)
   - Flight B = sisanya
5. Flight A Winner = #1 di Flight A. Flight B Winner = #1 di Flight B.

**Note:** Jika BGO winner = BNO winner (same player), exclude hanya 1 pemain dari pool; sisa di-split 50/50. Edge case extremely rare tapi handle deterministic.

### Tie-Breaker

Kalau dua pemain punya net score sama:
1. Lower handicap (Peoria over × 3) menang. Artinya gross-nya lebih bagus.
2. Kalau handicap juga sama, sort alfabetis by nama (deterministic, no permanent tie in UI).

### Playing Flights (Tee Groups)

- Pemain dikelompokkan dalam **playing flight** (numbered: Flight 1, 2, 3, ...).
- Tiap flight berisi 3-5 pemain yang main bareng dalam 1 tee group.
- Tee time per flight optional (informational).
- Score input di-grouped per playing flight untuk kemudahan batch entry.
- "Standings by Flight (Avg Net)" ditampilkan di leaderboard sebagai informational only (no prize): `avg_net = Σ net anggota / jumlah anggota`.

## Architecture

### Deployment
- **Single HTML file** (`index.html`), HTML + CSS + JS semua inline.
- Buka di browser local di laptop admin. No server, no backend.
- Logo assets di folder `assets/` (referenced via relative path saat runtime).

### State Persistence
- Single state object di JS, persist ke `localStorage` key `ignitex-gobar-2026` setiap mutation.
- Auto-restore on page load.
- "Clear All Data" button untuk reset.

### File Structure

```
Golf Ignitex/
├── index.html              ← Main app: HTML + CSS + JS inline
├── assets/
│   ├── ignitex-logo.png    ← User-provided
│   ├── event-logo.png      ← Optional
│   └── modern-land.png     ← Optional
├── snapshots/              ← Auto-created by Save Snapshot
│   └── ignitex-gobar-2026-05-22-{timestamp}.html
└── README.md
```

## Visual Design

**Palette:**
- Background: `#0A0A0A` (near-black)
- Surface (cards/rows): `#1A1A1A`
- Text primary: `#FFFFFF`
- Text muted: `#888888`
- Accent (Ignitex red): `#B71C2C`
- Accent gradient (winner highlights): `linear-gradient(135deg, #B71C2C 0%, #8a1322 100%)`
- Success (under par): `#3CCB7F`
- Danger / over par: `#B71C2C`
- Par neutral: `#888888`

**Typography:**
- Primary: Inter (system fallback: system-ui)
- Numeric tabular figures: `font-variant-numeric: tabular-nums`
- Letter-spacing wide untuk uppercase labels (tracking 0.2em)
- Heavy weights (700-900) untuk ranking & score numbers

**Visual style:**
- Modern Sport / ESPN scoreboard aesthetic
- Pure black background, crimson accents
- Bold uppercase for category labels
- Clean monospace-ish numbers (tabular-nums)
- Subtle dividers, no heavy borders

## Data Model

```js
state = {
  tournament: {
    name: "The Ignitex Gobar",
    venue: "Modern Land Golf Club",
    date: "2026-05-22",
    status: "setup" | "input" | "locked" | "finalized"
  },

  course: {
    // Modern Land Golf default par per hole:
    holes: [
      { number: 1,  par: 5 },
      { number: 2,  par: 4 },
      { number: 3,  par: 3 },
      { number: 4,  par: 4 },
      { number: 5,  par: 5 },
      { number: 6,  par: 3 },
      { number: 7,  par: 4 },
      { number: 8,  par: 4 },
      { number: 9,  par: 4 },
      { number: 10, par: 4 },
      { number: 11, par: 3 },
      { number: 12, par: 4 },
      { number: 13, par: 4 },
      { number: 14, par: 5 },
      { number: 15, par: 4 },
      { number: 16, par: 4 },
      { number: 17, par: 3 },
      { number: 18, par: 5 }
    ]
    // Total: 72, OUT 36, IN 36
    // Composition: 4 par-3, 10 par-4, 4 par-5
  },

  flights: [
    {
      id: "f1",
      name: "Flight 1",
      teeTime: "07:00",          // optional, "HH:MM" or null
      playerIds: ["p1","p2","p3","p4"]   // 3-5 players
    }
  ],

  players: [
    {
      id: "p1",
      name: "Budi Santoso",
      scores: [null, null, ...]   // length 18, integers (1-15, capped at 2×par per hole)
    }
  ],

  peoriaHoles: null | {
    // null until randomized; once set:
    par3: [number, number],     // hole numbers
    par4: [number, number],
    par5: [number, number],
    all: [n,n,n,n,n,n]            // sorted ascending, convenience
  },

  results: null | {
    // computed when status = "finalized"
    perPlayer: [
      {
        playerId: "p1",
        gross: 85,
        peoriaOver: 8,
        handicap: 24,
        net: 61
      }
    ],
    bgo: { playerId, gross },
    bno: { playerId, gross, handicap, net },
    flightA: [ { playerId, net, rank } ],  // sorted ascending by net
    flightB: [ { playerId, net, rank } ],
    flightStandings: [
      // by playing flight, sorted ascending by avg net
      { flightId, name, avgNet, totalNet, memberCount }
    ]
  },

  ui: {
    activeTab: "setup" | "input" | "leaderboard" | "awards",
    activeInputFlight: "f1",      // current playing flight in score input
    displayMode: false,            // fullscreen leaderboard toggle
    revealedAwards: []             // ["flightB","flightA","bno","bgo"] order
  }
}
```

### State Machine

```
setup ──[Start Tournament]──> input
input ──[Finalize Scoring]──> locked
locked ──[Randomize Peoria]──> finalized
finalized ──[Unlock Scoring]──> input  (clears peoriaHoles & results)
finalized ──[Re-randomize]──> finalized (new peoriaHoles + results)
[any] ──[Clear All Data]──> setup (with confirmation)
```

## UI Specification

### Header (all tabs)

```
┌──────────────────────────────────────────────────────────────────┐
│ [IGNITEX LOGO]  THE IGNITEX GOBAR                  ● {STATUS}    │
│                 22 May 2026 · Modern Land                         │
├──────────────────────────────────────────────────────────────────┤
│ [Setup][Score Input][Leaderboard][🏆 Awards] [Display][Save][⋮]   │
└──────────────────────────────────────────────────────────────────┘
```

- Status indicator pill (right side): warna berbeda per status
  - `setup` — abu-abu
  - `input` — crimson dengan pulsing dot
  - `locked` — kuning
  - `finalized` — gold
- Awards tab disabled (greyed out) sebelum status = `finalized`
- Kebab menu (⋮): "Clear All Data", "Export JSON", "Import JSON"

### Tab 1: Setup

**Course Par section:**
- 18 input boxes, satu per hole, default loaded ke Modern Land par
- Live validation: tampilkan running total OUT (1-9), IN (10-18), TOTAL
- Warning indicator kalau total ≠ 72
- Button "Load Modern Land defaults" untuk reset ke preset

**Flights (Playing Groups) section:**
- "+ Add Flight" button → bikin flight baru
- Tiap flight box:
  - Name field (editable, default "Flight 1", "Flight 2", ...)
  - Tee time field (HH:MM, optional)
  - List pemain dengan drag handle, name (editable inline), remove button
  - "+ Add Player" inline (type name + Enter)
  - Validation: max 5 pemain per flight
- Drag-and-drop reorder pemain antar flight
- Warning kalau ada pemain duplikat nama (case-insensitive trim compare)

**Test & Demo panel** (collapsible):
- `[🎲 Generate Demo Tournament]` — wipe & create 24 pemain, 6 flight, scores random realistic
- `[🎲 Fill Random Scores]` — fill semua skor random valid (only when roster exists)
- `[🗑 Clear All Data]` — reset to empty setup (confirmation modal)

**Action bar bottom:**
- Total players count
- `[Start Tournament →]` — validate: par total = 72, minimal 1 flight, minimal 2 pemain. Status → `input`.

### Tab 2: Score Input

**Flight switcher (top bar):**
- Pills per flight: `[Flight 1 ✓] [Flight 2 ●] [Flight 3]`
- ✓ = all scores filled, ● = current active, blank = no scores yet
- Progress bar overall: "18/24 players complete"

**Score grid (per active flight):**
- Header row: hole numbers 1-18 dengan visual divider antara hole 9 dan 10 (OUT | IN)
- Par row: par per hole (read-only, gray)
- Player rows: pemain dari flight aktif
- Score cells: input over-par value
  - Type `0` = par
  - Type `-1` = birdie (green text)
  - Type `+1` or `1` = bogey (red text)
  - Type `-2` = eagle (bold green)
  - Max validation per hole: cap at 2× par stroke equivalent
    - Par 3: max input `+3` (stroke 6)
    - Par 4: max input `+4` (stroke 8)
    - Par 5: max input `+5` (stroke 10)
  - Input exceeding max: auto-cap + tooltip "Capped at double par"
- Right columns: `OUT (+/- )`, `IN (+/- )`, `TOT (+/- )` — auto-calc, tabular nums
- Auto-tab right after entry; tab di hole 9 → loncat ke hole 10; tab di hole 18 → loncat ke pemain berikutnya hole 1
- Cell empty = null (counted as "not entered" for validation)

**Action bar bottom:**
- `[⚠ Edit Setup]` — link ke setup tab dengan warning kalau ada data
- `[🔒 Finalize Scoring]` — validate: semua cell terisi. Kalau ada gap: highlight cell pertama yang kosong + scroll. Confirmation modal, lalu status → `locked`.

### Tab 3: Leaderboard

**Mode A: status `input` atau `locked` (Provisional)**
- Banner: "PROVISIONAL GROSS RANKING — Peoria & Net belum dihitung"
- Table: Rank · Player · Flight · Thru (e.g., "18/18") · Gross · +/-
- Sort by gross ascending
- Action button:
  - Jika `input`: "🔒 Finalize Scoring →" (same as tab 2)
  - Jika `locked`: "🎲 Randomize Peoria Holes →"

**Mode B: status `finalized` (Final Results)**
- Peoria Holes banner: tampilkan 6 hole terpilih dengan composition labels
  - "Par 3: 6, 17  ·  Par 4: 4, 13  ·  Par 5: 5, 18"
- Winner summary cards (BGO + BNO side by side, prominent)
- Flight A & Flight B winner lists (top 3 dari masing-masing)
- Full standings table: Rank · Player · Flight · Gross · Hcp · Net · Class label
- Standings by Playing Flight: cards sorted by avg net ascending
- Actions: `[🔓 Unlock Scoring]`, `[🎲 Re-randomize Peoria]`, `[💾 Save Snapshot]`

### Tab 4: 🏆 Awards Ceremony

**State sebelum reveal:**
```
┌────────────────────────────────────────────┐
│        THE IGNITEX GOBAR · AWARDS           │
│              22 MAY 2026                    │
│                                              │
│         [▶  REVEAL NEXT WINNER]             │
│                                              │
│       Up next: FLIGHT B WINNER              │
│                                              │
│   ● Flight B  ○ Flight A  ○ BNO  ○ BGO     │
└────────────────────────────────────────────┘
```

**Reveal sequence (controlled, klik per reveal):**
1. Flight B Winner
2. Flight A Winner
3. Best Net Overall (BNO)
4. Best Gross Overall (BGO)

**Animation per reveal (1.5-3 seconds total):**
1. `[Reveal Next]` button click → disable button
2. Screen dim (overlay 70% black, transition 300ms)
3. Category label fades in top center (e.g., "FLIGHT B WINNER")
4. 3-2-1 countdown overlay (large crimson numbers, 1s total)
5. Spotlight expand from center, crimson glow
6. Player name typewriter effect (letter-by-letter, ~50ms per char)
7. Flight badge fades in below name
8. Stats reveal sequentially:
   - GROSS appears (400ms fade-up)
   - HANDICAP appears (400ms after)
   - NET appears (400ms after, bold accent)
9. Subtle confetti burst on BNO & BGO reveal only (CSS-only particles, no library). Flight A/B winners get crimson glow only.
10. Crimson border glow pulses on card
11. Background overlay fades out, screen restored
12. Winner card persists, stacked below previous reveals
13. `[Reveal Next]` re-enabled with next category indicator updated

**Winner card layout (persists after reveal):**
```
┌──────────────────────────────────────────────┐
│           🏆 FLIGHT B WINNER                  │
│                                                │
│              SARI HARTONO                     │
│                Flight 5                       │
│                                                │
│   GROSS        HANDICAP        NET            │
│    85             24            61            │
│                                                │
│        [↻ Replay Animation]                   │
└──────────────────────────────────────────────┘
```

**Special case BGO card:**
- HANDICAP & NET de-emphasized (smaller, gray) atau hidden
- GROSS highlighted, large

**End state:**
- Setelah BGO di-reveal, ada "🎉 Tournament Complete" banner
- "Reveal Next" button hilang, replaced dengan "Replay All" yang restart sequence

### Display Mode

- Toggle via button di header
- Hide tabs, controls, kebab menu — only logo + title + active content
- Font size +30%
- Body scroll lock (no scrollbar visible)
- ESC key untuk exit
- Auto-detected scenarios:
  - Status `input/locked` di Display Mode → show provisional leaderboard
  - Status `finalized` di Display Mode → show final leaderboard
  - Khusus untuk ceremony: switch ke Awards tab dulu, baru aktifkan Display Mode

### Save Snapshot

- Tombol "Save..." di header (kebab menu juga ada "Save Snapshot")
- Klik → generate self-contained HTML:
  1. Read current state
  2. Convert assets/*.png → base64 data URIs, embed
  3. Bake `state` object sebagai `const SNAPSHOT_STATE = {...}` di JS
  4. Set flag `READ_ONLY = true` → semua input/button disable, "Clear Data" hilang
  5. Trigger download as `ignitex-gobar-2026-05-22-{timestamp}.html`
- Snapshot file = portable, bisa dishare via email/WhatsApp, no folder dependency

### Random Data Generators (test mode)

**Generate Demo Tournament:**
- Wipe state, reset to setup
- Set par to Modern Land defaults
- Create 6 flights with realistic Indonesian names (curated list of ~30 sample names)
- Distribute 24 names across 6 flights (4 per flight)
- Tee times: 07:00, 07:08, 07:16, 07:24, 07:32, 07:40
- Random scores per hole, weighted toward par/bogey:
  - 5% birdie (-1)
  - 35% par (0)
  - 35% bogey (+1)
  - 15% double bogey (+2)
  - 8% triple (+3)
  - 2% double-par cap (max value)
- Set status to `input` (admin tinggal click Finalize untuk demo flow)

**Fill Random Scores:**
- Only enabled saat roster sudah ada
- Apply same weighted random formula ke semua cell yang kosong
- Doesn't overwrite existing cells (preserve manual entries)

## Validation & Error Handling

| Scenario | Behavior |
|---|---|
| Par total ≠ 72 di setup | Warning banner, button "Start Tournament" disabled |
| Duplicate player names | Yellow warning, allowed but flagged |
| Score input > 2×par | Auto-cap, tooltip notification |
| Score input non-numeric | Reject keypress |
| Score input negative beyond -3 | Reject (unlikely birdie/albatross beyond) |
| Try Finalize with empty cells | Modal listing affected players + first empty hole, scroll to first. Admin punya pilihan "Remove player from tournament" untuk handle no-show / DNF (player dihapus dari flight, score-nya dibuang). |
| Try Randomize Peoria before Lock | Button disabled |
| Try Awards before Finalize | Tab disabled |
| Try Save Snapshot before any data | Button disabled |
| localStorage quota exceeded | Toast error, suggest Save Snapshot + Clear |
| Browser refresh mid-input | State restored from localStorage automatically |

## Out of Scope (YAGNI)

- Multi-user concurrent input (single admin only)
- Backend / cloud sync
- Print-only scorecard layout (snapshot HTML print should suffice via browser print)
- Player photos
- Longest Drive / Nearest to Pin special prizes
- Multiple round / cumulative tournament
- Real-time leaderboard auto-refresh (no remote source)
- Login / authentication
- Mobile responsive optimization (laptop primary, mobile fallback acceptable)
- Internationalization beyond English UI

## Open Items (to address during implementation)

1. **Logo assets** — user akan menyediakan: `assets/ignitex-logo.png` (utama). Optional: event-specific Gobar logo, Modern Land logo.
2. **Indonesian player name samples** untuk Demo Tournament generator — saya curate dari nama umum, user bisa adjust list di-source code.
3. **Tee time defaults** — saat ini 8-menit interval mulai 07:00; bisa adjust di Setup.

## Success Criteria

- Admin bisa input semua data 24-32 pemain dalam < 30 menit setelah turnamen
- Randomize Peoria → final results visible dalam < 5 detik
- Awards ceremony reveal smooth, no jank, animation feels celebratory
- Snapshot HTML opens correctly on any modern browser without folder dependency
- State survives accidental browser refresh / tab close
- Display Mode terlihat clean dari jarak 5 meter di TV/projector clubhouse
