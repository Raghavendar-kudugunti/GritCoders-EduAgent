# EduAgent

An adaptive learning companion for anyone learning AI, from foundations and math through generative AI, agents, and MLOps.

## Run & Operate

- `uv run uvicorn backend.main:app --reload --port 5000` — run the FastAPI API and LangGraph workflows (requires `DATABASE_URL`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `DATABASE_URL` for PostgreSQL, `LLM_API_KEY` for LangGraph operations, Clerk's `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for the API, plus `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CLERK_PROXY_URL=/api/__clerk` for the React app. See `.env.example` for variable names; use Replit Secrets for deployed values.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: FastAPI + LangGraph (Python)
- DB: PostgreSQL through SQLAlchemy; tables are created at API startup
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Python dependencies: `requirements.txt` / `pyproject.toml`

## Where things live

- `artifacts/eduagent/src/App.tsx` — frontend routes, shared shell, and learning flows.
- `artifacts/eduagent/src/index.css` — the EduAgent visual system and responsive styles.
- `lib/api-spec/openapi.yaml` — source of truth for dashboard, path, practice, peer, and tutor APIs.
- `backend/main.py` and `backend/learning.py` — FastAPI endpoints matching the React app's `/api` contract.
- `backend/workflows.py` and `agent/` — LangGraph orchestration and adaptive tutor nodes.

## Architecture decisions

- The first release uses one shared learning API contract so the dashboard, roadmap, practice, topics, peers, and tutor views stay aligned.
- The experience is intentionally broad across AI learning rather than being framed as only AI engineering.
- The API seeds each learner's initial profile, dashboard, and path in PostgreSQL on first access. Onboarding, diagnostics, practice attempts, tutor messages, and LangGraph tutor sessions are persisted in PostgreSQL. Tables are created automatically on startup. Clerk authenticates API calls.

## Product

- Personalized dashboard with progress, streak, weekly learning rhythm, focus areas, and next action.
- Adaptive learning path from foundations through generative AI, agents, and MLOps.
- Daily practice with completion feedback and a lightweight diagnostic calibration flow.
- Browseable topic map, peer discovery, and tutor conversation with suggested prompts.

## User preferences

- Learning should cover everything under AI, not only AI engineering.

## Gotchas

- Vite builds require `PORT` and `BASE_PATH` when run outside the managed workflow, e.g. `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/eduagent run build`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
