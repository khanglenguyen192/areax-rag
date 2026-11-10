# Database ownership

> The tables below match `prisma/schema.prisma`. This file is the **single source of truth** for who writes what; the service folder links here instead of keeping a copy.

## Rules

- The **application owns the schema and migrations** (`prisma migrate`). Python services never create, alter or drop tables.
- Python services connect to the same Postgres database and write only to the rows and columns listed below, using parameterized SQL.
- Any new column or table that a service needs is requested as a schema change in the application first.
- Update this file in the same change as the schema or the service code.

## Entities and writers

| Table | Written by the application | Written by Python services |
|---|---|---|
| `users` (username, `username_normalized`, `password_hash`, `is_active`) | Yes (seed script) | No |
| `projects` (name, description, shared `prompt`) | Yes | No |
| `project_members` (`role`: `OWNER` or `MEMBER`) | Yes | No |
| `documents` | Yes: creates the row (`PENDING_UPLOAD`, or `PROCESSING` for YouTube), moves it to `PROCESSING` when the upload is confirmed | Updates `status`, `failure_code`, `chunk_count` |
| `threads` (owner user, project, title) | Yes | No |
| `messages` (question) | Yes: saves the question | No |
| `messages` (answer) | Yes: creates the empty answer (`STREAMING`) and marks it `FAILED` on an error message | Yes: writes the full `content` and sets `status` to `DONE` when the stream ends |

## Document status

`PENDING_UPLOAD -> PROCESSING -> READY | FAILED`. `PENDING_UPLOAD` means a presigned URL was issued but the upload is not confirmed; the API shows it as `PROCESSING`. A failed document stores a `failure_code` (see [`error-codes.md`](error-codes.md)).

## Message status

`STREAMING -> DONE | FAILED`. The service writes the answer text and `DONE`; the application creates the row as `STREAMING` and sets `FAILED` with a `failure_code` when it receives an error message.

## Notes

- Vectors live in S3 Vectors, not in Postgres. Deleting a document or project must remove its file and its vectors as well as its rows.
- Answers are keyed by the message id the application created, so a redelivered Kafka message updates the same row instead of creating a duplicate.
- A thread belongs to its owner and survives the owner leaving or being removed from the project; it is hidden until they are added back.
