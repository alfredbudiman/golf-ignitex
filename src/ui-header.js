export function renderHeader(state, onAction) {
  const status = state.tournament.status;
  const awardsReady = status === 'finalized';
  const logoSrc = (typeof LOGO_ASSETS !== 'undefined' && LOGO_ASSETS['assets/ignitex-logo.png'])
    || 'assets/ignitex-logo.png';

  return `
    <header class="header">
      <div class="header-top">
        <div class="brand">
          <div class="brand-logo-tile"><img src="${logoSrc}" alt="Ignitex" class="brand-logo"></div>
          <div class="brand-divider"></div>
          <div class="brand-text">
            <div class="title">GOBAR 2026</div>
            <div class="meta">22 May 2026 · Modern Land Golf Club</div>
          </div>
        </div>
        <div class="header-actions">
          <span class="status-pill" data-status="${status}">${statusLabel(status)}</span>
          <button class="display-toggle" data-action="toggle-display">${state.ui.displayMode ? 'Exit Display (ESC)' : 'Display Mode'}</button>
          <button class="save-btn" data-action="save-snapshot" ${state.players.length === 0 ? 'disabled' : ''}>Save Snapshot</button>
          <button class="kebab" data-action="open-menu">⋮</button>
        </div>
      </div>
      <nav class="tabs">
        <button class="tab" data-tab="setup" data-active="${state.ui.activeTab === 'setup'}">Setup</button>
        <button class="tab" data-tab="input" data-active="${state.ui.activeTab === 'input'}" ${state.players.length === 0 ? 'disabled' : ''}>Score Input</button>
        <button class="tab" data-tab="leaderboard" data-active="${state.ui.activeTab === 'leaderboard'}" ${state.players.length === 0 ? 'disabled' : ''}>Leaderboard</button>
        <button class="tab" data-tab="awards" data-active="${state.ui.activeTab === 'awards'}" ${!awardsReady ? 'disabled' : ''}>🏆 Awards</button>
      </nav>
    </header>
  `;
}

function statusLabel(s) {
  return { setup: 'Setup', input: 'Live · Input', locked: 'Locked', finalized: 'Finalized' }[s] || s;
}
