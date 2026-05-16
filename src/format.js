export function formatOver(over) {
  if (over === 0) return 'E';
  return over > 0 ? `+${over}` : `${over}`;
}

export function overColor(over) {
  if (over < 0) return 'under';
  if (over === 0) return 'par';
  if (over === 1) return 'over-1';
  return 'over-2plus';
}

export function parseScoreInput(value) {
  if (value === '' || value == null) return null;
  const cleaned = String(value).trim().replace(/^\+/, '');
  if (!/^-?\d+$/.test(cleaned)) return null;
  return parseInt(cleaned, 10);
}

export function formatNet(net) {
  return String(net);
}

export function flightDisplayName(flightId, flights) {
  const f = flights.find(x => x.id === flightId);
  return f ? f.name : '—';
}
