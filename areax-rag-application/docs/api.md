# API

All endpoints are under `/api`, return the `ApiResponse` envelope (see `CODING_STANDARD.md`, section 18) and, except login and logout, need a session cookie. Errors carry a stable `code`; see [`error-codes.md`](error-codes.md). A `204` answer has no body.

Every handler goes through `withApiHandler`: it reads or creates the `requestId`, loads the user from Postgres, converts errors and logs one line per request.

## Auth

| Method and path | Purpose |
|---|---|
| `POST /api/auth/login` | Body `{ username, password }`. Sets the session cookie. Failures are limited per username (10 per 15 minutes) |
| `POST /api/auth/logout` | Ends the session (204) |
| `GET /api/auth/me` | The signed-in user, or 401 |

`/api/auth/[...nextauth]` also exists for Auth.js's own endpoints; the UI does not use it.

## Projects and members

| Method and path | Who | Purpose |
|---|---|---|
| `GET /api/projects` | member | The user's projects |
| `POST /api/projects` | any user | Create a project (the caller becomes the owner) |
| `GET /api/projects/:projectId` | member | Project with its shared prompt |
| `DELETE /api/projects/:projectId` | owner | Delete the project, its files and its threads |
| `PUT /api/projects/:projectId/prompt` | member | Replace the shared prompt |
| `POST /api/projects/:projectId/leave` | member (not owner) | Leave the project |
| `GET /api/projects/:projectId/members` | member | List members |
| `POST /api/projects/:projectId/members` | owner | Body `{ username }`; adds an existing account |
| `DELETE /api/projects/:projectId/members/:memberId` | owner | Remove a member (their threads are kept) |

A user who is not a member gets `PROJECT_NOT_FOUND` (404) for every project route, not `FORBIDDEN`.

## Documents

| Method and path | Purpose |
|---|---|
| `GET /api/projects/:projectId/documents` | Documents plus `usedBytes`, `limitBytes`, `fileMaxBytes` |
| `POST /api/projects/:projectId/documents/upload` | Step 1. Body `{ fileName, sizeBytes, contentType }`. Returns `{ documentId, uploadUrl }` (presigned, 10 minutes) |
| `POST /api/projects/:projectId/documents/:documentId/complete` | Step 2. Checks the real size in storage and publishes `DocumentUploaded` |
| `POST /api/projects/:projectId/documents/youtube` | Body `{ url }`. Publishes `YoutubeSourceAdded` |
| `DELETE /api/projects/:projectId/documents/:documentId` | Delete the document and its file; publishes `DocumentDeleted` |

The size limit is checked while holding a lock on the project row, so two simultaneous uploads cannot exceed it.

## Threads and chat

| Method and path | Purpose |
|---|---|
| `GET /api/projects/:projectId/threads` | The caller's own threads only |
| `POST /api/projects/:projectId/threads` | Create a thread (body optional: `{ title }`) |
| `DELETE /api/threads/:threadId` | Delete an own thread |
| `GET /api/threads/:threadId/messages` | Messages of an own thread |
| `POST /api/threads/:threadId/messages` | Body `{ content }`. Saves the question and an empty answer, publishes `ChatRequested`, returns `{ userMessage, assistantMessage }` |
| `GET /api/events` | Server-sent events (`token`, `done`, `error`); one stream per tab |

A thread is readable only by its owner, even by the project owner, and is hidden while its owner is not a member of the project.

## Kafka

Published: `areax.document.events` (document and project events) and `areax.chat.requests`. Consumed: `areax.chat.tokens` (forwarded to the SSE hub by the thread owner's id). Invalid token messages go to `areax.dlq`. See `../../areax-rag-service/docs/message-contract.md`.
