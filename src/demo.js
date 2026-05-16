import { createEmptyState, newId } from './state.js';
import { capScore } from './peoria.js';

export const DEMO_NAMES = [
  'Budi Santoso', 'Andi Wijaya', 'Rudi Tan', 'Sari Hartono', 'Joko Sutomo',
  'Maya Putri', 'Doni Kurniawan', 'Tina Wijaya', 'Eko Prasetyo', 'Linda Sari',
  'Hendra Lim', 'Sinta Dewi', 'Fajar Nugroho', 'Wati Halim', 'Bambang Susilo',
  'Ratna Komala', 'Indra Gunawan', 'Yuli Marlina', 'Agus Salim', 'Devi Anggraini',
  'Rahmat Hidayat', 'Mira Lestari', 'Yusuf Iskandar', 'Nia Rahayu', 'Heri Wibowo',
  'Tika Permata', 'Anton Setiawan', 'Lia Kusuma', 'Dimas Aryo', 'Wulan Sari'
];

function randomOver() {
  const r = Math.random();
  if (r < 0.05) return -1;
  if (r < 0.40) return 0;
  if (r < 0.75) return 1;
  if (r < 0.90) return 2;
  if (r < 0.98) return 3;
  return 4;
}

export function generateDemoTournament() {
  const state = createEmptyState();
  state.tournament.status = 'input';

  const flights = [];
  const players = [];
  const teeTimes = ['07:00', '07:08', '07:16', '07:24', '07:32', '07:40'];

  for (let fi = 0; fi < 6; fi++) {
    const flightId = `f_demo_${fi+1}`;
    const playerIds = [];
    for (let pi = 0; pi < 4; pi++) {
      const playerId = `p_demo_${fi*4 + pi + 1}`;
      const name = DEMO_NAMES[fi*4 + pi];
      const scores = state.course.holes.map(h => {
        const stroke = h.par + randomOver();
        return capScore(h.par, Math.max(1, stroke));
      });
      players.push({ id: playerId, name, scores });
      playerIds.push(playerId);
    }
    flights.push({
      id: flightId,
      name: `Flight ${fi+1}`,
      teeTime: teeTimes[fi],
      playerIds
    });
  }
  state.flights = flights;
  state.players = players;
  state.ui.activeTab = 'input';
  state.ui.activeInputFlight = flights[0].id;
  return state;
}

export function fillRandomScores(state) {
  const next = JSON.parse(JSON.stringify(state));
  for (const player of next.players) {
    for (let i = 0; i < 18; i++) {
      if (player.scores[i] === null || player.scores[i] === undefined) {
        const par = next.course.holes[i].par;
        const stroke = par + randomOver();
        player.scores[i] = capScore(par, Math.max(1, stroke));
      }
    }
  }
  return next;
}
