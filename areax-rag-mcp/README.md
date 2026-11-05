# areax-rag-mcp

The planned **MCP server** for areax-rag.

> **Status: not implemented.** In this phase the requirement is only recorded. No code exists here yet, and the language and framework are not chosen.

## What is known

- It will live in this folder.
- It is **internal**: only the application is exposed to the internet.
- When implemented it becomes the third Docker image, next to `application` and `service`.
- It must follow the same project rules as the application: owner / member roles, and a thread is visible only to its owner.
- The shared conventions apply: English documents, a `README.md`, a `docs/` folder and a coding standard (to be written once the language is chosen).

## Not decided yet

- Which tools it exposes (for example question answering over one project, listing documents).
- How MCP clients authenticate and how that maps to a user and a project.
- Language, library and how to deploy and reach it.

See [`docs/notes.md`](docs/notes.md) for the open questions and the requirement documents in [`../areax-rag-requirement/en/05-mcp.md`](../areax-rag-requirement/en/05-mcp.md).
