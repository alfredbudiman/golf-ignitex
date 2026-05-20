export const STORAGE_KEY = 'ignitex-gobar-2026';

export const MODERN_LAND_PARS = [5,4,3,4,5,3,4,4,4,4,3,4,4,5,4,4,3,5];

let _idCounter = Date.now();
export function newId(prefix = 'p') {
  _idCounter += 1;
  return `${prefix}${_idCounter.toString(36)}`;
}

export function createEmptyState() {
  return {
    tournament: {
      name: 'The Ignitex Gobar',
      venue: 'Modern Land Golf Club',
      date: '2026-05-22',
      status: 'setup'
    },
    course: {
      holes: MODERN_LAND_PARS.map((par, i) => ({ number: i + 1, par }))
    },
    flights: [],
    players: [],
    peoriaHoles: null,
    results: null,
    ui: {
      activeTab: 'setup',
      activeInputFlight: null,
      displayMode: false,
      revealedAwards: []
    }
  };
}

// Default roster — editable on the Setup tab. Used on a fresh load (no saved data)
// and after "Clear All Data". Flights 1 & 3 have 5 players, 2 & 4 have 4.
export const DEFAULT_FLIGHTS = [
  { name: 'Flight 1', players: ['Grady E', 'Josh', 'Jeshua E', 'Lukas B', 'Wawan S'] },
  { name: 'Flight 2', players: ['Alvin S', 'Yosuan An', 'Andru T', 'Jeremy S'] },
  { name: 'Flight 3', players: ['Alfred B', 'Irvin T', 'Mulyana', 'Raymond', 'Mario'] },
  { name: 'Flight 4', players: ['Ivan DB', 'Ade', 'Iman N', 'Hendra'] },
];

export function createDefaultState() {
  const state = createEmptyState();
  const flights = [];
  const players = [];
  DEFAULT_FLIGHTS.forEach((f, fi) => {
    const playerIds = [];
    f.players.forEach((name, pi) => {
      const id = `p_default_${fi + 1}_${pi + 1}`;
      players.push({ id, name, scores: Array(18).fill(null), dnf: false });
      playerIds.push(id);
    });
    flights.push({ id: `f_default_${fi + 1}`, name: f.name, teeTime: '', playerIds });
  });
  state.flights = flights;
  state.players = players;
  return state;
}

export function loadState() {
  if (typeof localStorage === 'undefined') return createDefaultState();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createDefaultState();
  try {
    const parsed = JSON.parse(raw);
    return { ...createEmptyState(), ...parsed };
  } catch {
    return createDefaultState();
  }
}

export function saveState(state) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function validateSetup(state) {
  const errors = [];
  const parTotal = state.course.holes.reduce((s, h) => s + h.par, 0);
  if (parTotal !== 72) errors.push(`Par total must be 72 (currently ${parTotal})`);
  if (state.players.length < 2) errors.push('Minimum 2 players required');
  for (const flight of state.flights) {
    if (flight.playerIds.length > 5) errors.push(`Flight "${flight.name}" exceeds max 5 players`);
    if (flight.playerIds.length < 1) errors.push(`Flight "${flight.name}" is empty`);
  }
  if (state.flights.length < 1) errors.push('At least 1 flight required');
  return { valid: errors.length === 0, errors };
}

export function validateInput(state) {
  const errors = [];
  const emptyCellsBy = {};
  for (const player of state.players) {
    if (player.dnf) continue;  // DNF players excluded — partial scores are OK for them
    const empties = [];
    for (let i = 0; i < 18; i++) {
      if (player.scores[i] === null || player.scores[i] === undefined) empties.push(i);
    }
    if (empties.length > 0) emptyCellsBy[player.id] = empties;
  }
  const valid = Object.keys(emptyCellsBy).length === 0;
  if (!valid) errors.push(`${Object.keys(emptyCellsBy).length} player(s) have incomplete scores`);
  return { valid, errors, emptyCellsBy };
}

export function getPlayerFlight(state, playerId) {
  return state.flights.find(f => f.playerIds.includes(playerId)) || null;
}
