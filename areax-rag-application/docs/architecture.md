# Application architecture

Full system design: [`../../areax-rag-requirement/en/03-architecture.md`](../../areax-rag-requirement/en/03-architecture.md). This page summarizes what the application is responsible for.

## Responsibilities

- Serve the UI and the HTTP API (route handlers).
- Authenticate users (Auth.js, Credentials, bcrypt) and authorize every request against Postgres.
- Own the database schema and migrations (Prisma).
- Issue presigned URLs for uploads to S3 (Floci) after checking permissions and the 100MB project limit.
- Publish chat questions and document events to Kafka; consume answer tokens from Kafka.
- Push tokens to the browser over SSE.

## Layers

```
Route handler  ->  Service  ->  Repository (Prisma)
```

Route handlers parse and validate input, call one service method, and return an `ApiResponse`. Services hold business rules and permission checks. Repositories are the only code that uses Prisma.

## Chat flow

1. Browser sends the question with a POST.
2. The service checks the user owns the thread (or creates one) and that the user is a project member.
3. The question is saved, then published to Kafka (partition key: `threadId`).
4. The `chat` service streams tokens back through Kafka.
5. A Kafka consumer, started once at server start, hands each token to the SSE hub, which sends it to the thread owner's open connection.
6. When the stream ends, the full answer is saved to Postgres.

## Upload flow (proposed)

1. Browser asks for a presigned URL; the server checks membership and total project size.
2. Browser uploads straight to S3.
3. Browser confirms; the server checks the real size (S3 HEAD), saves the document row, and publishes a Kafka message.
4. The `ingestion` service processes the document and updates its status.

## Assumptions

- One application instance (the SSE hub and the Kafka consumer live in memory).
- One SSE stream per browser tab.
- Plain HTTP until a domain exists.

Open design points are listed in [`../../areax-rag-requirement/en/99-open-questions.md`](../../areax-rag-requirement/en/99-open-questions.md).
