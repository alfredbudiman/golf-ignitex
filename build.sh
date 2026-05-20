#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/dist/index.html"
mkdir -p "$ROOT/dist"

STYLES=$(cat "$ROOT/src/styles.css")

# Concat and strip ESM imports/exports from JS modules in dependency order
JS=""
for f in format peoria state demo snapshot ui-header ui-setup ui-input ui-leaderboard ui-awards ui-peoria-spin render app; do
  CONTENT=$(cat "$ROOT/src/$f.js" | sed -E 's/^[[:space:]]*import [^;]+;[[:space:]]*$//' | sed -E 's/^[[:space:]]*export[[:space:]]+//' | sed -E 's#</script>#<\\/script>#g')
  JS="$JS

// === src/$f.js ===
$CONTENT
"
done

# Base64-encode logos (bash 3.2 compatible)
LOGOS="{}"
if [ -d "$ROOT/assets" ]; then
  ENTRIES=""
  SEP=""
  for img in "$ROOT/assets"/*.png; do
    [ -f "$img" ] || continue
    name=$(basename "$img")
    b64=$(base64 -i "$img" | tr -d '\n')
    ENTRIES="$ENTRIES$SEP\"assets/$name\":\"data:image/png;base64,$b64\""
    SEP=","
  done
  if [ -n "$ENTRIES" ]; then
    LOGOS="{$ENTRIES}"
  fi
fi

cat > "$OUT" <<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Ignitex Gobar — Scoring Board</title>
  <style>$STYLES</style>
</head>
<body>
  <div id="app"></div>
  <div id="modal-root"></div>
  <script>
    const LOGO_ASSETS = $LOGOS;
    $JS
  </script>
</body>
</html>
HTML

echo "Built: $OUT ($(wc -c < "$OUT") bytes)"
