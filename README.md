# Query Genie

Query Genie is an AI database assistant that lets users ask questions in plain English, generates read-only SQL from the active schema, executes the query, and presents the result as tables, charts, saved favorites, history, and custom dashboards.

The project is split into a FastAPI backend and a React/Vite frontend.

## Project Snapshot

- Natural-language SQL chat for SQL databases, SQLite files, CSV uploads, and Excel uploads.
- Metadata browsing for MongoDB and Redis.
- Email OTP signup, password hashing, bearer auth tokens, and per-user database session tokens.
- Query result tables, chart visualizations, CSV/JSON export, favorites, chat sessions, query history, and custom dashboards.
- LLM generation through local Ollama when enabled, with token-budgeted Groq/LangChain fallback available through environment configuration.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI |
| Data UI | Recharts, dnd-kit, html2canvas |
| API | FastAPI, Pydantic, SlowAPI |
| Database layer | SQLAlchemy, SQLite internal storage, MySQL/PostgreSQL/MariaDB/Oracle/SQL Server/Db2/SQLite connectors |
| File sources | CSV, Excel through temporary SQLite snapshots |
| Auth | Passlib bcrypt, bearer tokens, email OTP |
| LLM | Ollama, Groq, LangChain |

## Supported Sources

| Source | Query chat | Browse/list | Create database | Notes |
| --- | --- | --- | --- | --- |
| MySQL | Yes | Yes | Yes | Default guided source |
| PostgreSQL | Yes | Yes | Yes | Includes custom handling for `vector` reflection |
| MariaDB | Yes | Yes | Yes | Uses MySQL-compatible connection flow |
| Microsoft SQL Server | Yes | Yes | No | Requires SQL Server ODBC driver |
| Oracle Database | Yes | Direct connection | No | Uses service name |
| IBM Db2 | Yes | Direct connection | No | Requires Db2 Python driver support |
| SQLite | Yes | Direct file path | No | Local `.db` or `.sqlite` path |
| CSV | Yes | Uploaded file | No | Staged as a temporary SQLite database |
| Excel | Yes | Uploaded workbook | No | Each sheet becomes a queryable table |
| MongoDB | No | Yes | No | Metadata browsing only |
| Redis | No | Active DB metadata | No | Metadata browsing only |

## Architecture

```text
React/Vite frontend
  - auth pages
  - landing page
  - chat dashboard
  - custom dashboard builder
        |
        | REST API with bearer auth and X-DB-Session
        v
FastAPI backend
  - user auth and OTP
  - per-user source sessions
  - schema inspection
  - LLM prompt generation
  - read-only SQL execution
  - favorites, history, settings, dashboards
        |
        +-- Internal SQLite: users, sessions, history, dashboards
        +-- User data sources: SQL databases, files, MongoDB, Redis
        +-- LLM providers: Ollama or Groq
```

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- A database or file source to connect
- Optional: local Ollama server and model
- Optional: Groq API key
- Optional: Gmail app password for email OTP signup

Some database drivers need system-level setup. SQL Server needs an ODBC driver, and enterprise databases such as Oracle or Db2 may need native client dependencies depending on your environment.

## Backend Setup

From the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `backend/.env`:

```env
# LLM configuration
USE_OLLAMA=true
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=deepseek-coder
GROQ_API_KEY=your_groq_api_key_here

# Email OTP configuration
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password_here

# Optional
AUTH_SESSION_TTL=604800
```

Start the API:

```bash
uvicorn backend:app --reload --port 8000
```

The API runs at `http://localhost:8000`, and Swagger docs are available at `http://localhost:8000/docs`.

## LLM Provider Behavior

Query Genie keeps the Ollama and Groq paths separate:

- Ollama receives the full rich prompt from `build_sql_prompt()`, including the complete system rules, schema context, and conversation history.
- Groq parses that same flat prompt inside `call_groq()` and sends a compact message pair instead: a cached dialect-specific `SystemMessage` plus a request-specific `HumanMessage`.
- Groq schema context is capped at `GROQ_MAX_SCHEMA_CHARS = 6000`, chat history is trimmed to `GROQ_MAX_HISTORY_TURNS = 6`, and SQL output is capped at `GROQ_MAX_TOKENS_OUT = 512`.
- This keeps the Groq fallback friendly to free-tier token-per-minute limits while preserving the local Ollama prompt quality.

## Frontend Setup

Open a second terminal from the repository root:

```bash
cd Query-frontend
npm install
```

The frontend defaults to `http://localhost:8000` for the API. If your backend runs elsewhere, create `Query-frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

Start Vite:

```bash
npm run dev
```

The Vite dev server is configured for `http://127.0.0.1:8082`.

## Main Routes

| Route | Description |
| --- | --- |
| `/` | Landing page |
| `/auth` | Login/signup with OTP signup flow |
| `/dashboard` | Protected chat dashboard |
| `/custom-dashboard` | Protected dashboard builder |

## Important API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/send-otp` | Send signup OTP |
| `POST` | `/api/signup` | Create user and auth session |
| `POST` | `/api/login` | Login and return bearer token |
| `POST` | `/api/logout` | Revoke current auth token |
| `POST` | `/api/list-databases` | List databases for supported servers |
| `POST` | `/api/create-database` | Create supported SQL databases |
| `POST` | `/api/connect` | Connect to a source and issue `X-DB-Session` token |
| `POST` | `/api/connect-file` | Upload CSV/Excel and create a temporary queryable snapshot |
| `GET` | `/api/connection-status` | Check active source connection |
| `GET` | `/api/database-tables` | List tables, collections, or metadata |
| `GET` | `/api/table-schema/{table_name}` | Inspect table or collection schema |
| `POST` | `/api/chat` | Generate and execute a read-only SQL answer |
| `GET/POST/PUT/DELETE` | `/api/chat-sessions` | Manage chat sessions |
| `GET/POST/DELETE` | `/api/favorites` | Manage saved queries |
| `POST` | `/api/export` | Export result data as CSV or JSON |
| `GET/POST/PUT/DELETE` | `/api/custom-dashboards` | Persist custom dashboards |

## Security Notes

- Do not commit `.env` files or real credentials.
- Rotate any API keys, app passwords, or database credentials that have ever been shared or committed.
- Database connections are stored as per-user session records and used through the `X-DB-Session` header.
- SQL generation is validated against read-only prefixes such as `SELECT`, `WITH`, `SHOW`, `DESCRIBE`, `EXPLAIN`, and `PRAGMA`.
- Write SQL confirmation is currently disabled on the backend.

## Project Structure

```text
.
|-- backend/
|   |-- backend.py              # FastAPI app and API routes
|   |-- extended_models.py      # SQLAlchemy models for favorites/settings/history
|   |-- migration.py            # Database migration helper
|   |-- requirements.txt        # Backend dependencies
|   `-- sql_system_prompt.py    # LLM system prompt
|-- Query-frontend/
|   |-- src/
|   |   |-- components/         # UI, auth, chat, dashboard components
|   |   |-- contexts/           # Auth, theme, database session state
|   |   |-- hooks/              # Query/chat helpers
|   |   |-- lib/                # Data source definitions and utilities
|   |   |-- pages/              # Landing, auth, dashboard routes
|   |   `-- services/           # API clients
|   |-- package.json
|   `-- vite.config.ts
|-- README.md
`-- Query_Genie_Presentation.md
```

## Useful Commands

```bash
# Backend
cd backend
uvicorn backend:app --reload --port 8000

# Frontend
cd Query-frontend
npm run dev
npm run build
npm run lint
```

## Troubleshooting

If the frontend cannot reach the backend, confirm `VITE_API_URL` and make sure the FastAPI server is running on the same URL.

If signup OTP fails, confirm `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD`. Gmail requires an app password, not a normal account password.

If chat generation fails, confirm that either Ollama is reachable with the configured model or `GROQ_API_KEY` is set.

If a database connection fails, confirm the source driver is installed, the host/port is reachable, and the credentials have permission to inspect schemas and run read-only queries.
