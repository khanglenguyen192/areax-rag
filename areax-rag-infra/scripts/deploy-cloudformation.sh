#!/usr/bin/env bash
#
# deploy-cloudformation.sh
# Create or update the areax-rag storage stack on Floci (virtual AWS).
# Safe to run repeatedly: creates the stack if missing, updates it if present, and exits 0
# when there is nothing to change.
#
# Written to run on the macOS default bash (3.2) as well as newer versions.

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_TEMPLATE="${SCRIPT_DIR}/../cloudformation/storage.yml"

# ---- Configuration (environment variables, all optional) -----------------------------------
AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${STACK_NAME:-areax-rag-storage}"
TEMPLATE_FILE="${TEMPLATE_FILE:-$DEFAULT_TEMPLATE}"
PARAMETERS="${PARAMETERS:-}"                       # space-separated Key=Value pairs
ALLOW_REMOTE_ENDPOINT="${ALLOW_REMOTE_ENDPOINT:-0}" # 1 = allow a non-local endpoint
USE_DEPLOY="${USE_DEPLOY:-0}"                       # 1 = use "aws cloudformation deploy"

# Floci accepts any credentials. Always use dummy ones so real AWS credentials in the
# caller's environment are never used or sent.
unset AWS_PROFILE AWS_SESSION_TOKEN
export AWS_ACCESS_KEY_ID="${FLOCI_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${FLOCI_SECRET_ACCESS_KEY:-test}"
export AWS_DEFAULT_REGION="$AWS_REGION"
export AWS_PAGER=""

MODE="deploy"
ASSUME_YES=0
TMP_PARAMS_FILE=""

# ---- Helpers --------------------------------------------------------------------------------
log() { printf '[deploy-cloudformation] %s\n' "$*" >&2; }
die() { printf '[deploy-cloudformation] ERROR: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: deploy-cloudformation.sh [options]

Create or update the areax-rag storage stack on Floci.

Options:
  -h, --help        Show this help and exit
  --validate-only   Only validate the template
  --outputs         Only print the stack outputs
  --delete          Delete the stack (asks for confirmation unless --yes)
  --yes             Skip the confirmation prompt for --delete

Environment variables (all optional):
  AWS_ENDPOINT_URL        Floci endpoint        (default: http://localhost:4566)
  AWS_REGION              Region                (default: us-east-1)
  STACK_NAME              Stack name            (default: areax-rag-storage)
  TEMPLATE_FILE           Template path         (default: ../cloudformation/storage.yml)
  PARAMETERS              Space-separated Key=Value template parameters, for example:
                          "VectorDimension=1536 DocumentsBucketName=areax-rag-documents"
                          Values must not contain spaces. On an update, a parameter you leave out
                          keeps the value it has in the stack (UsePreviousValue), so you only
                          pass what you want to change. To clear one, pass "Key=" with no value.
  ALLOW_REMOTE_ENDPOINT   Set to 1 to allow a non-local endpoint (default: 0)
  USE_DEPLOY              Set to 1 to use "aws cloudformation deploy" (unverified on Floci)
  FLOCI_ACCESS_KEY_ID     Dummy access key      (default: test)
  FLOCI_SECRET_ACCESS_KEY Dummy secret key      (default: test)

Prerequisite: the SSH tunnel to the VPS must be open so the endpoint is reachable, e.g.
  ssh -f -N <your-ssh-alias>

Exit codes: 0 success or nothing to change, 1 error.
EOF
}

cleanup() {
  if [[ -n "$TMP_PARAMS_FILE" && -f "$TMP_PARAMS_FILE" ]]; then
    rm -f "$TMP_PARAMS_FILE"
  fi
}
trap cleanup EXIT

cf() {
  aws --endpoint-url "$AWS_ENDPOINT_URL" --region "$AWS_REGION" cloudformation "$@"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

# Refuse to talk to anything that is not local unless explicitly allowed. This prevents
# deploying to a real AWS account by accident.
check_endpoint_is_local() {
  case "$AWS_ENDPOINT_URL" in
    http://localhost:* | http://127.0.0.1:* | https://localhost:* | https://127.0.0.1:*) ;;
    *)
      if [[ "$ALLOW_REMOTE_ENDPOINT" != "1" ]]; then
        die "Endpoint '$AWS_ENDPOINT_URL' is not local. Open the SSH tunnel and use localhost, or set ALLOW_REMOTE_ENDPOINT=1."
      fi
      ;;
  esac
}

check_endpoint_reachable() {
  if ! aws --endpoint-url "$AWS_ENDPOINT_URL" --region "$AWS_REGION" s3api list-buckets \
    >/dev/null 2>&1; then
    die "Cannot reach Floci at $AWS_ENDPOINT_URL. Is the SSH tunnel open? e.g. 'ssh -f -N <your-ssh-alias>'"
  fi
}

resolve_template() {
  [[ -f "$TEMPLATE_FILE" ]] || die "Template not found: $TEMPLATE_FILE"
  TEMPLATE_FILE="$(cd "$(dirname "$TEMPLATE_FILE")" && pwd)/$(basename "$TEMPLATE_FILE")"
}

json_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

# Split PARAMETERS into the global array PARAM_PAIRS (empty if PARAMETERS is empty).
PARAM_PAIRS=()
parse_parameters() {
  PARAM_PAIRS=()
  if [[ -n "$PARAMETERS" ]]; then
    IFS=' ' read -r -a PARAM_PAIRS <<<"$PARAMETERS"
  fi
  local pair
  for pair in ${PARAM_PAIRS[@]+"${PARAM_PAIRS[@]}"}; do
    [[ "$pair" == *=* ]] || die "Invalid PARAMETERS entry '$pair' (expected Key=Value)"
  done
}

# Parameters of the existing stack that this run does not override. They are sent with
# UsePreviousValue so an update does not silently reset them to the template defaults.
USE_PREVIOUS_KEYS=()
collect_previous_keys() {
  USE_PREVIOUS_KEYS=()
  local existing key pair overridden
  existing="$(cf describe-stacks --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Parameters[].ParameterKey' --output text 2>/dev/null || true)"
  [[ -n "$existing" && "$existing" != "None" ]] || return 0
  for key in $existing; do
    overridden=0
    for pair in ${PARAM_PAIRS[@]+"${PARAM_PAIRS[@]}"}; do
      [[ "${pair%%=*}" == "$key" ]] && overridden=1
    done
    [[ $overridden -eq 0 ]] && USE_PREVIOUS_KEYS+=("$key")
  done
  return 0
}

# Write a CloudFormation parameters JSON file from PARAM_PAIRS and USE_PREVIOUS_KEYS.
write_parameters_file() {
  local file="$1" first=1 pair key value
  printf '[' >"$file"
  for pair in ${PARAM_PAIRS[@]+"${PARAM_PAIRS[@]}"}; do
    key="${pair%%=*}"
    value="${pair#*=}"
    if [[ $first -eq 0 ]]; then printf ',' >>"$file"; fi
    first=0
    printf '{"ParameterKey":"%s","ParameterValue":"%s"}' \
      "$(json_escape "$key")" "$(json_escape "$value")" >>"$file"
  done
  for key in ${USE_PREVIOUS_KEYS[@]+"${USE_PREVIOUS_KEYS[@]}"}; do
    if [[ $first -eq 0 ]]; then printf ',' >>"$file"; fi
    first=0
    printf '{"ParameterKey":"%s","UsePreviousValue":true}' "$(json_escape "$key")" >>"$file"
  done
  printf ']' >>"$file"
}

stack_status() {
  cf describe-stacks --stack-name "$STACK_NAME" \
    --query 'Stacks[0].StackStatus' --output text 2>/dev/null || true
}

validate_template() {
  log "Validating template: $TEMPLATE_FILE"
  cf validate-template --template-body "file://${TEMPLATE_FILE}" >/dev/null \
    || die "Template validation failed."
}

print_outputs() {
  log "Outputs of stack '$STACK_NAME':"
  cf describe-stacks --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' --output text
}

deploy_with_deploy_command() {
  local -a overrides=()
  local pair
  for pair in ${PARAM_PAIRS[@]+"${PARAM_PAIRS[@]}"}; do
    overrides+=("$pair")
  done
  log "Using 'aws cloudformation deploy' (unverified on Floci)."
  if [[ ${#overrides[@]} -gt 0 ]]; then
    aws --endpoint-url "$AWS_ENDPOINT_URL" --region "$AWS_REGION" cloudformation deploy \
      --stack-name "$STACK_NAME" --template-file "$TEMPLATE_FILE" \
      --no-fail-on-empty-changeset --parameter-overrides "${overrides[@]}"
  else
    aws --endpoint-url "$AWS_ENDPOINT_URL" --region "$AWS_REGION" cloudformation deploy \
      --stack-name "$STACK_NAME" --template-file "$TEMPLATE_FILE" \
      --no-fail-on-empty-changeset
  fi
}

create_or_update_stack() {
  local status
  status="$(stack_status)"

  case "$status" in
    CREATE_COMPLETE | UPDATE_COMPLETE | UPDATE_ROLLBACK_COMPLETE) collect_previous_keys ;;
  esac

  local -a param_args=()
  if [[ ${#PARAM_PAIRS[@]} -gt 0 || ${#USE_PREVIOUS_KEYS[@]} -gt 0 ]]; then
    TMP_PARAMS_FILE="$(mktemp)"
    write_parameters_file "$TMP_PARAMS_FILE"
    param_args=(--parameters "file://${TMP_PARAMS_FILE}")
  fi

  case "$status" in
    "" | None)
      log "Stack '$STACK_NAME' does not exist. Creating..."
      cf create-stack --stack-name "$STACK_NAME" \
        --template-body "file://${TEMPLATE_FILE}" \
        ${param_args[@]+"${param_args[@]}"} >/dev/null
      cf wait stack-create-complete --stack-name "$STACK_NAME"
      log "Stack created."
      ;;
    CREATE_COMPLETE | UPDATE_COMPLETE | UPDATE_ROLLBACK_COMPLETE)
      log "Stack '$STACK_NAME' exists (status: $status). Updating..."
      local out rc
      set +e
      out="$(cf update-stack --stack-name "$STACK_NAME" \
        --template-body "file://${TEMPLATE_FILE}" \
        ${param_args[@]+"${param_args[@]}"} 2>&1)"
      rc=$?
      set -e
      if [[ $rc -ne 0 ]]; then
        if printf '%s' "$out" | grep -q "No updates are to be performed"; then
          log "No changes to apply."
          return 0
        fi
        die "update-stack failed: $out"
      fi
      cf wait stack-update-complete --stack-name "$STACK_NAME"
      log "Stack updated."
      ;;
    *)
      die "Stack '$STACK_NAME' is in status '$status' and cannot be updated. Fix or delete it first (use --delete)."
      ;;
  esac
}

delete_stack() {
  local status
  status="$(stack_status)"
  if [[ -z "$status" || "$status" == "None" ]]; then
    log "Stack '$STACK_NAME' does not exist. Nothing to delete."
    return 0
  fi
  if [[ $ASSUME_YES -ne 1 ]]; then
    [[ -t 0 ]] || die "Refusing to delete without --yes in a non-interactive shell."
    local answer
    printf 'Delete stack %s at %s? Retained resources (buckets, index) stay. Type "yes": ' \
      "$STACK_NAME" "$AWS_ENDPOINT_URL" >&2
    read -r answer
    [[ "$answer" == "yes" ]] || die "Aborted."
  fi
  cf delete-stack --stack-name "$STACK_NAME"
  cf wait stack-delete-complete --stack-name "$STACK_NAME"
  log "Stack deleted. Resources with DeletionPolicy Retain were kept."
}

# ---- Main -----------------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help) usage; exit 0 ;;
    --validate-only) MODE="validate" ;;
    --outputs) MODE="outputs" ;;
    --delete) MODE="delete" ;;
    --yes) ASSUME_YES=1 ;;
    *) usage >&2; die "Unknown option: $1" ;;
  esac
  shift
done

require_cmd aws
check_endpoint_is_local
parse_parameters
resolve_template
check_endpoint_reachable

log "Endpoint: $AWS_ENDPOINT_URL  Region: $AWS_REGION  Stack: $STACK_NAME"

case "$MODE" in
  validate)
    validate_template
    log "Template is valid."
    ;;
  outputs)
    print_outputs
    ;;
  delete)
    delete_stack
    ;;
  deploy)
    validate_template
    if [[ "$USE_DEPLOY" == "1" ]]; then
      deploy_with_deploy_command
    else
      create_or_update_stack
    fi
    print_outputs
    ;;
esac
