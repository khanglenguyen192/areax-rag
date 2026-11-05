# 02 - Non-functional requirements

> Labels: **Decided** / **Proposed**.

## 1. Resources and performance

- **NFR-1** The VPS has about **4GB RAM and 2 cores**. In this phase it only runs Postgres, Kafka and Floci. Every container needs its own **memory limit**. (VPS is decided; memory limits are proposed)
- **NFR-2** Answers appear **progressively, token by token**, not all at once. (Decided)
- **NFR-3** Each project holds at most **100MB** of documents. The limit is configurable. (Decided)
- **NFR-4** Streaming latency is higher because traffic goes through an SSH tunnel to the VPS; this is acceptable for chat. (Decided)

## 2. Security

- **NFR-5** **Only the application (Next.js) is public.** Postgres, Kafka, Floci, Python services and MCP are all internal. (Decided)
- **NFR-6** Every port on the VPS **binds only to `127.0.0.1`**; the personal machine reaches them through SSH tunnels. Reason: Docker port publishing bypasses `ufw`. (Decided)
- **NFR-7** Passwords are hashed with **bcrypt**. (Decided)
- **NFR-8** **Owner/member permissions are checked against Postgres on every request**; the JWT only identifies the user and carries no permissions. This makes removing a member take effect immediately. (Direction decided, details proposed)
- **NFR-9** The application checks permissions **before** publishing a Kafka message, because internal services trust the messages. (Proposed)
- **NFR-10** Secrets (API keys, DB passwords...) live in environment variables, `.env` (gitignored) or GitHub Secrets. Never commit them. Because the repo is public, review `.gitignore` before the first commit. (Decided)
- **NFR-11** SSH access to the VPS uses keys, with password login disabled. (Proposed)
- **NFR-12** **Known risk:** there is no HTTPS yet (no domain), so the login page runs over HTTP. A domain will be bought later, and a reverse proxy with a certificate will be added then. (Decided)

## 3. Reliability and data

- **NFR-13** **No data backup** in this phase; losing test data is acceptable. (Decided)
- **NFR-14** Floci runs in `hybrid` mode (asynchronous disk writes, so the latest changes can be lost on a sudden stop). `FLOCI_STORAGE_MODE` must be set because the default image uses `memory` (everything is lost on restart). (Decided)
- **NFR-15** Losing the SSH tunnel makes the application/services on the personal machine fail to connect; clients must reconnect on their own. (Proposed)

## 4. Cost

- **NFR-16** OpenAI is used for both embedding and the LLM; the LLM is a **low-cost model**. The model name and detailed cost limits are set by the user later. (Decided)
- **NFR-17** Models are set through **environment variables** so they can change without code changes. Changing the embedding model requires **re-indexing** the vectors. (Decided)
- **NFR-18** Cost control (proposed): limit the number of passages in the context, the output tokens and the history messages per turn.

## 5. Internationalization

- **NFR-19** The UI is in **English** in this phase. **All displayed strings come from locale files**, not hard-coded, so Vietnamese can be added later. (Decided)
- **NFR-20** The server returns **error codes** that the UI translates by locale, not fixed strings. (Decided)

## 6. API consistency

- **NFR-21** Every BE API uses **one shared response envelope**, `ApiResponse<T>` (see `03-architecture.md`). (Decided)
- **NFR-22** Every request has a `requestId` for tracing logs. (Decided in the envelope; passing it to Kafka is proposed)

## 7. Maintainability

- **NFR-23** Atomic design for the UI; best practices for the server. Every code folder has its own **coding standard**, `docs/` and `README.md`. (Decided)
- **NFR-24** All documents outside `areax-rag-requirement/` are written in **English**. (Decided)
- **NFR-25** There is no quality gate, CI/CD or **automated testing** in this phase (neither the application nor the services); changes are checked by hand. If tests are added later, they must mock OpenAI. (Postponement decided; mocking is proposed)
