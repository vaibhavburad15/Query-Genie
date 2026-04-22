<p align="center">
  <h1 align="center">🧞 Query Genie</h1>
  <p align="center">
    <strong>Talk to your database in plain English — powered by AI.</strong>
  </p>
  <p align="center">
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-api-reference">API Reference</a> •
    <a href="#-project-structure">Project Structure</a> •
    <a href="#-license">License</a>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/python-3.10+-blue?logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite">
    <img src="https://img.shields.io/badge/LangChain-0.3-1C3C3C?logo=langchain&logoColor=white" alt="LangChain">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  </p>
</p>

---

## 📖 Overview

**Query Genie** is an intelligent database assistant that lets users interact with MySQL databases using natural language. Powered by **Groq's LLaMA 3.3 70B** model via **LangChain**, it translates everyday English questions into optimized SQL queries, executes them safely, and presents results in beautiful, interactive tables — all through a modern React dashboard.

---

## ✨ Features

| Category | Feature | Description |
|----------|---------|-------------|
| 🤖 **AI Chat** | Natural Language to SQL | Ask questions in plain English; AI converts them to SQL automatically |
| 🤖 **AI Chat** | Context-Aware Conversations | Maintains last 5 interactions for smarter query generation |
| 🤖 **AI Chat** | Chat Sessions | Save, rename, and manage multiple conversation sessions |
| 🗄️ **Database** | MySQL Support | Connect to any MySQL database with full CRUD operations |
| 🗄️ **Database** | Database Browser | List databases, create new ones, browse tables & schemas |
| 🗄️ **Database** | Table Schema Viewer | Inspect columns, types, keys, and constraints for any table |
| 📊 **Visualization** | Interactive Data Tables | Sort, search, and paginate query results |
| 📊 **Visualization** | Custom Dashboards | Create dashboards with line, bar, pie, area & scatter charts |
| 📊 **Visualization** | Drag & Drop Charts | Rearrange dashboard charts with drag-and-drop (dnd-kit) |
| 📊 **Visualization** | Export Results | Export query results to CSV format |
| 🔐 **Security** | Email OTP Verification | Secure sign-up with 6-digit OTP sent via Gmail |
| 🔐 **Security** | Bcrypt Password Hashing | Industry-standard password encryption |
| 🔐 **Security** | Destructive SQL Warnings | Confirmation dialog before `DELETE`, `DROP`, `UPDATE`, `ALTER`, `TRUNCATE` |
| 🔐 **Security** | SQL Injection Protection | Blocks multi-statement queries, comment injection & unsafe patterns |
| 🔐 **Security** | Rate Limiting | API-level throttling with SlowAPI (login, OTP, chat) |
| ⚡ **Performance** | Query Caching | In-memory cache with 5-minute TTL for repeated queries |
| ⚡ **Performance** | Connection Pooling | SQLAlchemy pool with pre-ping, recycle & overflow settings |
| ⚡ **Performance** | Code Splitting | Lazy-loaded React pages for faster initial load |
| 🎨 **UI/UX** | Dark / Light Theme | Toggle between themes with system preference detection |
| 🎨 **UI/UX** | Responsive Design | Mobile-friendly layout built with Tailwind CSS + shadcn/ui |
| ⭐ **Extras** | Favorite Queries | Save & tag frequently used queries for quick access |
| ⭐ **Extras** | Query History & Stats | Track execution history, success rates & performance metrics |
| ⭐ **Extras** | User Settings | Customizable preferences (theme, language, results per page) |

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| [FastAPI](https://fastapi.tiangolo.com/) | High-performance Python API framework |
| [LangChain](https://langchain.com/) | LLM orchestration & prompt chaining |
| [Groq](https://groq.com/) (LLaMA 3.3 70B) | Ultra-fast LLM inference |
| [SQLAlchemy](https://www.sqlalchemy.org/) | ORM & database connection management |
| [SQLite](https://www.sqlite.org/) | Internal user/session storage |
| [MySQL Connector](https://dev.mysql.com/doc/connector-python/en/) | User database connectivity |
| [Pydantic](https://docs.pydantic.dev/) | Request/response validation |
| [SlowAPI](https://github.com/laurentS/slowapi) | Rate limiting middleware |
| [Passlib + Bcrypt](https://passlib.readthedocs.io/) | Password hashing |

### Frontend

| Technology | Purpose |
|------------|---------|
| [React 18](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework |
| [shadcn/ui](https://ui.shadcn.com/) | Accessible component library (Radix UI) |
| [Recharts](https://recharts.org/) | Chart/visualization library |
| [React Router](https://reactrouter.com/) | Client-side routing |
| [TanStack Query](https://tanstack.com/query) | Server state management |
| [dnd-kit](https://dndkit.com/) | Drag and drop toolkit |
| [Zod](https://zod.dev/) | Schema validation |

---

## 🏗️ Architecture

```
┌──────────────────────────────┐
│         React Frontend       │
│  (Vite + TypeScript + SWC)   │
│                              │
│  Auth ─── Chat ─── Dashboard │
│   │        │          │      │
│   └────────┴──────────┘      │
│            │ Axios            │
└────────────┼─────────────────┘
             │ REST API
┌────────────┼─────────────────┐
│         FastAPI Backend      │
│                              │
│  ┌─────────┐  ┌───────────┐  │
│  │ LangChain│  │ SQLAlchemy│  │
│  │ + Groq  │  │    ORM    │  │
│  └────┬────┘  └─────┬─────┘  │
│       │             │        │
│  NL → SQL      Query Exec   │
└───────┼─────────────┼────────┘
        │             │
   ┌────┴────┐   ┌────┴────┐
   │  Groq   │   │  MySQL  │
   │  Cloud  │   │   DB    │
   └─────────┘   └─────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+ & npm
- **MySQL** 5.7+ (for the database you want to query)
- **Groq API Key** — [Get one free](https://console.groq.com/)
- **Gmail App Password** — [Create one](https://myaccount.google.com/apppasswords) (requires 2FA enabled)

### 1. Clone the Repository

```bash
git clone https://github.com/vaibhavburad15/Query-Genie.git
cd Query-Genie
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment (recommended)
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Email Configuration (Gmail SMTP)
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password_here
```

> **Note:** For Gmail, you must enable **2-Factor Authentication** first, then create an [App Password](https://support.google.com/accounts/answer/185833). Regular passwords will not work.

#### Start the Backend Server

```bash
cd backend
uvicorn backend:app --reload --port 8000
```

The API will be running at **`http://localhost:8000`**  
Interactive docs available at **`http://localhost:8000/docs`** (Swagger UI)

### 3. Frontend Setup

```bash
# Open a new terminal
cd Query-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be running at **`http://localhost:5173`**

---

## 🗄️ Database Configuration

### Connecting to a MySQL Database

1. Log in to Query Genie
2. Click the **"Connect Database"** button on the dashboard
3. Enter your MySQL credentials:

| Field | Example |
|-------|---------|
| Host | `localhost` |
| Port | `3306` |
| Username | `root` |
| Password | `your_password` |
| Database | `my_database` |

### Sample Database Setup (Optional)

```sql
CREATE DATABASE sample_store;
USE sample_store;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    amount DECIMAL(10, 2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob', 'bob@example.com');

INSERT INTO orders (user_id, amount, status) VALUES
  (1, 99.99, 'completed'),
  (1, 49.50, 'pending'),
  (2, 150.00, 'completed');
```

---

## 💡 Usage Examples

Once connected to your database, try asking:

**Simple Queries**
```
"Show me all users"
"How many orders are there?"
"What are the table names?"
```

**Aggregations**
```
"What is the average order amount?"
"Show me total sales by user"
"Count orders by status"
```

**Joins & Relationships**
```
"Show me users with their orders"
"Find users who have never placed an order"
"List top 5 users by order count"
```

**Filtering**
```
"Show orders from the last 30 days"
"Find users whose email contains 'gmail'"
"List orders greater than $100"
```

**Data Modifications** *(with safety confirmation)*
```
"Delete orders older than 1 year"
"Update user status to active"
"Create a new table for products"
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/send-otp` | Send OTP to email (5/min limit) |
| `POST` | `/api/signup` | Register with OTP verification |
| `POST` | `/api/login` | Login with email & password (10/min limit) |
| `GET` | `/api/profile/{user_id}` | Get user profile |

### Database

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/connect` | Connect to MySQL database |
| `POST` | `/api/disconnect` | Disconnect current database |
| `POST` | `/api/list-databases` | List all databases on server |
| `POST` | `/api/create-database` | Create a new database |
| `GET` | `/api/database-tables` | Get all tables with metadata |
| `GET` | `/api/table-schema/{table}` | Get column details for a table |
| `GET` | `/api/search/tables?query=` | Search tables and columns |

### Chat & Queries

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send natural language query (60/min limit) |
| `POST` | `/api/confirm-sql` | Confirm/reject destructive SQL |
| `POST` | `/api/export` | Export query results |

### Sessions & History

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions/{user_id}` | Get all chat sessions |
| `POST` | `/api/sessions` | Create a new session |
| `PUT` | `/api/sessions/{session_id}` | Update session messages |
| `DELETE` | `/api/sessions/{session_id}` | Delete a session |
| `GET` | `/api/history/{user_id}` | Get query execution history |
| `GET` | `/api/history/{user_id}/stats` | Get query statistics |

### Dashboards

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboards/{user_id}` | Get all dashboards |
| `POST` | `/api/dashboards` | Create a dashboard |
| `PUT` | `/api/dashboards/{dashboard_id}` | Update a dashboard |
| `DELETE` | `/api/dashboards/{user_id}/{dashboard_id}` | Delete a dashboard |

### User Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/favorites/{user_id}` | Get favorite queries |
| `POST` | `/api/favorites` | Save a favorite query |
| `DELETE` | `/api/favorites/{id}` | Remove a favorite |
| `GET` | `/api/settings/{user_id}` | Get user settings |
| `PUT` | `/api/settings/{user_id}` | Update user settings |
| `GET` | `/api/tip-of-the-day` | Get a random SQL tip |

---

## 📁 Project Structure

```
Query-Genie/
├── backend/
│   ├── backend.py              # Main FastAPI application (all endpoints)
│   ├── extended_models.py      # Additional SQLAlchemy models
│   ├── sql_system_prompt.py    # System prompt for SQL generation
│   ├── migration.py            # Database migration utilities
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (not committed)
│   ├── users.db                # SQLite database (auto-generated)
│   └── tests/
│       ├── conftest.py         # Pytest fixtures & configuration
│       ├── test_unit.py        # Unit tests
│       └── test_integration.py # Integration tests
│
├── Query-frontend/
│   ├── src/
│   │   ├── App.tsx             # Root component with routing
│   │   ├── main.tsx            # Application entry point
│   │   ├── pages/
│   │   │   ├── Index.tsx       # Landing page
│   │   │   ├── AuthPage.tsx    # Login & signup page
│   │   │   ├── DashboardPage.tsx    # Main chat dashboard
│   │   │   └── Customdashboard.tsx  # Custom chart dashboard
│   │   ├── components/
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── chat/           # Chat interface components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   └── ui/             # shadcn/ui components
│   │   ├── contexts/           # React context providers
│   │   ├── services/           # API service layer
│   │   ├── hooks/              # Custom React hooks
│   │   └── lib/                # Utility functions
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── requirements.txt            # Root-level Python dependencies
├── LICENSE                     # MIT License
└── README.md                   # This file
```

---

## 🧪 Testing

The project includes both **unit** and **integration** tests.

```bash
# Navigate to the backend directory
cd backend

# Run all tests
pytest tests/ -v

# Run only unit tests
pytest tests/test_unit.py -v

# Run only integration tests
pytest tests/test_integration.py -v

# Run with coverage report
pytest tests/ -v --cov=. --cov-report=term-missing
```

---

## 🛡️ Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | Bcrypt via Passlib with automatic salt |
| **OTP Verification** | 6-digit codes with 5-minute expiry, max 5 attempts |
| **Rate Limiting** | SlowAPI middleware — 5 OTP/min, 10 login/min, 60 chat/min |
| **SQL Safety Validation** | Blocks multi-statement, comment injection, DROP/TRUNCATE |
| **Destructive Op Warnings** | User confirmation required for DELETE, UPDATE, ALTER |
| **Connection Pooling** | SQLAlchemy with pre-ping, recycle, and overflow limits |
| **Input Validation** | Pydantic models + email-validator for all requests |
| **CORS Configuration** | Configurable allowed origins |
| **Thread-Safe OTP** | Thread-locked storage with automatic cleanup |

---

## 🔮 Roadmap

- [ ] PostgreSQL & SQLite support for user databases
- [ ] Excel / CSV file upload and querying
- [ ] Multi-user collaboration & shared sessions
- [ ] Query templates library
- [ ] Voice-to-SQL input
- [ ] Query result visualization auto-suggestions
- [ ] Docker Compose one-command setup

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m "Add amazing feature"`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Vaibhav Burad**

[![GitHub](https://img.shields.io/badge/GitHub-vaibhavburad15-181717?logo=github)](https://github.com/vaibhavburad15)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Vaibhav_Burad-0A66C2?logo=linkedin)](https://www.linkedin.com/in/vaibhav-burad-278414243/)

---

<p align="center">
  Made with ❤️ by Vaibhav Burad
</p>
