# areax-rag-infra

Infrastructure for **areax-rag**: Postgres, Kafka and Floci (virtual AWS) on the VPS, the CloudFormation stack that creates the virtual AWS resources, and helper scripts.

In this phase infrastructure is **run by hand**. There is no CI/CD for this folder, and changing it does not redeploy the application or the services.

## What is in this folder

| Path | Purpose |
|---|---|
| `compose/postgres.compose.yml` | Postgres 16; creates an application role and database on first start |
| `compose/kafka.compose.yml` | Kafka (single broker, KRaft) with an internal and an external listener |
| `compose/floci.compose.yml` | Floci with persistent storage |
| `compose/.env.example` | Placeholders for passwords, limits and versions (copy to `compose/.env`) |
| `compose/postgres/initdb/` | First-start SQL/shell for Postgres |
| `compose/kafka/topics.txt` | Topics to create (provisional names) |
| `cloudformation/storage.yml` | Documents bucket, vector bucket and shared chunk index |
| `scripts/infra.sh` | Start, stop and inspect the containers (run on the VPS) |
| `scripts/init-kafka-topics.sh` | Create the Kafka topics (run on the VPS) |
| `scripts/tunnel.sh` | Open, close or check the SSH tunnel (run on your machine) |
| `scripts/deploy-cloudformation.sh` | Create or update the storage stack on Floci (run on your machine) |
| `docs/` | First-time setup, ports and tunnels, CloudFormation details, known risks |
| `CODING_STANDARD.md` | Rules for scripts, templates and compose files |

## Prerequisites

- On the VPS: Docker with the Compose plugin.
- On your machine: AWS CLI v2 (used only to talk to Floci, never to real AWS) and an SSH alias for the VPS in your own `~/.ssh/config`.

## Quick start

Full steps with explanations: [`docs/first-time-setup.md`](docs/first-time-setup.md).

On the VPS:

```bash
cp compose/.env.example compose/.env      # fill in the passwords, then chmod 600
./scripts/infra.sh up all                 # postgres, kafka, floci
./scripts/init-kafka-topics.sh
```

On your machine:

```bash
SSH_ALIAS=<your-ssh-alias> ./scripts/tunnel.sh open
./scripts/deploy-cloudformation.sh
```

Every script supports `--help`.

## Important behavior

- Every published port binds to `127.0.0.1`. Nothing is reachable from the internet; you use the SSH tunnel.
- `infra.sh down` **never deletes volumes**. There is no backup in this phase; deleting a volume loses that data for good.
- `deploy-cloudformation.sh` only talks to a local endpoint (`localhost` / `127.0.0.1`) unless you set `ALLOW_REMOTE_ENDPOINT=1`, and always uses dummy credentials, so real AWS credentials in your shell are never used.
- The buckets and the index have `DeletionPolicy: Retain`. Deleting the CloudFormation stack does **not** delete user data.
- **Pass the same `PARAMETERS` on every CloudFormation run.** Parameters you leave out fall back to their defaults on update. See [`docs/cloudformation.md`](docs/cloudformation.md).
- The vector index dimension and metric cannot change after creation.

## Safety rules (public repository)

- Never commit `compose/.env`, the VPS address, SSH user names, API keys or passwords.
- Keep your real SSH config out of the repository; use placeholders in documents.

## Status

All scripts and compose files were validated with stub tools and `docker compose config`, **not against the real VPS or Floci**. The checklist of what is still untested is in [`docs/known-risks.md`](docs/known-risks.md).

## Docs

- [`docs/first-time-setup.md`](docs/first-time-setup.md)
- [`docs/ports-and-tunnels.md`](docs/ports-and-tunnels.md)
- [`docs/cloudformation.md`](docs/cloudformation.md)
- [`docs/known-risks.md`](docs/known-risks.md)
- Requirements: [`../areax-rag-requirement/en/06-deployment.md`](../areax-rag-requirement/en/06-deployment.md)
