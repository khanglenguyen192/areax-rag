# Error codes

> **Provisional.** This is the starting list. The code constants live in `src/server/errors/codes.ts`; keep this file in sync in the same change.

Every API response carries `status` (HTTP status) and `code`. The UI translates `code` using the locale key `error.<CODE>`. The `message` field is for debugging and is never shown to users.

## Success codes

| Code | HTTP | Meaning |
|---|---|---|
| `OK` | 200 | Request succeeded |
| `CREATED` | 201 | Resource created |

## Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 400 | Input failed validation; see `errors[]` for fields |
| `UNAUTHENTICATED` | 401 | No valid session |
| `INVALID_CREDENTIALS` | 401 | Wrong username or password (same code for both) |
| `FORBIDDEN` | 403 | Authenticated but not allowed |
| `NOT_A_MEMBER` | 403 | The user is not a member of the project |
| `PROJECT_NOT_FOUND` | 404 | Project does not exist or is not visible to the user |
| `DOCUMENT_NOT_FOUND` | 404 | Document does not exist in the project |
| `THREAD_NOT_FOUND` | 404 | Thread does not exist or is not owned by the user |
| `USERNAME_NOT_FOUND` | 404 | No account with that username (when adding a member) |
| `ALREADY_A_MEMBER` | 409 | The user is already in the project |
| `OWNER_CANNOT_LEAVE` | 422 | The owner tried to leave the project |
| `PROJECT_SIZE_LIMIT_EXCEEDED` | 422 | The upload would exceed the project's total size limit |
| `FILE_TOO_LARGE` | 413 | A single file exceeds the per-file limit |
| `UNSUPPORTED_FILE_TYPE` | 422 | File type is not supported |
| `INVALID_YOUTUBE_URL` | 422 | The link is not a YouTube video URL |
| `UPLOAD_NOT_FOUND` | 422 | No file was found in storage, or its size differs from the declared one; the pending document is dropped |
| `NOT_FOUND` | 404 | No such route (generic) |
| `RATE_LIMITED` | 429 | Too many requests (for example login attempts) |
| `UPSTREAM_ERROR` | 502 | Kafka or storage did not answer in time or refused the call |
| `INTERNAL_ERROR` | 500 | Unexpected error; details are only in the server log |

## Client-only codes

The UI raises these itself; the server never sends them. They have locale keys like any other code.

| Code | Meaning |
|---|---|
| `NETWORK_ERROR` | The request never reached the server |
| `UNKNOWN` | An error without a known code |

## Document failure reasons

Written by the Python services when a document cannot be processed. Stored as codes (not text) so the UI can localize them.

| Code | Meaning |
|---|---|
| `NO_TEXT_LAYER` | PDF has no extractable text (scanned PDF; OCR is not supported) |
| `UNSUPPORTED_FORMAT` | The format is not supported by the extractors |
| `FILE_CORRUPT` | The file could not be read |
| `YOUTUBE_NO_CAPTIONS` | The video has no captions |
| `YOUTUBE_BLOCKED` | YouTube refused the request |
| `YOUTUBE_LANGUAGE_UNAVAILABLE` | The requested caption language is not available |
| `EMBEDDING_FAILED` | Embedding failed permanently |
| `INTERNAL_ERROR` | Unexpected processing error |

## Rules

- Add a new code in `codes.ts` and here in the same change.
- Never reuse a code for a different meaning.
- Do not put user data in `message`.
