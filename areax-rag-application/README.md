# areax-rag-application

The web application of **areax-rag**: the UI and the server (BE) in one Next.js project.

> **Status: UI implemented, server not yet.** The pages (login, home, project with documents, prompt, chat and members) are built against a **mock API** that runs in the browser. The route handlers, Prisma schema, Auth.js, Kafka and S3 code under `src/server/` and `src/app/api/` do not exist yet.

## What it does

- Login with a seeded account (no sign up yet).
- Home page with the user's projects; create a project.
- Project page: documents (upload files, add YouTube captions), one shared prompt, chat threads, members.
- Streams AI answers token by token to the browser over SSE.

## Stack

Next.js (App Router), TypeScript (strict), atomic design, MUI + Bootstrap (layout utilities only, provisional), SCSS (CSS Modules), Prisma + Postgres, Auth.js (Credentials) with bcrypt, Kafka client, S3 SDK pointed at Floci. Strings are loaded from locale files (English now, Vietnamese later).

## Planned structure

```
areax-rag-application/
  prisma/            schema, migrations, seed script
  src/
    app/
      (pages)/       every UI page (route group, not in the URL)
      api/           route handlers (thin)
    components/      atoms, molecules, organisms, templates
    features/        feature compositions and connected wrappers (no hooks)
    hooks/           all React hooks: common/ (generic) and <feature>/ (data hooks)
    model/           UI-side DTOs (API request/response shapes)
    server/
      model/         BE-side DTOs and mappers
      services, repositories, kafka, sse, auth, errors, http, config
    styles/          SCSS tokens, mixins, globals
    locales/         en.json
    lib/, types/
  docs/
  CODING_STANDARD.md
```

The full rules are in [`CODING_STANDARD.md`](CODING_STANDARD.md).

## Run the UI now (mock API)

Needs Node.js 24 (`.nvmrc`). No database, Kafka or VPS is required.

```bash
npm install
npm run dev:mock        # http://localhost:3000, redirects to /login
```

Sign in with `alice`, `bob` or `carol` and the password `password`. These accounts exist only in the in-memory mock (`src/lib/mock/`). Data resets when you restart the server. Uploads are simulated, a document turns *Ready* four seconds after upload, and chat answers are a canned text streamed token by token.

Other scripts: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run format`.

### How the mock works

`NEXT_PUBLIC_USE_MOCK_API=true` makes `lib/api-client.ts` answer from `src/lib/mock/` instead of calling `fetch`, and makes `lib/sse/event-stream.ts` use an in-memory stream instead of `EventSource`. The mock returns the same `ApiResponse` envelope and error codes as the real server will, so hooks and components do not change when the server arrives: build the route handlers and run `npm run dev` without the flag. The mock code is not included in a build made without the flag.

## Running with the real server (target workflow, not available yet)


In this phase the application runs on your own machine and reaches Postgres, Kafka and Floci on the VPS through an SSH tunnel.

1. Open the tunnel: `ssh -f -N <your-ssh-alias>` (see [`../areax-rag-infra/docs/ports-and-tunnels.md`](../areax-rag-infra/docs/ports-and-tunnels.md)).
2. Deploy the storage stack once: `../areax-rag-infra/scripts/deploy-cloudformation.sh`.
3. Copy `.env.example` to `.env` and fill in the values (names in [`docs/environment-variables.md`](docs/environment-variables.md)).
4. Install dependencies, run migrations, seed accounts, start the dev server. *(Commands to be added after scaffolding.)*

## Key rules

- The **server checks permissions on every request** against Postgres. The JWT only identifies the user.
- Every API returns the `ApiResponse<T>` envelope. Error `code` values are translated by the UI; `message` is never shown.
- No hard-coded user-visible strings.
- The application **owns the database schema** (Prisma migrations). Python services never change it.
- Public repository: never commit `.env`, secrets, API keys or real IPs.

## Docs

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/error-codes.md`](docs/error-codes.md)
- [`docs/db-ownership.md`](docs/db-ownership.md)
- [`docs/environment-variables.md`](docs/environment-variables.md)
- [`docs/deployment.md`](docs/deployment.md)
- Requirements: [`../areax-rag-requirement/en/`](../areax-rag-requirement/en/00-overview.md)
