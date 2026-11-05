# 01 - Functional requirements

> Labels: **Decided** / **Proposed** (see `00-overview.md`). FR codes are used for reference.

## 1. Accounts and login

- **FR-1** There is a **login** page using username and password. (Decided)
- **FR-2** Accounts are **created in advance by a seed script**. There is no sign up in this phase. (Decided)
- **FR-3** There is **no global admin** yet. (Decided)
- **FR-4** The seed script contains no real passwords: they come from environment variables or are generated randomly. (Proposed)
- **FR-5** A username is unique; comparison is case-insensitive. (Proposed)

## 2. Home page and projects

- **FR-6** After login, the user lands on the **home page**, which lists the projects they belong to. (Decided)
- **FR-7** A user can **create a project**; the creator becomes the **owner**. (Decided)

## 3. Members and roles

- **FR-8** There are only two roles: **owner** and **member**. There is no viewer. (Decided)
- **FR-9** The owner **adds a user to the project directly** by **username**; the user does not need to accept. Only existing accounts can be added. (Decided)
- **FR-10** The owner can **remove** a member. A member can **leave**. **The owner cannot leave.** (Decided)
- **FR-11** When a user is removed or leaves, their threads and messages are **kept**. If they are added back, they **see their old threads again**. (Decided)

## 4. Sources (documents)

- **FR-12** Members **upload documents** to the project; all members see the project's documents. (Decided)
- **FR-13** Supported formats: **PDF with a text layer, Docx, MD, TXT**, up to **50MB per file**. (Proposed)
- **FR-14** **No OCR.** A scanned PDF or an image without text shows the status "content cannot be read". (No OCR is decided; how it is shown is proposed)
- **FR-15** **YouTube** is supported as a source: the video's **captions (CC)** become a document. (Decided)
- **FR-16** The total file size of a project is **at most 100MB**; the value is configurable. YouTube captions count by text size. (100MB decided; the counting rule is proposed)
- **FR-17** **Both owner and member can delete documents.** Deleting a document removes both the file and its vectors; the UI needs a confirmation step. (Decided)
- **FR-18** Documents are processed **asynchronously**; the UI shows each document's status (processing, ready, failed). (Proposed)

## 5. Project prompt

- **FR-19** Each project has **one shared prompt**, used for every question in the project. (Decided)
- **FR-20** **Every member can edit the prompt**, not only the owner. (Decided)

## 6. Chat

- **FR-21** Users ask questions based on the project's documents. (Decided)
- **FR-22** A project has **many threads**; each thread has its own context. A user can start a new thread. (Decided)
- **FR-23** **Each user sees only their own threads.** Even the owner cannot see a member's threads. (Decided)
- **FR-24** A user **can delete their own threads**; nobody can delete another person's thread. (Decided)
- **FR-25** Answers **stream token by token**. (Decided)
- **FR-26** The answer **follows the language of the question**. (Decided)
- **FR-27** **No source citations** are needed. (Decided)
- **FR-28** The context sent to the LLM contains: the project's shared prompt, the messages in that thread, and passages retrieved from the project's documents. (Proposed)

## 7. Deleting a project

- **FR-29** **Only the owner can delete a project.** Deleting a project removes everything: database records (project, members, threads, messages), files and vectors. (Decided)

## 8. Permission table

| Action | Owner | Member |
|---|---|---|
| View project and documents | Yes | Yes |
| Upload / delete documents | Yes | Yes |
| Edit the project prompt | Yes | Yes |
| Create threads, chat, delete own threads | Yes | Yes |
| View other people's threads | No | No |
| Add / remove members | Yes | No |
| Leave the project | No | Yes |
| Delete the project | Yes | No |

## 9. Out of scope

Sign up, global admin, source citations, OCR, extra NotebookLM-style features (automatic summaries, suggested questions...), and per-user OpenAI cost limits (the user will do this later).
