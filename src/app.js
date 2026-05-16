import { loadState, saveState, clearState } from './state.js';
import { render } from './render.js';

let state = loadState();

function update(fn) {
  fn(state);
  saveState(state);
  render(state);
}

function handleAction(action, target) {
  switch (action) {
    case 'switch-tab':
      update(s => { s.ui.activeTab = target.dataset.tab; });
      break;
    case 'toggle-display':
      update(s => { s.ui.displayMode = !s.ui.displayMode; });
      document.body.dataset.displayMode = String(state.ui.displayMode);
      break;
  }
}

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) { handleAction('switch-tab', tabBtn); return; }
  const actionBtn = e.target.closest('[data-action]');
  if (actionBtn) { handleAction(actionBtn.dataset.action, actionBtn); return; }
});

document.body.dataset.displayMode = String(state.ui.displayMode);
render(state);

window.__state = () => state;
window.__clear = () => { clearState(); state = loadState(); render(state); };
