#!/usr/bin/env bash
# Deploys one image tag of the application on the VPS and rolls back if it does not become healthy.
# Usage: deploy.sh <full-image-reference>      e.g. deploy.sh myuser/areax-rag:application-1a2b3c4
set -euo pipefail

IMAGE="${1:?usage: deploy.sh <image>}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/login}"
HEALTH_TIMEOUT_S="${HEALTH_TIMEOUT_S:-60}"
CURRENT_FILE="$DIR/.current-image"

cd "$DIR"
[ -f application.env ] || { echo "missing $DIR/application.env (see docs/deployment.md)" >&2; exit 1; }

PREVIOUS=""
[ -f "$CURRENT_FILE" ] && PREVIOUS="$(cat "$CURRENT_FILE")"

wait_healthy() {
  local waited=0
  until curl -fsS -o /dev/null "$HEALTH_URL"; do
    waited=$((waited + 2))
    [ "$waited" -ge "$HEALTH_TIMEOUT_S" ] && return 1
    sleep 2
  done
}

start() {
  APP_IMAGE="$1" docker compose -f compose.yml pull
  APP_IMAGE="$1" docker compose -f compose.yml up -d --remove-orphans
}

echo "Deploying $IMAGE"
start "$IMAGE"
if wait_healthy; then
  echo "$IMAGE" > "$CURRENT_FILE"
  docker image prune -f >/dev/null
  echo "Healthy: $IMAGE"
  exit 0
fi

echo "Not healthy after ${HEALTH_TIMEOUT_S}s; recent logs:" >&2
APP_IMAGE="$IMAGE" docker compose -f compose.yml logs --tail 50 application >&2 || true
if [ -n "$PREVIOUS" ]; then
  echo "Rolling back to $PREVIOUS" >&2
  start "$PREVIOUS"
  wait_healthy && echo "Rollback is healthy" >&2 || echo "Rollback is NOT healthy either" >&2
fi
exit 1
