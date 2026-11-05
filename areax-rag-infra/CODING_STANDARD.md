# Coding Standard - areax-rag-infra

> Applies to everything in `areax-rag-infra/`: bash scripts, CloudFormation templates, Docker Compose files and their configuration.
> Items marked **(provisional)** are not final yet; see `areax-rag-requirement/en/99-open-questions.md`.
> Written in English.

---

## 0. Principles

1. **Repeatable.** Every script and template can be run again safely (idempotent): create if missing, update if present.
2. **No secrets, no real IPs.** This repo is public. Secrets come from environment variables or files that are gitignored.
3. **Nothing is exposed to the internet.** Every published port binds to `127.0.0.1`; people reach services through SSH tunnels.
4. **Run by hand, document everything.** In this phase infrastructure is run manually, so the instructions must be exact.
5. **Small VPS.** Every container has a memory limit; assume about 4GB RAM and 2 cores shared by all services.

## 1. Directory structure (proposed)

```
areax-rag-infra/
  README.md
  CODING_STANDARD.md
  docs/                     # runbooks, ports, tunnels, troubleshooting
  compose/
    postgres.compose.yml
    kafka.compose.yml
    floci.compose.yml
    .env.example            # placeholders only; the real compose/.env is never committed
    postgres/initdb/        # first-start scripts for Postgres
    kafka/topics.txt        # topics to create
  cloudformation/
    storage.yml             # S3 bucket, S3 vector bucket and index
  scripts/
    infra.sh                # start/stop/inspect containers (runs on the VPS)
    init-kafka-topics.sh    # create Kafka topics (runs on the VPS)
    tunnel.sh               # open/close/check the SSH tunnel (runs on your machine)
    deploy-cloudformation.sh
```

SSH config examples use placeholders and live inside `docs/` (never a real `~/.ssh/config`).

## 2. Bash scripts

Every script starts with:

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
```

Rules:
- Pass `shellcheck` with no warnings.
- Provide `-h` / `--help` with usage and the list of environment variables.
- Read configuration from **environment variables with defaults**; never hard-code IPs, account IDs or credentials.
- Quote all variable expansions: `"$var"`.
- Check prerequisites first (`command -v aws`, tunnel reachable) and fail with a clear message.
- Log steps to stderr with a prefix; print machine-readable results to stdout only when needed.
- Exit with non-zero status on any failure; use `trap` for cleanup.
- Functions are `snake_case`; constants and environment variables are `UPPER_SNAKE_CASE`.
- Scripts must be safe to run twice and must **not delete data** unless a clearly named flag (for example `--delete`) is given and confirmed.

### `deploy-cloudformation.sh` requirements

- Runs from the personal machine through the SSH tunnel to Floci.
- Inputs (environment variables): `AWS_ENDPOINT_URL` (default `http://localhost:4566`), `AWS_REGION` (default `us-east-1`), `STACK_NAME`, `TEMPLATE_FILE`, optional `PARAMETERS`.
- Uses dummy credentials for Floci via environment variables (for example `AWS_ACCESS_KEY_ID=test`), never real AWS credentials.
- Behavior: validate the template, then create the stack or update it, wait for completion, print the stack outputs. If there are no changes, exit 0 with a clear message.
- Uses `aws cloudformation deploy` **if it works against Floci** **(unverified; fall back to `create-stack` / `update-stack` / `wait`)**.
- Verifies the tunnel first (for example a quick call to the endpoint) and explains how to open it if it is closed.

## 3. CloudFormation templates

- YAML, one logical concern per template (`storage.yml`).
- Always include `AWSTemplateFormatVersion` and a `Description`.
- Use `Parameters` (with `Description`, `Default`, constraints) instead of literals: bucket names, vector dimension, distance metric.
- Name resources with a stable prefix (`areax-rag-`) and PascalCase logical IDs.
- Add `Outputs` for every value other components need (bucket names, index name); export names are prefixed.
- Set `DeletionPolicy: Retain` on resources that hold user data (document bucket, vector bucket) so a stack deletion cannot erase data by accident.
- Vector index: dimension **1536**, distance metric **cosine** (matches `text-embedding-3-small`); document the dimension next to the embedding model so they change together.
- No account IDs, ARNs with real accounts, IPs or secrets in templates.
- **Floci caveat:** unsupported resource types are skipped silently (only a WARN). Run Floci with `FLOCI_SERVICES_CLOUDFORMATION_ALLOW_STUB_UNSUPPORTED_RESOURCE_TYPES=false` so a bad template fails loudly. Test every template against Floci before documenting it as working.
- Keep templates small and readable; comment any non-obvious property.

## 4. Docker Compose

- Compose file format without a deprecated `version:` key; use the current Compose specification.
- **Pin image tags** (for example `postgres:16`, a specific Kafka tag); do **not** use `latest`. Record the chosen versions in `docs/`.
- **Ports:** always publish as `127.0.0.1:HOST:CONTAINER`. Never `0.0.0.0` and never a bare `5432:5432` (Docker bypasses `ufw` for published ports).
- **Memory:** set `mem_limit` (or `deploy.resources.limits.memory`) for every service. Kafka JVM heap and Floci memory are limited explicitly (Kafka heap through `KAFKA_HEAP_OPTS`).
- `restart: unless-stopped` for long-running services.
- Add `healthcheck` for Postgres, Kafka and Floci.
- Persist data in **named volumes**; document where each volume lives and what is lost if it is deleted (there is no backup in this phase).
- Configuration through `env_file` and `environment`; commit only `.env.example` with placeholders. Real `.env` files are gitignored.
- **Postgres:** a database for the application and a dedicated role; no default superuser password; credentials from environment.
- **Kafka (single node, KRaft):** two listeners.
  - `INTERNAL` (for example `kafka:9092`) for containers on the VPS.
  - `EXTERNAL` (port 9094) with `advertised.listeners` set to `localhost:9094`, published only on `127.0.0.1:9094`, for clients on the personal machine through the tunnel.
  - Works only with a single broker. Test the connection from the personal machine before relying on it **(not yet tested)**.
- **Floci:** set `FLOCI_STORAGE_MODE` explicitly (the default image is `memory`, which loses everything on restart); store data in a named volume. Re-evaluate the `/var/run/docker.sock` mount and remove it if Floci does not need it for the services we use.

## 5. Networking and SSH

- Fixed ports on the VPS (all bound to `127.0.0.1`):

| Service | VPS port | Tunnel port on the personal machine |
|---|---|---|
| Postgres | 5432 | 5432 (or 5433 if already used) |
| Kafka (EXTERNAL) | 9094 | 9094 |
| Floci | 4566 | 4566 |

- SSH access uses keys; password login is disabled on the VPS.
- Tunnels use `-N -L ...` with `ServerAliveInterval` and `ServerAliveCountMax`; `autossh` is allowed for automatic reconnection.
- Do not commit the VPS IP, user names or a real `~/.ssh/config`. Provide `ssh/config.example` with placeholders such as `<VPS_HOST>` and `<SSH_USER>`.

## 6. Naming

| Element | Convention | Example |
|---|---|---|
| Script files | kebab-case `.sh` | `deploy-cloudformation.sh` |
| Compose files | `<service>.compose.yml` | `kafka.compose.yml` |
| CloudFormation files | kebab-case `.yml` | `storage.yml` |
| Resource names | prefix `areax-rag-` | `areax-rag-documents` |
| Compose services | lowercase | `postgres`, `kafka`, `floci` |
| Environment variables | UPPER_SNAKE_CASE | `AWS_ENDPOINT_URL` |

## 7. Documentation duties

- `README.md`: what is in this folder, prerequisites (Docker, AWS CLI, SSH alias), the exact order to start things, how to open tunnels, how to deploy the CloudFormation stack, how to stop everything.
- `docs/` (English): ports and tunnel table, versions in use, data volume locations, known risks (no backup, `hybrid` storage, HTTP only), troubleshooting (for example Kafka listener problems), results of the "to test" items.
- Any change to ports, listeners, images or volumes updates the docs **in the same change**.

## 8. Git and commits

- Default branch `develop`. Commit messages in English, imperative, with a type prefix: `feat:` `fix:` `refactor:` `docs:` `chore:`.
- Changes in this folder do **not** trigger application or service redeploys.

## 9. Pre-merge checklist

- [ ] `shellcheck` clean; scripts re-runnable.
- [ ] No secrets, real IPs, account IDs or `.env` files committed.
- [ ] All published ports bind to `127.0.0.1`.
- [ ] Every compose service has a memory limit and a pinned image tag.
- [ ] CloudFormation template tested against Floci with stub-unsupported disabled.
- [ ] Docs and README updated.
