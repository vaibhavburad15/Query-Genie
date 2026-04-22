# 🧞 Query Genie — Complete Project Presentation Document

> **Project Name:** Query Genie  
> **Author:** Vaibhav Burad  
> **Date:** April 2026  
> **Tagline:** *Talk to your database in plain English — powered by AI.*

---

## 📌 Table of Contents

1. [What is Query Genie?](#1--what-is-query-genie)
2. [The Problem It Solves](#2--the-problem-it-solves)
3. [How It Works — Simple Explanation](#3--how-it-works--simple-explanation)
4. [Complete Architecture Overview](#4--complete-architecture-overview)
5. [Tech Stack — Every Technology Explained](#5--tech-stack--every-technology-explained)
6. [🤖 AI / LLM Deep Dive — The Brain of Query Genie](#6---ai--llm-deep-dive--the-brain-of-query-genie)
7. [🔐 DATA SECURITY — Your Data NEVER Goes to the AI](#7---data-security--your-data-never-goes-to-the-ai)
8. [Authentication & User Security](#8--authentication--user-security)
9. [SQL Safety & Injection Protection](#9--sql-safety--injection-protection)
10. [All Features Explained](#10--all-features-explained)
11. [Database Design](#11--database-design)
12. [Frontend Architecture](#12--frontend-architecture)
13. [API Endpoints Summary](#13--api-endpoints-summary)
14. [Performance Optimizations](#14--performance-optimizations)
15. [Project File Structure](#15--project-file-structure)
16. [Summary — Key Talking Points](#16--summary--key-talking-points)

---

## 1. 🌟 What is Query Genie?

### In One Line
Query Genie is a **web application** that lets anyone talk to a MySQL database using **normal English** instead of writing complex SQL code.

### The Simple Metaphor
Imagine you have a huge filing cabinet (that's your database) with thousands of folders (those are your tables) containing records. Normally, to find information, you'd need to learn a special language called **SQL** (Structured Query Language). Query Genie acts as a **smart translator** — you tell it what you want in everyday English, and it automatically writes the SQL code, runs it on your database, and shows you the results in a beautiful table.

### Example
Instead of writing this complex SQL:
```sql
SELECT department, AVG(salary) as avg_salary 
FROM employees 
GROUP BY department 
ORDER BY avg_salary DESC 
LIMIT 5
```

You simply type:
> **"Show me the top 5 departments with the highest average salary"**

Query Genie's AI understands your question, generates the correct SQL, executes it safely, and displays the results.

---

## 2. 💡 The Problem It Solves

| Problem | Query Genie Solution |
|---------|---------------------|
| SQL is hard to learn and has complex syntax | Users type in plain English |
| Small mistakes in SQL cause errors or data loss | AI generates optimized, correct SQL |
| Database exploration requires technical knowledge | Visual browser to see tables, columns, and schemas |
| No quick way to visualize database data | Built-in charts (line, bar, pie, area, scatter) |
| Accidental data deletion is easy with SQL | Safety warnings before any destructive operation |
| SQL injection attacks are a constant threat | Multiple layers of SQL validation and blocking |

---

## 3. 🔄 How It Works — Simple Explanation

Here's the journey of a single user question, step by step:

### Step-by-Step Flow

```
STEP 1: User types "Show me all employees who earn more than 50000"
   ↓
STEP 2: The question is sent from the browser (React frontend) to the server (FastAPI backend)
   ↓
STEP 3: The backend reads the DATABASE SCHEMA (table names, column names, column types)
         ⚠️ It reads ONLY the STRUCTURE — NOT the actual data inside the tables
   ↓
STEP 4: The backend sends THREE things to the AI (Groq LLaMA model):
         a) System instructions (rules for generating SQL)
         b) The database SCHEMA (structure only — not data!)
         c) The user's English question
   ↓
STEP 5: The AI returns ONLY a SQL query string, for example:
         "SELECT * FROM employees WHERE salary > 50000"
   ↓
STEP 6: The backend performs SAFETY CHECKS on the generated SQL:
         - Is it trying to DROP a table? ❌ BLOCKED
         - Does it have multiple statements (injection)? ❌ BLOCKED
         - Does it contain SQL comments (injection technique)? ❌ BLOCKED
   ↓
STEP 7: If it's a dangerous operation (DELETE, UPDATE, ALTER):
         → Ask user for CONFIRMATION before executing
   ↓
STEP 8: The SQL is executed DIRECTLY on the user's MySQL database
         (The AI never touches the database — only the backend does)
   ↓
STEP 9: Results are sent back to the frontend and displayed in a beautiful table
```

> [!IMPORTANT]
> **The AI (LLM) only sees the database STRUCTURE (table names, column names, data types). It NEVER sees or receives the actual DATA stored in your tables.** This is the most critical security feature.

---

## 4. 🏗️ Complete Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                              │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              React Frontend (Vite + TypeScript)           │  │
│   │                                                          │  │
│   │   Landing ─── Auth ─── Chat Dashboard ─── Chart Builder  │  │
│   │     Page      Page      (Main Page)       (Dashboards)   │  │
│   │                                                          │  │
│   │   Uses: React 18, Tailwind CSS, shadcn/ui, Recharts      │  │
│   └──────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
│                    Axios HTTP Requests                           │
│                    (REST API calls)                              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                    Internet / localhost
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                     BACKEND SERVER                               │
│                  (FastAPI — Python)                               │
│                                                                  │
│   ┌──────────────┐  ┌────────────────┐  ┌───────────────────┐   │
│   │ Auth System   │  │ Chat / AI      │  │ Dashboard/Export  │   │
│   │ - Login       │  │ - LangChain    │  │ - Charts CRUD     │   │
│   │ - Signup      │  │ - Groq API     │  │ - CSV/JSON Export │   │
│   │ - OTP Email   │  │ - SQL Safety   │  │ - Favorites       │   │
│   │ - Bcrypt      │  │ - Query Cache  │  │ - History         │   │
│   └──────┬───────┘  └───────┬────────┘  └───────┬───────────┘   │
│          │                  │                    │               │
│    ┌─────┴──────────────────┴────────────────────┴─────┐        │
│    │              SQLAlchemy ORM Layer                   │        │
│    │     (Manages all database connections safely)       │        │
│    └─────┬──────────────────────────────────────┬──────┘        │
│          │                                      │               │
│   ┌──────┴──────┐                        ┌──────┴──────┐        │
│   │   SQLite    │                        │   MySQL     │        │
│   │  (users.db) │                        │  (User's    │        │
│   │ Stores:     │                        │  Database)  │        │
│   │ - Users     │                        │ Stores:     │        │
│   │ - Sessions  │                        │ - User data │        │
│   │ - Settings  │                        │ - Business  │        │
│   │ - History   │                        │   data      │        │
│   └─────────────┘                        └─────────────┘        │
│                                                                  │
│          │ (Only schema sent)                                    │
│          ▼                                                       │
│   ┌─────────────────┐                                           │
│   │   Groq Cloud     │  ← External AI Service                   │
│   │   LLaMA 3.3     │                                           │
│   │   70B Model     │  Returns: SQL query string only            │
│   └─────────────────┘                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Key Point: TWO Separate Databases

| Database | Technology | Purpose | What It Stores |
|----------|-----------|---------|---------------|
| **Internal DB** | SQLite (`users.db`) | App's own data | User accounts, chat sessions, settings, favorites, history, dashboards |
| **User's DB** | MySQL (external) | User's actual data | Whatever the user connects — business data, records, etc. |

These two databases are **completely separate**. The internal SQLite database runs automatically. The MySQL database is whatever the user connects to.

---

## 5. 🛠️ Tech Stack — Every Technology Explained

### Backend Technologies

| Technology | What It Is (Simple) | Why We Use It | Version |
|-----------|-------------------|--------------|---------|
| **Python** | A programming language, easy to read and write | The main language for our backend server | 3.10+ |
| **FastAPI** | A framework to build web APIs (servers that respond to requests) | Super fast, automatic documentation, data validation | 0.115 |
| **LangChain** | A toolkit to connect and work with AI models | Makes it easy to build AI-powered applications with structured prompts | 0.3 |
| **Groq** | A cloud service that runs AI models ultra-fast | Provides the LLaMA 3.3 70B AI model with extremely low latency (fast responses) | Cloud |
| **LLaMA 3.3 70B** | An AI model made by Meta (Facebook), with 70 billion parameters | Understands English and generates accurate SQL queries | 70B Versatile |
| **SQLAlchemy** | A Python toolkit to work with databases | Manages database connections safely, prevents SQL injection | 2.0.36 |
| **SQLite** | A lightweight database stored in a single file | Stores user accounts, sessions, settings (internal app data) | Built-in |
| **MySQL Connector** | A Python library to connect to MySQL databases | Lets users connect to their own MySQL databases | 9.1.0 |
| **Pydantic** | A data validation library | Ensures all incoming requests have the correct format | 2.10.0 |
| **SlowAPI** | Rate limiting middleware | Prevents abuse by limiting how many requests a user can make | 0.1.9 |
| **Passlib + Bcrypt** | Password hashing libraries | Encrypts passwords so they can never be read, even if the database is stolen | 1.7.4 |
| **python-dotenv** | Environment variable loader | Safely loads secret keys (API keys, passwords) from a `.env` file | 1.0.0 |
| **email-validator** | Email validation library | Checks if email addresses are real and properly formatted | 2.1.0 |
| **Uvicorn** | An ASGI web server | Actually runs the FastAPI application | 0.32.0 |

### Frontend Technologies

| Technology | What It Is (Simple) | Why We Use It | Version |
|-----------|-------------------|--------------|---------|
| **React 18** | A JavaScript framework for building user interfaces | The most popular frontend framework; makes building interactive UIs easy | 18 |
| **TypeScript** | JavaScript with type checking | Catches bugs before they happen by checking data types | 5.8 |
| **Vite** | A build tool and development server | Ultra-fast page reloading during development | 5 |
| **Tailwind CSS** | A CSS framework using utility classes | Makes styling fast and consistent without writing custom CSS | Latest |
| **shadcn/ui** | A component library built on Radix UI | Provides beautiful, accessible, pre-built UI components (buttons, dialogs, etc.) | Latest |
| **Recharts** | A charting library for React | Creates beautiful line, bar, pie, area, and scatter charts | Latest |
| **React Router** | A routing library | Handles navigation between pages (login, dashboard, etc.) | Latest |
| **TanStack Query** | Server state management library | Efficiently caches and syncs data from the backend | Latest |
| **dnd-kit** | Drag and drop toolkit | Lets users rearrange charts on their custom dashboards | Latest |
| **Zod** | Schema validation library | Validates form inputs on the frontend | Latest |
| **Axios** | HTTP client library | Makes API calls from the frontend to the backend | Latest |

---

## 6. 🤖 AI / LLM Deep Dive — The Brain of Query Genie

### What is an LLM?

**LLM** stands for **Large Language Model**. Think of it as a computer program that has "read" billions of pages of text from the internet (books, articles, code, documentation) and learned patterns in language. It can:
- Understand natural language (English, Hindi, etc.)
- Generate text, code, translations
- Follow instructions given to it

In Query Genie, we use an LLM to **understand English questions and generate SQL code**.

### Which LLM Do We Use?

| Property | Value |
|----------|-------|
| **Model Name** | LLaMA 3.3 70B Versatile |
| **Made By** | Meta (Facebook/Instagram's parent company) |
| **Parameters** | 70 Billion (70,000,000,000 learned values) |
| **Hosted On** | Groq Cloud (not on our server) |
| **API Provider** | Groq (provides ultra-fast inference) |
| **Cost** | Free tier available |
| **Temperature** | 0 (deterministic — same question always gives same answer) |
| **Max Tokens** | 500 (limits response length to prevent rambling) |

### What is Groq?

Groq is a **cloud AI service** that hosts and runs AI models. Instead of running the massive 70-billion parameter model on our own computer (which would require extremely expensive hardware), we send a request to Groq's servers, and they run the model for us and send back the result. Think of it like using Google Search — you don't run Google's servers yourself; you just type a query and get results.

### What is LangChain?

**LangChain** is a Python framework that makes it easy to build applications using LLMs. Instead of manually writing code to:
- Format prompts
- Call the AI API
- Parse the response
- Chain multiple steps together

LangChain provides ready-made building blocks. In Query Genie, we use LangChain to:
1. **Create a prompt template** with the system instructions + schema + question
2. **Call the Groq API** to get the AI's response
3. **Parse the response** to extract the SQL query
4. **Chain steps together** in a pipeline

### The Complete AI Pipeline — Step by Step

Here is exactly what happens when you type a question:

#### Step 1: The System Prompt (Instructions for the AI)

Before the AI sees any user question, it receives a **240-line instruction manual** (stored in `sql_system_prompt.py`). This tells the AI:

```
"You are an expert MySQL database assistant. Given a user's question 
and a database schema, you must:
1. Understand the user's intent
2. Analyze the schema structure
3. Generate ONE valid MySQL query
4. Return ONLY the SQL — nothing else"
```

Key rules in the system prompt:
- ✅ Return ONLY the SQL statement
- ✅ NO markdown formatting
- ✅ NO explanations
- ✅ NO comments
- ✅ NO semicolons
- Contains **50+ examples** of natural language → SQL translations
- Contains rules for GROUP BY, JOINs, date handling, etc.
- Contains error prevention guidelines

> [!NOTE]
> The system prompt is like giving an employee a detailed job manual before they start working. The AI follows these rules for every single question.

#### Step 2: Getting the Database Schema

The system calls `db.get_table_info()` which returns the **structure** of the database. For example:

```sql
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    department VARCHAR(50),
    salary DECIMAL(10,2),
    hire_date DATE
)

CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dept_name VARCHAR(100),
    manager_id INT
)
```

> [!CAUTION]
> **CRITICAL: This is ONLY the schema (structure) — table names, column names, and data types. The actual DATA inside the tables (employee names, salaries, etc.) is NEVER sent to the AI.**

#### Step 3: Chat History Context

The system formats the **last 5 conversations** to give the AI context. But notice — it only sends:
- What the user **asked** (the English question)
- What SQL was **generated**
- A **summary** of the result (column names and row count only)

```python
# From the actual code (format_chat_history function):
formatted.append(f"""
Previous Query #{idx}:
User Asked: "{user_msg}"
SQL Generated: {sql_query}
Result Schema: {schema_info}   # ← Only "Columns: name, salary | Rows: 5"
""")
```

> [!IMPORTANT]
> **Even in chat history, ONLY metadata is sent (column names, row count). The actual data values are NEVER included.**

#### Step 4: Building the Prompt

LangChain creates a **structured prompt** combining all three pieces:

```
┌──────────────────────────────────────────────────┐
│ SYSTEM MESSAGE (240 lines of instructions)        │
├──────────────────────────────────────────────────┤
│ USER MESSAGE:                                     │
│                                                   │
│ Database Schema:                                  │
│   CREATE TABLE employees (id INT, name VARCHAR..) │
│   CREATE TABLE departments (id INT, dept_name..)  │
│                                                   │
│ Previous Conversations:                           │
│   #1 User asked: "show all tables"                │
│      SQL: SELECT TABLE_NAME FROM...               │
│      Result: Columns: TABLE_NAME, Rows: 3         │
│                                                   │
│ Current User Question:                            │
│   "Show me employees earning more than 50000"     │
│                                                   │
│ Instructions: Generate ONLY the SQL query          │
└──────────────────────────────────────────────────┘
```

#### Step 5: AI Generates the SQL

The AI processes the prompt and returns **only** a SQL string:

```sql
SELECT * FROM employees WHERE salary > 50000
```

#### Step 6: Post-Processing

The backend cleans up the response:
1. Removes any markdown formatting (```sql blocks) if the AI accidentally added them
2. Removes trailing semicolons
3. Strips whitespace

```python
# Actual code from backend.py:
if sql_query.startswith("```"):
    sql_query = re.sub(r'^```[\w]*\n?', '', sql_query)
    sql_query = re.sub(r'\n?```$', '', sql_query)
    sql_query = sql_query.strip()
sql_query = sql_query.rstrip(';')
```

#### Step 7: Safety Validation (Before Execution)

The SQL goes through **multiple safety checks** before it touches the database. (See Section 9 for full details.)

#### Step 8: Execution on UserMs Database

The **backend server** (not the AI) executes the SQL on the user's MySQL database using SQLAlchemy, retrieves the results, and sends them to the frontend.

### Visual Summary of the AI Pipeline

```
┌──────────┐     ┌──────────────┐     ┌───────────────┐
│  User    │────▶│   Backend    │────▶│  Groq Cloud   │
│  types   │     │   (FastAPI)  │     │  (LLaMA 3.3)  │
│  English │     │              │     │               │
│  question│     │ Sends:       │     │ Receives:     │
│          │     │ 1. Rules     │     │ 1. Rules      │
│          │     │ 2. Schema    │     │ 2. Schema     │
│          │     │ 3. Question  │     │ 3. Question   │
│          │     │              │     │               │
│          │     │ Does NOT     │     │ Returns:      │
│          │     │ send DATA!   │     │ SQL string    │
└──────────┘     └──────┬───────┘     └───────────────┘
                        │
                        │ Backend executes
                        │ SQL on MySQL
                        ▼
                 ┌──────────────┐
                 │  User's      │
                 │  MySQL DB    │
                 │              │
                 │  Returns     │
                 │  actual data │
                 └──────────────┘
```

---

## 7. 🔐 DATA SECURITY — Your Data NEVER Goes to the AI

This is the **most important section** for your presentation. Many people worry: *"If I'm using AI, is my data being sent to some company's server?"* The answer is **NO**.

### The Golden Rule of Query Genie

> **Your actual database DATA (rows, records, personal information, business data) NEVER leaves your server. It NEVER goes to the AI. The AI only sees the STRUCTURE (table names and column names).**

### Proof from the Code

Let's trace exactly what is sent to the AI:

#### What IS Sent to the AI (Groq/LLaMA):

| What | Example | Sensitive? |
|------|---------|-----------|
| System prompt (instructions) | "You are an expert MySQL assistant..." | ❌ No — generic rules |
| Database schema (structure) | `CREATE TABLE employees (id INT, name VARCHAR(100), salary DECIMAL)` | ⚠️ Low risk — only table/column names |
| User's English question | "Show me all employees" | ❌ No — user's own question |
| Previous query metadata | "Columns: id, name | Rows: 5" | ❌ No — just column names and count |

#### What is NEVER Sent to the AI:

| What | Example | Why Not? |
|------|---------|---------|
| ❌ Actual row data | "John Doe, $50,000, Engineering" | Never included in the prompt |
| ❌ Database passwords | "root:password123" | Only used locally for MySQL connection |
| ❌ User passwords | "mySecretPass" | Hashed with bcrypt, never stored as plain text |
| ❌ Query results | "[{name: 'Alice', salary: 99000}, ...]" | Returned directly to frontend, never sent to AI |
| ❌ User personal info | Email, name, etc. | Stored in local SQLite, never sent to AI |

### How the Data Flows — Security Diagram

```
     YOUR DATA STAYS HERE                    AI ONLY SEES THIS
     (Never leaves)                         (Structure only)
     ─────────────────                      ──────────────────

  ┌─────────────────────┐              ┌─────────────────────┐
  │    MySQL Database    │              │     Groq Cloud      │
  │                      │              │     (LLaMA AI)      │
  │  Actual Data:        │              │                     │
  │  ┌─────────────────┐ │              │  Sees:              │
  │  │ John | $50,000  │ │   NEVER ──▶  │  "Table: employees" │
  │  │ Alice| $75,000  │ │   SENT       │  "Columns: id,      │
  │  │ Bob  | $60,000  │ │              │   name, salary"     │
  │  └─────────────────┘ │              │                     │
  │                      │              │  Does NOT see:      │
  │  This data goes      │              │  "John", "$50,000"  │
  │  DIRECTLY to your    │              │  or any actual data │
  │  browser only        │              │                     │
  └──────────┬───────────┘              └─────────────────────┘
             │
             │ Query results go
             │ directly to browser
             ▼
  ┌─────────────────────┐
  │   Your Browser       │
  │   (Frontend)         │
  │                      │
  │   Displays data in   │
  │   beautiful tables   │
  └─────────────────────┘
```

### Code Evidence — The `get_sql_chain` Function

Here is the actual function that builds what is sent to the AI (from `backend.py`, line 477):

```python
def get_sql_chain(db, chat_history: list = []):
    # What goes to the AI:
    user_template = """Database Schema:
    {schema}          ← ONLY table structure (CREATE TABLE...)
    
    {history}         ← ONLY previous questions + column names
    
    Current User Question:
    {question}        ← The user's English question
    
    Instructions:
    - Generate ONLY the SQL query, nothing else"""
    
    # The schema is fetched like this:
    def get_schema(_):
        return db.get_table_info()  # ← Returns CREATE TABLE statements ONLY
```

The `db.get_table_info()` function from LangChain returns only DDL (Data Definition Language) — the `CREATE TABLE` statements that describe the structure. It does **not** run `SELECT * FROM table` or fetch any data.

### Where Does the Actual Data Go?

After the AI returns the SQL query string, the **backend server itself** executes the query:

```python
# This happens on YOUR server, not on the AI:
connection = db._engine.connect()
result_proxy = connection.execute(text(sql_query))  # Runs on YOUR MySQL
columns = list(result_proxy.keys())
rows = result_proxy.fetchall()
# Results are sent DIRECTLY to the user's browser
```

The data travels: **MySQL → Backend Server → User's Browser**. The AI is completely out of this loop.

### Additional Security: Database Passwords

When you connect to your MySQL database, the password is:
1. Sent **only** to the backend server via HTTPS
2. Used to create a connection string stored **only in server memory** (`app.state.db_uri`)
3. **NEVER** stored in localStorage — the frontend explicitly excludes it:

```typescript
// From DatabaseContext.tsx — PASSWORD IS NOT STORED:
localStorage.setItem('dbConnection', JSON.stringify({
    host: data.host,
    port: data.port,
    user: data.user,
    database: data.database,
    type: data.type
    // PASSWORD NOT STORED!
}));
```

---

## 8. 🔑 Authentication & User Security

### Signup Flow (Email OTP Verification)

```
User fills signup form
        │
        ▼
Clicks "Send OTP"
        │
        ▼
Backend generates 6-digit random OTP ──────▶ Sends via Gmail SMTP
(e.g., 847293)                                to user's email
        │
        ▼
OTP stored in server memory with:
  - 5-minute expiry timer
  - Max 5 verification attempts
  - Thread-safe storage (OtpManager class)
  - Auto-cleanup after expiry
        │
        ▼
User enters OTP from email ──────▶ Backend verifies:
                                    ✅ OTP matches?
                                    ✅ Not expired (< 5 min)?
                                    ✅ Under attempt limit (< 5)?
        │
        ▼
If valid: Account created with HASHED password
If invalid: Error message returned
```

### Password Hashing — Bcrypt

When a user signs up, their password is **never stored as plain text**. Here's what happens:

```
User enters: "MyPassword123"
                   │
                   ▼
        Bcrypt hashing algorithm
        (adds random "salt" + hashes)
                   │
                   ▼
Stored in database: "$2b$12$LJ3m4jG8x7uP9kQ5wR3..."
```

| Aspect | Detail |
|--------|--------|
| **Algorithm** | Bcrypt (industry standard) |
| **Implementation** | Passlib library with `CryptContext(schemes=["bcrypt"])` |
| **Salt** | Automatic random salt for every password |
| **Reversible?** | NO — even the developer cannot recover the original password |
| **If database is stolen** | Attacker cannot read passwords — they are one-way hashed |

### Login Security

```python
# From backend.py:
@app.post("/api/login")
@limiter.limit("10/minute")  # ← Maximum 10 login attempts per minute
async def login_for_access_token(request, form_data, db):
    user = get_user(form_data.identifier, db)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
```

Security features:
- **Rate limited** to 10 attempts per minute (prevents brute force attacks)
- **Generic error message** ("Incorrect email or password") — doesn't reveal if the email exists
- **Bcrypt verification** — compares hashed values, not plain text

### Rate Limiting Summary

| Endpoint | Limit | Why |
|----------|-------|-----|
| `/api/send-otp` | 5 per minute | Prevents OTP spam/abuse |
| `/api/login` | 10 per minute | Prevents brute force password attacks |
| `/api/chat` | 60 per minute | Prevents AI API abuse and cost overrun |

---

## 9. 🛡️ SQL Safety & Injection Protection

### What is SQL Injection?

SQL injection is when a malicious user tries to trick the system into running harmful SQL code. For example, instead of asking a normal question, they might try:

```
"Show me all users; DROP TABLE users; --"
```

If unprotected, this could **delete the entire users table**.

### Query Genie's Multi-Layer Protection

#### Layer 1: SQL Safety Validation (`validate_sql_safety` function)

```python
def validate_sql_safety(sql: str) -> Tuple[bool, str]:
    sql_upper = sql.upper().strip()
    
    # Block DROP and TRUNCATE entirely
    if sql_upper.startswith(("DROP", "TRUNCATE")):
        return False, "DROP and TRUNCATE operations are not allowed"
    
    # Block multiple statements (classic SQL injection technique)
    statements = sql.split(";")
    if len([s for s in statements if s.strip()]) > 1:
        return False, "Multiple SQL statements are not allowed"
    
    # Block SQL comment injection
    if "--" in sql or "/*" in sql or "*/" in sql:
        return False, "SQL comments are not allowed for security"
    
    return True, ""
```

**What this blocks:**
| Attack | Example | Result |
|--------|---------|--------|
| DROP table | `DROP TABLE users` | ❌ BLOCKED |
| TRUNCATE table | `TRUNCATE TABLE orders` | ❌ BLOCKED |
| Multi-statement injection | `SELECT 1; DROP TABLE users` | ❌ BLOCKED |
| Comment injection | `SELECT * FROM users --admin` | ❌ BLOCKED |
| Block comment injection | `SELECT * FROM users /* bypass */` | ❌ BLOCKED |

#### Layer 2: Dangerous Operation Detection

```python
DANGEROUS_KEYWORDS = ["DROP", "TRUNCATE", "DELETE", "ALTER", "UPDATE"]

def detect_dangerous_sql(sql: str):
    sql_upper = sql.upper()
    return [kw for kw in DANGEROUS_KEYWORDS if kw in sql_upper]
```

If any dangerous keyword is found, the system **sends a confirmation dialog** to the user before executing. The user must explicitly click "Yes, I'm sure" before the SQL runs.

#### Layer 3: Database Name Validation

When creating databases, names are validated against a regex pattern:
```python
if not re.match(r'^[a-zA-Z0-9_]+$', request.database_name):
    raise ValueError("Database name can only contain letters, numbers, and underscores")
```

This prevents special characters that could be used for injection.

#### Layer 4: Input Validation (Pydantic)

Every API request is validated using Pydantic models:
```python
class ChatRequest(BaseModel):
    question: str          # Must be a string
    chat_history: list = [] # Must be a list

class UserCreate(BaseModel):
    email: EmailStr        # Must be a valid email format
    password: str          # Must be a string
    otp: str              # Must be a string
```

If the data doesn't match the expected format, the request is rejected before any processing.

#### Layer 5: Email Validation

```python
from email_validator import validate_email, EmailNotValidError

try:
    validate_email(otp_request.email)
except EmailNotValidError as e:
    raise HTTPException(status_code=400, detail=f"Invalid email address: {str(e)}")
```

Emails are validated for proper format before OTP is sent or accounts are created.

---

## 10. ✨ All Features Explained

### 🤖 AI Chat Features

| Feature | How It Works |
|---------|-------------|
| **Natural Language to SQL** | User types English → AI generates SQL → Backend executes → Results displayed |
| **Context-Aware Conversations** | Keeps last 5 interactions so the AI can understand follow-up questions like "now filter that by department" |
| **Chat Sessions** | Save, rename, and manage multiple conversation threads — like separate chat windows |

### 🗄️ Database Features

| Feature | How It Works |
|---------|-------------|
| **MySQL Connection** | Enter host, port, username, password, database name → connects to any MySQL server |
| **Database Browser** | Lists all databases on the server, lets you switch between them |
| **Create Database** | Create a new empty database directly from the UI |
| **Table Schema Viewer** | Click any table to see all columns, their types, keys (PRI, UNI, MUL), and constraints |
| **Table Search** | Search across all tables and columns to find what you're looking for |

### 📊 Visualization Features

| Feature | How It Works |
|---------|-------------|
| **Interactive Data Tables** | Sort by any column, search within results, paginate large datasets |
| **Custom Dashboards** | Create dashboards with multiple charts — each chart can be a different type |
| **Chart Types** | Line, Bar, Pie, Area, Scatter charts using Recharts library |
| **Drag & Drop** | Rearrange charts on your dashboard by dragging them (dnd-kit) |
| **Export to CSV** | Download query results as CSV files for use in Excel or Google Sheets |
| **Export to JSON** | Download query results as JSON files for use in other applications |

### ⭐ Extra Features

| Feature | How It Works |
|---------|-------------|
| **Favorite Queries** | Save frequently used queries with tags and descriptions for quick access |
| **Query History** | Tracks every query you've run: what you asked, the SQL, success/failure, execution time |
| **Query Statistics** | See total queries run, success rate, and performance metrics |
| **User Settings** | Customize theme (dark/light), language, results per page, and notification preferences |
| **Dark/Light Theme** | Toggle between dark and light mode with system preference detection |

---

## 11. 🗃️ Database Design

### Internal SQLite Database Tables

#### `users` — Stores registered users
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-incrementing user ID |
| email | String (Unique) | User's email address |
| firstName | String | User's first name |
| lastName | String | User's last name |
| gender | String | User's gender |
| username | String | Display username |
| hashed_password | String | Bcrypt-hashed password (never plain text) |

#### `chat_sessions` — Stores saved conversations
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Session ID |
| user_id | Integer (FK → users) | Owner of the session |
| title | String | Session name (e.g., "Sales Analysis") |
| messages | Text (JSON) | All messages in the session, stored as JSON |

#### `favorite_queries` — Saved favorite queries
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Favorite ID |
| user_id | Integer (FK → users) | Owner |
| question | Text | The English question |
| sql_query | Text | The generated SQL |
| tags | String | User-defined tags (e.g., "sales, monthly") |
| description | Text | Optional description |
| created_at | DateTime | When it was saved |

#### `user_settings` — User preferences
| Column | Type | Description |
|--------|------|-------------|
| user_id | Integer (FK → users) | Owner |
| theme | String | "light" or "dark" |
| language | String | "en" (default) |
| results_per_page | Integer | Default: 10 |
| auto_save_sessions | Boolean | Auto-save chat sessions? |
| sql_syntax_highlighting | Boolean | Highlight SQL syntax? |
| notification_preferences | JSON | Custom notification settings |

#### `query_history` — Execution tracking
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | History entry ID |
| user_id | Integer (FK → users) | Who ran the query |
| session_id | Integer | Which chat session |
| question | Text | The English question asked |
| sql_query | Text | The SQL that was generated |
| success | Boolean | Did it execute successfully? |
| execution_time_ms | Integer | How long it took (milliseconds) |
| row_count | Integer | How many rows were returned |
| created_at | DateTime | When it was executed |

#### `user_dashboards` — Custom chart dashboards
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Dashboard record ID |
| user_id | Integer | Owner |
| dashboard_id | String (Unique) | Frontend-generated unique ID |
| name | String | Dashboard name |
| description | Text | Optional description |
| charts_data | Text (JSON) | All chart configurations stored as JSON |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last modification timestamp |

---

## 12. 🖥️ Frontend Architecture

### Page Structure

```
/ (Root)
├── /              → Index.tsx (Landing Page — public)
├── /auth          → AuthPage.tsx (Login & Signup — public)
├── /dashboard     → DashboardPage.tsx (Main Chat — protected)
├── /custom-dashboard → Customdashboard.tsx (Chart Builder — protected)
└── /*             → NotFound.tsx (404 page)
```

### React Context Providers (Global State)

The app uses three **Context Providers** that wrap the entire application:

```
QueryClientProvider (TanStack Query — server state cache)
  └── BrowserRouter (React Router — page navigation)
       └── ThemeProvider (dark/light theme management)
            └── AuthProvider (user login state)
                 └── DatabaseProvider (MySQL connection state)
                      └── App Routes & Components
```

| Context | Purpose | What It Manages |
|---------|---------|----------------|
| **ThemeProvider** | Dark/Light mode | Current theme, system preference detection |
| **AuthProvider** | User authentication | Login/logout, user data, OTP, session persistence |
| **DatabaseProvider** | MySQL connection | Connection state, table list, connect/disconnect |

### Code Splitting (Performance)

Heavy pages are **lazy loaded** — they are only downloaded when the user navigates to them:

```typescript
const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CustomDashboard = lazy(() => import("./pages/Customdashboard"));
```

This means the initial page load is **faster** because users don't download code for pages they haven't visited yet.

### Protected vs Public Routes

| Route | Type | Behavior |
|-------|------|----------|
| `/` | Public | Landing page; anyone can see |
| `/auth` | Public (redirects if logged in) | If already logged in → redirects to `/dashboard` |
| `/dashboard` | Protected | If not logged in → redirects to `/auth` |
| `/custom-dashboard` | Protected | If not logged in → redirects to `/auth` |

---

## 13. 📡 API Endpoints Summary

### Authentication APIs (4 endpoints)

| Method | Endpoint | What It Does | Rate Limit |
|--------|----------|-------------|-----------|
| POST | `/api/send-otp` | Sends 6-digit OTP to email | 5/min |
| POST | `/api/signup` | Creates account with OTP verification | — |
| POST | `/api/login` | Logs in with email + password | 10/min |
| GET | `/api/profile/{user_id}` | Gets user profile info | — |

### Database APIs (6 endpoints)

| Method | Endpoint | What It Does |
|--------|----------|-------------|
| POST | `/api/connect` | Connects to a MySQL database |
| POST | `/api/disconnect` | Disconnects from current database |
| POST | `/api/list-databases` | Lists all databases on the MySQL server |
| POST | `/api/create-database` | Creates a new database |
| GET | `/api/database-tables` | Gets all tables with row counts |
| GET | `/api/table-schema/{table}` | Gets column details for a table |

### Chat & AI APIs (3 endpoints)

| Method | Endpoint | What It Does | Rate Limit |
|--------|----------|-------------|-----------|
| POST | `/api/chat` | Sends question → gets AI-generated SQL + results | 60/min |
| POST | `/api/confirm-sql` | Confirms/rejects dangerous SQL operations | — |
| POST | `/api/export` | Exports results to CSV or JSON | — |

### Session Management (5 endpoints)

| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/api/chat-sessions` | Gets all saved chat sessions |
| POST | `/api/chat-sessions` | Creates a new chat session |
| PUT | `/api/chat-sessions/{id}` | Updates a session (messages, title) |
| DELETE | `/api/chat-sessions/{id}` | Deletes a single session |
| DELETE | `/api/chat-sessions/delete-all` | Deletes all sessions for a user |

### Dashboard, Favorites, Settings, History (12+ endpoints)

| Category | Endpoints Count | Operations |
|----------|---------------|-----------|
| Custom Dashboards | 6 | CRUD + migration from localStorage |
| Favorites | 4 | Add, remove, list, check |
| Settings | 2 | Get and update user settings |
| Tips | 2 | Get random tip, get by category |
| History | 3 | Track execution, get history, get stats |
| Search | 1 | Search tables and columns |

**Total: 30+ API endpoints**

---

## 14. ⚡ Performance Optimizations

### 1. Query Caching (In-Memory)

```python
class QueryCache:
    def __init__(self, ttl_seconds: int = 300):  # 5-minute TTL
        self.cache = {}
        self.ttl = ttl_seconds
```

- Repeated identical queries return **instantly** from cache
- Cache automatically expires after **5 minutes** (TTL = Time To Live)
- Cache key is generated using **MD5 hash** of `sql_query + database_name`
- Cache is **cleared** when the user disconnects from the database

### 2. Connection Pooling (SQLAlchemy)

```python
engine = create_engine(
    f"sqlite:///{SQLITE_DB_FILE}", 
    pool_pre_ping=True,      # Check if connection is alive before using
    pool_recycle=3600,        # Recycle connections every hour
    pool_size=10,             # Keep 10 connections ready
    max_overflow=20,          # Allow up to 20 extra connections under load
)
```

Instead of opening a new database connection for every request (slow), we maintain a **pool** of ready connections that can be reused (fast).

### 3. Frontend Code Splitting

Lazy loading pages so the browser only downloads code when needed:
```typescript
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
```

### 4. AI Response Optimization

| Setting | Value | Purpose |
|---------|-------|---------|
| `temperature=0` | Deterministic | Same question → same answer (no random variation) |
| `max_tokens=500` | Response limit | Prevents unnecessarily long responses |
| History limit | Last 5 only | Keeps prompt small for faster processing |

---

## 15. 📁 Project File Structure

```
Query-Genie/
│
├── backend/                          # Python Backend (FastAPI)
│   ├── backend.py                    # Main application (1,702 lines)
│   │                                 #   - All 30+ API endpoints
│   │                                 #   - AI pipeline (LangChain + Groq)
│   │                                 #   - SQL safety validation
│   │                                 #   - OTP management
│   │                                 #   - Query caching
│   │                                 #   - Database models
│   │
│   ├── sql_system_prompt.py          # The 240-line instruction manual for the AI
│   │                                 #   - SQL generation rules
│   │                                 #   - 50+ example translations
│   │                                 #   - Error prevention guidelines
│   │
│   ├── extended_models.py            # Additional database models
│   │                                 #   - FavoriteQuery, UserSettings
│   │                                 #   - QueryHistory, QueryRecommendation
│   │
│   ├── migration.py                  # Database migration utilities
│   ├── requirements.txt              # Python dependencies list
│   ├── .env                          # Secret keys (GROQ_API_KEY, email credentials)
│   ├── users.db                      # SQLite database file (auto-generated)
│   └── tests/                        # Automated tests
│       ├── conftest.py               # Test configuration
│       ├── test_unit.py              # Unit tests
│       └── test_integration.py       # Integration tests
│
├── Query-frontend/                   # React Frontend
│   ├── src/
│   │   ├── App.tsx                   # Root component — routing, providers
│   │   ├── main.tsx                  # Entry point
│   │   │
│   │   ├── pages/                    # Full pages
│   │   │   ├── Index.tsx             # Landing page (64KB — very detailed!)
│   │   │   ├── AuthPage.tsx          # Login & signup page
│   │   │   ├── DashboardPage.tsx     # Main chat + database dashboard
│   │   │   ├── Customdashboard.tsx   # Custom chart builder (90KB!)
│   │   │   └── NotFound.tsx          # 404 page
│   │   │
│   │   ├── components/               # Reusable UI pieces
│   │   │   ├── auth/                 # Login/signup forms
│   │   │   ├── chat/                 # Chat interface components
│   │   │   ├── dashboard/            # Dashboard panels & widgets
│   │   │   ├── ui/                   # shadcn/ui base components
│   │   │   ├── ErrorBoundary.tsx     # Error handling wrapper
│   │   │   └── Logo.tsx              # App logo component
│   │   │
│   │   ├── contexts/                 # Global state management
│   │   │   ├── AuthContext.tsx       # User authentication state
│   │   │   ├── DatabaseContext.tsx   # MySQL connection state
│   │   │   └── ThemeContext.tsx      # Dark/light theme state
│   │   │
│   │   ├── services/                 # API communication layer
│   │   │   ├── api.ts               # Auth, chat, session API functions
│   │   │   └── dashboardApi.ts      # Dashboard CRUD API functions
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   └── lib/                      # Utility functions
│   │
│   ├── package.json                  # Node.js dependencies
│   ├── tailwind.config.ts            # Tailwind CSS configuration
│   ├── vite.config.ts                # Vite build configuration
│   └── tsconfig.json                 # TypeScript configuration
│
├── requirements.txt                  # Root-level Python dependencies
├── LICENSE                           # MIT License
└── README.md                         # Project documentation
```

---

## 16. 📝 Summary — Key Talking Points for Your Presentation

### 🎯 What to Say About the Project

1. **"Query Genie is a natural language database assistant"** — Users type in English, get SQL results instantly
2. **"It's a full-stack web application"** — React frontend + FastAPI backend + MySQL integration
3. **"Powered by LLaMA 3.3 70B AI model"** — One of the most powerful open-source AI models available

### 🤖 What to Say About the AI/LLM

1. **"We use Meta's LLaMA 3.3 70B model hosted on Groq Cloud"**
2. **"LangChain orchestrates the AI pipeline"** — handles prompt building, API calls, response parsing
3. **"The AI receives a 240-line system prompt"** — detailed instructions on how to generate SQL
4. **"The AI is context-aware"** — remembers the last 5 conversations for smarter follow-up queries
5. **"Temperature is set to 0"** — deterministic output, same question always gets the same SQL
6. **"The AI ONLY generates SQL"** — it doesn't execute anything; the backend handles execution

### 🔐 What to Say About Data Security

1. **"Your actual database data NEVER goes to the AI"** — only table structure (schema) is shared
2. **"The AI only sees table names and column names, not the data inside"**
3. **"Passwords are hashed with bcrypt"** — impossible to reverse, even if database is stolen
4. **"Email verification with OTP"** — 6-digit codes, 5-minute expiry, max 5 attempts
5. **"SQL injection protection at 5 levels"** — safety validation, dangerous keyword detection, input validation, comment blocking, multi-statement blocking
6. **"Rate limiting on all sensitive endpoints"** — prevents brute force attacks
7. **"Database passwords are never stored in the browser"** — explicitly excluded from localStorage

### 📊 What to Say About Features

1. **"30+ API endpoints"** covering auth, database, chat, dashboards, favorites, history, settings
2. **"Interactive data visualization"** — 5 chart types with drag-and-drop dashboard builder
3. **"Query caching with 5-minute TTL"** — repeated queries return instantly
4. **"Connection pooling"** — 10 pre-warmed database connections for fast performance
5. **"Code splitting"** — lazy-loaded pages for faster initial load
