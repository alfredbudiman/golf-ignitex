import { renderHeader } from './ui-header.js';

export function render(state) {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderHeader(state)}
    <main class="main">
      <div data-tab-content="${state.ui.activeTab}">Tab: ${state.ui.activeTab} (under construction)</div>
    </main>
  `;
}
