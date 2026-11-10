# First-time setup

Order of work to bring the infrastructure up. Steps 1 to 5 run **on the VPS**, steps 6 to 8 on **your machine**.

> Nothing here has been run against the real VPS yet. The scripts were checked with stub tools only; see [`known-risks.md`](known-risks.md) for what is still untested.

## What gets initialized

| Piece | What is initialized | By what | When |
|---|---|---|---|
| Postgres | The user, password and database from `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (default `postgres` / `postgres`). Application databases are created later by hand, see [`postgres.md`](postgres.md) | The `postgres` image, from `compose/.env` | Once, when the data volume is empty |
| Postgres | Tables | The application (`prisma migrate`) | When the application is set up, not here |
| Kafka | Topics from `compose/kafka/topics.txt` (provisional names) | `scripts/init-kafka-topics.sh` | After Kafka is up; safe to repeat |
| Floci | Documents bucket, vector bucket, chunk index | `scripts/deploy-cloudformation.sh` | After Floci is up; safe to repeat |

## On the VPS

1. **Get the repo** (it is public, so HTTPS needs no credentials):

   ```bash
   git clone https://github.com/khanglenguyen192/areax-rag.git
   cd areax-rag/areax-rag-infra
   ```

2. **Create the env file** and fill in the passwords:

   ```bash
   cp compose/.env.example compose/.env
   chmod 600 compose/.env
   # edit compose/.env: POSTGRES_PASSWORD is required (use a long random one)
   ```

   `compose/.env` is never committed.

3. **Floci already runs on the VPS.** `compose/floci.compose.yml` mirrors that instance (container `floci`), so do not start it again: skip `up floci`. Only recreate Floci if you want the stricter CloudFormation setting or a pinned version; then follow the header of that file (remove the old container, keep its volume, set `FLOCI_VOLUME`).

4. **Start the services**:

   ```bash
   ./scripts/infra.sh up postgres
   ./scripts/infra.sh up kafka
   ./scripts/infra.sh ps all        # or: ps postgres | kafka | floci
   ```

   `up all` starts the three in that order. `down` never deletes volumes.

5. **Create the Kafka topics**:

   ```bash
   ./scripts/init-kafka-topics.sh
   ```

## On your machine

6. **Open the tunnel** (uses an alias from your own `~/.ssh/config`):

   ```bash
   SSH_ALIAS=<your-ssh-alias> ./scripts/tunnel.sh open
   SSH_ALIAS=<your-ssh-alias> ./scripts/tunnel.sh status
   ```

   Postgres is forwarded to `localhost:5432` (set `LOCAL_POSTGRES_PORT=5433` if you run Postgres locally), Kafka to `localhost:9094`, Floci to `localhost:4566`. Ports already in use are skipped with a warning.

7. **Deploy the storage stack** to Floci:

   ```bash
   ./scripts/deploy-cloudformation.sh
   ```

8. **Verify**:

   ```bash
   aws --endpoint-url http://localhost:4566 s3 ls          # the documents bucket exists
   ./scripts/deploy-cloudformation.sh --outputs            # stack outputs
   nc -z localhost 5432 && nc -z localhost 9094 && echo "tunnel ports answer"
   ```

   Then connect a Postgres client with `POSTGRES_USER` and `POSTGRES_PASSWORD` from `compose/.env`, and a Kafka client to `localhost:9094` (list topics, produce and consume one message). Record the results in [`known-risks.md`](known-risks.md).

## Day-to-day

| Task | Command |
|---|---|
| See status | `./scripts/infra.sh ps all` (on the VPS) |
| Follow logs | `./scripts/infra.sh logs kafka` |
| Restart one service | `./scripts/infra.sh restart postgres` |
| Add a Kafka topic | Add a line to `compose/kafka/topics.txt`, run `./scripts/init-kafka-topics.sh` |
| Close the tunnel | `SSH_ALIAS=<alias> ./scripts/tunnel.sh close` |

## Resource budget (4GB VPS)

Default memory limits: Postgres 512m, Kafka 768m (heap 512m), Floci 1g. That is about 2.3GB, leaving room for the operating system. Adjust in `compose/.env` after measuring real use with `docker stats`.

## Warning

There is no backup. Removing a volume (`docker volume rm areax-rag-postgres-data`, `areax-rag-kafka-data` or the Floci volume) deletes that service's data permanently.
