# Service architecture

> **Proposed.** This describes the structure defined in [`../CODING_STANDARD.md`](../CODING_STANDARD.md). No code exists yet. System-wide design: [`../../areax-rag-requirement/en/03-architecture.md`](../../areax-rag-requirement/en/03-architecture.md).

## Why this shape

The services are small Kafka consumers, but they talk to five external systems (Kafka, Postgres, S3 and S3 Vectors, OpenAI, YouTube). If business logic calls those SDKs directly, it becomes hard to test, hard to change and easy to break. So:

- Business logic depends on **interfaces** (ports), not on SDKs.
- One layer of **adapters** owns every SDK and translates its errors.
- Each service has a single **composition root** (`bootstrap.py`) that wires everything.
- The dependency rules are **checked by a tool**, so the structure does not rot.

## Layers

| Layer | Holds | Depends on |
|---|---|---|
| `core/` | Settings base, logging, error hierarchy, shutdown signal | nothing in the package |
| `domain/` | Document status, failure reasons, vector record and key rules | `core/` |
| `contracts/` | Kafka message models and topic names | `core/` |
| `ports/` | `Protocol` interfaces: `ObjectStore`, `VectorStore`, `Embedder`, `ChatModel`, `DocumentRepository`, `MessageRepository`, `EventPublisher`, `TextExtractor`, `CaptionFetcher` | `domain/`, `contracts/`, `core/` |
| `adapters/` | Implementations that use the SDKs | `ports/`, `domain/`, `contracts/`, `core/` |
| `ingestion/`, `chat/` | Use cases, handlers, service-specific pure logic, `bootstrap.py` | `ports/`, `domain/`, `contracts/`, `core/` (and `adapters/` only in `bootstrap.py`) |

`ingestion` and `chat` never import each other.

## Flow: ingestion

```
Kafka (DocumentUploaded / YoutubeSourceAdded / DocumentDeleted / ProjectDeleted)
  -> ConsumerRunner (adapters/kafka)         parse, retry, dead-letter, commit
  -> IngestionHandler (ingestion/handlers)   message -> use case
  -> ProcessDocument.execute
       DocumentRepository.claim_for_processing   PENDING -> PROCESSING (skip if READY)
       ObjectStore.get / CaptionFetcher.fetch    raw bytes or captions
       TextExtractor.extract                     plain text, no OCR
       split_into_chunks                         pure function
       Embedder.embed                            OpenAI, batched
       VectorStore.put                           keys <document_id>:<chunk_index>
       DocumentRepository.mark_ready | mark_failed(reason code)
```

## Flow: chat

```
Kafka (ChatRequested)
  -> ConsumerRunner -> ChatHandler -> AnswerQuestion.execute
       Embedder.embed(question)
       VectorStore.query(project_id, embedding, top_k)      always filtered by project
       MessageRepository.history(thread_id, limit)
       build_prompt(project prompt, history, passages, question)   pure function
       ChatModel.stream(prompt)                              yields tokens
       TokenBatcher -> EventPublisher.publish(ChatToken ...)  batches, then one `done` or one `error`
       MessageRepository.save_answer(message_id, text)        upsert by message_id
```

## Reliability rules in one place

- Offsets are committed after the handler succeeds or the message is dead-lettered.
- Retryable errors back off and retry up to `max_attempts`, then go to the dead-letter topic.
- Permanent errors mark the document `FAILED` with a reason code and never retry.
- Handlers are idempotent: deterministic vector keys, a document state machine, upserts by `message_id`.
- `SIGTERM` finishes the current message, commits and closes the consumer.

## Verification (no automated tests in this phase)

There are no automated tests yet. Check a change by hand against the tunnel:

| What | How to check |
|---|---|
| Ingestion happy path | Upload a small PDF with text; the document ends `READY` and vectors exist |
| Idempotency | Send the same `DocumentUploaded` message twice; there are no duplicate vectors or rows |
| Permanent failure | Upload a PDF without text; the document ends `FAILED` with `NO_TEXT_LAYER` and no retry happens |
| Retryable failure | Stop a dependency; the message retries, then reaches the dead-letter topic |
| Chat | Ask a question; tokens stream and exactly one `done` ends the answer; the answer is saved once |
| Project isolation | A question only retrieves vectors of its own `project_id` |
| Shutdown | `SIGTERM` lets the current message finish and commit |
| Layering | `import-linter` contracts (provisional) |

The layered design keeps pure logic free of I/O, so automated tests can be added later without redesign.

## Open points

- Kafka client library, Postgres driver and the lock/compile tool are chosen at scaffolding.
- Topic names, token batch size and retry limits are part of the open Kafka design.
- Whether any service needs threads or `asyncio` (default: synchronous loop).
