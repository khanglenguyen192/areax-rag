# Coding Standard - areax-rag-service

**Version:** 1.1 | **Last updated:** 2026-11-05
**Applies to:** all Python code in `areax-rag-service/` (the `ingestion` and `chat` services and everything they share).

> This is a **hard** standard: new code and non-trivial changes MUST comply.
> The services are **Kafka consumers** (no HTTP, no Celery, no sessions). They are organized in layers with **ports and adapters** so business logic stays small, pure and testable, and every external system (Kafka, Postgres, S3, OpenAI, YouTube) sits behind an interface.
> Items marked **(provisional)** are not final yet; see `areax-rag-requirement/en/99-open-questions.md`.
> Written in English. Code comments, commit messages and identifiers are in English.

## Table of contents

0. [Principles](#0-principles)
1. [Tooling](#1-tooling)
2. [Architecture and project structure](#2-architecture-and-project-structure)
3. [Naming](#3-naming)
4. [Python rules](#4-python-rules)
5. [Ports, adapters and composition](#5-ports-adapters-and-composition)
6. [Message contract](#6-message-contract-provisional)
7. [Kafka consumer pattern](#7-kafka-consumer-pattern)
8. [Configuration](#8-configuration)
9. [Database access](#9-database-access)
10. [Storage and vectors](#10-storage-and-vectors)
11. [OpenAI usage](#11-openai-usage)
12. [Extraction rules](#12-extraction-rules)
13. [Error handling](#13-error-handling)
14. [Logging and observability](#14-logging-and-observability)
15. [Packaging and container](#15-packaging-and-container)
16. [Testing](#16-testing)
17. [Git and commits](#17-git-and-commits)
18. [Comments, docstrings and documentation](#18-comments-docstrings-and-documentation)
19. [Forbidden practices](#19-forbidden-practices)
20. [Review checklist](#20-review-checklist)

---

## 0. Principles

1. **At-least-once processing, idempotent handlers.** A message may be delivered twice; handling it twice must be safe.
2. **The application owns the database schema.** Services read and write rows but never change the schema.
3. **Services are internal.** They have no public HTTP surface and trust only validated Kafka messages.
4. **Business logic does not know infrastructure.** Use cases depend on interfaces (ports), never on `boto3`, `psycopg`, `confluent_kafka` or `openai` directly.
5. **Dependencies point inward.** Outer layers import inner layers, never the reverse (section 2.3). This is checked by a tool, not only by review.
6. **Configuration, not literals.** Models, limits and endpoints come from environment variables.
7. **One place wires everything.** Objects are created in one composition root per service and passed in; there are no hidden globals.
8. **Public repo.** Never commit secrets, real IPs, `.env` files or API keys.

## 1. Tooling

| Item | Rule |
|---|---|
| Python | 3.11 or newer; one version pinned in the Dockerfile |
| Packaging | `pyproject.toml`, **src layout**, one installable package `areax_service` |
| Dependencies | Direct dependencies pinned (or a lock file); dev tools in a separate dependency group; a lock/compile tool (`uv` or `pip-tools`) **(provisional)** |
| Virtual env | `.venv`, never committed |
| Lint and format | **`ruff`** for both lint and format (one tool), line length 100 |
| Types | **`mypy --strict`** for all of `src/` |
| Architecture rules | **`import-linter`** contracts (section 2.4) **(provisional)** |
| Dependency audit | `pip-audit` **(provisional)** |
| Comment rules | `ruff` rules for docstrings, commented-out code, TODO format and blanket suppressions (section 18.6) **(provisional)** |

Each new third-party dependency needs a one-line justification in the PR.

**Automated tests are not required in this phase** (section 16): do not add `pytest`, test files or test-only dependencies.

## 2. Architecture and project structure

### 2.1 Layers

```
            entrypoints / application          ingestion/   chat/        (use cases, handlers, bootstrap)
                         |
                      adapters/                                           (Kafka, Postgres, S3, OpenAI, YouTube)
                         |
                       ports/                                             (interfaces: typing.Protocol)
                         |
                  domain/   contracts/                                    (pure logic, message models)
                         |
                       core/                                              (config base, logging, errors)
```

| Layer | Holds | May use third-party SDKs? |
|---|---|---|
| `core/` | Settings base, logging setup, error hierarchy, shutdown signal | Only `pydantic-settings` and the standard library |
| `domain/` | Pure business rules and value objects shared by both services (document status, failure reasons, vector record) | No |
| `contracts/` | Pydantic models for Kafka messages and topic names | `pydantic` only |
| `ports/` | `typing.Protocol` interfaces for every external system | No |
| `adapters/` | The only code that imports `boto3`, `psycopg`, `confluent_kafka`, `openai`, `youtube_transcript_api`, PDF/Docx libraries | **Yes** |
| `ingestion/`, `chat/` | Use cases, handlers, service-specific logic, composition root | No (they use ports) |

### 2.2 Tree

```
areax-rag-service/
  pyproject.toml              # packaging, ruff, mypy, import-linter config
  Dockerfile                  # ONE image for all services
  README.md
  CODING_STANDARD.md
  docs/
  src/
    areax_service/
      __init__.py
      py.typed
      core/
        config.py             # BaseServiceSettings (pydantic-settings)
        logging.py            # JSON logging, context variables (request_id, ...)
        errors.py             # RetryableError, PermanentError, InvalidMessage
        shutdown.py           # SIGTERM handling
      domain/
        documents.py          # DocumentStatus, FailureReason codes
        vectors.py            # VectorRecord, VectorHit, vector key rules
      contracts/
        envelope.py           # MessageEnvelope
        document.py           # DocumentUploaded, YoutubeSourceAdded, DocumentDeleted, ProjectDeleted
        chat.py               # ChatRequested, ChatToken
        topics.py             # topic name constants
      ports/
        object_store.py       # ObjectStore
        vector_store.py       # VectorStore
        embedder.py           # Embedder
        llm.py                # ChatModel
        documents.py          # DocumentRepository
        messages.py           # MessageRepository
        publisher.py          # EventPublisher
        extractor.py          # TextExtractor
        captions.py           # CaptionFetcher
      adapters/
        kafka/                # consumer.py, publisher.py, runner.py
        postgres/             # connection.py, documents.py, messages.py
        aws/                  # s3_object_store.py, s3_vector_store.py
        openai/               # embedder.py, chat_model.py
        extractors/           # pdf.py, docx.py, markdown.py, text.py, registry.py
        youtube/              # captions.py
      ingestion/
        __main__.py           # entrypoint: python -m areax_service.ingestion
        bootstrap.py          # composition root: settings -> adapters -> use cases -> runner
        settings.py           # IngestionSettings
        handlers.py           # message -> use case
        use_cases/            # process_document.py, delete_document.py, delete_project.py
        chunking.py           # pure text splitting
      chat/
        __main__.py           # entrypoint: python -m areax_service.chat
        bootstrap.py
        settings.py           # ChatSettings
        handlers.py
        use_cases/            # answer_question.py
        retrieval.py          # build the query, filter by project_id, rank
        prompt.py             # pure prompt assembly
        streaming.py          # token batching, end and error signals
```

### 2.3 Dependency rules

1. `core/` imports nothing from the package.
2. `domain/` and `contracts/` import only `core/`; they are independent of each other.
3. `ports/` import `domain/`, `contracts/`, `core/`.
4. `adapters/` import `ports/`, `domain/`, `contracts/`, `core/`. They never import `ingestion/` or `chat/`.
5. `ingestion/` and `chat/` import `ports/`, `domain/`, `contracts/`, `core/`. They **never import `adapters/`**, with one exception: their own `bootstrap.py`, which is the composition root.
6. `ingestion/` and `chat/` **never import each other.** Shared logic moves down into `domain/` or `ports/`.
7. Third-party I/O libraries (`boto3`, `psycopg`, `confluent_kafka`, `openai`, ...) are imported **only inside `adapters/`**.

### 2.4 Enforcing the rules (provisional)

Put the rules in `pyproject.toml` so a violation fails CI/lint instead of waiting for a review:

```toml
[tool.importlinter]
root_package = "areax_service"
include_external_packages = true

[[tool.importlinter.contracts]]
name = "Lower layers never import higher layers"
type = "layers"
layers = [
  "areax_service.adapters",
  "areax_service.ports",
  "areax_service.contracts | areax_service.domain",
  "areax_service.core",
]

[[tool.importlinter.contracts]]
name = "Services do not import adapters, except through bootstrap"
type = "forbidden"
source_modules = ["areax_service.ingestion", "areax_service.chat"]
forbidden_modules = ["areax_service.adapters"]
ignore_imports = [
  "areax_service.ingestion.bootstrap -> areax_service.adapters.*",
  "areax_service.chat.bootstrap -> areax_service.adapters.*",
]

[[tool.importlinter.contracts]]
name = "ingestion and chat are independent"
type = "independence"
modules = ["areax_service.ingestion", "areax_service.chat"]

[[tool.importlinter.contracts]]
name = "I/O SDKs only inside adapters"
type = "forbidden"
source_modules = [
  "areax_service.core", "areax_service.domain", "areax_service.contracts",
  "areax_service.ports", "areax_service.ingestion", "areax_service.chat",
]
forbidden_modules = ["boto3", "psycopg", "confluent_kafka", "openai", "youtube_transcript_api"]
```

Verify the exact contract syntax against the `import-linter` version you install when scaffolding.

### 2.5 Structure rules

- One module has one responsibility. A module over **300 lines** is split.
- Handlers are thin: parse the message, call one use case, return. Logic goes in use cases and pure functions.
- A use case is one business operation (`ProcessDocument`, `AnswerQuestion`). It receives its dependencies in the constructor and exposes one method, `execute`.
- Pure logic (chunking, prompt assembly, vector keys, token batching) lives in plain functions with no I/O, so it is easy to read and reason about (and to test later).
- No `utils.py` or `helpers.py` dumping grounds: name modules after what they do.
- A package gets an `__init__.py` re-export (`__all__`) only when it has a real public API.

## 3. Naming

| Element | Convention | Example |
|---|---|---|
| Module / file | `snake_case` | `chunking.py` |
| Class | `PascalCase` | `ProcessDocument` |
| Port (interface) | Noun naming the capability, no `I` prefix | `ObjectStore`, `VectorStore`, `Embedder` |
| Adapter | Technology + port | `S3ObjectStore`, `PostgresDocumentRepository`, `OpenAIEmbedder` |
| Use case | Verb phrase | `ProcessDocument`, `AnswerQuestion` |
| Function / method | `snake_case`, verb first | `split_into_chunks()` |
| Variable | `snake_case` | `document_id` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_BATCH_SIZE` |
| Private | `_snake_case` | `_normalize_text()` |
| Boolean | `is_` / `has_` / `can_` / `should_` | `is_final` |
| Settings field | `snake_case` (env var is `UPPER_SNAKE_CASE`) | `openai_chat_model` <- `OPENAI_CHAT_MODEL` |
| Failure reason / error code | `UPPER_SNAKE_CASE` | `NO_TEXT_LAYER` |

No abbreviations except widely known ones (`id`, `url`, `llm`, `db`).

## 4. Python rules

**Types**
- Annotate every function signature. `mypy --strict` must pass. Use `X | None`, `list[str]`, `collections.abc` types.
- Avoid `Any`; use `object` and narrow, or a `Protocol`. No unexplained `# type: ignore`.
- Use `Literal` or `StrEnum` for closed sets of values.

**Data**
- Internal value objects: `@dataclass(frozen=True, slots=True)`. Messages and settings: pydantic v2 models.
- Immutability by default. No mutable default arguments. No module-level mutable state.
- Prefer small functions: **<= 30 lines**, **<= 5 parameters** (otherwise group into a dataclass), cyclomatic complexity **<= 10** (ruff `C901`).

**Time and ids**
- Use timezone-aware UTC datetimes (`datetime.now(UTC)`); never `datetime.utcnow()`.
- Inject a clock or id generator into code that needs one, so behavior is deterministic and easy to reason about.

**Style**
- Docstrings and comments follow section 18: Google-style docstrings on public code, comments explain **why**, nothing is commented out.
- `raise ... from exc` when wrapping an exception.
- Use `logging` with lazy `%s` formatting; never `print`.
- No `from x import *`. Imports are sorted by ruff.
- Use `pathlib`, context managers for resources, and generators/iterators for large data.

**Concurrency.** Default to a **synchronous** consumer loop that handles one message at a time per partition. Use threads or `asyncio` only for a measured need, and record the decision in `docs/` **(provisional)**.

## 5. Ports, adapters and composition

### 5.1 Ports

A port is a `typing.Protocol` that describes what a use case needs, in the language of the domain, not of the SDK.

```python
from collections.abc import Sequence
from typing import Protocol

from areax_service.domain.vectors import VectorHit, VectorRecord


class VectorStore(Protocol):
    def put(self, vectors: Sequence[VectorRecord]) -> None: ...

    def query(
        self, *, project_id: str, embedding: Sequence[float], top_k: int
    ) -> list[VectorHit]: ...

    def delete_by_document(self, *, document_id: str) -> None: ...

    def delete_by_project(self, *, project_id: str) -> None: ...
```

Rules: methods take and return domain types or plain data, never SDK objects; keyword-only arguments for anything ambiguous; each port is small and focused.

### 5.2 Adapters

An adapter implements a port with one technology (`S3VectorStore`, `PostgresDocumentRepository`, `OpenAIEmbedder`). It owns the SDK, translates SDK errors into `RetryableError` / `PermanentError`, sets timeouts, and hides pagination and batching. Adapters contain no business rules.

### 5.3 Use cases

```python
from dataclasses import dataclass

from areax_service.contracts.document import DocumentUploaded
from areax_service.ports.documents import DocumentRepository
from areax_service.ports.embedder import Embedder
from areax_service.ports.object_store import ObjectStore
from areax_service.ports.vector_store import VectorStore


@dataclass(frozen=True, slots=True)
class ProcessDocument:
    documents: DocumentRepository
    objects: ObjectStore
    embedder: Embedder
    vectors: VectorStore
    chunk_size: int
    chunk_overlap: int

    def execute(self, message: DocumentUploaded) -> None:
        ...  # claim the document, extract, split, embed, store, mark READY
```

A use case depends only on ports and domain types, receives everything through its constructor, and never reads environment variables or builds clients.

### 5.4 Composition root

Each service has a `bootstrap.py` that is the **only** place that reads settings, builds adapters and connects them to use cases:

```python
def build_runner(settings: IngestionSettings) -> ConsumerRunner:
    documents = PostgresDocumentRepository(settings.database_url)
    objects = S3ObjectStore(settings.aws_endpoint_url, settings.s3_bucket)
    embedder = OpenAIEmbedder(settings.openai_api_key, settings.openai_embedding_model)
    vectors = S3VectorStore(settings.aws_endpoint_url, settings.vector_bucket, settings.vector_index)
    use_case = ProcessDocument(documents, objects, embedder, vectors,
                               settings.chunk_size, settings.chunk_overlap)
    handler = IngestionHandler(use_case)
    return ConsumerRunner(KafkaConsumer(settings), handler, publisher=KafkaPublisher(settings))
```

`__main__.py` only configures logging, calls `build_runner`, and runs it. Nothing creates clients at import time.

## 6. Message contract (provisional)

All Kafka messages are defined once in `contracts/` as **frozen** pydantic v2 models, used by both producers and consumers. The application mirrors them in TypeScript; keep both in sync and document changes in `docs/message-contract.md`.

```python
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class MessageEnvelope(BaseModel):
    # Python fields are snake_case; the JSON on the wire is camelCase, matching the application.
    model_config = ConfigDict(
        extra="forbid", frozen=True, alias_generator=to_camel, populate_by_name=True
    )

    schema_version: int = 1
    request_id: str
    project_id: str
    occurred_at: str  # ISO-8601 UTC


class ChatRequested(MessageEnvelope):
    thread_id: str
    message_id: str
    user_id: str
    question: str = Field(min_length=1)


class ChatToken(MessageEnvelope):
    thread_id: str
    message_id: str
    kind: Literal["token", "done", "error"]
    text: str | None = None
    error_code: str | None = None
```

- Always parse incoming bytes into a contract model; reject and dead-letter anything that does not validate.
- A change to a message is **additive** inside the same `schema_version`; a breaking change bumps `schema_version`, and consumers handle both during the transition.
- The partition key for chat messages is `thread_id`, so tokens stay ordered.
- Topic names are constants in `contracts/topics.py`. Final names are decided in the Kafka design **(still open)**.

## 7. Kafka consumer pattern

A single reusable `ConsumerRunner` in `adapters/kafka/runner.py` implements the loop; services only supply a handler.

```python
def run(self) -> None:
    while not self._shutdown.is_set():
        record = self._consumer.poll(timeout=1.0)
        self._heartbeat()
        if record is None:
            continue
        try:
            message = self._parse(record)       # validates against the contract
            self._handler.handle(message)       # idempotent use case
        except InvalidMessage as exc:
            self._dead_letter(record, exc)      # poison message: never retried
        except RetryableError as exc:
            if self._attempts_exhausted(record):
                self._dead_letter(record, exc)
            else:
                self._backoff(record)           # redeliver later
                continue
        self._consumer.commit(record)           # commit AFTER success or dead-letter
```

Rules:
- **Commit offsets after** the handler succeeds or the message is dead-lettered (at-least-once).
- Handlers are **idempotent** (section 7.1).
- Separate **retryable** errors (network, OpenAI 429/5xx, database blips) from **permanent** errors (bad file, unsupported format). A permanent error marks the document `FAILED` with a reason code and moves on; it never loops forever.
- Retries use exponential backoff with jitter and a **maximum number of attempts** (configuration); after that the message goes to the dead-letter topic with the original payload, the error code and the attempt count.
- **Graceful shutdown:** handle `SIGTERM`, finish the current message, commit, close the consumer.
- The Kafka client library is chosen at scaffolding **(provisional, for example `confluent-kafka`)** and imported only in `adapters/kafka/`.
- Always propagate `request_id` into logs and into messages produced downstream.
- **Liveness:** the runner touches a heartbeat file on every poll. The container health check (in the infra compose file) fails when the file is older than a threshold **(provisional)**.

### 7.1 Idempotency rules

- **Deterministic vector keys:** `f"{document_id}:{chunk_index:06d}"`. Re-processing a document overwrites the same keys; keys beyond the new chunk count are deleted. Never generate random vector ids.
- **Document state machine:** `PENDING -> PROCESSING -> READY | FAILED`. A message for a `READY` document is skipped; a document stuck in `PROCESSING` may be re-processed.
- **Saved answers** are upserted by `message_id`, so a redelivered chat message does not create a duplicate row.
- Deleting a document or project twice is a no-op, not an error.

## 8. Configuration

Settings are pydantic-settings classes, loaded once, validated at startup; the process fails fast when a required value is missing.

```python
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseServiceSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    log_level: str = "INFO"
    kafka_bootstrap_servers: str
    database_url: SecretStr
    aws_endpoint_url: str
    aws_region: str = "us-east-1"
    s3_bucket: str
    vector_bucket: str
    vector_index: str
    openai_api_key: SecretStr


class IngestionSettings(BaseServiceSettings):
    openai_embedding_model: str = "text-embedding-3-small"
    file_max_bytes: int = 50 * 1024 * 1024
    chunk_size: int
    chunk_overlap: int
    max_attempts: int = 5


class ChatSettings(BaseServiceSettings):
    openai_embedding_model: str = "text-embedding-3-small"
    openai_chat_model: str  # low-cost model, set per environment
    retrieval_top_k: int
    max_history_messages: int
    max_output_tokens: int
    token_batch_size: int
    max_attempts: int = 5
```

- Each service has **its own settings class**; shared fields live in the base class.
- Secrets are `SecretStr`; never log settings values that contain secrets.
- Chunk size, top-k, history length and similar parameters are **configuration**, not literals.
- `.env` is gitignored; commit `.env.example` with placeholders only.
- Only `bootstrap.py` reads settings; everything else receives plain values or objects through constructors.

## 9. Database access

- The schema is owned by the application (Prisma). Services use **parameterized SQL** through the Postgres adapter **(provisional: `psycopg` 3; SQLAlchemy Core is acceptable)**.
- Do **not** define ORM models that create or migrate tables. If a column or table is needed, ask for a schema change in the application.
- Write only to the tables and columns listed in the application's `docs/db-ownership.md` (document status, saved answers). That file is the single source of truth; `docs/db-ownership.md` in this folder only links to it.
- Repositories expose intent (`claim_for_processing`, `mark_ready`, `mark_failed`, `save_answer`), not raw SQL, to use cases.
- Use short transactions; never hold a transaction across an OpenAI call.
- Use connection pooling configured in one place; close connections on shutdown.
- Update document status through the state machine in section 7.1 only.

## 10. Storage and vectors

- S3 and S3 Vectors are accessed with `boto3` inside the AWS adapters, using `aws_endpoint_url`, so the same code runs against Floci.
- Every vector carries metadata `project_id` and `document_id`. Queries **always filter by `project_id`**. Deleting a document deletes its vectors by `document_id`.
- Store the embedding model name and dimension with the index; never mix vectors from different models in one index.
- Write vectors in batches; respect S3 Vectors batch limits (the adapter splits batches).
- Stream large reads; do not load files into memory beyond what is needed (the VPS is small).

## 11. OpenAI usage

- All calls go through the OpenAI adapters (`Embedder`, `ChatModel`): explicit timeout, exponential backoff with jitter on 429/5xx, no retries on other 4xx.
- Model names come from settings; **do not hard-code** model names.
- Embeddings are sent in batches; respect token limits per request.
- Chat answers are streamed; the streaming module batches a few tokens per Kafka message and sends exactly one `done` or one `error` at the end **(batch size: provisional)**.
- The answer **follows the language of the question**: the system prompt instructs this explicitly.
- Prompt assembly order (pure function in `prompt.py`): system rules + project prompt, limited thread history, retrieved passages, then the question. History and passages are limited by configuration to control cost.
- Never log prompts, passages or answers at `info`; use `debug` and only in development.

## 12. Extraction rules

- Supported inputs: PDF with a text layer, Docx, MD, TXT, YouTube captions. **No OCR.**
- Extractors implement the `TextExtractor` port and are chosen by a registry from the detected type; adding a format means adding one extractor, with no change to the use case.
- If a PDF has no extractable text, mark the document `FAILED` with the reason `NO_TEXT_LAYER`; do not try other engines.
- Validate the real file type by content (magic bytes), not only by extension, and enforce `file_max_bytes` before reading the whole file.
- YouTube: fetch captions only; treat "no captions", "blocked" and "language not available" as permanent, reportable errors. The dependency is fragile; keep it behind the `CaptionFetcher` port.
- Extractors return plain text only; chunking is a separate step (`chunking.py`, pure).

## 13. Error handling

Define a small hierarchy in `core/errors.py`: `RetryableError`, `PermanentError`, `InvalidMessage`. Adapters translate SDK exceptions into these; use cases and the runner only know these.

```python
try:
    text = extractor.extract(path)
except NoTextLayerError as exc:
    documents.mark_failed(document_id, FailureReason.NO_TEXT_LAYER)
    raise PermanentError("NO_TEXT_LAYER") from exc
except OpenAIRateLimitError as exc:
    raise RetryableError("EMBEDDING_RATE_LIMITED") from exc
```

- Catch specific exceptions. A bare `except:` is forbidden; `except Exception` is allowed only at the top of the runner loop, with logging.
- Failure reasons stored for users are **codes** (UPPER_SNAKE), never raw exception text, so the UI can localize them. The code list is shared with the application's `docs/error-codes.md`.
- Do not swallow errors silently; if you ignore one on purpose, comment why.

## 14. Logging and observability

- Module-level logger: `logger = logging.getLogger(__name__)`.
- Structured JSON output. `request_id`, `project_id`, `document_id` / `thread_id` are bound once per message through `contextvars`, so every log line carries them without passing them around.
- Levels: `debug` detail, `info` normal operations, `warning` degraded, `error` failures, `exception` with traceback.
- Log one `info` line per handled message: type, ids, outcome, duration, attempt.
- Never log secrets, API keys, passwords, full prompts or document contents.
- Metrics and tracing are optional for now **(provisional)**.

## 15. Packaging and container

- Single Dockerfile at the root of `areax-rag-service/`; **multi-stage**: build dependencies in one stage, copy the installed package into a slim runtime stage.
- The image runs as a **non-root user**, sets `PYTHONUNBUFFERED=1` and `PYTHONDONTWRITEBYTECODE=1`, and contains no secrets.
- Each container runs **one process**: `python -m areax_service.ingestion` or `python -m areax_service.chat`. (Console scripts `areax-ingestion` and `areax-chat` may be defined as aliases.)
- Configuration comes from environment variables at run time.
- Set a memory limit per container in compose; avoid loading whole files and large models into memory.
- Temp files go to a dedicated temp directory and are removed after processing, including on failure.
- `.dockerignore` excludes `.venv`, `.git`, `.env*` and caches.

## 16. Testing

**Decision: automated tests are not required in this phase**, for the application and for the services. Do not generate test files, fakes, fixtures, a `tests/` folder, `pytest` configuration or test-only dependencies.

Verify a change by hand: run the service against the tunnel (Kafka, Postgres, Floci) and send messages. Check:
- a normal message end to end (a document becomes `READY`; a question streams tokens and ends with `done`);
- the **same message twice** (no duplicate vectors or rows);
- a **permanent failure** (a PDF without text ends `FAILED` with `NO_TEXT_LAYER`) and a **retryable failure** (a dependency is down: the message retries, then goes to the dead-letter topic);
- every vector query filters by `project_id`;
- shutdown: `SIGTERM` lets the current message finish.

The layered design keeps pure logic (chunking, prompt assembly, vector keys, token batching) free of I/O, so tests can be added later without redesign. If tests are introduced, update this section, the folder structure (section 2.2) and the tooling table first.

## 17. Git and commits

- Default branch `develop`. Branch names: `<type>/<short-slug>` (for example `feat/ingestion-docx`).
- Commit messages in English, imperative, conventional:

  ```
  <type>(<scope>): <subject>
  ```

  Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`, `build`, `revert`. Scope is the area (`ingestion`, `chat`, `adapters`, `contracts`, `core`...).
- Keep refactors separate from behavior changes. One logical change per PR.
- A change to the message contract or table ownership updates the docs **in the same change**.
- Do not merge with red checks. Never `--no-verify`. Never force-push a shared branch.

## 18. Comments, docstrings and documentation

### 18.1 The rule

**Code says what. A comment says why.** Make the code readable with good names first. If a comment only restates the code, delete it or improve the names instead.

**Write a comment when (MUST):**

1. **The reason is not obvious**: a hidden constraint, a business rule, a trade-off, or why the obvious approach does not work.
2. **You work around a quirk of an external system** (boto3, S3 Vectors limits, OpenAI, Kafka, a PDF library, YouTube). Name the system and the symptom.
3. **An ordering or reliability decision would look arbitrary**: why offsets are committed after the handler, why a key is deterministic, why an error is classed as retryable or permanent.
4. **Idempotency depends on something subtle**: say what makes a second delivery safe.
5. **A value is not self-explanatory**: a unit, a format, a range, a magic number, or a regular expression (say what it matches, with an example).
6. **An exception is ignored on purpose**: say why it is safe to ignore.
7. **A lint, type or format rule is suppressed** (section 18.4).
8. **Two places must change together**: for example "mirrors `src/model/chat/chat.dto.ts` in the application; change both".
9. **The code is public** (section 18.2).

**Never write a comment that (MUST NOT):**

- restates the code (`# increment counter`), or is a banner, a section divider or an end-of-block marker;
- is **commented-out code**: delete it, git keeps the history;
- names an author, a date, or a ticket story, or describes change history ("changed by X", "fixed in v2"): that belongs in git and the PR;
- contains a secret, token, API key, real hostname or IP, personal data, or a real prompt, passage or document content;
- complains or blames ("hack", "ugly", "stupid") without a technical explanation;
- is written in a language other than English;
- is a `TODO` without an issue link (section 18.5);
- is out of date. A wrong comment is a bug: fix it in the same change as the code, or delete it.

| Situation | Do this |
|---|---|
| The code is unclear | Rename, extract a function, simplify. Comment only if it is still unclear |
| You need a unit | Put it in the name (`timeout_seconds`, `max_bytes`) before adding a comment |
| You add a workaround | Say what it fixes and when it can be removed |
| You delete a feature | Delete its comments with it |
| You are unsure whether to comment | Ask "will a reader in six months wonder **why**?" If yes, comment |

```python
# BAD: restates the code
# loop over the chunks
for chunk in chunks:
    ...

# GOOD: explains why
# S3 Vectors limits how many vectors one call accepts, so write in batches.
for batch in iter_batches(vectors, MAX_VECTORS_PER_PUT):
    ...
```

### 18.2 Docstrings (Google style)

**Required on** (MUST):
- every module: a one-line docstring saying what the module is for;
- every public class, function and method in `ports/`, `contracts/`, `domain/`, `core/`, every use case (`execute`) and every public adapter class;
- pure functions with non-trivial behavior (chunking, prompt assembly, token batching): document the edge cases;
- contract and domain fields whose unit or format is not obvious (`Field(description=...)` or an attribute docstring).

Private helpers (`_name`) need no docstring; a good name is enough.

**Ports are contracts.** The docstring of a port method is what every adapter must satisfy. State the behavior, the **errors raised** (`RetryableError`, `PermanentError`), whether the operation is **idempotent**, and any ordering or blocking guarantee.

**Format**
- First line: a summary in the imperative mood ("Return ...", "Split ..."), one sentence, ends with a period, at most 100 characters.
- Then a blank line and, only if needed, a longer description.
- Use `Args:`, `Returns:`, `Raises:`, `Yields:` sections **only when they add information the signature does not carry**. Do **not** repeat types: annotations already declare them.
- `Raises:` lists project errors (`RetryableError`, `PermanentError`, `InvalidMessage`) with the condition.

```python
class VectorStore(Protocol):
    def delete_by_document(self, *, document_id: str) -> None:
        """Delete every vector that belongs to a document.

        Idempotent: deleting a document that has no vectors does nothing.

        Raises:
            RetryableError: The store is temporarily unavailable.
        """


class ProcessDocument:
    def execute(self, message: DocumentUploaded) -> None:
        """Extract, embed and store a document, then mark it ready.

        Safe to run twice for the same message: a ready document is skipped, and vector keys
        are deterministic, so a repeat overwrites instead of duplicating.

        Raises:
            PermanentError: The file cannot be read (the document is marked failed).
            RetryableError: A dependency was unavailable; the runner retries.
        """
```

### 18.3 Inline comment style

- English, complete sentences, present tense, short. Respect the 100-character line length.
- Put a comment on the **line above** the code it describes. Trailing comments only for a very short note.
- Use `#` comments. Do not use a string literal as a comment.
- A comment before a block may describe the **intent of a multi-step algorithm** ("1. claim the document, 2. ..."), but never narrate individual lines.
- Reference specs and docs by a stable name or URL, not by "see above".
- Reserve `Note:` and `Warning:` for things that can lose data or cause a security problem.

### 18.4 Suppressing rules

Every suppression has the **narrowest scope** and a **reason**:

```python
value = parse(raw)  # type: ignore[arg-type]  # the SDK stub is wrong: it accepts bytes here
client = make_client()  # noqa: S113  # timeout is set by the adapter configuration
```

- Always name the rule (`type: ignore[code]`, `noqa: CODE`). A bare `# type: ignore` or `# noqa` is forbidden.
- No file-wide `# ruff: noqa` or `# mypy: ignore-errors`, except in generated code.
- `# pragma: no cover` needs a reason on the same line.

### 18.5 TODO and FIXME

- Format: `# TODO(#123): imperative action, and why it is deferred`. Use `FIXME(#123)` for a known bug.
- The number is an issue in this repository. A TODO without an issue link must not be merged.
- A TODO is actionable and specific. Remove it in the same change that completes it.

### 18.6 Enforcement and review (provisional)

Configure the checks that exist in `ruff` and tune them against the installed version when scaffolding:

```toml
[tool.ruff.lint]
# D: docstrings, ERA: commented-out code, TD: TODO format, PGH: blanket suppressions, RUF: unused noqa
extend-select = ["D", "ERA", "TD", "PGH", "RUF"]
# Our TODOs carry an issue number, not an author.
extend-ignore = ["TD002"]

[tool.ruff.lint.pydocstyle]
convention = "google"
```

- Do **not** enable the `FIX` rules: they forbid every `TODO`, which section 18.5 allows.
- Docstring rules apply to public code only.
- Everything else is a review item: reviewers check that comments are true, explain why, are in English, and cover the cases in section 18.1. Wrong or noisy comments are review blockers.

### 18.7 Project documentation duties

- `README.md`: purpose, structure, how to run locally (including the SSH tunnel for Kafka, Postgres and Floci), environment variable names, how to start each service.
- `docs/` (English): `architecture.md` (layers and flows), `message-contract.md`, `environment-variables.md`, `db-ownership.md` (link), and a runbook for failed documents.
- Each service package may carry a short README of its own.
- Update the matching document in the same change as the code.

## 19. Forbidden practices

Rejected on review:

- Importing `boto3`, `psycopg`, `confluent_kafka`, `openai` or another I/O SDK outside `adapters/`.
- `ingestion/` or `chat/` importing `adapters/` (except `bootstrap.py`), or importing each other.
- Creating clients, reading environment variables or connecting to anything at import time.
- Module-level mutable state or hidden singletons; global `Settings()` objects read from deep inside business code.
- Business rules inside adapters or handlers.
- Bare `except:`; swallowing exceptions; raising generic `Exception`.
- `print`, `datetime.utcnow()`, mutable default arguments, `from x import *`, `assert` used for runtime validation.
- String-built SQL; ORM models that create tables; schema changes from a service.
- Hard-coded model names, limits, bucket names or endpoints.
- Random vector ids; vector queries without a `project_id` filter.
- Logging secrets, prompts, passages or document contents above `debug`.
- Files over 300 lines, functions over 30 lines (split first).
- Committing `.env`, `.venv`, caches or build output.
- Commented-out code, comments that restate the code, a `TODO` without an issue link, or a bare `# type: ignore` / `# noqa` (section 18).

## 20. Review checklist

The author self-checks first; the reviewer repeats it.

**Architecture**
- [ ] New code sits in the right layer (section 2.1); the import rules pass (`import-linter`).
- [ ] External systems are used through ports; new SDK use is inside `adapters/`.
- [ ] New wiring happens only in `bootstrap.py`.
- [ ] Handlers are thin; logic is in use cases or pure functions.

**Correctness and reliability**
- [ ] `ruff`, `ruff format --check` and `mypy --strict` pass.
- [ ] Handlers are idempotent; vector keys are deterministic; offsets are committed after success.
- [ ] Permanent and retryable errors are separated; retries are bounded; failures end in a reason code or the dead-letter topic.
- [ ] Shutdown is graceful; temp files are cleaned up.

**Security and data**
- [ ] No secrets in code, logs, images or committed files; settings use `SecretStr` for secrets.
- [ ] Incoming messages validated against the contract; invalid ones dead-lettered.
- [ ] File size and real type validated before processing.
- [ ] Every vector query filtered by `project_id`; SQL is parameterized.
- [ ] Container runs as non-root; prompts and document text are not logged above `debug`.

**Quality**
- [ ] The changed flows were exercised by hand: a normal message, the same message twice, a permanent failure and a retryable failure.
- [ ] No hard-coded model names or limits; new configuration is in the settings class and `docs/environment-variables.md`.
- [ ] Modules <= 300 lines, functions <= 30 lines.
- [ ] Docs updated (contract, ownership, architecture) in the same change; conventional commit message.
- [ ] Comments follow section 18: they explain **why**, are true, are in English, and no code is commented out.
- [ ] Public code has a Google-style docstring; port docstrings state errors and idempotency; every suppression names its rule and gives a reason.
