# Known risks and items to test

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| No backup in this phase | VPS failure loses all data | Accepted for now; treat data as disposable |
| Floci `hybrid` mode writes asynchronously | The latest changes can be lost after a sudden stop | Consider `persistent` if loss becomes a problem |
| Floci default image uses `memory` storage | Everything is lost on restart | Always set `FLOCI_STORAGE_MODE` |
| Floci is an emulator, not AWS | Behavior can differ from real S3 / S3 Vectors | Test every template and API call against Floci |
| `/var/run/docker.sock` mounted into Floci | Very high privileges on the host | Remove it if Floci does not need it |
| 4GB RAM / 2 cores shared by Postgres, Kafka, Floci | Out-of-memory kills | Memory limit per container; small Kafka heap |
| Tunnel drops | Application and services on your machine lose connections | `ServerAliveInterval`, `autossh`, reconnect logic in clients |
| No domain, so no HTTPS | The login page runs over HTTP | Buy a domain later and add a reverse proxy |
| Public repository | Leaked secrets or IPs are public | Never commit them; review `.gitignore` before the first commit |
| Parameters reset on stack update | Index replacement attempt | The script keeps previous values for parameters you omit (`UsePreviousValue`), tested on Floci |
| A stack deployed with names that equal another stack's resources | Floci applies the new stack's settings (for example CORS) onto the existing bucket before failing, leaving it changed | Never point a test stack at the real bucket or vector names; always pass different names |

## To test

| # | Item | Status | Result |
|---|---|---|---|
| 1 | Kafka with two listeners through the SSH tunnel | Tested | 2026-11-10: the application's Kafka producer and consumer, running on a Mac, connected through the SSH tunnel to `localhost:9094`, published to `areax.document.events` and `areax.chat.requests`, and consumed `areax.chat.tokens` |
| 2 | `deploy-cloudformation.sh` against a real Floci (create, update, no change) | Partly tested | Create works and the stack reached `CREATE_COMPLETE` after the template fix (2026-11-10). Update and no-change runs not tested yet |
| 3 | S3 Vectors property names and metadata configuration accepted by Floci | Tested | Vector bucket and index created. `get-index` shows dimension 1536, cosine, and `nonFilterableMetadataKeys: [text]`. A `CommaDelimitedList` parameter failed (list passed as a string), so the key is written inline |
| 4 | CORS and public access block properties on the S3 bucket accepted by Floci | Tested | The bucket was created with the public access block and a CORS rule that includes `AllowedOrigins: [http://localhost:3000]`. A list parameter silently dropped the origins, so the origin is a single string parameter. Browser upload (item 8) still not tested |
| 5 | `aws cloudformation deploy` (`USE_DEPLOY=1`) on Floci | Not tested | |
| 6 | Floci RAM use in `hybrid` mode; VPS free disk and RAM (`df -h /`, `free -m`, `docker stats`) | Not measured | |
| 7 | Whether Floci needs the `/var/run/docker.sock` mount | Not checked | |
| 8 | Presigned PUT upload from the browser to Floci through the tunnel (CORS) | Tested for localhost | 2026-11-10: Chrome uploaded a file straight to Floci with a presigned URL through the tunnel from origin `http://localhost:3000`, with no CORS error. Other origins (the deployed application) are not tested |
| 9 | The three compose files start on the VPS and pass their health checks | Not tested (only `docker compose config` was run) | |
| 10 | `postgres.compose.yml` starts with `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD` from `compose/.env`, healthy, reachable only through the tunnel | Tested | Postgres started healthy with `POSTGRES_USER`/`POSTGRES_PASSWORD` from `compose/.env`, listens on `127.0.0.1` only (checked from outside), and the application migrated and used it through the tunnel |
| 11 | `apache/kafka:4.3.2` accepts the environment variables in `kafka.compose.yml`; the data volume is writable; the health check works | Not tested | |
| 12 | `init-kafka-topics.sh` against a real Kafka | Tested | Created the four topics on the real Kafka |
| 13 | Floci 2.4.0 starts without the Docker socket and with unsupported CloudFormation types set to fail; whether the `-baseline` or `-compat` image variants are needed for the VPS CPU | Not tested | |
| 14 | `floci.compose.yml` still matches the running Floci instance (container `floci`, volume name, image version); recreating it from the file keeps the data | Not tested | |
| 15 | `tunnel.sh` against the real VPS (open, status, close; port skipping) | Tested | `tunnel.sh open` with an alias that has no forwards of its own; Postgres, Kafka and Floci answered through it |

Update the status and result columns as you test, and keep the requirement documents in `../../areax-rag-requirement/` in sync.
