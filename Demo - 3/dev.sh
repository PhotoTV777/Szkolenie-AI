#!/usr/bin/env bash
# Uruchomienie lokalnego serwera developerskiego (auto-restart przy zmianach w kodzie).
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -d node_modules ]]; then
  echo "Brak node_modules — npm install..."
  npm install
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

PORT="${PORT:-3000}"
export PORT

echo ""
echo "  Rezerwacja sal — tryb dev"
echo "  http://localhost:${PORT}"
echo "  API health: http://localhost:${PORT}/api/health"
echo "  Ctrl+C aby zatrzymać"
echo ""

npm run dev
