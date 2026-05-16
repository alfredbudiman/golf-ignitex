import { renderHeader } from './ui-header.js';
import { renderSetup } from './ui-setup.js';
import { renderInput } from './ui-input.js';
import { renderLeaderboard } from './ui-leaderboard.js';
import { renderAwards } from './ui-awards.js';

export function render(state) {
  const app = document.getElementById('app');
  let body = '';
  switch (state.ui.activeTab) {
    case 'setup': body = renderSetup(state); break;
    case 'input': body = renderInput(state); break;
    case 'leaderboard': body = renderLeaderboard(state); break;
    case 'awards': body = renderAwards(state); break;
    default: body = `<p>Tab "${state.ui.activeTab}" under construction.</p>`;
  }
  app.innerHTML = `${renderHeader(state)}<main class="main">${body}</main>`;
}
