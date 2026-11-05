# areax-rag-service

The Python services of **areax-rag**. They are internal: no public HTTP, they work by consuming and producing Kafka messages.

> **Status: folders initialized, no code yet.** The package structure from `CODING_STANDARD.md` exists under `src/areax_service/` (empty folders hold a `.gitkeep` so git tracks them), together with `.gitignore` and `.env.example`. There is no `pyproject.toml`, no `__init__.py` and no Dockerfile yet. Commands to install and run will be added when the code is created.

## Services

| Service | Start command | What it does |
|---|---|---|
| `ingestion` | `python -m areax_service.ingestion` | Reads a document (PDF with text, Docx, MD, TXT, YouTube captions), splits it into chunks, creates embeddings with OpenAI, writes vectors to S3 Vectors, updates the document status in Postgres |
| `chat` | `python -m areax_service.chat` | Retrieves relevant chunks for a question, calls the LLM with streaming, publishes each token batch to Kafka, saves the full answer to Postgres |

Both are packaged into **one Docker image** (`service`). A container runs one process, chosen by its start command.

## How the code is organized

One installable package, `areax_service`, in a `src/` layout, split into layers. Outer layers depend on inner layers, never the other way:

```
ingestion/  chat/     use cases, handlers, bootstrap (composition root)
      |
   adapters/          Kafka, Postgres, S3 / S3 Vectors, OpenAI, extractors, YouTube
      |
    ports/            interfaces (typing.Protocol) for every external system
      |
domain/  contracts/   pure business rules, Kafka message models
      |
    core/             settings base, logging, errors, shutdown
```

```
areax-rag-service/
  pyproject.toml
  Dockerfile              one image for all services
  src/areax_service/
    core/  domain/  contracts/  ports/  adapters/
    ingestion/            __main__.py, bootstrap.py, settings.py, handlers.py, use_cases/, chunking.py
    chat/                 __main__.py, bootstrap.py, settings.py, handlers.py, use_cases/, retrieval.py, prompt.py, streaming.py
  docs/
  CODING_STANDARD.md
```

The reasons and the exact rules are in [`CODING_STANDARD.md`](CODING_STANDARD.md) (section 2) and [`docs/architecture.md`](docs/architecture.md). In short:

- Business logic only talks to **ports**. Only `adapters/` imports SDKs such as `boto3`, `psycopg`, `confluent_kafka` and `openai`.
- `ingestion` and `chat` never import each other, and never import `adapters/` except in their own `bootstrap.py`.
- The layering is checked by `import-linter` (provisional), so a violation fails the check.

## Running locally (target workflow)

The services run on your own machine and reach Postgres, Kafka and Floci on the VPS through an SSH tunnel.

1. Open the tunnel: `SSH_ALIAS=<your-ssh-alias> ../areax-rag-infra/scripts/tunnel.sh open` (see [`../areax-rag-infra/docs/ports-and-tunnels.md`](../areax-rag-infra/docs/ports-and-tunnels.md)).
2. Make sure the storage stack is deployed (`../areax-rag-infra/scripts/deploy-cloudformation.sh`) and the Kafka topics exist (`../areax-rag-infra/scripts/init-kafka-topics.sh`, run on the VPS).
3. Copy `.env.example` to `.env` and fill it in (names in [`docs/environment-variables.md`](docs/environment-variables.md)). The OpenAI API key goes only here.
4. Create the environment, install dependencies, start a service. *(Commands to be added after scaffolding.)*

## Key rules

- **At-least-once, idempotent**: commit Kafka offsets only after the handler succeeds; handling the same message twice must be safe. Vector keys are deterministic (`<document_id>:<chunk_index>`).
- **No OCR.** A PDF without a text layer fails with the reason `NO_TEXT_LAYER`.
- Every vector query is filtered by `project_id`.
- The application owns the database schema; services only read and write rows listed in the application's [`db-ownership.md`](../areax-rag-application/docs/db-ownership.md).
- Models and limits come from environment variables, never hard-coded. Each service has its own settings class.
- **No automated tests in this phase.** Check a change by running the service against the tunnel and sending messages (a normal one, a repeated one, a permanent failure, a retryable failure). See `CODING_STANDARD.md` section 16.
- Public repository: never commit `.env`, secrets, API keys or real IPs.

## Docs

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/message-contract.md`](docs/message-contract.md)
- [`docs/environment-variables.md`](docs/environment-variables.md)
- [`docs/db-ownership.md`](docs/db-ownership.md) (points to the application copy)
- Requirements: [`../areax-rag-requirement/en/`](../areax-rag-requirement/en/00-overview.md)
