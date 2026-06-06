# Query Genie - Complete Documentation

**Version:** 1.0.0  
**Last Updated:** June 3, 2026  
**Author:** Vaibhav Burad

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Getting Started](#getting-started)
5. [Installation Guide](#installation-guide)
6. [Configuration](#configuration)
7. [User Guide](#user-guide)
8. [API Reference](#api-reference)
9. [Database Support](#database-support)
10. [Security](#security)
11. [Troubleshooting](#troubleshooting)
12. [Development](#development)
13. [Deployment](#deployment)
14. [Contributing](#contributing)
15. [FAQ](#faq)

---

## 1. Overview

### 1.1 What is Query Genie?

Query Genie is an AI-powered database assistant that revolutionizes how users interact with databases. Instead of writing complex SQL queries, users can ask questions in plain English and receive instant, accurate results presented as interactive tables, charts, and dashboards.

### 1.2 Key Highlights

- **Natural Language Processing**: Convert plain English questions into database-specific queries
- **Multi-Database Support**: Works with 11+ data sources including SQL databases, NoSQL, and file formats
- **AI-Powered**: Leverages local Ollama and cloud-based Groq for intelligent query generation
- **Enterprise-Ready**: Built with security, scalability, and performance in mind
- **Visualization Tools**: Interactive charts, custom dashboards, and data export capabilities
- **Session Management**: Save queries, track history, and manage multiple chat sessions

### 1.3 Use Cases


- **Business Intelligence**: Quick data exploration and reporting without SQL knowledge
- **Data Analysis**: Rapid insights from multiple data sources
- **Development**: Fast database inspection and query testing
- **Education**: Learn database concepts through natural language interaction
- **Team Collaboration**: Share queries, dashboards, and insights

### 1.4 Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context API with custom hooks
- **Data Visualization**: Recharts for interactive charts
- **Drag & Drop**: dnd-kit for dashboard customization

#### Backend
- **Framework**: FastAPI (Python) for high-performance APIs
- **Database ORM**: SQLAlchemy 2.0 with async support
- **Authentication**: Passlib with bcrypt, JWT-based sessions
- **AI Integration**: LangChain with Groq and Ollama support
- **Rate Limiting**: SlowAPI for API protection
- **Validation**: Pydantic v2 for data validation
- **File Processing**: openpyxl for Excel, pandas for CSV

#### Supported Databases
- **SQL**: MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, IBM Db2, SQLite
- **NoSQL**: MongoDB (metadata), Redis (metadata)
- **Files**: CSV, Excel (XLSX)

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Landing    │  │  Auth Pages  │  │   Dashboard      │  │
│  │  Page       │  │  (Login/OTP) │  │   (Chat/Charts)  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Context Providers                             │  │
│  │  • AuthContext  • DatabaseContext  • ThemeContext    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │ REST API (HTTPS)
                           │ Bearer Auth + X-DB-Session
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND LAYER (FastAPI)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             API Endpoints                            │   │
│  │  • Auth  • Connection  • Chat  • Favorites          │   │
│  │  • History  • Dashboards  • Export                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │  Session    │  │  Query Cache │  │  Pending Store │   │
│  │  Store      │  │  (5min TTL)  │  │  (Confirm SQL) │   │
│  └─────────────┘  └──────────────┘  └────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          AI Query Generation Engine                  │   │
│  │  ┌────────────┐         ┌─────────────┐            │   │
│  │  │  Ollama    │   OR    │   Groq API  │            │   │
│  │  │  (Local)   │         │   (Cloud)   │            │   │
│  │  └────────────┘         └─────────────┘            │   │
│  │                                                      │   │
│  │  • Schema Context Builder                           │   │
│  │  • Conversation History Manager                     │   │
│  │  • Dialect-Specific Prompt Router                   │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌──────────────┐  ┌────────────────────────────────────┐  │
│  │  Internal DB │  │      User Data Sources              │  │
│  │  (SQLite)    │  │  ┌──────────┐  ┌─────────────┐    │  │
│  │              │  │  │ SQL DBs  │  │  MongoDB    │    │  │
│  │  • Users     │  │  │ MySQL    │  │  Redis      │    │  │
│  │  • Sessions  │  │  │ Postgres │  │  Files      │    │  │
│  │  • Favorites │  │  │ Oracle   │  │  CSV/Excel  │    │  │
│  │  • History   │  │  │ ...      │  │             │    │  │
│  │  • Dashboards│  │  └──────────┘  └─────────────┘    │  │
│  └──────────────┘  └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

#### Query Execution Flow

1. **User Input**: User types natural language question in chat
2. **Authentication**: Request validated with Bearer token
3. **Database Session**: X-DB-Session header identifies connected database
4. **Context Building**: System gathers:
   - Database schema (tables, columns, relationships)
   - Conversation history (last N messages)
   - Database dialect (MySQL, PostgreSQL, etc.)
5. **AI Generation**: 
   - Ollama (preferred): Full prompt with rich context
   - Groq (fallback): Optimized prompt for API limits
6. **Query Validation**: Generated SQL checked for:
   - Read-only operations (SELECT, SHOW, DESCRIBE)
   - Syntax correctness
   - Security constraints
7. **Execution**: Query runs against user's database
8. **Result Processing**:
   - Data transformation
   - Caching (5-minute TTL)
   - Row limit enforcement
9. **Response**: Results returned as JSON with metadata
10. **Visualization**: Frontend renders tables/charts


#### Authentication Flow

1. **OTP Request**: User enters email
2. **OTP Generation**: 6-digit code generated and emailed
3. **OTP Verification**: User submits code (5 attempts, 5-minute expiry)
4. **Account Creation**: User completes signup form
5. **Token Issuance**: Bearer token created with 7-day expiry
6. **Session Management**: Token stored in HTTP-only cookie

### 2.3 Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│              SECURITY LAYERS                             │
│                                                          │
│  Layer 1: Transport Security                            │
│  ├─ HTTPS/TLS encryption                                │
│  ├─ Secure headers (CSP, HSTS, X-Frame-Options)        │
│  └─ CORS policy enforcement                             │
│                                                          │
│  Layer 2: Authentication                                │
│  ├─ Email OTP verification                              │
│  ├─ Bcrypt password hashing (cost factor 12)           │
│  ├─ Bearer token sessions (secure cookies)              │
│  └─ Token expiry and rotation                           │
│                                                          │
│  Layer 3: Authorization                                 │
│  ├─ Per-user database sessions                          │
│  ├─ Session token isolation (X-DB-Session)             │
│  └─ User-scoped resources (favorites, history)          │
│                                                          │
│  Layer 4: Data Protection                               │
│  ├─ SQL injection prevention (parameterized queries)    │
│  ├─ Read-only query enforcement                         │
│  ├─ Query result limiting                               │
│  └─ Audit logging                                       │
│                                                          │
│  Layer 5: Rate Limiting                                 │
│  ├─ API endpoint throttling (SlowAPI)                  │
│  ├─ Per-IP rate limits                                  │
│  └─ Brute force protection                              │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Features

### 3.1 Core Features

#### Natural Language Query Interface
- Ask questions in plain English
- Context-aware conversation history
- Multi-turn dialog support
- Query refinement and follow-ups

#### Multi-Database Support
- **SQL Databases**: MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, IBM Db2, SQLite
- **NoSQL**: MongoDB, Redis (metadata browsing)
- **File Formats**: CSV, Excel workbooks
- Automatic dialect detection
- Schema introspection

#### AI-Powered Query Generation
- Local Ollama integration for privacy
- Cloud Groq API as fallback
- Dialect-specific SQL generation
- Query optimization recommendations


#### Data Visualization
- **Interactive Tables**: Sortable columns, pagination, search
- **Chart Types**:
  - Bar charts
  - Line charts
  - Pie charts
  - Area charts
  - Scatter plots
- **Real-time Updates**: Live data refresh
- **Export Options**: CSV, JSON, PNG (charts)

#### Custom Dashboards
- Drag-and-drop dashboard builder
- Multiple chart widgets
- Responsive grid layout
- Dashboard templates
- Share and export capabilities

#### Query Management
- **Favorites**: Save frequently used queries with tags
- **History**: Complete audit trail of all queries
- **Sessions**: Multiple chat contexts
- **Templates**: Pre-built query patterns

### 3.2 Advanced Features

#### File Upload Processing
- Automatic CSV parsing
- Excel multi-sheet support
- Temporary SQLite staging
- Schema auto-detection
- Data type inference

#### Connection Management
- Multiple database connections per user
- Connection pooling and optimization
- Automatic reconnection
- Connection health monitoring
- Session timeout handling

#### Performance Optimization
- Query result caching (5-minute TTL)
- Schema context caching
- Connection pooling (up to 300 connections)
- Lazy loading for large datasets
- Pagination support

#### User Experience
- Dark/Light theme toggle
- Keyboard shortcuts (Ctrl+K command palette)
- Mobile-responsive design
- Real-time connection status
- Offline detection and fallback

---

## 4. Getting Started

### 4.1 Quick Start (5 Minutes)

#### Prerequisites Check
```bash
# Check Python version (3.10+ required)
python --version

# Check Node.js version (18+ required)
node --version

# Check npm
npm --version
```


#### Step 1: Clone Repository
```bash
git clone https://github.com/vaibhavburad15/Query-Genie.git
cd Query-Genie
```

#### Step 2: Backend Setup
```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

#### Step 3: Configure Environment
Create `backend/.env`:
```env
USE_OLLAMA=true
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=deepseek-coder
GROQ_API_KEY=your_groq_key_here

EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

AUTH_SESSION_TTL=604800
```

#### Step 4: Start Backend
```bash
uvicorn backend:app --reload --port 8000
```

#### Step 5: Frontend Setup (New Terminal)
```bash
cd Query-frontend
npm install
npm run dev
```

#### Step 6: Access Application
- Frontend: http://127.0.0.1:8082
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 4.2 First Time Setup

1. **Create Account**:
   - Navigate to http://127.0.0.1:8082
   - Click "Get Started" or "Sign up"
   - Enter email and request OTP
   - Check email for 6-digit code
   - Complete registration form

2. **Connect Database**:
   - Click "Connect Database" in dashboard
   - Select database type
   - Enter connection credentials
   - Test connection
   - Click "Connect"

3. **Ask First Question**:
   ```
   Example: "Show me all tables in this database"
   Example: "What are the top 10 customers by revenue?"
   Example: "Count active users by region"
   ```

4. **Explore Results**:
   - View data in table format
   - Switch to chart visualization
   - Export as CSV/JSON
   - Save to favorites

---

## 5. Installation Guide

### 5.1 System Requirements

#### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 2 GB free space
- **Network**: Internet connection for cloud AI

#### Recommended Requirements
- **OS**: Windows 11, macOS 12+, Linux (Ubuntu 22.04+)
- **CPU**: 4+ cores
- **RAM**: 8 GB+
- **Disk**: 10 GB free space (for Ollama models)
- **Network**: High-speed internet


### 5.2 Database Driver Installation

#### MySQL
```bash
pip install mysql-connector-python
```

#### PostgreSQL
```bash
pip install psycopg2-binary
```

#### SQL Server
```bash
# Windows: Install ODBC Driver 17 for SQL Server
# Download from: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

pip install pyodbc
```

#### Oracle
```bash
pip install oracledb

# Optional: Oracle Instant Client for advanced features
# Download from: https://www.oracle.com/database/technologies/instant-client.html
```

#### IBM Db2
```bash
pip install ibm-db ibm-db-sa
```

#### MongoDB
```bash
pip install pymongo
```

#### Redis
```bash
pip install redis
```

### 5.3 Ollama Setup (Optional but Recommended)

#### Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from: https://ollama.com/download
```

#### Pull Model
```bash
ollama pull deepseek-coder
# OR
ollama pull codellama
# OR
ollama pull llama2
```

#### Verify Installation
```bash
ollama list
```

### 5.4 Email Configuration (Gmail)

1. **Enable 2-Factor Authentication**:
   - Go to Google Account Settings
   - Security > 2-Step Verification

2. **Generate App Password**:
   - Security > App Passwords
   - Select "Mail" and your device
   - Copy 16-character password

3. **Update .env**:
   ```env
   EMAIL_HOST_USER=your.email@gmail.com
   EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
   ```

---

## 6. Configuration

### 6.1 Backend Configuration

#### Environment Variables Reference

```env
# ===================================
# LLM CONFIGURATION
# ===================================
USE_OLLAMA=true                          # Use local Ollama (true/false)
OLLAMA_BASE_URL=http://127.0.0.1:11434  # Ollama server URL
OLLAMA_MODEL=deepseek-coder              # Model name
OLLAMA_TIMEOUT_SECONDS=10                # Request timeout
GROQ_API_KEY=your_key                    # Groq API key (fallback)

# ===================================
# TOKEN BUDGETS (Groq)
# ===================================
GROQ_MAX_SCHEMA_CHARS=50000              # Schema context limit
GROQ_MAX_HISTORY_TURNS=50                # Chat history turns
GROQ_MAX_TOKENS_OUT=4096                 # Max output tokens

# ===================================
# EMAIL CONFIGURATION
# ===================================
EMAIL_HOST_USER=email@gmail.com          # Sender email
EMAIL_HOST_PASSWORD=app_password         # Gmail app password

# ===================================
# AUTHENTICATION
# ===================================
AUTH_SESSION_TTL=604800                  # Session lifetime (seconds)
AUTH_COOKIE_NAME=auth_token              # Cookie name
AUTH_COOKIE_SECURE=true                  # HTTPS only
AUTH_COOKIE_SAMESITE=none                # SameSite policy

# ===================================
# DATABASE SESSIONS
# ===================================
DB_SESSION_TTL=3600                      # DB session lifetime (seconds)
MAX_RESULT_ROWS=                         # Result limit (empty = unlimited)

# ===================================
# ENVIRONMENT
# ===================================
ENV=development                          # development/production
ALLOWED_ORIGINS=http://localhost:5173    # CORS origins (comma-separated)
```


### 6.2 Frontend Configuration

Create `Query-frontend/.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

### 6.3 Production Configuration

```env
ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
AUTH_COOKIE_SECURE=true
```

---

## 7. User Guide

### 7.1 Connecting to Databases

#### MySQL/MariaDB Connection
```
Host: localhost or IP address
Port: 3306
User: your_username
Password: your_password
Database: your_database_name
```

#### PostgreSQL Connection
```
Host: localhost
Port: 5432
User: postgres
Password: your_password
Database: your_database
```

#### SQL Server Connection
```
Host: localhost
Port: 1433
User: sa
Password: your_password
Database: master
```

#### SQLite Connection
```
Path: C:\path\to\database.db
```

#### CSV/Excel Upload
1. Click "Upload File"
2. Select CSV or XLSX file
3. Review auto-detected schema
4. Click "Upload and Connect"

### 7.2 Query Examples

#### Basic Queries
```
"Show all tables"
"Describe the users table"
"Count total records in orders"
"What are the column names in products table?"
```

#### Data Retrieval
```
"Show me top 10 customers by revenue"
"List all active users from last month"
"Get products with price greater than 100"
"Find orders placed today"
```

#### Aggregations
```
"Average salary by department"
"Total sales per region"
"Count users by country"
"Monthly revenue for 2026"
```

#### Complex Queries
```
"Show top 5 products by revenue with month-over-month growth"
"Compare sales between Q1 and Q2 by region"
"Find customers who haven't ordered in 90 days"
```

### 7.3 Working with Results

#### Table View
- Sort by clicking column headers
- Search using the search box
- Navigate pages with pagination controls
- Select rows for actions

#### Chart View
- Choose chart type (bar, line, pie)
- Configure axes and data keys
- Customize colors and labels
- Export as PNG image

#### Export Data
- CSV: Preserves data structure
- JSON: Includes metadata
- Excel: Multi-sheet support

### 7.4 Favorites Management

1. After running a query, click "Add to Favorites"
2. Add tags for organization (e.g., "sales", "monthly")
3. Add description for context
4. Access from sidebar "Favorites" panel
5. Re-run with one click

### 7.5 Custom Dashboards

1. Navigate to Custom Dashboard page
2. Click "Create New Dashboard"
3. Name your dashboard
4. Add widgets (charts from query results)
5. Drag to reposition
6. Resize widgets
7. Save dashboard

---

## 8. API Reference

### 8.1 Authentication Endpoints

#### POST /api/send-otp
Request OTP for signup.

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "message": "OTP sent to your email"
}
```

#### POST /api/signup
Create new user account.

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "otp": "123456",
  "gender": "male",
  "username": "johndoe"
}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "session_token_here"
}
```

#### POST /api/login
Login existing user.

**Request**:
```json
{
  "identifier": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response**:
```json
{
  "token": "bearer_token",
  "user": { "id": 1, "email": "john@example.com" }
}
```

### 8.2 Database Connection Endpoints

#### POST /api/connect
Connect to a database.

**Headers**:
```
Authorization: Bearer <token>
```

**Request**:
```json
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "password",
  "database": "mydb"
}
```

**Response**:
```json
{
  "success": true,
  "db_session_token": "session_token",
  "db_name": "mydb",
  "db_type": "mysql"
}
```

#### GET /api/connection-status
Check current connection.

**Headers**:
```
Authorization: Bearer <token>
X-DB-Session: <db_session_token>
```

**Response**:
```json
{
  "connected": true,
  "db_name": "mydb",
  "db_type": "mysql"
}
```

### 8.3 Query Endpoints

#### POST /api/chat
Execute natural language query.

**Headers**:
```
Authorization: Bearer <token>
X-DB-Session: <db_session_token>
```

**Request**:
```json
{
  "question": "Show top 10 customers by revenue",
  "chat_history": []
}
```

**Response**:
```json
{
  "role": "assistant",
  "content": "Query results...",
  "metadata": {
    "sql": "SELECT ...",
    "rows": 10,
    "execution_time": 45
  }
}
```

### 8.4 Favorites Endpoints

#### GET /api/favorites
Get user's favorite queries.

#### POST /api/favorites
Save query to favorites.

**Request**:
```json
{
  "question": "Top 10 customers",
  "sql_query": "SELECT ...",
  "tags": "sales,monthly",
  "description": "Monthly top customers report"
}
```

### 8.5 Dashboard Endpoints

#### GET /api/custom-dashboards
List user dashboards.

#### POST /api/custom-dashboards
Create new dashboard.

#### PUT /api/custom-dashboards/{dashboard_id}
Update dashboard.

#### DELETE /api/custom-dashboards/{dashboard_id}
Delete dashboard.

---

## 9. Database Support

### 9.1 SQL Databases

| Database | Version | Query Support | Create DB | Notes |
|----------|---------|---------------|-----------|-------|
| MySQL | 5.7+ | ✅ Full | ✅ Yes | Recommended for beginners |
| PostgreSQL | 12+ | ✅ Full | ✅ Yes | Advanced features supported |
| MariaDB | 10.x | ✅ Full | ✅ Yes | MySQL-compatible |
| SQL Server | 2019+ | ✅ Full | ❌ No | Requires ODBC driver |
| Oracle | 12c+ | ✅ Full | ❌ No | Service name connection |
| IBM Db2 | 11.x+ | ✅ Full | ❌ No | Enterprise support |
| SQLite | 3.x | ✅ Full | ❌ No | File-based |

### 9.2 NoSQL Databases

| Database | Version | Query Support | Browse | Notes |
|----------|---------|---------------|--------|-------|
| MongoDB | 4.x+ | ❌ No | ✅ Yes | Metadata and collections only |
| Redis | 6.x+ | ❌ No | ✅ Yes | Key browsing and inspection |

### 9.3 File Formats

| Format | Query Support | Notes |
|--------|---------------|-------|
| CSV | ✅ Full | Auto-staged as SQLite |
| Excel (XLSX) | ✅ Full | Each sheet = table |

### 9.4 Dialect-Specific Features

#### MySQL
- Window functions (8.0+)
- JSON operations
- Full-text search
- CTEs (Common Table Expressions)

#### PostgreSQL
- Advanced JSON/JSONB
- Array operations
- Full-text search
- Window functions
- Custom types

#### Oracle
- PL/SQL support
- Analytic functions
- Hierarchical queries
- Partitioning

#### SQL Server
- T-SQL features
- Window functions
- JSON support
- Temporal tables

---

## 10. Security

### 10.1 Authentication Security

- **Password Hashing**: Bcrypt with cost factor 12
- **OTP**: 6-digit codes, 5-minute expiry, 5 attempts max
- **Session Tokens**: Cryptographically secure random tokens
- **Token Expiry**: 7-day default, configurable
- **HTTP-Only Cookies**: Prevents XSS attacks

### 10.2 Database Security

- **Per-User Sessions**: Isolated database connections
- **Read-Only Enforcement**: Only SELECT queries allowed by default
- **SQL Injection Prevention**: Parameterized queries
- **Connection Pooling**: Controlled resource usage
- **Audit Logging**: All queries logged with timestamps

### 10.3 API Security

- **CORS**: Strict origin validation
- **Rate Limiting**: Per-IP throttling
- **Security Headers**: CSP, HSTS, X-Frame-Options
- **Input Validation**: Pydantic schemas
- **Error Handling**: No sensitive data in errors

### 10.4 Best Practices

1. **Use HTTPS in Production**
2. **Rotate API Keys Regularly**
3. **Use Strong Database Passwords**
4. **Enable 2FA for Gmail**
5. **Monitor Audit Logs**
6. **Keep Dependencies Updated**
7. **Use Environment Variables for Secrets**
8. **Implement Network Firewalls**

---

## 11. Troubleshooting

### 11.1 Common Issues

#### Backend Won't Start
**Problem**: `ModuleNotFoundError` or `ImportError`
**Solution**:
```bash
pip install -r requirements.txt --upgrade
```

#### Frontend Can't Connect to Backend
**Problem**: CORS or network errors
**Solution**:
- Check `ALLOWED_ORIGINS` in backend `.env`
- Verify `VITE_API_URL` in frontend `.env.local`
- Ensure backend is running on correct port

#### OTP Email Not Received
**Problem**: Email not sending
**Solution**:
- Verify Gmail app password (not account password)
- Check spam folder
- Confirm 2FA is enabled on Gmail account
- Test SMTP connection

#### Ollama Connection Failed
**Problem**: `Connection refused` to Ollama
**Solution**:
```bash
# Check if Ollama is running
ollama list

# Restart Ollama service
# macOS/Linux: systemctl restart ollama
# Windows: Restart Ollama Desktop app

# Verify URL in .env
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

#### Database Connection Failed
**Problem**: Authentication or connection errors
**Solution**:
- Verify credentials
- Check firewall rules
- Confirm database is running
- Test connection from command line
- Check driver installation

### 11.2 Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check Bearer token or re-login |
| 403 | Forbidden | Verify X-DB-Session header |
| 429 | Too Many Requests | Wait or increase rate limits |
| 500 | Internal Server Error | Check backend logs |
| 503 | Service Unavailable | Check database connectivity |

### 11.3 Debugging

#### Enable Debug Logging
Backend `backend.py`:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

#### Check Backend Logs
```bash
# View recent logs
tail -f backend.log

# Search for errors
grep "ERROR" backend.log
```

#### Browser Console
Press F12 in browser to check:
- Network requests
- JavaScript errors
- Console messages

---

## 12. Development

### 12.1 Project Structure

```
Query-Genie/
├── backend/
│   ├── backend.py              # Main FastAPI application
│   ├── extended_models.py      # SQLAlchemy models
│   ├── sql_system_prompt.py    # LLM prompts
│   ├── migration.py            # Database migrations
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment config
│   ├── users.db                # SQLite database
│   └── audit.log               # Security audit log
│
├── Query-frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── auth/          # Login/signup
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilities
│   │   ├── pages/             # Route pages
│   │   ├── services/          # API clients
│   │   └── App.tsx            # Root component
│   ├── package.json           # Node dependencies
│   └── vite.config.ts         # Vite configuration
│
├── docs/                       # Documentation
│   └── DOCUMENTATION.md        # This file
│
└── README.md                   # Quick start guide
```

### 12.2 Development Workflow

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**:
   - Backend: Modify Python files
   - Frontend: Edit React components

3. **Test Locally**:
   ```bash
   # Backend tests
   pytest

   # Frontend lint
   npm run lint
   ```

4. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Add feature: description"
   ```

5. **Push and Create PR**:
   ```bash
   git push origin feature/my-feature
   ```

### 12.3 Code Style

#### Python (Backend)
- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Maximum line length: 120 characters

#### TypeScript (Frontend)
- Use ESLint configuration
- Functional components with hooks
- Prop types with TypeScript interfaces
- Maximum line length: 100 characters

---

## 13. Deployment

### 13.1 Production Checklist

- [ ] Set `ENV=production` in `.env`
- [ ] Configure `ALLOWED_ORIGINS`
- [ ] Enable `AUTH_COOKIE_SECURE=true`
- [ ] Use strong passwords
- [ ] Set up HTTPS/SSL
- [ ] Configure reverse proxy (nginx)
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Enable firewall rules
- [ ] Review security headers

### 13.2 Docker Deployment

Create `Dockerfile` (backend):
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
  
  frontend:
    build: ./Query-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

Deploy:
```bash
docker-compose up -d
```

### 13.3 Cloud Deployment

#### AWS
- Use EC2 for compute
- RDS for database
- S3 for static files
- CloudFront for CDN
- Route 53 for DNS

#### Azure
- App Service for backend
- Static Web Apps for frontend
- Azure Database for databases
- Azure CDN

#### Google Cloud
- Cloud Run for containers
- Cloud SQL for databases
- Cloud Storage for files
- Cloud CDN

---

## 14. Contributing

### 14.1 How to Contribute

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Write/update tests
5. Update documentation
6. Submit pull request

### 14.2 Contribution Guidelines

- Follow code style guidelines
- Write clear commit messages
- Add tests for new features
- Update documentation
- Be respectful in discussions

### 14.3 Reporting Issues

When reporting bugs, include:
- Operating system
- Python/Node.js versions
- Database type and version
- Error messages
- Steps to reproduce

---

## 15. FAQ

**Q: Can I use Query Genie with my existing database?**
A: Yes, Query Genie supports 11+ database types including MySQL, PostgreSQL, SQL Server, Oracle, and more.

**Q: Is my data secure?**
A: Yes, Query Genie enforces read-only queries by default, uses encrypted connections, and never stores your database credentials long-term.

**Q: Do I need an internet connection?**
A: For local Ollama, no. For Groq API, yes. The app detects offline status and shows appropriate messages.

**Q: Can multiple users share the same database connection?**
A: Each user has isolated database sessions for security.

**Q: How do I export query results?**
A: Click the export button in the results table and choose CSV or JSON format.

**Q: Can I create custom visualizations?**
A: Yes, use the Custom Dashboard feature to create personalized charts and layouts.

**Q: Is there a query limit?**
A: By default, no limit. You can configure `MAX_RESULT_ROWS` if needed.

**Q: How do I update Query Genie?**
A: Pull latest changes from Git, reinstall dependencies, and restart services.

**Q: Can I use Query Genie commercially?**
A: Check the LICENSE file in the repository for licensing terms.

**Q: Where can I get help?**
A: Open an issue on GitHub or contact the maintainer.

---

## Appendix

### A. Glossary

- **OTP**: One-Time Password
- **Bearer Token**: Authentication token sent in HTTP headers
- **X-DB-Session**: Custom header for database session identification
- **LLM**: Large Language Model
- **Ollama**: Local LLM runtime
- **Groq**: Cloud AI API service
- **SQLAlchemy**: Python SQL toolkit and ORM
- **FastAPI**: Modern Python web framework
- **Vite**: Frontend build tool
- **shadcn/ui**: React component library

### B. Resources

- **GitHub Repository**: https://github.com/vaibhavburad15/Query-Genie
- **Author LinkedIn**: https://www.linkedin.com/in/vaibhav-burad-278414243/
- **Ollama Documentation**: https://ollama.com/docs
- **FastAPI Documentation**: https://fastapi.tiangolo.com
- **React Documentation**: https://react.dev

### C. Version History

- **v1.0.0** (June 2026): Initial release
  - Multi-database support
  - Natural language queries
  - Custom dashboards
  - Enterprise security features

---

**© 2026 Vaibhav Burad. Query Genie - AI-Powered Database Assistant**

*Documentation Version: 1.0.0*  
*Last Updated: June 3, 2026*
