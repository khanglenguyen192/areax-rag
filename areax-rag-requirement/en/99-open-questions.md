# 99 - Open questions

> A summary of what is still undecided after normalization. Decided points are in files 00 to 06.

## A. The user must decide

1. **README defaults**: should every Python service subfolder have its own (short) README? Should `areax-rag-mcp/` only have a note-style README? (Proposed: yes, and yes.)
2. **File formats and 50MB per file** (FR-13): confirm officially. Is there a limit on the **number of files** per project?
3. **LLM model name** (set in env) and retrieval parameters: chunk size, overlap, top-k, output token limit, history messages per turn. The user said they will set cost limits later.
4. **Toggling individual documents on/off as sources** for answers: yes or no? (The user said no extra features are needed yet.)
5. **Document error handling**: scanned PDFs, corrupt files, videos without captions; whether retry is allowed; whether the user may choose the YouTube caption language.
6. **Threads**: whether the name is user-set or generated; a limit on the number of threads.
7. **How the 100MB is counted** and the message shown when it is exceeded (FR-16).
8. **Coding standard**: written for `application`, `service` and `infra` (a `CODING_STANDARD.md` at the root of each folder; `areax-rag-service/` has one shared file). Still open: whether `mcp` needs its own (waiting for the language choice); contents of `docs/` (proposed: architecture, setup, environment variables, message contract, runbook). Items marked "provisional" in the coding standards need your review.
9. **Open ports**: keep the assumption that no port other than the application's is exposed to the internet? (Default: none.)
10. **Code comments, commit messages and identifiers** in English: confirm.
11. ~~The `hooks` folder~~: **decided (request 46)**: `src/hooks/` holds **React hooks** (`useXxx`), not webhooks. Generic hooks go in `hooks/common/`, data hooks per feature in `hooks/<feature>/`. Claude had misread it as webhooks.
12. **Kafka topic names** in `areax-rag-infra/compose/kafka/topics.txt` are provisional; settle them together with the Kafka contract.
13. **Application tooling** (marked provisional in the coding standard): lint and format with ESLint + Prettier or Biome; whether to use Storybook; commit hooks and commitlint; npm or pnpm. (Decided: **no TanStack Query** and **no tests** for the application, request 41.)
14. **Python service tooling** (marked provisional): `uv` or `pip-tools` for locking versions; whether to use `import-linter` to enforce the layered architecture; `pip-audit`; the Kafka library (for example `confluent-kafka`) and the Postgres driver (`psycopg` 3 or SQLAlchemy Core); a synchronous consumer loop (default) or threads/`asyncio`; health checks through a heartbeat file.

## B. Technical design to settle

1. **Vector index**: one shared index filtered by `project_id` (proposed) or one index per project.
2. **Kafka contract**: topic list, message schema, partition key by thread, token batching, end/error signals, retry/DLQ, idempotency, passing `requestId` as the correlation id.
3. **SSE catch-up**: use `Last-Event-ID` or reload the saved answer.
4. **Upload flow** (section 4 of `03-architecture.md`): confirm; handle two concurrent uploads.
5. **Postgres write boundaries**: which tables the application writes and which the Python services write; how Python accesses the database (plain SQL or SQLAlchemy); how to detect schema drift.
6. **Monorepo layout**: a shared folder for the message contract, compose for local, `.env` management, `.gitignore` before the first commit.
7. **UI**: how to use MUI + Bootstrap together; the i18n and data-fetching libraries.
8. **The concrete list of error codes** and success codes.
9. **Auth.js version** to check when coding starts.
10. **Docker Hub**: check the free plan's private repo policy before settling on one repo.

## C. To test or measure

1. Kafka with two listeners through an SSH tunnel.
2. `aws cloudformation deploy` on Floci (S3 bucket, vector bucket, index).
3. Floci's RAM in `hybrid` mode; VPS disk and RAM (no result yet from `ssh floci 'df -h /; free -m; docker stats --no-stream'`). From that we learn how many 100MB projects the VPS can hold. Rough estimate (not measured): at the ceiling, vectors take a few hundred MB per project.
4. `youtube-transcript-api` on the VPS.
5. Whether mounting `/var/run/docker.sock` is really needed for Floci.

## D. Work to do (not questions)

- ~~Write the bash script to deploy CloudFormation and the templates (S3 bucket, vector bucket, index)~~: **done** (`areax-rag-infra/scripts/deploy-cloudformation.sh`, `cloudformation/storage.yml`). Syntax and flow were checked with a stub `aws`; **not yet tested against a real Floci**.
- ~~Write `README.md` and `docs/` for each code folder~~: **done** for application, service, mcp and infra. Coding standards are written for application, service and infra; mcp has none yet. Application and service contain documents only, no code yet.
- Initialize git and push to the remote when the user asks.
- Review `.gitignore` and the document contents before the first commit (the repo is public; a scan found no VPS IP, secrets or email).
