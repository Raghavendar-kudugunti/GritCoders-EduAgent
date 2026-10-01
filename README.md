# EduAgent

EduAgent is an adaptive AI learning app. Learners choose a focus, complete a short diagnostic, and get a saved learning path with interactive lessons and practice. The tutor routes conceptual questions through connected curriculum concepts and can search a learner's uploaded notes.

## Features

- React learning app with sign-in, onboarding, dashboard, adaptive path, practice, topic map, and tutor.
- FastAPI backend organized around LangGraph workflows.
- PostgreSQL persistence for learner profiles, paths, lesson completion, practice, tutor messages, and private tutor documents. Tables are created automatically when the backend starts.
- Personalized curriculum covering AI foundations, Python, machine learning, deep learning, generative AI, RAG, data engineering, and MLOps.
- Tutor routing: conceptual/comparison/path questions use graph-style retrieval over the curriculum; fact checks and document lookups use keyword-based retrieval over the learner's uploaded files.
- Uploads support TXT, Markdown, CSV, and HTML files up to 5 MB each. Documents are private to the signed-in account.

The tutor does not have live web search. Its GraphRAG-style route uses the app's connected curriculum catalog, and its document route searches uploaded files. It does not use a separate graph database or embedding/vector search yet.

## Tech stack

- Frontend: React, TypeScript, Vite, TanStack Query, Clerk
- Backend: Python, FastAPI, LangGraph, SQLAlchemy
- Database: PostgreSQL
- Language model: OpenAI-compatible chat completions API (the sample configuration uses Groq)
- Workspace: pnpm monorepo

## Requirements

- Node.js 24 (Node.js 20+ may work, but the Replit configuration uses Node 24)
- Python 3.10 or newer
- PostgreSQL 14 or newer
- Corepack (included with supported Node.js releases) or pnpm 10
- An LLM provider API key
- A Clerk application for sign-in

## Local setup on Windows PowerShell

### 1. Configure environment variables

Copy the example file and edit the copy:

```powershell
Copy-Item .env.example .env
```

Set these values in `.env`:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string, for example `postgresql://postgres:YOUR_PASSWORD@localhost:5432/eduagent` |
| `LLM_API_KEY` | API key for the configured model provider |
| `LLM_BASE_URL` | OpenAI-compatible API base URL; the example uses Groq |
| `LLM_MODEL` | Model name supported by that provider |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key used by the backend to locate signing keys |
| `CLERK_SECRET_KEY` | Clerk secret key, required for the Clerk proxy endpoint |
| `VITE_CLERK_PUBLISHABLE_KEY` | The same publishable key, exposed to the frontend build |
| `VITE_CLERK_PROXY_URL` | Leave blank for standard Clerk development setup; use `/api/__clerk` only when your Clerk setup is configured to use this app's proxy |

Keep `.env` private. Do not commit it or paste its contents into issues or chat. `.env.example` contains placeholders and is safe to commit.

Create a PostgreSQL database before starting the backend. For example, in `psql`:

```sql
CREATE DATABASE eduagent;
```

### 2. Install and start the backend

Open PowerShell in the project root:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 5000
```

The API is at `http://127.0.0.1:5000`. Open `http://127.0.0.1:5000/docs` for the FastAPI API reference. A health check is available at `http://127.0.0.1:5000/health`.

### 3. Install and start the frontend

Open a second PowerShell window in the project root:

```powershell
npm install --global pnpm@10
pnpm --version
pnpm install
$env:PORT = "5173"
$env:BASE_PATH = "/"
pnpm --filter @workspace/eduagent dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the backend on port 5000.

If PowerShell blocks virtual-environment activation, run this for the current terminal and activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Useful commands

From the project root:

```powershell
pnpm run typecheck
pnpm run build
```

The API contract is maintained in `lib/api-spec/openapi.yaml`. The generated client command is available in the `@workspace/api-spec` package; it requires the workspace dependencies to be installed.

## Project layout

```text
agent/                      Existing LangGraph learning workflow
backend/                    FastAPI routes, PostgreSQL models, curriculum, and tutor router
artifacts/eduagent/          React application
artifacts/api-server/        Additional workspace API artifact
artifacts/mockup-sandbox/    UI mockup sandbox
lib/api-spec/                OpenAPI source of truth
lib/api-client-react/        React API client and generated hooks
lib/db/                      Shared database workspace package
```

## Before publishing to GitHub

1. Review `git status --short` and check every file you plan to include.
2. Confirm `.env` is ignored with `git check-ignore -v .env`. Commit `.env.example`, never `.env`.
3. Review local assets before staging. `attached_assets/Untitled_2_1790748909879.pdf` and the `screenshots/` images are not referenced by the app source; remove them from the commit if they contain private or unrelated material.
4. Keep local state and generated caches out of the commit: `.venv/`, `node_modules/`, `.pnpm-store/`, `.uv-cache/`, `.agents/`, and `.conversation/` are ignored.
5. Run the frontend typecheck/build and make sure the backend starts with a local PostgreSQL database and valid Clerk/LLM configuration.
6. Inspect the staged file list and diff before committing:

   ```powershell
   git add README.md .gitignore .env.example .npmrc .replit .replitignore replit.md agent artifacts backend lib package.json pnpm-lock.yaml pnpm-workspace.yaml pyproject.toml requirements.txt scripts tsconfig.base.json tsconfig.json uv.lock
   git diff --cached --name-only
   git diff --cached
   ```

   Only stage `attached_assets/`, `screenshots/`, or other extra files if you intend to publish them. If a secret was ever committed, deleting it from the latest files is not enough; rotate the credential and remove it from Git history before publishing.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
