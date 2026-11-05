# MCP notes

Nothing is built yet. This page keeps the open questions so they are not lost.

## Open questions

1. Which tools should the MCP server expose? Candidates: ask a question in a project, list a project's documents.
2. How does an MCP client authenticate, and how is that identity mapped to a user and to project membership?
3. Language and library: Python or TypeScript?
4. Where does it run, and how is it reached, given that only the application is public?
5. Should it call the application's API, or read data and talk to Kafka directly? Calling the application's API keeps permission checks in one place.
6. Does it need its own coding standard? (Yes once the language is chosen.)

## Constraints already decided

- Internal service; never exposed to the internet directly.
- Same permission rules as the application: owner / member roles, and a thread is visible only to its owner.
- Third Docker image when implemented.
- Documents in English; this folder needs a `README.md`, `docs/` and a coding standard.

## When work starts

Update `../README.md`, add `CODING_STANDARD.md`, record the decisions here, and update `../../areax-rag-requirement/` (both `vi/` and `en/`).
