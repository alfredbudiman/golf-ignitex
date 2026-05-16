import { renderHeader } from './ui-header.js';
import { renderSetup } from './ui-setup.js';

export function render(state) {
  const app = document.getElementById('app');
  let body = '';
  switch (state.ui.activeTab) {
    case 'setup': body = renderSetup(state); break;
    default: body = `<p>Tab "${state.ui.activeTab}" under construction.</p>`;
  }
  app.innerHTML = `
    ${renderHeader(state)}
    <main class="main">${body}</main>
  `;
}
