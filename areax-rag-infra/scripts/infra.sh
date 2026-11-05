#!/usr/bin/env bash
#
# infra.sh - start, stop and inspect the infrastructure containers on the VPS.
# Run this ON THE VPS (it needs Docker there). Written for bash 3.2+.
#
# Usage: infra.sh <up|down|restart|ps|logs|config> <postgres|kafka|floci|all>

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$(cd "${SCRIPT_DIR}/../compose" && pwd)"
ENV_FILE="${COMPOSE_ENV_FILE:-${COMPOSE_DIR}/.env}"

log() { printf '[infra] %s\n' "$*" >&2; }
die() { printf '[infra] ERROR: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: infra.sh <command> <service>

Commands:
  up        Start the service in the background (creates it if needed)
  down      Stop and remove the container. Volumes (your data) are KEPT
  restart   Restart the container
  ps        Show container status
  logs      Follow the last 100 log lines
  config    Validate and print the resolved compose configuration

Services: postgres | kafka | floci | all   ("all" = postgres, kafka, floci in that order)

Environment (optional):
  COMPOSE_ENV_FILE   Path to the env file (default: compose/.env)

Notes:
  - Copy compose/.env.example to compose/.env and fill in the passwords first.
  - This script never deletes volumes. To wipe data, do it yourself with 'docker volume rm'.
EOF
}

compose_file_for() {
  case "$1" in
    postgres | kafka | floci) printf '%s/%s.compose.yml' "$COMPOSE_DIR" "$1" ;;
    *) die "Unknown service '$1' (expected postgres, kafka, floci or all)" ;;
  esac
}

run_compose() {
  local service="$1"
  shift
  docker compose -f "$(compose_file_for "$service")" --env-file "$ENV_FILE" "$@"
}

run_for() {
  local command="$1" service="$2"
  case "$command" in
    up) run_compose "$service" up -d ;;
    down) run_compose "$service" down ;; # no -v: volumes are never removed
    restart) run_compose "$service" restart ;;
    ps) run_compose "$service" ps ;;
    logs) run_compose "$service" logs -f --tail=100 ;;
    config) run_compose "$service" config ;;
    *) usage >&2; die "Unknown command: $command" ;;
  esac
}

if [[ $# -eq 1 && ( "$1" == "-h" || "$1" == "--help" ) ]]; then
  usage
  exit 0
fi
[[ $# -eq 2 ]] || { usage >&2; exit 1; }

COMMAND="$1"
SERVICE="$2"

# Validate here, not inside a command substitution (where die would not stop the script).
case "$SERVICE" in
  postgres | kafka | floci | all) ;;
  *) usage >&2; die "Unknown service '$SERVICE' (expected postgres, kafka, floci or all)" ;;
esac

command -v docker >/dev/null 2>&1 || die "Docker is not installed or not on PATH."
[[ -f "$ENV_FILE" ]] || die "Env file not found: $ENV_FILE. Copy compose/.env.example to compose/.env and fill it in."

if [[ "$SERVICE" == "all" ]]; then
  if [[ "$COMMAND" == "logs" ]]; then
    die "'logs' needs one service (postgres, kafka or floci)."
  fi
  for s in postgres kafka floci; do
    log "$COMMAND $s"
    run_for "$COMMAND" "$s"
  done
else
  run_for "$COMMAND" "$SERVICE"
fi
