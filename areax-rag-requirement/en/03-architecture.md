# 03 - Architecture

> Labels: **Decided** / **Proposed**.

## 1. Overview

```
Browser ──HTTP/SSE──> Application (Next.js)  [public]
                          │  Prisma         │  Kafka producer/consumer
                          ▼                 ▼
                     Postgres  <───────>  Kafka  <──> Python services (ingestion, chat)
                                                          │        │
                                                          ▼        ▼
                                                 Floci: S3 + S3 Vectors      OpenAI API
```

Only the **Application** is public. Everything else is internal. (Decided)

## 2. Components

| Component | Role | Status |
|---|---|---|
| Application (Next.js) | UI, API (route handlers), Auth.js, Prisma, SSE, Kafka producer/consumer | Decided |
| `ingestion` service | Read documents -> split into chunks -> embed -> write vectors and status | Proposed |
| `chat` service | Retrieve vectors -> call the LLM with streaming -> push tokens to Kafka -> save the answer | Proposed |
| Postgres | Business data (users, projects, members, documents, threads, messages) | Decided |
| Kafka | Carries questions and answer tokens | Decided |
| Floci | S3 (files), S3 Vectors (vectors), CloudFormation | Decided |
| OpenAI API | Embedding `text-embedding-3-small`, a low-cost LLM | Decided |

Both Python services are Kafka consumers with no HTTP. (Proposed)

## 3. Chat flow (Decided)

1. The UI sends the question with an **HTTP POST**.
2. The application checks permissions (against Postgres), then pushes the question to **Kafka**.
3. The `chat` service retrieves relevant passages from S3 Vectors, calls the LLM, and pushes **each token** to Kafka.
4. The application receives the tokens from Kafka and pushes them to the UI over **SSE**.
5. When the stream ends, the complete answer is **saved to Postgres**. Chat history does not depend on the SSE stream.

Details:
- SSE pushes only to the **user who owns the thread**. Each tab opens **one** SSE stream for the whole user (HTTP/1.1 allows about 6 connections per origin).
- The Kafka consumer inside Next.js is started **once** when the server starts, then fans messages out by user/thread. This suits a single instance only.
- Each token is one Kafka message. Batching, a partition key by thread, and end/error signals are needed. (Proposed, not yet designed in detail)
- A way to catch up after a lost connection is needed (`Last-Event-ID`), or reload the saved answer. (Proposed)
- A unified SSE event shape: types `token`, `done`, `error`, with `threadId`/`messageId`; errors use the same codes as the API. (Proposed)

## 4. Upload and ingestion flow (Proposed)

1. The UI asks the application for a **presigned URL**. The application checks permissions and the project's **total size** (<= 100MB) before issuing it.
2. The UI uploads the file straight to **S3** (Floci), then tells the application.
3. The application confirms the real size (S3 HEAD), saves the document record, and publishes a **Kafka** message. (Floci does not push S3 events to Kafka, so the application publishes.)
4. The `ingestion` service reads the file, extracts text, splits it into chunks, calls OpenAI embeddings, writes vectors to **S3 Vectors** with `project_id` and `document_id` metadata, and updates the document status in Postgres.
5. YouTube sources: fetch captions with `youtube-transcript-api`, then continue from step 4.
6. Deleting a document removes the S3 file and its vectors by `document_id`. Deleting a project removes everything.

Two concurrent uploads that together exceed 100MB must be handled (a lock, or a re-check inside a transaction).

## 5. Vector storage (Proposed)

- Use Floci's **S3 Vectors**, not a self-built index.
- **One shared index** (1536 dimensions, cosine) created ahead of time by CloudFormation; filter by `project_id` with the S3 Vectors filter (filtering happens before ranking). The alternative is one index per project (created at runtime, outside CloudFormation).
- Store the embedding model name and dimension with the index; re-index when the model changes.

## 6. Database and schema ownership

- **Postgres** is the source of business data. (Decided)
- **Prisma** is the application's ORM; **the application owns the schema and migrations**. (Prisma decided; ownership proposed)
- **Python services write directly to Postgres** (document status, saved answers) without Prisma; a convention for which table is written by whom, and a way to keep schemas aligned, are still open. (Direct writes decided; convention open)

## 7. Authentication and authorization

- **Auth.js** with the Credentials provider (username + **bcrypt** password). Sign up is not enabled. (Decided)
- The JWT only identifies the user; **permissions are checked against Postgres on every request**, along with an "account is active" flag. (Direction decided)
- All user access goes through the application; the application checks permissions before publishing to Kafka.

## 8. API response envelope (Decided)

Every application API (success and error) uses one envelope; null/undefined fields are left out of the JSON:

```ts
interface ApiResponse<T = unknown> {
  status: number;        // same as the HTTP status
  code: string;          // "OK" on success, stable UPPER_SNAKE code on error
  message: string;       // for debugging, not shown to users
  requestId: string;     // unique per request, also sent as X-Request-Id
  timestamp: string;     // ISO-8601 UTC
  data?: T;
  errors?: { field: string; code: string }[]; // validation errors only
}
```

- Use **real HTTP status codes**; success vs error is told by `status` (< 400 is success).
- `code` is stable so the UI can translate by locale; success uses fixed codes such as `OK`, `CREATED`.
- Pagination lives inside `data`: `{ items, page, pageSize, total }`.
- One helper builds responses and catches errors; no stack traces are leaked.
- The error code list lives in one shared file and is documented in `docs/`.
- No URL versioning (`/api/v1`) for now.
- Scope: the application's API. Kafka communication has its **own message contract** (shared in the repo; still open).

## 9. Docker images (Decided)

- The whole project has **2 images**: `application` (Node) and `service` (Python, shared by every Python service); `mcp` is added when it is implemented.
- One Dockerfile at the root of `areax-rag-service/`; one Python package `areax_service` holding the shared code and each service; containers differ only in the `command` (`python -m areax_service.ingestion`, `python -m areax_service.chat`).
- Compose runs the same image several times, each container with its own memory limit and restart.
- The application and the services are not merged into one image.
- Accepted trade-offs: a larger image, deploys recreate all service containers at once, shared library versions. Split again if a service needs a very heavy library or independent scaling.

## 10. Python service layout (Proposed)

One package, `areax_service` (`src/` layout), split into layers in the **ports and adapters** style; outer layers depend on inner layers, never the reverse:

```
areax-rag-service/
  pyproject.toml, Dockerfile, README.md, CODING_STANDARD.md, docs/
  src/areax_service/
    core/         # settings base, logging, errors, graceful shutdown
    domain/       # pure business rules (document status, vector keys)
    contracts/    # Kafka message models, topic names
    ports/        # interfaces (Protocol) for every external system
    adapters/     # Kafka, Postgres, S3/S3 Vectors, OpenAI, extractors, YouTube (the only place that imports SDKs)
    ingestion/    # python -m areax_service.ingestion  (use cases, handlers, bootstrap)
    chat/         # python -m areax_service.chat       (use cases, handlers, bootstrap)
```

- Business logic only talks to **ports**; only `adapters/` imports `boto3`, `psycopg`, `confluent_kafka` and `openai`.
- `ingestion` and `chat` never import each other, and never import `adapters/` except in their own `bootstrap.py`.
- The layering is checked with `import-linter` (provisional). Details: `areax-rag-service/CODING_STANDARD.md` and `docs/architecture.md`.

Reference: `ocr-rag` (on the user's machine, outside this repo): FastAPI + Pydantic Settings, `pymupdf4llm` for text PDFs, `youtube-transcript-api` for YouTube. Its OCR part is not used.

## 11. Known Floci limits

- **S3 Vectors** supports: create bucket/index, put/get/delete/query vectors, metadata filters (`$eq`, `$in`, `$and`, `$or`...), 1..4096 dimensions. No real KMS encryption. The storage format and performance are not documented.
- **S3**: multipart (non-final parts >= 5 MiB), presigned URLs, CORS, event notifications (SQS/SNS/Lambda). Bucket policies are not enforced by default.
- **CloudFormation**: supports S3, S3 Vectors, IAM, SQS, SNS... Unsupported types are skipped (only a WARN log); set `FLOCI_SERVICES_CLOUDFORMATION_ALLOW_STUB_UNSUPPORTED_RESOURCE_TYPES=false`. `aws cloudformation deploy` is not confirmed by the documentation and must be tested.
- There is no separate storage quota; the limit is the VPS disk. It is unclear whether `hybrid` mode keeps data in RAM; this must be measured.
- Mounting `/var/run/docker.sock` grants very high privileges; check whether it is really needed.
