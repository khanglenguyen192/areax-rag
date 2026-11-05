# 00 - Overview

> Normalized requirements for `areax-rag`. The raw record of the discussion is in `raw-business.md` and `raw-technical.md` (in the `vi/` folder, Vietnamese).
> Status labels: **Decided** = confirmed by the user. **Proposed** = suggested by Claude, not yet clearly confirmed by the user.

## 1. Goal

A NotebookLM-style RAG web system. Users create **projects**, upload **documents**, and **ask questions** over those documents. Each project has one shared **prompt**. Several people can work together in one project.

The work has three parts: a **web application with a UI**, an **MCP server**, and **infrastructure + deployment**.

## 2. Scope of this phase (Decided)

- **Only set up infrastructure on the VPS**: Postgres, Kafka, Floci (virtual AWS), and AWS resources created with CloudFormation. The user runs the infrastructure by hand.
- **The application and Python services run on the user's own machine**, connected to the VPS through an SSH tunnel. They move to the VPS in a later phase.
- **MCP server**: requirements are noted only, not implemented.
- **Not in this phase**: sign up, global admin, source citations, OCR, data backup, a staging environment, CI/CD, quality gates, HTTPS and a domain.

## 3. Components and folders

Public monorepo at `git@github.com:khanglenguyen192/areax-rag.git`. Default branch `develop`, deploy branch `deployment/prod`.

| Folder | Role | Language / technology |
|---|---|---|
| `areax-rag-application/` | UI and server (BE) | Next.js, TypeScript, MUI + Bootstrap, SCSS, Prisma, Auth.js |
| `areax-rag-service/` | Processing services: ingestion, chat | Python, Kafka consumers |
| `areax-rag-mcp/` | MCP server (noted only) | Not decided |
| `areax-rag-infra/` | Infrastructure: Postgres, Kafka, Floci, CloudFormation, scripts | Docker Compose, bash, CloudFormation |
| `areax-rag-requirement/` | Requirements (`vi/` and `en/`) | Markdown |

## 4. Main technology (Decided)

Next.js + TypeScript (atomic design), MUI + Bootstrap, SCSS, Postgres + Prisma, Auth.js (Credentials) + bcrypt, Python services, Kafka, SSE, Floci (S3, S3 Vectors, CloudFormation), OpenAI API (embedding `text-embedding-3-small`, a low-cost LLM).

## 5. Documentation and code conventions (Decided)

- Only `areax-rag-requirement/` has two versions, **vi** and **en**, with the same file names. All other documents are written in **English**.
- Every code folder has a `README.md`, a `docs/` folder and its own coding standard file.
- The repo is public: never commit API keys, passwords, SSH keys, `.env` files or the VPS IP.

## 6. Glossary

| Term | Meaning |
|---|---|
| Project | A workspace with documents, a prompt and members |
| Owner / Member | The two roles in a project |
| Source | One document in a project: an uploaded file or YouTube captions |
| Thread | One chat conversation; belongs to one user in one project |
| Ingestion | Reading a document, splitting it into chunks, creating embeddings and storing vectors |

## 7. Contents

1. [01 - Functional requirements](01-functional-requirements.md)
2. [02 - Non-functional requirements](02-non-functional-requirements.md)
3. [03 - Architecture](03-architecture.md)
4. [04 - UI](04-ui.md)
5. [05 - MCP](05-mcp.md)
6. [06 - Deployment](06-deployment.md)
7. [99 - Open questions](99-open-questions.md)
