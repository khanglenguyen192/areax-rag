# Environment variables

> **Provisional.** Names only. Values live in `.env` (gitignored) or the host environment. Commit `.env.example` with placeholders, never real values. Settings are loaded once with pydantic-settings; the process fails fast when a required variable is missing.

| Variable | Required | Example (placeholder) | Purpose |
|---|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | Yes | `localhost:9094` | Kafka through the tunnel |
| `DATABASE_URL` | Yes | `postgresql://<user>:<password>@localhost:5432/<db>` | Postgres through the tunnel |
| `AWS_ENDPOINT_URL` | Yes | `http://localhost:4566` | Floci endpoint |
| `AWS_REGION` | No | `us-east-1` | Region |
| `AWS_ACCESS_KEY_ID` | Yes | `test` | Dummy credential for Floci |
| `AWS_SECRET_ACCESS_KEY` | Yes | `test` | Dummy credential for Floci |
| `S3_BUCKET` | Yes | `areax-rag-documents` | Documents bucket |
| `VECTOR_BUCKET` | Yes | `areax-rag-vectors` | S3 Vectors bucket |
| `VECTOR_INDEX` | Yes | `areax-rag-chunks` | Shared chunk index |
| `OPENAI_API_KEY` | Yes | *(secret)* | OpenAI API key. **Only here, never in the application or the repo** |
| `OPENAI_EMBEDDING_MODEL` | No | `text-embedding-3-small` | Embedding model. Changing it requires re-indexing and a matching index dimension |
| `OPENAI_CHAT_MODEL` | Yes | *(set per environment)* | Low-cost chat model; name not decided yet |
| `FILE_MAX_BYTES` | No (52428800) | `52428800` | Per-file size limit (50MB) |
| `CHUNK_SIZE` | Yes | *(to be decided)* | Chunk size |
| `CHUNK_OVERLAP` | Yes | *(to be decided)* | Chunk overlap |
| `RETRIEVAL_TOP_K` | Yes (`chat`) | *(to be decided)* | Passages retrieved per question |
| `MAX_HISTORY_MESSAGES` | Yes (`chat`) | *(to be decided)* | Thread messages sent to the model per question |
| `MAX_OUTPUT_TOKENS` | Yes (`chat`) | *(to be decided)* | Output token limit per answer |
| `TOKEN_BATCH_SIZE` | Yes (`chat`) | *(to be decided)* | Tokens grouped into one Kafka message |
| `MAX_ATTEMPTS` | No (5) | `5` | Attempts before a message goes to the dead-letter topic |
| `LOG_LEVEL` | No (`info`) | `info` | Log level |

Notes:

- `AWS_*` values are dummy credentials for Floci. Never put real AWS credentials in this project.
- Bucket and index names come from the CloudFormation stack outputs (`../../areax-rag-infra/docs/cloudformation.md`). The index dimension must match the embedding model (1536 for `text-embedding-3-small`).
- Each service has its own settings class (`IngestionSettings`, `ChatSettings`) built on a shared base; this table lists the union. `CHUNK_SIZE` and `CHUNK_OVERLAP` apply to `ingestion`. Values marked "to be decided" are required and have no default on purpose.
- Environment variables are `UPPER_SNAKE_CASE`; the matching settings fields use the same names in `snake_case`.
- Only `bootstrap.py` reads settings; the rest of the code receives values through constructors.
