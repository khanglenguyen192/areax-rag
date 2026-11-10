# Coding Standard - areax-rag-application

**Version:** 1.2 | **Last updated:** 2026-11-08
**Applies to:** all code in `areax-rag-application/` (Next.js, TypeScript).

> This is a **hard** standard: new code and non-trivial changes MUST comply.
> Part A covers the **UI** (atomic design, styling, i18n, client data). Part B covers the **server / BE** (route handlers, services, Prisma, Kafka, SSE).
> Items marked **(provisional)** are not final yet; see `areax-rag-requirement/en/99-open-questions.md`.
> Written in English. Code comments, commit messages and identifiers are in English.

## Table of contents

0. [Principles](#0-principles)
1. [Tech stack and tooling](#1-tech-stack-and-tooling)
2. [Project structure](#2-project-structure)
3. [Models (DTOs)](#3-models-dtos)
4. [Naming](#4-naming)
5. [TypeScript rules](#5-typescript-rules)

**Part A - UI:** 6. [Atomic design](#6-atomic-design) - 7. [Server and client components](#7-server-and-client-components) - 8. [Component standards](#8-component-standards) - 9. [Styling](#9-styling-mui-bootstrap-scss) - 10. [Internationalization](#10-internationalization-i18n) - 11. [State and data fetching](#11-state-and-data-fetching) - 12. [UI behavior and accessibility](#12-ui-behavior-and-accessibility) - 13. [Performance](#13-performance)

**Part B - Server (BE):** 14. [Layering](#14-layering) - 15. [Authentication and authorization](#15-authentication-and-authorization) - 16. [Validation and errors](#16-validation-and-errors) - 17. [Configuration and secrets](#17-configuration-and-secrets) - 18. [API response envelope](#18-api-response-envelope) - 19. [Database (Prisma)](#19-database-prisma) - 20. [Kafka, S3 and external calls](#20-kafka-s3-and-external-calls) - 21. [SSE](#21-sse-token-streaming) - 22. [Logging](#22-logging-and-observability)

**General:** 23. [Testing](#23-testing) - 24. [Git, commits and PRs](#24-git-commits-and-prs) - 25. [Forbidden practices](#25-forbidden-practices) - 26. [Comments and documentation](#26-comments-and-documentation) - 27. [Review checklist](#27-review-checklist)

---

## 0. Principles

1. **Server is the source of truth for permissions.** The UI may hide features by role, but every server operation re-checks permissions.
2. **No hard-coded display strings.** Everything shown to users comes from locale files.
3. **One response shape.** Every API returns the `ApiResponse<T>` envelope (section 18).
4. **Thin edges, logic in the middle.** Route handlers and components stay small; business logic lives in services and hooks.
5. **Boundaries are enforced by tooling, not only by review.** Import direction between tiers and layers is a lint rule (section 6.3).
6. **Public repo.** Never commit secrets, real IPs, `.env` files or API keys.

## 1. Tech stack and tooling

| Layer | Choice |
|---|---|
| Framework | Next.js **App Router**, version 15 or newer (`params` and `searchParams` are Promises: always `await` them) |
| Runtime | Node.js 24 LTS (pinned in `.nvmrc` and `engines`) |
| Package manager | npm, lockfile committed **(provisional)** |
| Language | TypeScript, `"strict": true`, path alias `@/*` -> `src/*` |
| UI | MUI; Bootstrap only as layout partials **(provisional)** (section 9) |
| Styles | **SCSS** with CSS Modules (`*.module.scss`); `sass` as a dev dependency |
| Lint and format | ESLint (Next.js + TypeScript rules) and Prettier **(provisional; Biome is an alternative that also enforces import boundaries)**; Stylelint for SCSS **(provisional)** |
| Validation | `zod` at every boundary (request input, env, external data) |
| Database | Postgres through Prisma |
| Auth | Auth.js (Credentials) with bcrypt |
| Component workshop | Storybook **(provisional)** |

Do **not** add alternatives (Redux, Zustand, Axios, SWR, TanStack Query, styled-components, Tailwind...) without a recorded decision in `docs/`.

Server data is fetched with the built-in `fetch` through `lib/apiClient` (section 11); there is no server-state library. **Automated tests are not required** at this stage (section 23).

## 2. Project structure

```
areax-rag-application/
  prisma/                    # schema.prisma, migrations/, seed script
  public/
  src/
    app/                     # App Router
      (pages)/               # route group: EVERY UI page lives here (not part of the URL)
        (auth)/login/
        (main)/home/
        (main)/projects/[projectId]/
      api/...                # route handlers (thin), outside (pages)
      layout.tsx             # root layout (imports styles/globals.scss once)
      error.tsx              # segment error boundary
      global-error.tsx       # root error boundary
    components/              # ALL presentational UI (Part A, section 6)
      atoms/
      molecules/
      organisms/
      templates/
      providers/             # theme, SSE, i18n providers (not on the atomic ladder)
    features/<feature>/      # compositions (*View.tsx), connected wrappers, pure logic, fixtures (no hooks)
    hooks/                   # ALL React hooks (useXxx), section 8.7
      common/                # generic hooks: no data, no session (useDebounce, useT)
      <feature>/             # data hooks: call lib/apiClient or read the session (useProjects)
    model/                   # UI-side DTOs: API request/response shapes, SSE events (browser-safe)
    shared/                  # tier-neutral primitives any tier may import (formatters, status unions)
    server/                  # server-only code (Part B)
      model/                 # BE DTOs: service input/output, Kafka message DTOs (messages/), mappers
      auth/                  # Auth.js config, session helpers
      services/              # business logic
      repositories/          # Prisma access
      kafka/                 # producer and consumer singletons
      s3/                    # object storage client (presigned URLs, head, delete)
      sse/                   # SSE hub (user -> connections)
      errors/                # AppError, error codes
      http/                  # ApiResponse helpers, requestId, handler wrapper
      config/                # validated env
    styles/                  # SCSS: tokens, mixins, vendor imports, globals
    locales/                 # en.json (later vi.json)
    lib/                     # apiClient, upload and SSE clients, error helpers; mock/ holds the dev-only mock API (see section 11)
    types/
  docs/
  README.md
  CODING_STANDARD.md
```

Rules:
1. Code under `src/server/` is **server-only**; add `import "server-only"` at the top of its entry modules. Client components must never import from it.
2. **Every page lives under `src/app/(pages)/`.** `(pages)` is a route group: it organizes files and never appears in the URL. Nested groups such as `(auth)` and `(main)` choose the layout. Route handlers stay in `src/app/api/`, outside `(pages)`.
3. **All presentational UI lives in `src/components/<tier>/`**, even when only one feature uses it today (section 6.5). `src/features/<feature>/` holds the composition, its hooks, its pure logic and its fixtures, and nothing presentational.
4. **One component = one folder** containing `Name.tsx`, `Name.module.scss`, `Name.stories.tsx` **(provisional)** and `index.ts` (barrel).
5. **Barrels (`index.ts`) are required** for each component folder and each tier. Import from the barrel, never from the internal file. Register the tier barrels in `next.config.ts` `experimental.optimizePackageImports` (section 13).
6. **Models live on both sides** (`src/model/` and `src/server/model/`, section 3).
7. **All React hooks (`useXxx`) live in `src/hooks/`.** Generic hooks that touch no data and no session (`useDebounce`, `useT`, `useMediaQuery`) go in `src/hooks/common/`. Data hooks, which call `lib/apiClient` or read the session, go in `src/hooks/<feature>/` (`useProjects`, `useProjectMembers`). `src/features/` holds no hooks. See section 8.7.
8. Route files (`page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`) belong to Next: keep unrelated code out of them.
9. A folder gets an `index.ts` only when it exposes a public API. Do not create new top-level folders without updating this document.

## 3. Models (DTOs)

Both the UI side and the BE side declare their data shapes in a `model` folder. A DTO is a plain TypeScript type, plus a zod schema where data crosses a boundary. It has no behavior.

| Folder | Holds | May import | Must not |
|---|---|---|---|
| `src/model/` | **UI-facing DTOs**: request and response shapes of every API (`ProjectDto`, `CreateProjectInput`, `DocumentDto`, `ThreadDto`, `MessageDto`, `MemberDto`), SSE event types, `ApiResponse`, `ApiError` | Other files in `src/model/`, `zod` | Import Prisma, anything from `src/server/`, secrets or server-only code. It must stay safe to use in the browser |
| `src/server/model/` | **BE DTOs**: service inputs and outputs, internal command objects, Kafka message DTOs (`messages/`), mappers from Prisma entities to DTOs | `src/model/`, Prisma types | Be imported by client components |

Rules:
- Organize by feature: `model/project/project.dto.ts`, `model/project/project.schema.ts` (zod). Suffixes: `.dto.ts`, `.schema.ts`, and `.mapper.ts` (server only).
- Naming: `XxxDto` for outputs, `CreateXxxInput` / `UpdateXxxInput` for inputs, `XxxQuery` for query parameters.
- Declare each API request/response shape **once** in `src/model/`. Route handlers, services and `lib/apiClient` all use that declaration; never re-declare the same shape elsewhere.
- **Never return Prisma entities** from a service or a route handler. Map them to DTOs; this keeps the password hash and internal fields out of responses.
- Mark DTO fields `readonly` when consumers must not mutate them.
- Dates in DTOs are ISO-8601 strings; ids are strings.
- Kafka message DTOs mirror `areax-rag-service/docs/message-contract.md`; change both in the same change.
- Dependency direction: `src/server/model` may import `src/model`, never the other way.
- Boundary DTOs never contain React types (`ReactNode`, component props).

## 4. Naming

| Kind | Convention | Example |
|---|---|---|
| Component file and folder | PascalCase, folder matches the component | `organisms/MemberPanel/MemberPanel.tsx` |
| Barrel | `index.ts` per component folder and per tier | `atoms/StatusDot/index.ts` |
| React hook (in `hooks/`) | `useXxx.ts`, one hook per file | `hooks/members/useProjectMembers.ts` |
| Other files | kebab-case | `api-client.ts`, `project-service.ts` |
| DTO files | `*.dto.ts`, `*.schema.ts`, `*.mapper.ts` (server only) | `project.dto.ts` |
| DTO types | `XxxDto`, `CreateXxxInput`, `UpdateXxxInput`, `XxxQuery` | `ProjectDto` |
| SCSS module | `<Component>.module.scss` | `Button.module.scss` |
| SCSS partial | `_name.scss` | `_tokens.scss` |
| CSS class in a module | camelCase | `.isActive` |
| Route handler, page | `route.ts`, `page.tsx` (Next-mandated), pages under `app/(pages)/` | `app/(pages)/home/page.tsx` |
| Feature folder | kebab-case under `features/` | `features/project-members/` |
| Story | colocated `*.stories.tsx` **(provisional)** | `MemberPanel.stories.tsx` |
| Types, interfaces | PascalCase, no `I` prefix, no `T` prefix | `ProjectDto` |
| Enum-like values | string-literal union, not `enum` | `type DocumentStatus = "PENDING" \| "READY" \| "FAILED"` |
| Variables, functions | camelCase | `getProjectById` |
| Booleans | `is` / `has` / `can` / `should` prefix | `isLoading`, `canEdit` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_BYTES` |
| Handler inside a component | `handleXxx` | `handleSubmit` |
| Handler prop passed to a child | `onXxx`, named by intent | `onConfirm`, `onFilterChange` |
| Error codes | UPPER_SNAKE_CASE | `OWNER_CANNOT_LEAVE` |
| Locale keys | dot.case | `project.members.add.title` |
| Route segments | kebab-case | `/projects/[projectId]` |

Non-negotiable:
- No Hungarian notation (`IUser`, `TFoo`, `EStatus`).
- No abbreviations except widely known ones (`id`, `url`, `jwt`, `api`, `csv`, `sse`).
- A component name never encodes its tier (`MemberPanel`, not `MemberPanelOrganism`); the folder encodes it.
- Prop names describe intent, not the DOM event (`onConfirm`, not `onClick`, unless it is a direct passthrough).

## 5. TypeScript rules

**Compiler.** `"strict": true` is mandatory and must not be weakened. Do not use `// @ts-ignore` or `// @ts-expect-error` without a linked issue in the comment.

**Prefer**
- Discriminated unions over piles of optional flags.
- Type guards and zod parsing over casts. `as` is a smell; `as unknown as Foo` is worse.
- `readonly` on DTOs and props that must not be mutated.
- Explicit return types on exported functions.

**Ban**
- `any` (implicit or explicit): use `unknown` and narrow.
- Non-null assertion `!` at boundaries (request bodies, JWT payloads, HTTP responses, Kafka messages).
- The `Function` and `Object` types: use a concrete signature or `Record<string, unknown>`.

**Boundaries.** Data entering the system (request, env, Kafka message, external response) is parsed with zod into a strict type; do not let `unknown` leak upward.

**Tier discipline for props** (section 6): atoms and molecules take generic props (primitives, callbacks, `ReactNode`). Domain DTOs appear only from organisms upward.

---

# Part A - UI

## 6. Atomic design

### 6.1 Tiers

| Tier | Meaning | Signal it belongs here |
|---|---|---|
| **Atom** | Smallest reusable UI piece, no business meaning. Wraps or composes one MUI primitive | Renders one visible thing (button, text field, spinner, status dot). No domain types in props, no data fetching, no state beyond hover/focus |
| **Molecule** | A few atoms wired together with local state, still generic | FormField (label + input + error), SearchBox, ConfirmDialog. Props stay generic (`label`, `value`, `onChange`, `error`) |
| **Organism** | A complex section that carries domain meaning | ProjectCard, DocumentPanel, ChatThreadList, MessageList, MemberPanel, InviteMemberDialog, PromptEditor. May take DTOs and own local UI state (open, selection). **Never fetches** |
| **Template** | A page layout skeleton with slots and no data | AuthLayout, MainLayout, ProjectLayout. Consumers pass content in; the template does not know what it is |
| **Page** | A route file in `src/app/(pages)/**/page.tsx` | Composes a template, organisms and data hooks (`src/hooks/<feature>/`). Owns auth gating and redirects |

`providers/` holds cross-cutting providers (theme, SSE, i18n). They are not on the ladder.

### 6.2 Sorting rules (first match wins)

1. Does it fetch, redirect or read the session? -> **Page** (or a feature composition).
2. Is it a page-level layout with slots and no data? -> **Template**.
3. Does it accept a domain DTO, emit domain events, or carry domain-specific copy? -> **Organism**.
4. Does it combine two or more atoms with its own state but generic props? -> **Molecule**.
5. Otherwise -> **Atom**.

### 6.3 Dependency rules

- Atoms may import: MUI, `styles/`, `shared/`, other atoms.
- Molecules may import: atoms, `shared/`.
- Organisms may import: molecules, atoms, `shared/`, DTOs from `src/model/`, the i18n hook.
- Templates may import: structural helpers only; they prefer receiving `children` or slot props.
- Pages may import: everything in the UI tree.
- **Any tier may import `shared/`** (tier-neutral: formatters, status unions). When an atom would otherwise reach *up* for a primitive, move that primitive to `shared/`.
- **Hooks:** any tier may import the generic hooks in `src/hooks/common/`. Only pages, feature compositions and connected wrappers may import data hooks (`src/hooks/<feature>/`); atoms, molecules and organisms never do, they receive data as props.
- Direction is one way: `atoms <- molecules <- organisms <- templates <- pages`. **Never upward**, never sideways at the same tier unless the dependency is generic enough to move down.
- The direction is **enforced by lint** (for example `no-restricted-imports` or an import-boundaries plugin; Biome `noRestrictedImports` if Biome is chosen) **(provisional)**, not left to review alone.

### 6.4 What does NOT belong in atoms or molecules

- Anything that reads the session (`useSession`), calls `fetch`, or touches `window`/`document` beyond simple event listeners.
- Anything whose props include a DTO (`ProjectDto`, `DocumentDto`, `ThreadDto`...). That is an organism.
- Anything carrying feature-specific copy, even if its prop types are generic. `DocumentsEmptyState` takes only `kind` and a callback, but its text is about documents, so it is an organism.

### 6.5 Shared tree is the default home for presentational components

A presentational component goes in `src/components/<tier>/` **even when only one feature uses it today**. The tier decides, not the reuse count.

Why: discoverability (the card is under `organisms/`, not buried in a feature), Storybook coverage is enforced by location, the props boundary is forced early (an upward import becomes a lint error), and "promote on the second consumer" rarely happens.

What stays in `src/features/<feature>/`:

| Keep in the feature | Why |
|---|---|
| The composition (`*View.tsx`) | It owns fetching, routing and cross-component state |
| Pure feature logic (`filters.ts`, `grouping.ts`) | Not UI |
| Fixtures and mock data | Scaffolding for stories and local development |

DTOs and fixtures that a shared component needs live in `src/model/` (and `src/shared/` for primitives), **not** in the feature: an organism must not import from `src/features/**`.

### 6.6 Split the component that fetches from the one that renders

An organism never fetches. A section that reads and writes data is **two files**:
- the presentational organism in `src/components/organisms/<Name>/`, fully controlled: data, in-flight state and errors come in as props, intents go out as callbacks;
- a thin **connected wrapper** in `src/features/<feature>/` that owns the hooks and maps errors to copy. Name it after the feature (`ProjectMembersTab` wraps `MembersTab`).

The organism gets the story **(provisional)**; the wrapper stays a thin layer over the hook.

### 6.7 Tier discipline for props

- Atom and molecule props: primitives, callback signatures, `ReactNode`. No DTOs.
- Organism props: DTOs allowed.
- Template props: structural (`children`, `header`, `sidebar`, `content`). No DTOs.
- If a molecule's props start to describe a `ProjectDto`, it is an organism now: move it.

## 7. Server and client components

Next.js App Router components are **server components by default**. Client behavior is opt-in and must be intentional.

**Server components (no directive)**
- May `await`, read cookies and headers, and call server code.
- Must not use `useState`, `useEffect`, `useRef`, browser APIs or event handlers.

**Client components (`"use client"`)**
- Required for hooks, event handlers, browser globals and interactive MUI components (dialogs, inputs, menus).
- Keep the client boundary **narrow**: a `"use client"` leaf inside a server page shell, never a `"use client"` root layout.
- Must not import anything from `src/server/` (secrets, Prisma, Kafka, JWT validation).
- Atomic tier and `"use client"` are orthogonal: an atom is a client component only if it needs state or handlers.

**Route handlers (`route.ts`)**
- Always server. Export named HTTP verbs (`GET`, `POST`, `PATCH`, `DELETE`); no default export.
- Return an `ApiResponse` built by the helpers (section 18).
- `params` is a Promise: `async (request, { params }: { params: Promise<{ projectId: string }> })` and `await params`.

**Middleware.** Keep `middleware.ts` small: gate unauthenticated access to pages, no database calls, no imports from `components/` or `features/`.

## 8. Component standards

### 8.1 Folder shape

```
src/components/organisms/MemberPanel/
  MemberPanel.tsx
  MemberPanel.module.scss
  MemberPanel.stories.tsx     # provisional
  index.ts                    # export { MemberPanel } and its public types
```

### 8.2 Skeleton (organism)

```tsx
"use client";

import { useCallback } from "react";
import { Button } from "@/components/atoms/Button";
import { useT } from "@/hooks/common/useT";
import type { MemberDto } from "@/model/project/member.dto";
import styles from "./MemberRow.module.scss";

type MemberRowProps = {
  readonly member: MemberDto;
  readonly canRemove: boolean;
  readonly onRemove: (memberId: string) => void;
};

export function MemberRow({ member, canRemove, onRemove }: MemberRowProps) {
  const t = useT();

  const handleRemove = useCallback(() => {
    onRemove(member.id);
  }, [member.id, onRemove]);

  return (
    <li className={styles.root}>
      <span className={styles.name}>{member.username}</span>
      {canRemove && <Button onClick={handleRemove}>{t("project.members.remove")}</Button>}
    </li>
  );
}
```

### 8.3 Ordering inside a component file

1. `"use client"` (if needed).
2. Imports: external first, then `@/...`, then relative. The linter enforces order.
3. The props `type` (co-located; exported through `index.ts` only when shared).
4. The component as a **named function** (better stack traces than `const` + arrow).
5. Hooks in stable order: `useState`, `useReducer`, `useRef`, context/data hooks, `useMemo`, `useCallback`, `useEffect`.
6. Derived values.
7. Early returns (loading, error, empty).
8. The JSX return.
9. Private helpers and constants below the component (or hoisted above).

### 8.4 Hard limits (defaults; change only by recorded decision)

| Thing | Limit |
|---|---|
| Atom file | <= 80 lines |
| Molecule file | <= 150 lines |
| Organism file | <= 250 lines |
| Template file | <= 150 lines |
| Feature composition (`*View.tsx`) | <= 300 lines |
| Hook file | <= 150 lines |
| Any file | <= 400 lines |
| Function or handler | <= 30 lines |
| JSX nesting in one return | <= 3 levels |
| Prop drilling | <= 3 levels |

Above a limit, split before adding more.

### 8.5 Props

- Props are TypeScript types, never PropTypes.
- Callback props are concrete: `onRemove: (memberId: string) => void`, never `Function`.
- Do not spread `...rest` onto DOM nodes unless the component is explicitly a passthrough wrapper.
- **Named exports only** for components, re-exported from the folder's `index.ts`. Next's own files (`page.tsx`, `layout.tsx`, `error.tsx`) use default exports; route handlers use named verbs.

### 8.6 Comments

Follow the comment rules in section 26: names explain **what**, comments explain **why**, public API gets a doc comment, and every suppression and TODO carries a reason or an issue link.

### 8.7 Hooks (`src/hooks/`)

Every React hook lives in `src/hooks/`, one hook per file, named `useXxx.ts`. Components, features and pages import hooks from here.

There are **two kinds**, in two places:

| Kind | Folder | Rule | Examples |
|---|---|---|---|
| Generic hook | `src/hooks/common/` | No API calls, no session, no feature knowledge. It may take a loader or action as an argument (`useAsyncData`, `useAsyncAction`). Any tier may use it | `useDebounce`, `useDisclosure`, `useT`, `useAsyncData` |
| Data hook | `src/hooks/<feature>/` | Calls `lib/apiClient` or reads the session. Used only by pages, feature compositions and connected wrappers | `useProjects`, `useProjectMembers`, `useThreadMessages` |

Rules:
- A data hook returns `{ data, error, isLoading, refetch }` plus any write functions (section 11). It is the only layer between a view and `lib/apiClient`.
- Follow the rules of hooks: call hooks at the top level of a component or another hook, and start the name with `use`.
- A hook does one job. Split a hook that fetches, derives and formats at once. A hook file stays within 150 lines.
- A hook never returns JSX and never imports a component. It may import DTOs (`src/model/`), `lib/` and `shared/`.
- A hook that needs the browser (`EventSource`, `window`) is client-only: never import it from a server component.
- The import direction is enforced by lint (section 6.3): `components/**` may import only `@/hooks/common/**`.

## 9. Styling (MUI, Bootstrap, SCSS)

- **MUI** is the component library (typography, component defaults, behavior). Wrap MUI in atoms so the rest of the app does not import MUI directly.
- **SCSS** is the styling language for everything we write ourselves:
  - Component styles are a CSS Module next to the component, `Button/Button.module.scss`, imported as `styles`. Class names are camelCase (`.root`, `.title`, `.isActive`).
  - Global styles live only in `src/styles/` and are imported once in the root layout:
    - `_tokens.scss`: design tokens (colors, spacing, radius, font sizes, breakpoints)
    - `_mixins.scss`: breakpoint and repeated-pattern mixins
    - `_vendor-bootstrap.scss`: the Bootstrap partials we use
    - `globals.scss`: reset, base typography and the imports above
  - Use `@use` / `@forward`, not `@import` (deprecated). Share tokens with `@use "tokens" as t;` (`src/styles` is a Sass load path, set in `next.config.ts`).
  - Define tokens once as **CSS custom properties** (for example `--color-primary`) so SCSS and the MUI theme read the same values **(provisional: exact mechanism)**. Never hard-code a color or spacing value that duplicates a token.
  - Nest at most 3 levels. No ID selectors, no element selectors outside the reset, no `!important`.
  - Responsive: mobile-first, using breakpoint mixins from `_mixins.scss`; no ad hoc media queries.
  - No inline `style={{}}` for anything SCSS or the theme can express.
- **Bootstrap** is allowed **only** for layout utilities (grid, spacing helpers) **(provisional)**. Import just the Bootstrap SCSS partials we need (functions, variables, mixins, grid, utilities) in `_vendor-bootstrap.scss`. Never import all of Bootstrap, and do not use Bootstrap components or JavaScript.
- Never style the same concern with two systems on one element. If a conflict appears, MUI wins for components and SCSS wins for layout.
- Do not restyle MUI internals with global selectors. Use the MUI theme (`styleOverrides`) or `sx` for small adjustments, and a SCSS Module for layout and custom pieces.
- Icons: use one icon set (MUI icons); wrap icons that repeat with domain meaning into an atom (`StatusIcon`) instead of repeating the raw icon. Do not import SVG files directly for icons.

## 10. Internationalization (i18n)

- **Every user-visible string comes from `src/locales/en.json`**. No literals in JSX, `aria-label`, `title`, placeholders or toasts.
- Keys are namespaced and stable: `project.members.add.title`, `error.PROJECT_NOT_FOUND`.
- The i18n library is chosen later **(provisional, for example `next-intl`)**. Components access strings only through one wrapper hook (`useT`), so switching libraries is cheap.
- Server errors arrive as `code`; the UI maps `error.<code>` to a localized message. Never display `message` from the API.
- Dates and numbers are formatted with the active locale.
- Adding Vietnamese later must need **only** a new locale file.

## 11. State and data fetching

**State layers**

| Kind | Tool |
|---|---|
| Local UI state | `useState` / `useReducer` |
| Derived state | Compute during render; `useMemo` only when measurably expensive |
| Cross-component state inside a feature | A hook in `src/hooks/<feature>/` returning `{ state, actions }` |
| App-wide state | A context provider in `components/providers/` (theme, SSE, i18n, session display) |
| Server data | A data hook in `src/hooks/<feature>/` that calls `lib/apiClient` and returns `{ data, error, isLoading, refetch }` |

Do not introduce a global store (Redux, Zustand...) without a recorded decision. Do not cache auth or user data in `localStorage` or `sessionStorage`; the session cookie is authoritative.

**Who fetches**
- Pages, feature compositions and data hooks fetch and pass data **down** as props; actions go **up** through callbacks.
- Organisms receive data via props and never fetch. Molecules and atoms never fetch and never read the session.
- Contexts are for genuinely global state, not to avoid one level of prop drilling.

**Browser-side fetch discipline**
- The browser calls **only our own `/api/**` routes**, always through `lib/apiClient`.
- `lib/apiClient` sends and receives the `ApiResponse<T>` envelope, and throws a typed `ApiError { status, code, errors }` when `status >= 400`. Components never parse raw responses.
- Handle three classes explicitly: success; `401` (session expired: redirect to the login page); any other error (friendly localized message from the error `code`).
- Use `cache: "no-store"` for auth-gated data, or an explicit `revalidate` with a reason in a comment.
- Never show upstream or server error text verbatim.

**Server-data hooks (no server-state library)**
- One data hook per resource or screen, in `src/hooks/<feature>/` (`useProjects`, `useProjectMembers`). It owns `data`, `error`, `isLoading` and a `refetch` function, and hands them to the composition.
- Hooks call only our API routes, through `lib/apiClient`.
- Cancel an in-flight request when the component unmounts or its inputs change (`AbortController`), and ignore stale responses, so a slow response never overwrites a newer one.
- Fire a request only when it has what it needs (a session, an id).
- A write is an async function exposed by the hook (`invite`, `remove`, `leave`). When a write settles, **refetch what the user is looking at**, also when the write failed with `404` or `409` (the row moved).
- **After an action that removes the caller's access (leave a project, delete a project), navigate away first and do not refetch that entity.** Refetching the open detail returns `404`. Refetch only the list the user lands on.
- Read sub-resources lazily (only when the tab that shows them opens); use a cheaper source (a count already on the list) for badges shown earlier.
- Do not fetch the same data in two places: one hook per resource, result passed down.
- An API failure must surface as an **error state**, never as an empty list: the hook sets `error` and the view renders it.
- Initial page data may be loaded in a server component that calls a service directly and passes the result to client components as props, when that removes a loading state **(provisional)**.

**Mock API (development only).** With `NEXT_PUBLIC_USE_MOCK_API=true`, `lib/api-client.ts` answers from `src/lib/mock/` and `lib/sse/event-stream.ts` uses an in-memory stream, so the UI runs without a server. The mock returns the real `ApiResponse` envelope and the codes in `docs/error-codes.md`; when an API shape or code changes, change the mock in the same change. Mock code is loaded with a dynamic import and is not part of a build without the flag. Mock accounts are fixtures, never real credentials.

**SSE on the client.** One `EventSource` per tab for the whole user, managed by a single provider. Components subscribe by `threadId`. Do not open an `EventSource` per component or per project.

## 12. UI behavior and accessibility

**Behavior**
- Destructive actions (delete document, delete thread, remove member, delete project) require a confirmation dialog.
- Show loading, empty and error states for every data view.
- Validation errors from `errors[].field` appear next to the matching input.
- Role-based visibility: owner-only controls (add/remove member, delete project) are hidden for members; the owner has no Leave button.
- Never read the session in an atom or molecule. Auth belongs to pages and data hooks; organisms are given what they need as props.

**Accessibility**
- Semantic HTML first: `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`, `<header>`.
- `role="button"` on a non-button element requires `tabIndex={0}` and a keyboard handler (`Enter` and `Space`).
- Every interactive element has a discernible name: visible text, `aria-label` or `aria-labelledby` (all from locale files).
- Dialogs trap focus and restore it on close (use the MUI dialog primitives).
- Keep sufficient contrast; do not override theme colors with low-contrast overlays.
- Screen-reader-only text uses MUI's `visuallyHidden`, not custom classes.
- Accessibility is validated at the atom and molecule level; organisms and pages inherit it by composition.

## 13. Performance

- Prefer **server components** for anything that needs no interactivity; they ship no JavaScript.
- Use `React.memo` only for demonstrably expensive lists or rows. `useMemo` and `useCallback` only when the dependency is stable and a downstream `memo` or `useEffect` benefits, or the computation is measurably expensive.
- Do not render lists of 1000+ items without virtualization.
- Images use `next/image` with `width`, `height` and `sizes`; no raw `<img>` for content images.
- Lazy-load heavy client dependencies with `next/dynamic` and comment the reason.
- Avoid `useEffect` for derivable state; compute it during render.
- Register the tier barrels in `next.config.ts` `experimental.optimizePackageImports` (`@/components/atoms`, `molecules`, `organisms`, `templates`). Barrels are required for developer experience, but without this setting Next re-evaluates the whole barrel on every import.

---

# Part B - Server (BE)

## 14. Layering

```
Route handler  ->  Service  ->  Repository (Prisma)
   (thin)       (business)        (data access)
```

- **Route handler** (`src/app/api/**/route.ts`): parse and validate input (zod), call **one** service method, return an `ApiResponse`. No Prisma calls, no business rules.
- **Service** (`src/server/services/*`): business rules, permission checks, orchestration (DB + S3 + Kafka). No `Request` or `Response` objects. Takes and returns **DTOs** (`src/server/model/`, and `src/model/` for API shapes).
- **Repository** (`src/server/repositories/*`): the only place that uses Prisma. Returns Prisma results; a mapper turns them into DTOs before they leave the service layer.
- A service never calls a route handler; a repository never calls a service.

Wrap every handler with one helper (`withApiHandler`) that:
1. creates or reads `requestId` and sets `X-Request-Id`,
2. resolves the session when the route requires auth,
3. catches errors and converts them into `ApiResponse`,
4. logs one structured line per request (method, path, status, duration, `requestId`, `userId`).

Handlers never build JSON by hand.

## 15. Authentication and authorization

- **Auth.js** with the Credentials provider (username + password). **bcrypt** for hashing (cost >= 12, configurable). Sign up is not enabled.
- Usernames are unique and compared **case-insensitively** (store a normalized column).
- The JWT only identifies the user (`userId`). It carries **no permissions**. Key every decision on the stable `userId`.
- **Authorization is checked against Postgres on every request**:
  - `requireUser()` loads the user and checks the account is active.
  - `requireProjectRole(projectId, userId, role)` checks membership and role. Use it in every service method that touches a project.
  - Thread access: a thread is readable and writable **only by its owning user**, even for the project owner.
- Check permissions **before** publishing any Kafka message or issuing any presigned URL.
- Path and query parameters are untrusted: they never prove that the caller may access that resource.
- The login endpoint is rate limited; failures return the same error code whether the username or the password was wrong.
- Never store JWTs or user identifiers in `localStorage` or `sessionStorage`.

## 16. Validation and errors

- Validate with `zod` at the edge; derive TypeScript types from the schemas (`z.infer`). Reject bad input with `400` before doing any work, including malformed JSON.
- Throw `AppError(code, httpStatus, details?)` from services. Never throw raw strings or leak Prisma errors and stack traces to clients.
- Error codes live in **one file**, `src/server/errors/codes.ts`, as UPPER_SNAKE constants. Each code is documented in `docs/error-codes.md`.
- HTTP status mapping: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 413 too large, 422 rule violation, 429 rate limited, 500 unexpected. Success: `200` for reads and updates, `201` for creates, `204` for empty deletes. Never return 200 for an error.
- Unexpected errors: log with stack and `requestId`; respond with `INTERNAL_ERROR` and no internals.
- Every `async` operation in a handler or client function is wrapped with a **specific** error class mapped by the central error handler.
- **No empty `catch {}`.** If an error is ignored on purpose, comment why.
- **Error boundaries (UI):** `src/app/error.tsx` handles errors in a route segment and `src/app/global-error.tsx` is the root fallback. Both show a localized message and report the error. Inline errors inside a page use an `ErrorMessage` molecule; never swallow errors silently.
- User-facing copy is short, actionable and non-leaking ("We couldn't load your projects. Please try again."), always from locale files.

## 17. Configuration and secrets

- All environment variables are read in **one module** (`src/server/config/env.ts`) and validated with zod at startup. The app fails fast if a required variable is missing.
- Server-only variables never reach the client bundle. Only `NEXT_PUBLIC_*` values are public; keep them to a minimum.
- Business limits are configuration, not literals: `PROJECT_MAX_TOTAL_BYTES` (default 100 MB), `FILE_MAX_BYTES` (default 50 MB).
- `.env` is gitignored; commit `.env.example` with placeholder values only.
- Never log secrets, tokens, passwords or full request bodies.

## 18. API response envelope

Every API response, success or error, has this shape. Null and undefined fields are omitted from the JSON.

```ts
export interface ApiResponse<T = unknown> {
  status: number;        // same as the HTTP status
  code: string;          // "OK" / "CREATED" on success, stable UPPER_SNAKE code on error
  message: string;       // for debugging; never shown to users
  requestId: string;     // unique per request, also sent as X-Request-Id
  timestamp: string;     // ISO-8601 UTC
  data?: T;
  errors?: { field: string; code: string }[]; // validation errors only
}
```

- Success vs error is told by `status` (`< 400` is success).
- Pagination lives inside `data`: `{ items, page, pageSize, total }`.
- Helpers `ok(data)`, `created(data)`, `fail(error)` are the only way to build responses.
- No URL versioning for now.
- The `ApiResponse` and `ApiError` types live in `src/model/` so the UI and the server share one definition.

## 19. Database (Prisma)

- **The application owns the schema and migrations.** Python services read and write rows but never change the schema. Any schema change goes through `prisma migrate`.
- One shared `PrismaClient` instance (guard against hot-reload duplicates).
- Use `select` and `include` deliberately; avoid fetching whole rows and N+1 queries.
- Multi-step writes that must be consistent use `prisma.$transaction`.
- Raw SQL only when Prisma cannot express the query, always parameterized.
- Deleting a project or document is done by a service that also removes S3 objects and vectors (section 20); deletion order and failure handling are documented in `docs/`.
- Migrations are forward-only, reviewed, and never edited after being applied.
- The seed script creates accounts; passwords come from environment variables or are generated; never commit real passwords.
- Tables written by Python services (document status, saved answers) are listed in `docs/db-ownership.md`; keep that file updated.

## 20. Kafka, S3 and external calls

- Kafka producer and consumer are **singletons created once at server start** (for example in `instrumentation.ts`). Never create a client per request.
- Message formats follow the shared **message contract** **(provisional)**: every message has `schemaVersion`, `requestId`, `projectId`, `threadId` (when relevant) and a typed `payload`. The partition key for chat messages is `threadId`. Incoming messages are parsed with zod.
- Producers publish only after the DB write that justifies the message has committed.
- S3 access uses the AWS SDK with `endpoint` taken from env (so it works with Floci). Uploads use presigned URLs; before issuing one, check permission and `PROJECT_MAX_TOTAL_BYTES`; after the upload, confirm the real size with a HEAD request.
- Each external system (S3, Kafka) is reached through one typed client module. Calls have **timeouts** (`AbortController` or client options), mapped to specific error classes (for example `UpstreamTimeoutError`, `UpstreamError`). Never throw a raw `Response`.
- Do not retry mutating operations automatically. Idempotent reads may retry once with backoff; comment why.

## 21. SSE (token streaming)

- Endpoint: `GET /api/events`; one stream per tab per user; requires a session.
- A single in-process hub maps `userId -> open connections`. The Kafka consumer delivers token messages to the hub by the thread owner's `userId`.
- Event types: `token`, `done`, `error`. Each event carries `threadId` and `messageId`; `error` uses the same codes as the API.
- Send a heartbeat comment periodically; clean up connections on close; set `Cache-Control: no-store` and disable buffering.
- Support catch-up with `Last-Event-ID`, or reload the saved answer from Postgres **(provisional)**.
- The complete answer is saved to Postgres when the stream ends; history never depends on the SSE connection.
- This design assumes a **single application instance**; document any change to that assumption.


## 22. Logging and observability

- Structured JSON logs. Fields: `level`, `time`, `requestId`, `userId` (when known), `msg`, `context`.
- Levels: `debug` for detail, `info` for normal operations, `warn` for degraded behavior, `error` for failures.
- **No `console.log` in committed code.** Use the logger. Client errors go through the error boundaries.
- Pass `requestId` into Kafka messages so a question can be traced from the UI to the services.
- Never log passwords, tokens, API keys, full prompts or document contents.

---

# General

## 23. Testing

**Decision: automated tests are not required for the application at this stage.** Do not add a test runner, test files, mocks or test-only dependencies. Verify a change by running the app and exercising the affected flows by hand.

Because there is no safety net, check these by hand before merging:
- permission rules: owner vs member, thread visible only to its owner, owner cannot leave;
- the project size limit on upload;
- error states and the confirmation step on destructive actions;
- the SSE stream (tokens arrive, `done` ends it, a dropped connection recovers).

If automated tests are introduced later, update this section and the folder shape (sections 2 and 8) first.

## 24. Git, commits and PRs

- Default branch `develop`. Production deploys from `deployment/prod` (not used in this phase).
- Branch names: `<type>/<short-slug>` (for example `feat/project-members`, `fix/sse-reconnect`).
- Commit messages in English, imperative, conventional:

  ```
  <type>(<scope>): <subject>
  ```

  Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`, `build`, `revert`. Scope is the area (`auth`, `sse`, `kafka`, `prisma`, `atoms`, `organisms`, `projects`...).
- Commit-message linting and Git hooks are recommended **(provisional)**.
- One logical change per PR; do not mix a refactor with a behavior change. The description covers what, why, how to verify by hand, and screenshots for UI.
- Do not merge with red CI. Never `--no-verify` a commit. Never force-push a shared branch.

## 25. Forbidden practices

Rejected on review:

- Class components.
- Adding Tailwind, styled-components, CSS-in-JS libraries or any styling system other than SCSS + MUI.
- `any`, `as unknown as Foo`, `@ts-ignore` without a linked issue.
- Direct calls to Kafka, S3 or Prisma from a route handler, or Prisma from a component.
- The browser calling anything except our own API routes.
- `console.log` in committed code.
- `localStorage` or `sessionStorage` for auth or user identity.
- Hard-coded secrets, real IPs, API keys; committing `.env` or generated output (`.next/`, `node_modules/`).
- Hard-coded user-visible strings.
- Inline styles for anything SCSS can express, `!important`, importing all of Bootstrap.
- Files over 400 lines, or over their tier limit (section 8.4).
- Commented-out code, comments that restate the code, a `TODO` without an issue link, or a suppression (`eslint-disable`, `@ts-expect-error`) without a reason (section 26).
- **Atomic violations:**
  - An atom or molecule importing an organism, a feature or a page.
  - An atom or molecule accepting a DTO in its props.
  - An organism calling `fetch` directly.
  - Duplicating a component across features instead of moving it into the shared tree.
  - A presentational component (card, row, sidebar, empty state, dialog) under `src/features/`.
  - Typing a shared component on a type that lives in `src/features/**`.
  - A data hook (one that fetches or reads the session) imported by an atom, molecule or organism.
  - A React hook defined outside `src/hooks/`.

## 26. Comments and documentation

### 26.1 The rule

**Code says what. A comment says why.** Make the code readable with good names first. If a comment only restates the code, delete it or improve the names instead.

**Write a comment when (MUST):**

1. **The reason is not obvious**: a hidden constraint, a business rule, a trade-off, or why the obvious approach does not work.
2. **You work around a quirk of an external system** (Next.js, MUI, the browser, S3/Floci, Kafka). Name the system and the symptom.
3. **A security or ordering decision would look arbitrary**: why permissions are checked before publishing to Kafka, why a comparison is constant-time.
4. **A value is not self-explanatory**: a unit, a format, a range, a magic number, or a regular expression (say what it matches, with an example).
5. **An error is ignored on purpose**: an empty `catch` needs the reason.
6. **A lint, type or style rule is suppressed** (section 26.4).
7. **Two places must change together**: for example "keep in sync with `areax-rag-service/docs/message-contract.md`".
8. **The code is public API** (section 26.2).

**Never write a comment that (MUST NOT):**

- restates the code (`// increment counter`), or is a banner, a section divider or an end-of-block marker;
- is **commented-out code**: delete it, git keeps the history;
- names an author, a date, or a ticket story, or describes change history ("changed by X", "fixed in v2"): that belongs in git and the PR;
- contains a secret, token, real hostname or IP, personal data or customer content;
- complains or blames ("hack", "ugly", "stupid") without a technical explanation;
- is written in a language other than English;
- is a `TODO` without an issue link (section 26.5);
- is out of date. A wrong comment is a bug: fix it in the same change as the code, or delete it.

| Situation | Do this |
|---|---|
| The code is unclear | Rename, extract a function, simplify. Comment only if it is still unclear |
| You need a unit | Put it in the name (`TIMEOUT_MS`, `maxBytes`) before adding a comment |
| You copy a workaround from the web | Say what it fixes and when it can be removed |
| You delete a feature | Delete its comments with it |
| You are unsure whether to comment | Ask "will a reader in six months wonder **why**?" If yes, comment |

```ts
// BAD: restates the code
// loop over the members
for (const member of members) { ... }

// GOOD: explains why
// Members who left keep their threads, so filter by thread owner, not by current membership.
const visibleThreads = threads.filter((thread) => thread.ownerId === userId);
```

### 26.2 Doc comments (TSDoc)

Use `/** ... */` on **public API**:

- exported route handlers;
- service methods, and repository methods whose behavior is not obvious;
- exported hooks and exported helper functions;
- every function in `lib/apiClient`;
- exported types whose fields are not self-explanatory (units, formats, nullable meaning).

Rules:
- Start with a one-sentence summary beginning with a present-tense verb ("Removes a member from a project.").
- Document what a caller cannot see from the signature: **permissions required**, **errors thrown with their codes** (`@throws`), **side effects** (a Kafka message published, an S3 object deleted), and surprising behavior.
- **Do not repeat types**: TypeScript already declares them. Add `@param name - ...` only for a constraint or meaning that the name does not carry.
- Component props: comment a prop only when its meaning, unit or side effect is not obvious.
- Internal helpers need no doc comment; a good name is enough.

```ts
/**
 * Removes a member from a project.
 *
 * Only the owner may call this. The member's threads are kept, so they reappear if the user
 * is added again.
 *
 * @throws AppError `FORBIDDEN` when the caller is not the owner.
 * @throws AppError `OWNER_CANNOT_LEAVE` when the target is the owner.
 */
export async function removeMember(input: RemoveMemberInput): Promise<void> { ... }
```

### 26.3 Comment style

- English, complete sentences, present tense, short. Wrap at the line length.
- Put a comment on the **line above** the code it describes. Trailing comments only for a very short value note.
- `//` for line comments; `/** */` only for doc comments. In JSX use `{/* ... */}` only for a non-obvious reason.
- **SCSS:** use `//` (it stays out of the compiled CSS). Explain magic numbers, `z-index` values and browser workarounds; define the `z-index` scale once in `_tokens.scss`.

  ```scss
  // iOS Safari ignores `100vh` while the address bar is visible, so use the dynamic unit.
  .screen {
    min-height: 100dvh;
  }
  ```
- Reference specs or docs by stable name or URL, not by "see above".
- Do not use `Note:` or `Warning:` prefixes casually; reserve them for things that can cause data loss or a security problem.

### 26.4 Suppressing rules

Every suppression has the **narrowest scope** and a **reason**:

```ts
// eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount; the id never changes
useEffect(() => { ... }, []);

// @ts-expect-error The upstream type is wrong: `owner` can be null (see #123)
```

- Use `@ts-expect-error` with a description, never `@ts-ignore`.
- Do not disable a rule for a whole file unless the file is generated.
- Style rules follow the same pattern: `/* stylelint-disable-next-line rule-name -- reason */`.
- Enforce with `@typescript-eslint/ban-ts-comment` (allow `ts-expect-error` only with a description) and the `require-description` and `no-unlimited-disable` rules of the ESLint comments plugin **(provisional)**.

### 26.5 TODO and FIXME

- Format: `// TODO(#123): imperative action, and why it is deferred`. Use `FIXME(#123)` for a known bug.
- The number is an issue in this repository. A TODO without an issue link must not be merged.
- A TODO is actionable and specific. Remove it in the same change that completes it.

### 26.6 Enforcement and review

- Tooling checks the syntax of doc comments and the suppression rules above **(provisional: `eslint-plugin-jsdoc` or `eslint-plugin-tsdoc`, the ESLint comments plugin)**. A grep in CI for `TODO` without `(#` can be added later.
- Everything else is a review item: reviewers check that comments are true, explain why, and cover the cases in section 26.1. Wrong or noisy comments are review blockers.

### 26.7 Project documentation duties

- `README.md`: purpose, structure, how to run locally (including opening the SSH tunnel), environment variable names, links to `docs/` and this file.
- `docs/` (English): architecture notes, `error-codes.md`, `db-ownership.md`, `environment-variables.md`, message contract references.
- When you change an API shape, an error code, a message contract or table ownership, update the matching document **in the same change**.
- Update this standard when a convention changes; behavior changes to the standard are recorded in `docs/`.

## 27. Review checklist

The author self-checks first; the reviewer repeats it.

**Correctness**
- [ ] Builds, lints and formats clean; strict types with no new `any` or suppressed diagnostics.
- [ ] The changed flows were exercised by hand: happy path, permission denied, error state.

**Atomic design and structure**
- [ ] The component is in the right tier (section 6.2) and its folder has the standard shape (section 8.1).
- [ ] Imports go downward only; atom and molecule props carry no DTOs.
- [ ] Presentational components are under `src/components/<tier>/`, not under `src/features/`; types they need are in `src/model/` or `src/shared/`.
- [ ] Pages are under `src/app/(pages)/`; DTOs are in `src/model/` (UI) or `src/server/model/` (BE); no Prisma entity leaves a service.
- [ ] Hooks are in `src/hooks/` (generic in `common/`, data hooks per feature); components import only generic hooks.
- [ ] File sizes are within the limits.

**Architecture**
- [ ] The server/client boundary is correct: `"use client"` only where needed, no `src/server/` import in client code.
- [ ] Route handlers are thin: validate, call one service, return `ApiResponse`.
- [ ] Env values come only from the validated env module.

**UI**
- [ ] No hard-coded user-visible strings; error `code` maps to a locale key.
- [ ] Styles are SCSS Modules: no inline styles, no `!important`, no full Bootstrap import.
- [ ] Loading, empty and error states exist; destructive actions ask for confirmation.
- [ ] Accessibility: semantic HTML, keyboard reachable, discernible names.

**Security**
- [ ] Every API route except login requires a session.
- [ ] Every project operation calls `requireProjectRole`; thread operations check thread ownership.
- [ ] Inputs are validated with zod; file names and sizes are validated before a presigned URL is issued.
- [ ] No secrets in code, logs or responses; stack traces and internal messages never reach clients.
- [ ] Security headers are set (CSP, `X-Content-Type-Options`, `Referrer-Policy`). The app runs over HTTP until a domain exists, so avoid HTTPS-only assumptions and plan the switch.
- [ ] Dependencies are pinned through the lockfile.

**Hygiene**
- [ ] Conventional commit; no `console.log`, no TODO without an issue link.
- [ ] Comments follow section 26: they explain **why**, are true, are in English, and no code is commented out.
- [ ] Public API has a doc comment (permissions, errors, side effects); every suppression has a reason.
- [ ] New error codes are in `codes.ts` and `docs/error-codes.md`; docs and README updated.
