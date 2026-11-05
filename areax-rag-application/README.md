# areax-rag-application

The web application of **areax-rag**: the UI and the server (BE) in one Next.js project.

> **Status: folders initialized, no code yet.** The folder structure from `CODING_STANDARD.md` exists (empty folders hold a `.gitkeep` so git tracks them), together with `.gitignore` and `.env.example`. There is no `package.json` and nothing is installed. Commands to install and run will be added when the project is scaffolded.

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

## Running locally (target workflow)

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
- Requirements: [`../areax-rag-requirement/en/`](../areax-rag-requirement/en/00-overview.md)
