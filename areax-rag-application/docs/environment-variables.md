# Environment variables

> **Provisional.** Names only. Values live in `.env` (gitignored) or the host environment. Commit `.env.example` with placeholders, never real values. All variables are read in one validated module (`src/server/config/env.ts`) and the app fails fast when a required one is missing.

| Variable | Required | Example (placeholder) | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://<user>:<password>@localhost:5432/<db>` | Postgres through the tunnel |
| `AUTH_SECRET` | Yes | *(random string)* | Auth.js secret |
| `BCRYPT_COST` | No (12) | `12` | bcrypt cost factor |
| `KAFKA_BOOTSTRAP_SERVERS` | Yes | `localhost:9094` | Kafka through the tunnel |
| `AWS_ENDPOINT_URL` | Yes | `http://localhost:4566` | Floci endpoint |
| `AWS_REGION` | No | `us-east-1` | Region |
| `AWS_ACCESS_KEY_ID` | Yes | `test` | Dummy credential for Floci |
| `AWS_SECRET_ACCESS_KEY` | Yes | `test` | Dummy credential for Floci |
| `S3_BUCKET` | Yes | `areax-rag-documents` | Documents bucket (stack output) |
| `PROJECT_MAX_TOTAL_BYTES` | No (104857600) | `104857600` | Total size limit per project (100MB) |
| `FILE_MAX_BYTES` | No (52428800) | `52428800` | Size limit per file (50MB) |
| `SEED_PASSWORD` | No | *(none)* | Password for seeded accounts; a random password is generated and printed once when unset |
| `LOG_LEVEL` | No (`info`) | `info` | Log level |

Notes:

- `AWS_*` values are dummy credentials. Never put real AWS credentials in this project.
- Kafka topic names and message settings are added here once the Kafka contract is designed.
- Bucket and index names come from the CloudFormation stack outputs (`../../areax-rag-infra/docs/cloudformation.md`).
- Do not set `OPENAI_*` here: only the Python services call OpenAI.
