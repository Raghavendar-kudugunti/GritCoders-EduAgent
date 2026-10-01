# <img src="artifacts/eduagent/public/logo.svg" alt="" width="38" align="top" /> EduAgent

<div align="center">

### Learn AI from where you are.

An adaptive AI tutor that turns your goals and starting knowledge into a learning path you can actually follow—from Python and machine learning to generative AI, RAG, and MLOps.

[![CI](https://github.com/Raghavendar-kudugunti/GritCoders-EduAgent/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Raghavendar-kudugunti/GritCoders-EduAgent/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-9fbd45.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-FastAPI-3776AB?logo=python&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-React-149ECA?logo=react&logoColor=white)

<br />

[Get started](#quick-start) · [How it works](#how-it-works) · [Evaluate the learner paths](#adaptive-learning-and-evaluation) · [Contribute](#contributing)

</div>

## A learning path that adapts

Most learning plans begin with a fixed syllabus. EduAgent first asks what you want to learn and uses a short diagnostic to estimate your starting point. It then builds and saves a path around your focus, role, and prior knowledge. As you complete lessons and scored practice, later activities can adjust their level of support or challenge.

| 🧭 Find your starting point | 🧠 Learn by doing | 💬 Ask with context | 🤝 Learn together |
| --- | --- | --- | --- |
| Short onboarding and a focus-specific path | Visual explanations, code, projects, and interactive practice | Curriculum-aware tutor plus search over your own notes | Match with signed-in learners and use direct or group chats |

## How it works

```mermaid
flowchart LR
    A[Focus and diagnostic] --> B[LangGraph learning workflow]
    B --> C[Personalized path]
    C --> D[Lessons and practice]
    D --> E[Scored progress]
    E --> B
    F[Tutor question] --> G{Intent router}
    G -->|Concepts, comparisons, paths| H[Connected curriculum retrieval]
    G -->|Facts and uploaded notes| I[Document search]
    H --> J[LLM response]
    I --> J
```

## What you can do

- **Build a personal path:** explore AI foundations, Python, machine learning, deep learning, generative AI, retrieval-augmented generation, data engineering, and MLOps.
- **Study a concept in different ways:** use visual concept flows, concise explanations, code examples, mini projects, and related learning resources.
- **Practice interactively:** complete different practice activities; successfully scored attempts inform future lesson and practice difficulty. Unscored attempts do not affect score analytics.
- **Ask a tutor:** conceptual, comparison, and path questions use connected curriculum concepts. Fact checks and document questions search notes uploaded by the learner.
- **Study with peers:** find other signed-in learners through saved interests and progress, then continue in direct or group conversations.
- **Track progress:** review scored-practice trends and completed learning activity in a PostgreSQL-backed profile.

<details>
<summary><strong>About tutor retrieval and uploaded files</strong></summary>

The tutor's curriculum route is GraphRAG-style retrieval over the app's connected curriculum catalog. It does not use a separate graph database or embedding/vector search. The document route searches the current learner's uploaded TXT, Markdown, CSV, or HTML files (up to 5 MB each). The tutor does not have live web search. Uploaded documents are private to the signed-in account.

</details>

## Architecture

| Layer | Technology |
| --- | --- |
| Web app | React, TypeScript, Vite, TanStack Query, Clerk |
| API and agent workflows | Python, FastAPI, LangGraph |
| Persistence | PostgreSQL, SQLAlchemy |
| LLM provider | OpenAI-compatible chat completions API; sample settings use Groq, with optional Gemini failover |
| Workspace | pnpm monorepo |

## Requirements

- Node.js 24 (Node.js 20+ may work, but the Replit configuration uses Node 24)
- Python 3.10 or newer
- PostgreSQL 14 or newer
- Corepack (included with supported Node.js releases) or pnpm 10
- An LLM provider API key
- A Clerk application for sign-in

## Quick start

### Windows PowerShell

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
| `LLM_FALLBACK_API_KEY` | Optional backup provider key; leave blank to disable failover |
| `LLM_FALLBACK_BASE_URL` | Backup OpenAI-compatible endpoint (defaults to Gemini) |
| `LLM_FALLBACK_MODEL` | Required model name when a backup key is configured |
| `LLM_TIMEOUT_SECONDS` | Per-provider request timeout; defaults to 30 seconds |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key used by the backend to locate signing keys |
| `CLERK_SECRET_KEY` | Clerk secret key, required for the Clerk proxy endpoint |
| `VITE_CLERK_PUBLISHABLE_KEY` | The same publishable key, exposed to the frontend build |
| `VITE_CLERK_PROXY_URL` | Leave blank for standard Clerk development setup; use `/api/__clerk` only when your Clerk setup is configured to use this app's proxy |

Keep `.env` private. Do not commit it or paste its contents into issues or chat. `.env.example` contains placeholders and is safe to commit.

To enable Gemini failover, set `LLM_FALLBACK_API_KEY` and `LLM_FALLBACK_MODEL` in your local `.env`; keep the fallback base URL at its default unless you choose another compatible provider. The OpenAI-compatible Gemini endpoint is supported by the current client, but provider/model availability and quotas depend on your account. Restart the backend after changing these values.

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

## Adaptive learning and evaluation

The LangGraph onboarding flow estimates a starting level and builds a role/focus-specific path. Successfully graded practice is saved with a scoring flag and topic-level performance signal. Later lesson and practice generation uses those signals to add scaffolding after low scores or offer deeper application after repeated strong scores. If the grader/provider is unavailable, the attempt is marked unscored and excluded from score analytics. Lesson completion remains learner-controlled. An optional second OpenAI-compatible provider can be configured for LLM failover; the default backup endpoint is Gemini, and it remains disabled until a fallback key and model are configured.

Data engineering and machine learning lessons include an optional project using a public UDISE+ school-count dataset from data.gov.in. It uses the downloadable dataset page rather than requiring a data.gov.in API key. The exercise focuses on inspecting and visualizing aggregates and calls out limits: the data is not student-level and school counts are not learning outcomes.

The learner dashboard shows scored-attempt averages and descriptive early/recent score changes. Practice time is estimated at five minutes per successfully scored attempt. These values are progress signals, not causal learning-gain claims. Run the synthetic 12-persona fallback evaluation with `python scripts/evaluate_personas.py --mode fallback`; see [`eval/README.md`](eval/README.md) and [`eval/RESULTS.md`](eval/RESULTS.md) for the data, current numbers, traces, and limits. The personas are project-authored and are not official hackathon-provided cases.

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

## Contributing

Contributions are welcome. Open an issue to discuss a larger change, or submit a pull request with a focused description of what changed and how you checked it. The GitHub Actions workflow runs Python syntax checks and the frontend typecheck/build for pushes and pull requests to `main`.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
