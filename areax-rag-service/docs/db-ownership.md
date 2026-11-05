# Database ownership

The single source of truth is in the application: [`../../areax-rag-application/docs/db-ownership.md`](../../areax-rag-application/docs/db-ownership.md). It is not copied here, so the two cannot drift apart.

Summary for the services:

- Never create, alter or drop tables. The application owns the schema (Prisma migrations).
- Write only to what that file lists for Python services: document `status`, `failure_reason`, `chunk_count`, and the saved answer message.
- Use parameterized SQL through the Postgres adapter (`adapters/postgres/`), behind the repository ports, with short transactions that never span an OpenAI call.
- Need a new column or table? Ask for a schema change in the application first, then update the ownership file in the same change.
