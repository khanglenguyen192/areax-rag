# Kafka message contract

> **Provisional.** The Kafka design (topic names, token batching, retries) is still open. This page records the shape agreed so far so the application (TypeScript) and the services (Python) stay in sync. Change it in both places in the same change.

## Rules

- Every message has an envelope with `schemaVersion`, `requestId`, `projectId`, `occurredAt`.
- The Python models live in `src/areax_service/contracts/`. JSON field names are **camelCase** on the wire; the Python fields are `snake_case` with a camelCase alias generator.
- A change that only adds optional fields keeps the same `schemaVersion`; a breaking change bumps it, and consumers accept both during the transition.
- Messages are validated on receipt (pydantic in Python, zod in the application). Invalid messages go to a dead-letter topic and are never retried.
- Chat messages use `threadId` as the partition key so tokens stay in order.
- Consumers commit offsets **after** successful handling. Handlers are idempotent (keyed by `documentId` / `messageId`).
- `requestId` is copied into every message produced while handling a request, so one question can be traced across the system.

## Envelope

| Field | Type | Notes |
|---|---|---|
| `schemaVersion` | integer | Starts at 1 |
| `requestId` | string | Same value as the API `requestId` |
| `projectId` | string | |
| `occurredAt` | string | ISO-8601 UTC |

## Messages (proposed)

### Document events (application -> `ingestion`)

| Message | Extra fields | Meaning |
|---|---|---|
| `DocumentUploaded` | `documentId`, `storageKey`, `fileName`, `contentType`, `sizeBytes` | A file is in S3 and ready to process |
| `YoutubeSourceAdded` | `documentId`, `url`, `language?` | Fetch captions for a video |
| `DocumentDeleted` | `documentId` | Remove the file's vectors (and file) |
| `ProjectDeleted` | *(none)* | Remove all of the project's vectors and files |

### Chat events

| Message | Direction | Extra fields | Meaning |
|---|---|---|---|
| `ChatRequested` | application -> `chat` | `threadId`, `messageId`, `userId`, `question` | A user asked a question |
| `ChatToken` | `chat` -> application | `threadId`, `messageId`, `kind` (`token` / `done` / `error`), `text?`, `errorCode?` | A batch of answer tokens, the end marker, or an error |

## Still open

- Topic names and how many topics.
- How many tokens to batch per message.
- Retry and dead-letter topic naming.
- Whether history messages are sent in the request or read from Postgres by the service.
- SSE catch-up (`Last-Event-ID`) versus reloading the saved answer.
