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
| Parameters reset on stack update | Index replacement attempt | Always pass the same `PARAMETERS` |

## To test

| # | Item | Status | Result |
|---|---|---|---|
| 1 | Kafka with two listeners through the SSH tunnel | Not tested | |
| 2 | `deploy-cloudformation.sh` against a real Floci (create, update, no change) | Not tested | |
| 3 | S3 Vectors property names and metadata configuration accepted by Floci | Not tested | |
| 4 | CORS and public access block properties on the S3 bucket accepted by Floci | Not tested | |
| 5 | `aws cloudformation deploy` (`USE_DEPLOY=1`) on Floci | Not tested | |
| 6 | Floci RAM use in `hybrid` mode; VPS free disk and RAM (`df -h /`, `free -m`, `docker stats`) | Not measured | |
| 7 | Whether Floci needs the `/var/run/docker.sock` mount | Not checked | |
| 8 | Presigned PUT upload from the browser to Floci through the tunnel (CORS) | Not tested | |
| 9 | The three compose files start on the VPS and pass their health checks | Not tested (only `docker compose config` was run) | |
| 10 | Postgres first-start script creates the role and database (no `psql` was available to run it here) | Not tested | |
| 11 | `apache/kafka:4.3.2` accepts the environment variables in `kafka.compose.yml`; the data volume is writable; the health check works | Not tested | |
| 12 | `init-kafka-topics.sh` against a real Kafka | Not tested (stub `docker` only) | |
| 13 | Floci 2.4.0 starts without the Docker socket and with unsupported CloudFormation types set to fail; whether the `-baseline` or `-compat` image variants are needed for the VPS CPU | Not tested | |
| 14 | Switching from the old Floci compose file (container name, volume reuse through `FLOCI_VOLUME`) | Not tested | |
| 15 | `tunnel.sh` against the real VPS (open, status, close; port skipping) | Not tested (stub `ssh` and `nc` only) | |

Update the status and result columns as you test, and keep the requirement documents in `../../areax-rag-requirement/` in sync.
