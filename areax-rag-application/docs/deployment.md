# Deployment

How the application reaches the VPS. Everything here is written but **has not run yet**: the workflow has never executed, and the Docker image has not been built (no Docker daemon was available when it was written). Expect to fix small things on the first run.

## Overview

Diagram: [`diagrams/deployment-pipeline.drawio`](diagrams/deployment-pipeline.drawio) (open it in draw.io).

```
push to deployment/prod
   |
   v
GitHub Actions: .github/workflows/application-deploy.yml
   |  1. build   docker build areax-rag-application  ->  push to Docker Hub
   |  2. deploy  scp compose.yml + deploy.sh to the VPS, run deploy.sh over SSH
   v
VPS: docker compose pull && up -d  ->  health check  ->  roll back if unhealthy
```

- **Trigger:** a push to `deployment/prod` that touches `areax-rag-application/**` or the workflow file, or a manual run (`workflow_dispatch`). Pushes to `develop` deploy nothing.
- **Image:** one Docker Hub repository for the whole project, one tag family per component. The application uses `application-<7-char commit sha>` and `application-latest`. The Python services will use `service-...` later. This fits the free plan's single private repository.
- **No quality gate.** This was a decision (see `areax-rag-requirement`). `npm run build` inside the Docker build still fails on type errors, but lint is not run.
- **Infrastructure is not redeployed** by this pipeline. Postgres, Kafka and Floci are started by hand (`areax-rag-infra`).
- **One deploy at a time.** A second push waits for the first (`concurrency` group).

## Files

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage build (deps, build, runtime). Uses Next.js `output: "standalone"`, runs as the non-root `node` user, listens on port 3000 |
| `.dockerignore` | Keeps `node_modules`, `.next`, `.env*` and `deploy/` out of the build context |
| `deploy/compose.yml` | The service definition on the VPS. Uses host networking (reason below) |
| `deploy/deploy.sh` | Pulls the image, starts it, waits for `/login` to return 200, rolls back on failure |
| `../.github/workflows/application-deploy.yml` | The pipeline |

**Why host networking:** Postgres, Kafka and Floci publish their ports on `127.0.0.1` only. A container on a bridge network cannot reach them, so the application container shares the host network. The application therefore listens on the VPS port `3000` directly.

## One-time setup

### 1. Docker Hub

1. Create a repository, for example `areax-rag`. It may be **public** (the source code is already public and the image holds no secrets; the VPS then pulls without logging in) or private. Never put a secret in the image: pass secrets at run time through `application.env`, not through build arguments.
2. Create an access token (Account settings, Security) with *Read & Write* scope. Use it as `DOCKERHUB_TOKEN`; never use your password.
3. If the repository is private, check the current free-plan limits first (an open item in `areax-rag-requirement/en/99-open-questions.md`).

### 2. The VPS

1. Docker Engine with the Compose plugin is installed, and infra is running (`areax-rag-infra/docs/first-time-setup.md`).
2. **Only for a private repository:** log in to Docker Hub on the VPS once with a *read-only* token, so it can pull the image: `docker login -u <user>`. The credentials stay in the deploy user's `~/.docker/config.json`; the pipeline never sends them.
3. A dedicated deploy user in the `docker` group, with a key pair used only for this pipeline. Add the public key to its `~/.ssh/authorized_keys`.
4. Allow the application port in the VPS firewall (`3000/tcp`). Nothing else is opened. There is no domain or HTTPS yet, so traffic is plain HTTP.
5. Provide the runtime environment file, either by creating it by hand (below) or by setting the `APPLICATION_ENV` secret (see the GitHub section), which the pipeline writes to the same path on every deploy.

   To create it by hand: Its content follows [`environment-variables.md`](environment-variables.md); the values for Postgres, Kafka and Floci are the same ones the infra compose files use:

   ```bash
   mkdir -p ~/areax-rag/application
   $EDITOR ~/areax-rag/application/application.env
   chmod 600 ~/areax-rag/application/application.env
   ```

   Use `localhost` for `DATABASE_URL`, `KAFKA_BOOTSTRAP_SERVERS` (port `9094`) and `AWS_ENDPOINT_URL`, because the container is on the host network. This file lives only on the VPS; it is never in git or in GitHub.

### 3. GitHub

Create an **Environment** named `prod` (Settings, Environments). The deploy job uses it, so a secret stored in that environment (such as `APPLICATION_ENV`) is visible only to the deploy job. Optionally add *required reviewers* to approve each deploy.

Repository **secrets** (Settings, Secrets and variables, Actions):

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub account name |
| `DOCKERHUB_TOKEN` | The read/write token from step 1 |
| `VPS_HOST` | VPS address |
| `VPS_USER` | The deploy user |
| `VPS_SSH_KEY` | The **private** key of the deploy key pair (whole file) |
| `VPS_KNOWN_HOSTS` | Output of `ssh-keyscan -p <port> <host>`, checked against the VPS's real host key before saving. This pins the server so the pipeline cannot be pointed at an impostor |
| `VPS_PORT` | Optional; defaults to `22` |

Optional secret `APPLICATION_ENV`: the whole content of `application.env`, one `KEY=value` per line. When set, each deploy overwrites the file on the VPS (mode 600); when empty, the file on the VPS is kept. The values pass through GitHub, so use it only if you accept that.

`DOCKERHUB_REPOSITORY` may be a repository **variable** or a secret; the workflow accepts either. Example value: `areax-rag`.

The repository is public. Secrets are not exposed to pull requests from forks, and the workflow runs only on pushes to `deployment/prod`. Protect that branch (Settings, Branches) so only you can push or merge to it.

## Deploying

```bash
git checkout deployment/prod        # create it from develop the first time
git merge --ff-only develop
git push origin deployment/prod
```

Watch the run in the Actions tab. On success the VPS runs `application-<sha>` and `deploy/.current-image` holds that reference.

## What `deploy.sh` does

1. Reads the previously deployed image from `deploy/.current-image`.
2. Pulls the new image and runs `docker compose up -d`.
3. Waits up to 60 seconds for `http://127.0.0.1:3000/login` to answer 200 (`HEALTH_TIMEOUT_S` and `HEALTH_URL` can be overridden).
4. **Healthy:** records the new image and prunes dangling images.
5. **Unhealthy:** prints the last 50 log lines, starts the previous image again, and exits with an error so the run is red.

The first deploy has no previous image, so a failure leaves the new container running; check `docker compose logs`.

## Rolling back by hand

On the VPS:

```bash
cd ~/areax-rag/application
./deploy.sh <dockerhub-user>/areax-rag:application-<older-sha>
```

Older tags stay on Docker Hub. Delete tags you no longer need to stay under the free plan's limits.

## Known limits and risks

- **The server does not exist yet.** The image is built with `NEXT_PUBLIC_USE_MOCK_API=false`, so the UI calls `/api/**` routes that are not implemented. A deployed build shows the login page, but sign-in fails until the route handlers exist. To deploy the mock UI for a demo, add `--build-arg NEXT_PUBLIC_USE_MOCK_API=true` to the build step; do not leave that on in production.
- The health check only proves that Next.js serves `/login`. It does not check Postgres, Kafka or Floci. Add an `/api/health` route when the server exists.
- Only the application is deployed. The Python services get their own workflow and image tags when they have code.
- The first run will probably expose details that were not testable offline: Docker Hub login on the VPS, SSH key format, firewall, file permissions.
- The Actions are referenced by major version (`@v4`, `@v3`, `@v6`). Pin them to commit SHAs if you want protection against a compromised tag.
- With `network_mode: host`, port `3000` must be free on the VPS.
