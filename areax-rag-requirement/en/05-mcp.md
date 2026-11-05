# 05 - MCP server

> Labels: **Decided** / **Proposed**.

## 1. Status

- The MCP server will live in `areax-rag-mcp/`. (Decided)
- **Noted only in this phase, not implemented.** (Decided)
- The folder only needs a `README.md` saying this component is not built yet. (Proposed)

## 2. Known constraints

- MCP is **internal**, not exposed to the internet; only the application is public. (Decided)
- When implemented, mcp is the third image (next to `application` and `service`). (Decided)
- The shared conventions still apply: English documents, `README.md`, `docs/`, a coding standard. (A separate coding standard for mcp is proposed)
- Data access must follow the same project rules: owner/member; a thread is visible only to its owner. (Proposed)

## 3. Not discussed yet (later phase)

- Which tools MCP exposes (for example Q&A over one project, listing documents).
- How MCP clients authenticate and how that maps to a user/project.
- Language and library (Python or TypeScript).
- Deployment and access (because it is internal, it needs a tunnel or its own reverse proxy).
