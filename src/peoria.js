export function categorizeHoles(holes) {
  const buckets = { par3: [], par4: [], par5: [] };
  for (const h of holes) {
    if (h.par === 3) buckets.par3.push(h.number);
    else if (h.par === 4) buckets.par4.push(h.number);
    else if (h.par === 5) buckets.par5.push(h.number);
  }
  return buckets;
}

function pickN(arr, n, rng) {
  const pool = [...arr];
  const picked = [];
  for (let k = 0; k < n; k++) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked.sort((a, b) => a - b);
}

export function pickPeoriaHoles(holes, rng = Math.random) {
  const cats = categorizeHoles(holes);
  const par3 = pickN(cats.par3, 2, rng);
  const par4 = pickN(cats.par4, 2, rng);
  const par5 = pickN(cats.par5, 2, rng);
  const all = [...par3, ...par4, ...par5].sort((a, b) => a - b);
  return { par3, par4, par5, all };
}

export function capScore(par, stroke) {
  return Math.min(stroke, par * 2);
}

export function computeGross(scores) {
  return scores.reduce((sum, s) => sum + (s ?? 0), 0);
}

export function computePeoriaOver(scores, holes, peoriaHoles) {
  let over = 0;
  for (const num of peoriaHoles.all) {
    const idx = num - 1;
    const par = holes[idx].par;
    const stroke = scores[idx];
    over += stroke - par;
  }
  return over;
}

export function computeHandicap(peoriaOver) {
  return peoriaOver * 3;
}

export function computeNet(gross, handicap) {
  return gross - handicap;
}

export function computePlayerResult(player, holes, peoriaHoles) {
  const gross = computeGross(player.scores);
  const peoriaOver = computePeoriaOver(player.scores, holes, peoriaHoles);
  const handicap = computeHandicap(peoriaOver);
  const net = computeNet(gross, handicap);
  return { gross, peoriaOver, handicap, net };
}

export function compareNetTiebreak(a, b) {
  if (a.net !== b.net) return a.net - b.net;
  if (a.handicap !== b.handicap) return a.handicap - b.handicap;
  return a.name.localeCompare(b.name);
}

// Used to split classes: lower handicap first (tiebreak by net, then name).
export function compareHandicapTiebreak(a, b) {
  if (a.handicap !== b.handicap) return a.handicap - b.handicap;
  if (a.net !== b.net) return a.net - b.net;
  return a.name.localeCompare(b.name);
}

export function splitFlights(results) {
  if (results.length === 0) return { bgo: null, bno: null, flightA: [], flightB: [] };

  const sortedByGross = [...results].sort((a, b) => a.gross - b.gross || a.name.localeCompare(b.name));
  const bgo = sortedByGross[0];

  const sortedByNet = [...results].sort(compareNetTiebreak);
  const bno = sortedByNet[0];

  const excludedIds = new Set([bgo.playerId, bno.playerId]);
  const pool = results.filter(r => !excludedIds.has(r.playerId));

  // Split into classes by HANDICAP — lower handicaps → Class A, higher → Class B.
  const byHandicap = [...pool].sort(compareHandicapTiebreak);
  const flightASize = Math.ceil(byHandicap.length / 2);
  const classA = byHandicap.slice(0, flightASize);
  const classB = byHandicap.slice(flightASize);

  // Rank WITHIN each class by NET (lowest net = rank 1).
  const flightA = [...classA].sort(compareNetTiebreak).map((r, i) => ({ ...r, rank: i + 1 }));
  const flightB = [...classB].sort(compareNetTiebreak).map((r, i) => ({ ...r, rank: i + 1 }));

  return { bgo, bno, flightA, flightB };
}
