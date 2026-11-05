# Database ownership

> **Provisional.** Table names are not final until the Prisma schema exists. This file is the **single source of truth** for who writes what; the service folder links here instead of keeping a copy.

## Rules

- The **application owns the schema and migrations** (`prisma migrate`). Python services never create, alter or drop tables.
- Python services connect to the same Postgres database and write only to the rows and columns listed below, using parameterized SQL.
- Any new column or table that a service needs is requested as a schema change in the application first.
- Update this file in the same change as the schema or the service code.

## Entities and writers

| Entity | Written by the application | Written by Python services |
|---|---|---|
| User (username, password hash, active flag) | Yes (seed script, login metadata) | No |
| Project | Yes | No |
| Project member (role: owner / member) | Yes | No |
| Document (name, type, size, source, storage key) | Yes: creates the row with status `PENDING` | Updates `status`, `failure_reason`, `chunk_count` |
| Thread (owner user, project, title) | Yes | No |
| Message (question) | Yes: saves the user's question | No |
| Message (answer) | No | Yes: saves the full answer when the stream ends (proposed) |

## Document status

`PENDING -> PROCESSING -> READY | FAILED`. Final names follow the schema. A failed document stores a `failure_reason` code (see [`error-codes.md`](error-codes.md)).

## Notes

- Vectors live in S3 Vectors, not in Postgres. Deleting a document or project must remove its file and its vectors as well as its rows.
- Message ordering and idempotency: answers are keyed by `message_id` so a redelivered Kafka message does not create duplicates.
