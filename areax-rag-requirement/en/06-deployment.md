# 06 - Deployment

> Labels: **Decided** / **Proposed**. Do not write the VPS IP, the SSH user name or secrets in documents (the repo is public).

## 1. Environments (Decided)

- Only **local (dev)** and **VPS (prod)**. There is no staging.
- VPS: about 4GB RAM, 2 cores. The personal machine has an SSH alias `floci`.

## 2. This phase: infrastructure on the VPS (Decided)

- The VPS runs **Postgres, Kafka and Floci**. The user **runs them by hand** (Docker Compose); there is **no CI/CD for infrastructure**.
- The virtual AWS resources (S3 bucket, vector bucket, index) are created with **CloudFormation**; templates live in `areax-rag-infra/`.
- A **bash script to deploy CloudFormation** is needed (in `areax-rag-infra/`): it runs from the personal machine through the tunnel (`--endpoint-url http://localhost:4566`), is **safe to run repeatedly** (create or update), and contains no secrets or real IPs.
- The application and Python services run on the personal machine and reach the VPS through the tunnel.
- `areax-rag-infra/` has a `README.md` and `docs/` with repeatable instructions, plus **compose files for Postgres, Kafka and Floci** (`compose/`) and the scripts `infra.sh`, `init-kafka-topics.sh`, `tunnel.sh` and `deploy-cloudformation.sh`. Postgres creates the application role and database on first start; Kafka topics are created from `compose/kafka/topics.txt` (topic names are provisional). (Direction decided; **not yet tested on the real VPS**, the to-test list is in `areax-rag-infra/docs/known-risks.md`)
- Changes in `areax-rag-infra/` **do not trigger a redeploy** of the application or services. (Decided)

## 3. Network and ports (Decided)

Every port on the VPS binds only to `127.0.0.1` and is **not exposed to the internet**. Access is through SSH tunnels (`-L`).

| Service | Port on the VPS | Tunnel port on the personal machine |
|---|---|---|
| Postgres | 5432 | 5432 (or 5433 if the machine already runs Postgres) |
| Kafka (EXTERNAL listener) | 9094 | 9094 |
| Floci | 4566 | 4566 |

- **Kafka uses two listeners** (one broker): `INTERNAL` (for example `kafka:9092`) for containers on the VPS; `EXTERNAL` (9094) with `advertised.listeners=localhost:9094`, published only on `127.0.0.1:9094`. Clients on the personal machine use bootstrap `localhost:9094`. This only works with a single broker. (Proposed, **not yet tested**)
- The SSH config should set `ServerAliveInterval` and `ServerAliveCountMax`; consider `autossh` for automatic reconnection. (Proposed)
- Floci runs with `FLOCI_STORAGE_MODE=hybrid`, with data in its own volume. Re-check whether mounting `/var/run/docker.sock` is needed.

## 4. CI/CD (application workflow written; others postponed)

The **application** workflow is written (`.github/workflows/application-deploy.yml`, documented in `areax-rag-application/docs/deployment.md`) but has **not run yet**. The service, mcp and infra have none. Direction (general direction decided, details proposed):

- Work happens on `develop`; merging into `deployment/prod` deploys. **No quality gate.** (Decided)
- **One workflow per component** (application, service, mcp, infra) with `on.push.paths`, plus `workflow_dispatch` for manual runs. (Decided: run separately per folder)
- Registry is **Docker Hub**, using **one repo** with tags per component (the application uses `application-<sha>`, the services will use `service-<sha>`). The free plan's private repo policy is unverified. (Registry decided; repo usage proposed)
- **Build on the GitHub runner**, not on the VPS. Tag by git SHA. (Proposed)
- Deploy over **SSH**: `docker compose pull && docker compose up -d`. No self-hosted runner on the VPS. (Proposed)
- On the VPS, run `docker login` once with a read-only token; the runner uses a separate write token stored in GitHub Secrets. The repo is public, so the VPS can clone over HTTPS without credentials. (Proposed)
- A `concurrency` group, a health check after deploy, migrations before the new version starts, and rollback by redeploying an older SHA tag. (Proposed)
- Restrict who may merge into `deployment/prod`. (Proposed)

## 5. Domain and HTTPS (postponed)

There is no domain yet; one will be bought later. Then add a reverse proxy (Caddy/Nginx) and a certificate for the UI and SSE. Until then it runs over HTTP (the risk is recorded in `02-non-functional-requirements.md`).

## 6. Public repo

- Never commit API keys, passwords, SSH keys, `.env` files or the VPS IP. Review `.gitignore` before the first commit.
- Configuration in `areax-rag-infra/` contains no real IPs or secrets; sensitive values live only in GitHub Secrets or in `.env` on the VPS.
- `git init` / push has not been done; it happens when the user asks.

## 7. To test in practice

1. Kafka with two listeners through an SSH tunnel from the personal machine.
2. `aws cloudformation deploy` on Floci with `AWS::S3::Bucket` and `AWS::S3Vectors::Index`.
3. Floci's real RAM use in `hybrid` mode; the VPS's free disk and RAM (`df -h /`, `free -m`, `docker stats`).
4. `youtube-transcript-api` when run on the VPS (the IP may be blocked).
