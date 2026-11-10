#!/usr/bin/env bash
#
# init-kafka-topics.sh - create the Kafka topics listed in compose/kafka/topics.txt.
# Run this ON THE VPS after Kafka is up. Safe to run repeatedly (existing topics are left alone).
# Written for bash 3.2+.

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KAFKA_CONTAINER="${KAFKA_CONTAINER:-kafka}"
TOPICS_FILE="${TOPICS_FILE:-${SCRIPT_DIR}/../compose/kafka/topics.txt}"
KAFKA_BIN="${KAFKA_BIN:-/opt/kafka/bin}"
BOOTSTRAP="${BOOTSTRAP:-localhost:9092}" # INTERNAL listener, as seen from inside the container

log() { printf '[init-kafka-topics] %s\n' "$*" >&2; }
die() { printf '[init-kafka-topics] ERROR: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: init-kafka-topics.sh [-h|--help]

Creates the topics in compose/kafka/topics.txt inside the Kafka container.

Environment (optional):
  KAFKA_CONTAINER  Container name            (default: kafka)
  TOPICS_FILE      Topics list               (default: ../compose/kafka/topics.txt)
  KAFKA_BIN        Kafka scripts directory   (default: /opt/kafka/bin)
  BOOTSTRAP        Bootstrap inside container (default: localhost:9092)

File format: name partitions replication-factor [config=value,config=value]
EOF
}

if [[ $# -gt 0 ]]; then
  case "$1" in
    -h | --help) usage; exit 0 ;;
    *) usage >&2; die "Unknown option: $1" ;;
  esac
fi

command -v docker >/dev/null 2>&1 || die "Docker is not installed or not on PATH (run this on the VPS)."
[[ -f "$TOPICS_FILE" ]] || die "Topics file not found: $TOPICS_FILE"

if ! docker exec "$KAFKA_CONTAINER" "${KAFKA_BIN}/kafka-broker-api-versions.sh" \
  --bootstrap-server "$BOOTSTRAP" >/dev/null 2>&1; then
  die "Kafka is not reachable in container '$KAFKA_CONTAINER'. Is it running? (infra.sh ps kafka)"
fi

created=0
while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip blank lines and comments.
  case "$line" in
    "" | \#*) continue ;;
  esac

  name=""
  partitions=""
  replication=""
  configs=""
  IFS=' ' read -r name partitions replication configs <<<"$line"
  [[ -n "$name" && -n "$partitions" && -n "$replication" ]] \
    || die "Invalid line in $TOPICS_FILE: '$line' (expected: name partitions replication [configs])"

  args=(--bootstrap-server "$BOOTSTRAP" --create --if-not-exists
    --topic "$name" --partitions "$partitions" --replication-factor "$replication")
  if [[ -n "$configs" ]]; then
    cfg_list=()
    IFS=',' read -r -a cfg_list <<<"$configs"
    for cfg in ${cfg_list[@]+"${cfg_list[@]}"}; do
      args+=(--config "$cfg")
    done
  fi

  log "Ensuring topic: $name (partitions=$partitions, replication=$replication${configs:+, $configs})"
  docker exec "$KAFKA_CONTAINER" "${KAFKA_BIN}/kafka-topics.sh" "${args[@]}" >/dev/null
  created=$((created + 1))
done <"$TOPICS_FILE"

log "Processed $created topic(s). Current topics:"
docker exec "$KAFKA_CONTAINER" "${KAFKA_BIN}/kafka-topics.sh" \
  --bootstrap-server "$BOOTSTRAP" --list
