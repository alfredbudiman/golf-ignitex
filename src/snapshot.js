async function fetchAsDataUrl(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function fetchTextFile(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  }
}

async function inlineLogoIfExists() {
  const candidates = ['assets/ignitex-logo.png', 'assets/event-logo.png', 'assets/modern-land.png'];
  const results = {};
  for (const path of candidates) {
    const dataUrl = await fetchAsDataUrl(path);
    if (dataUrl) results[path] = dataUrl;
  }
  return results;
}

export async function generateSnapshotHtml(state) {
  const styles = await fetchTextFile('src/styles.css');
  const logos = await inlineLogoIfExists();

  const scripts = await Promise.all([
    fetchTextFile('src/format.js'),
    fetchTextFile('src/peoria.js'),
    fetchTextFile('src/state.js'),
    fetchTextFile('src/demo.js'),
    fetchTextFile('src/snapshot.js'),
    fetchTextFile('src/ui-header.js'),
    fetchTextFile('src/ui-setup.js'),
    fetchTextFile('src/ui-input.js'),
    fetchTextFile('src/ui-leaderboard.js'),
    fetchTextFile('src/ui-awards.js'),
    fetchTextFile('src/ui-peoria-spin.js'),
    fetchTextFile('src/render.js'),
    fetchTextFile('src/app.js'),
  ]);

  // Strip ESM imports/exports for inline-bundle
  const concat = scripts
    .map(s => s
      .replace(/^\s*import [^;]+;\s*$/gm, '')
      .replace(/^\s*export\s+/gm, '')
    )
    .join('\n\n');

  const snapshot = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Ignitex Gobar — Snapshot ${state.tournament.date}</title>
  <style>${styles}</style>
</head>
<body data-readonly="true">
  <div id="app"></div>
  <div id="modal-root"></div>
  <script>
    const SNAPSHOT_STATE = ${JSON.stringify(state)};
    const LOGO_ASSETS = ${JSON.stringify(logos)};
    const READ_ONLY = true;
    ${concat}
    window.loadState = () => JSON.parse(JSON.stringify(SNAPSHOT_STATE));
    window.saveState = () => {};
    window.clearState = () => {};
    if (typeof render === 'function') render(SNAPSHOT_STATE);
  </script>
</body>
</html>`;
  return snapshot;
}

export function downloadSnapshot(state, html) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `ignitex-gobar-${state.tournament.date}-${stamp}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
