#!/usr/bin/env bash
#
# tunnel.sh - open, close or check the SSH tunnel from YOUR machine to the VPS.
# Forwards Postgres, Kafka (EXTERNAL listener), Floci and the Floci UI to localhost.
# Written for bash 3.2+ (macOS default).
#
# Usage: SSH_ALIAS=<your-ssh-alias> tunnel.sh <open|close|status>

set -euo pipefail
IFS=$'\n\t'

SSH_ALIAS="${SSH_ALIAS:-}"
LOCAL_POSTGRES_PORT="${LOCAL_POSTGRES_PORT:-5432}"
LOCAL_KAFKA_PORT="${LOCAL_KAFKA_PORT:-9094}"
LOCAL_FLOCI_PORT="${LOCAL_FLOCI_PORT:-4566}"
LOCAL_FLOCI_UI_PORT="${LOCAL_FLOCI_UI_PORT:-4500}"
# Ports on the VPS (all bound to 127.0.0.1 there)
REMOTE_POSTGRES_PORT="${REMOTE_POSTGRES_PORT:-5432}"
REMOTE_KAFKA_PORT="${REMOTE_KAFKA_PORT:-9094}"
REMOTE_FLOCI_PORT="${REMOTE_FLOCI_PORT:-4566}"
REMOTE_FLOCI_UI_PORT="${REMOTE_FLOCI_UI_PORT:-4500}"

log() { printf '[tunnel] %s\n' "$*" >&2; }
die() { printf '[tunnel] ERROR: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: SSH_ALIAS=<your-ssh-alias> tunnel.sh <open|close|status>

  open     Open the tunnel in the background (skips ports already listening locally)
  close    Close the tunnel
  status   Show whether the tunnel is up and which local ports answer

Environment:
  SSH_ALIAS             Host alias from your own ~/.ssh/config (required)
  LOCAL_POSTGRES_PORT   Local port for Postgres (default 5432; use 5433 if taken)
  LOCAL_KAFKA_PORT      Local port for Kafka    (default 9094)
  LOCAL_FLOCI_PORT      Local port for Floci    (default 4566)
  LOCAL_FLOCI_UI_PORT   Local port for Floci UI (default 4500)
  REMOTE_*_PORT         Ports on the VPS (defaults 5432, 9094, 4566, 4500)
  TUNNEL_SOCKET         Control socket path (default /tmp/areax-rag-tunnel-<alias>.sock)

Kafka note: clients must use localhost:9094 (the advertised address). If you change
LOCAL_KAFKA_PORT, the broker's advertised address will no longer match.
EOF
}

port_listening() {
  command -v nc >/dev/null 2>&1 && nc -z localhost "$1" >/dev/null 2>&1
}

master_running() {
  ssh -S "$SOCKET" -O check "$SSH_ALIAS" >/dev/null 2>&1
}

open_tunnel() {
  if master_running; then
    log "Tunnel is already open."
    return 0
  fi
  rm -f "$SOCKET"

  local -a forwards=()
  local name local_port remote_port
  for entry in "Postgres:${LOCAL_POSTGRES_PORT}:${REMOTE_POSTGRES_PORT}" \
    "Kafka:${LOCAL_KAFKA_PORT}:${REMOTE_KAFKA_PORT}" \
    "Floci:${LOCAL_FLOCI_PORT}:${REMOTE_FLOCI_PORT}" \
    "Floci UI:${LOCAL_FLOCI_UI_PORT}:${REMOTE_FLOCI_UI_PORT}"; do
    IFS=':' read -r name local_port remote_port <<<"$entry"
    if port_listening "$local_port"; then
      log "Local port $local_port is already in use; skipping $name forward."
      continue
    fi
    forwards+=(-L "${local_port}:localhost:${remote_port}")
  done

  [[ ${#forwards[@]} -gt 0 ]] || die "All local ports are already in use; nothing to forward."

  ssh -f -N -M -S "$SOCKET" \
    -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes \
    "${forwards[@]}" "$SSH_ALIAS" \
    || die "Could not open the tunnel. Check the alias '$SSH_ALIAS' and that the VPS is reachable."
  log "Tunnel opened."
  show_status
}

close_tunnel() {
  if master_running; then
    ssh -S "$SOCKET" -O exit "$SSH_ALIAS" >/dev/null 2>&1 || true
    rm -f "$SOCKET"
    log "Tunnel closed."
  else
    log "No tunnel is open."
  fi
}

show_status() {
  if master_running; then
    log "Tunnel: UP (alias: $SSH_ALIAS)"
  else
    log "Tunnel: DOWN"
  fi
  local name port
  for entry in "Postgres:${LOCAL_POSTGRES_PORT}" "Kafka:${LOCAL_KAFKA_PORT}" "Floci:${LOCAL_FLOCI_PORT}" "Floci UI:${LOCAL_FLOCI_UI_PORT}"; do
    IFS=':' read -r name port <<<"$entry"
    if port_listening "$port"; then
      log "  $name: localhost:$port is listening"
    else
      log "  $name: localhost:$port is not listening"
    fi
  done
}

# ---- Main -----------------------------------------------------------------------------------
if [[ $# -ge 1 && ( "$1" == "-h" || "$1" == "--help" ) ]]; then
  usage
  exit 0
fi
[[ $# -eq 1 ]] || { usage >&2; exit 1; }

[[ -n "$SSH_ALIAS" ]] || die "Set SSH_ALIAS to a host alias from your ~/.ssh/config."
SOCKET="${TUNNEL_SOCKET:-/tmp/areax-rag-tunnel-${SSH_ALIAS}.sock}"
command -v ssh >/dev/null 2>&1 || die "ssh is not installed."

case "$1" in
  open) open_tunnel ;;
  close) close_tunnel ;;
  status) show_status ;;
  *) usage >&2; die "Unknown command: $1" ;;
esac
