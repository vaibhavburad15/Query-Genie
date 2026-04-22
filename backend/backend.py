import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Path, Request, Header
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from email_validator import validate_email, EmailNotValidError
from pydantic import BaseModel, EmailStr, SecretStr
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Mapped, Session, mapped_column
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from passlib.context import CryptContext
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_community.utilities import SQLDatabase
from langchain_groq import ChatGroq
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import json
import re
from typing import cast, Any
from typing import List, Optional, Dict
import csv
import io
import hashlib
import secrets
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

from extended_models import (
    FavoriteQuery,
    UserSettings,
    QueryHistory,
    Base
)
from sql_system_prompt import SQL_SYSTEM_PROMPT
import re
from typing import Tuple
import threading
import time

# ─────────────────────────────────────────────
# ENV / KEYS
# ─────────────────────────────────────────────
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("WARNING: GROQ_API_KEY not found in environment variables.")
    GROQ_API_KEY = ""
else:
    GROQ_API_KEY = cast(str, groq_api_key)

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
    print("WARNING: Email credentials not found. OTP sending will be disabled.")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─────────────────────────────────────────────
# APP-INTERNAL SQLITE DATABASE  (users, sessions, etc.)
# ─────────────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_DB_FILE = os.path.join(BACKEND_DIR, "users.db")
engine = create_engine(
    f"sqlite:///{SQLITE_DB_FILE}",
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
    connect_args={
        "timeout": 30,
        "check_same_thread": False
    },
)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    username = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String, nullable=False)
    messages = Column(Text, nullable=False)


class UserDashboard(Base):
    __tablename__ = "user_dashboards"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    dashboard_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    charts_data: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ─────────────────────────────────────────────
# PER-USER DATABASE SESSION STORE
# Replaces the dangerous global app.state.db_uri
# Each user gets their own db_uri keyed by a session token
# that is issued at /api/connect and must be sent as
# X-DB-Session header on every subsequent request.
# ─────────────────────────────────────────────

class DbSessionStore:
    """Thread-safe, per-user database connection store."""

    def __init__(self, ttl_seconds: int = 3600):
        self._store: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._ttl = ttl_seconds

    def create(self, db_uri: str, db_name: str) -> str:
        """Store a new connection and return an opaque session token."""
        token = secrets.token_urlsafe(32)
        with self._lock:
            self._store[token] = {
                "db_uri": db_uri,
                "db_name": db_name,
                "created_at": time.time(),
            }
        # Auto-expire after TTL
        t = threading.Thread(target=self._expire, args=(token,), daemon=True)
        t.start()
        return token

    def get(self, token: str) -> Optional[Dict[str, Any]]:
        """Return the session dict or None if missing / expired."""
        with self._lock:
            session = self._store.get(token)
            if session is None:
                return None
            if time.time() - session["created_at"] > self._ttl:
                del self._store[token]
                return None
            return session

    def delete(self, token: str) -> None:
        with self._lock:
            self._store.pop(token, None)

    def _expire(self, token: str) -> None:
        time.sleep(self._ttl)
        with self._lock:
            self._store.pop(token, None)


db_session_store = DbSessionStore(ttl_seconds=int(os.getenv("DB_SESSION_TTL", "3600")))


def get_db_session(x_db_session: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    """FastAPI dependency – resolves the per-user DB session from the header."""
    if not x_db_session:
        raise HTTPException(status_code=400, detail="X-DB-Session header is required. Connect to a database first.")
    session = db_session_store.get(x_db_session)
    if session is None:
        raise HTTPException(status_code=401, detail="Database session expired or not found. Please reconnect.")
    return session


# ─────────────────────────────────────────────
# QUERY RESULT ROW LIMIT
# ─────────────────────────────────────────────
MAX_RESULT_ROWS = int(os.getenv("MAX_RESULT_ROWS", "1000"))


# ─────────────────────────────────────────────
# QUERY CACHE  (scoped per db_name, not global)
# ─────────────────────────────────────────────
class QueryCache:
    """In-process TTL cache for SELECT results."""

    def __init__(self, ttl_seconds: int = 300, max_entries: int = 200):
        self.cache: Dict[str, Any] = {}
        self.timestamps: Dict[str, float] = {}
        self.ttl = ttl_seconds
        self.max_entries = max_entries
        self._lock = threading.Lock()

    def _key(self, sql: str, db_name: str) -> str:
        return hashlib.md5(f"{sql}:{db_name}".encode()).hexdigest()

    def get(self, sql: str, db_name: str) -> Optional[dict]:
        key = self._key(sql, db_name)
        with self._lock:
            if key not in self.cache:
                return None
            if time.time() - self.timestamps[key] > self.ttl:
                del self.cache[key]
                del self.timestamps[key]
                return None
            return self.cache[key]

    def set(self, sql: str, db_name: str, value: dict) -> None:
        key = self._key(sql, db_name)
        with self._lock:
            # Evict oldest entry when over capacity
            if len(self.cache) >= self.max_entries and key not in self.cache:
                oldest = min(self.timestamps, key=lambda k: self.timestamps[k])
                del self.cache[oldest]
                del self.timestamps[oldest]
            self.cache[key] = value
            self.timestamps[key] = time.time()

    def clear(self) -> None:
        with self._lock:
            self.cache.clear()
            self.timestamps.clear()


query_cache = QueryCache(ttl_seconds=300, max_entries=200)

# ─────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────
app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SlowAPIMiddleware)

# ─────────────────────────────────────────────
# OTP MANAGER
# ─────────────────────────────────────────────
class OtpManager:
    """Thread-safe OTP manager with auto-cleanup."""

    def __init__(self):
        self.storage: Dict[str, Any] = {}
        self.lock = threading.Lock()

    def store(self, email: str, otp: str, expiry_minutes: int = 5):
        with self.lock:
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes)
            self.storage[email] = {
                "otp": otp,
                "expires_at": expires_at,
                "attempts": 0,
            }
        # Auto-expire
        t = threading.Thread(target=self._cleanup, args=(email, expiry_minutes * 60), daemon=True)
        t.start()

    def verify(self, email: str, otp: str) -> Tuple[bool, str]:
        with self.lock:
            data = self.storage.get(email)
            if not data:
                return False, "OTP not requested or already used"
            if datetime.now(timezone.utc) > data["expires_at"]:
                del self.storage[email]
                return False, "OTP has expired"
            if data["attempts"] >= 5:
                del self.storage[email]
                return False, "Too many failed attempts. Request a new OTP."
            if data["otp"] != otp:
                data["attempts"] += 1
                return False, "Invalid OTP"
            del self.storage[email]
            return True, "OTP verified"

    def _cleanup(self, email: str, delay: int):
        time.sleep(delay)
        with self.lock:
            self.storage.pop(email, None)


otp_manager = OtpManager()

# ─────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────
class DBConfig(BaseModel):
    host: str
    port: int
    user: str
    password: str = ""
    database: str


class ServerConnectionConfig(BaseModel):
    host: str
    port: int
    user: str
    password: str = ""


class CreateDatabaseRequest(BaseModel):
    host: str
    port: int
    user: str
    password: str = ""
    database_name: str


class ChatRequest(BaseModel):
    question: str
    chat_history: list = []


class UserCreate(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str
    otp: str
    gender: str
    username: str


class UserLogin(BaseModel):
    identifier: str
    password: str


class OtpRequest(BaseModel):
    email: EmailStr


class FavoriteQueryCreate(BaseModel):
    user_id: int
    question: str
    sql_query: str
    tags: Optional[str] = None
    description: Optional[str] = None


class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    results_per_page: Optional[int] = None
    auto_save_sessions: Optional[bool] = None
    sql_syntax_highlighting: Optional[bool] = None
    notification_preferences: Optional[dict] = None


class ExportRequest(BaseModel):
    data: List[List]
    columns: List[str]
    format: str


class ChartConfig(BaseModel):
    xKey: Optional[str] = "name"
    yKey: Optional[str] = "value"
    dataKey: Optional[str] = "value"
    nameKey: Optional[str] = "name"
    colors: Optional[List[str]] = None


class ChartData(BaseModel):
    id: str
    title: str
    type: str
    size: Optional[str] = "medium"
    data: List[Dict[str, Any]]
    config: ChartConfig
    notes: Optional[str] = None
    createdAt: str
    updatedAt: Optional[str] = None


class Dashboard(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    charts: List[ChartData]
    createdAt: str
    updatedAt: str


class DashboardCreate(BaseModel):
    user_id: int
    dashboard_id: str
    name: str
    description: Optional[str] = ""
    charts: List[Dict[str, Any]]


class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    charts: Optional[List[Dict[str, Any]]] = None


class DashboardMigrate(BaseModel):
    user_id: int
    dashboards_data: List[Dict[str, Any]]


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_otp():
    return str(random.randint(100000, 999999))


def send_otp_email(recipient_email: str, otp: str):
    if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
        # In dev mode without email creds, do NOT log the OTP to stdout
        print(f"[DEV] Email credentials missing – OTP not sent to {recipient_email}")
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = "Your Verification Code"
    message["From"] = EMAIL_HOST_USER
    message["To"] = recipient_email

    html = f"""
    <html>
    <body>
        <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
            <h2>Welcome to Query Genie!</h2>
            <p>Your one-time verification code is:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #007BFF;">{otp}</p>
            <p>This code will expire in 5 minutes.</p>
        </div>
    </body>
    </html>
    """
    message.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
            server.sendmail(EMAIL_HOST_USER, recipient_email, message.as_string())
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP email.")


DANGEROUS_KEYWORDS = ["DROP", "TRUNCATE", "DELETE", "ALTER", "UPDATE"]


def detect_dangerous_sql(sql: str):
    sql_upper = sql.upper()
    return [kw for kw in DANGEROUS_KEYWORDS if kw in sql_upper]


def sql_to_table_preview(sql: str):
    sql_upper = sql.upper()
    action = "UNKNOWN"
    table = "-"
    condition = "-"

    if sql_upper.startswith("DELETE"):
        action = "DELETE"
        match = re.search(r"FROM\s+(\w+)", sql_upper)
        if match:
            table = match.group(1)
        where_match = re.search(r"WHERE\s+(.+)", sql, re.IGNORECASE)
        if where_match:
            condition = where_match.group(1)

    return {
        "columns": ["Action", "Table", "Condition", "Impact"],
        "data": [[action, table, condition, "Removes record(s) permanently"]],
    }


def validate_sql_safety(sql: str) -> Tuple[bool, str]:
    sql_upper = sql.upper().strip()
    if sql_upper.startswith(("DROP", "TRUNCATE")):
        return False, "DROP and TRUNCATE operations are not allowed"
    statements = sql.split(";")
    if len([s for s in statements if s.strip()]) > 1:
        return False, "Multiple SQL statements are not allowed"
    if "--" in sql or "/*" in sql or "*/" in sql or "#" in sql:
        return False, "SQL comments are not allowed for security"
    return True, ""


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user(identifier: str, db):
    return db.query(User).filter(User.email == identifier).first()


def format_chat_history(chat_history: list) -> str:
    if not chat_history:
        return "No previous conversation history."
    recent_history = chat_history[-5:] if len(chat_history) > 5 else chat_history
    formatted = []
    for idx, item in enumerate(recent_history, 1):
        user_msg = item.get('user', '')
        assistant_msg = item.get('assistant', '')
        sql_match = re.search(r'SQL: `([^`]+)`', assistant_msg)
        output_match = re.search(r'Output: ({.*})', assistant_msg, re.DOTALL)
        sql_query = sql_match.group(1) if sql_match else "N/A"
        if output_match:
            try:
                output_data = json.loads(output_match.group(1))
                if output_data.get('type') == 'select':
                    schema_info = f"Columns: {', '.join(output_data.get('columns', []))}, Rows: {output_data.get('row_count', 0)}"
                else:
                    schema_info = output_data.get('message', 'Operation completed')
            except Exception:
                schema_info = "Result schema unavailable"
        else:
            schema_info = "No output"
        formatted.append(
            f"\nPrevious Query #{idx}:\nUser Asked: \"{user_msg}\"\nSQL Generated: {sql_query}\nResult Schema: {schema_info}\n"
        )
    return "\n".join(formatted)


# ─────────────────────────────────────────────
# LLM CHAIN
# ─────────────────────────────────────────────
def get_sql_chain(db, chat_history: list = []):
    history_context = format_chat_history(chat_history)

    user_template = """Database Schema:
{schema}

{history}

Current User Question:
{question}

Instructions:
- Use the database schema above to understand table structures
- Review the previous conversation history to understand context
- Generate ONLY the SQL query, nothing else"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", SQL_SYSTEM_PROMPT),
        ("user", user_template),
    ])

    llm = ChatGroq(
        api_key=SecretStr(str(GROQ_API_KEY)),
        model="llama-3.3-70b-versatile",
        temperature=0,
        max_tokens=6000,
        stop_sequences=None,
    )

    def get_schema(_):
        return db.get_table_info()

    def get_history(_):
        return history_context

    return (
        RunnablePassthrough.assign(schema=get_schema, history=get_history)
        | prompt
        | llm
        | StrOutputParser()
    )


def get_response(question: str, db, db_name: str, chat_history: list = []):
    """Generate SQL via LLM, execute it, return structured response string."""
    chain = get_sql_chain(db, chat_history)
    connection = None
    sql_query = "N/A"

    try:
        response_text = chain.invoke({"question": question})
        sql_query = response_text.strip()

        # Strip markdown fences if LLM adds them
        if sql_query.startswith("```"):
            sql_query = re.sub(r'^```[\w]*\n?', '', sql_query)
            sql_query = re.sub(r'\n?```$', '', sql_query)
            sql_query = sql_query.strip()

        sql_query = sql_query.rstrip(';')

        is_safe, error_msg = validate_sql_safety(sql_query)
        if not is_safe:
            return json.dumps({
                "type": "error",
                "message": f"❌ Security Check Failed: {error_msg}",
                "sql": sql_query,
            })

        dangerous_ops = detect_dangerous_sql(sql_query)
        if dangerous_ops:
            return json.dumps({
                "type": "confirmation_required",
                "sql": sql_query,
                "dangerous_operations": dangerous_ops,
                "table": sql_to_table_preview(sql_query),
            })

        sql_upper = sql_query.upper().strip()
        sql_type = 'select' if sql_upper.startswith('SELECT') else 'other'

        if sql_type == 'select':
            # Check cache
            cached = query_cache.get(sql_query, db_name)
            if cached:
                return f"SQL: `{sql_query}`\nOutput: {json.dumps(cached)}"

            try:
                connection = db._engine.connect()
                result_proxy = None
                try:
                    result_proxy = connection.execute(text(sql_query))
                    columns = list(result_proxy.keys())
                    # Enforce row limit
                    rows = result_proxy.fetchmany(MAX_RESULT_ROWS)
                    total_fetched = len(rows)

                    data = [
                        [str(cell) if cell is not None else '' for cell in row]
                        for row in rows
                    ]

                    output_data = {
                        "type": "select",
                        "data": data,
                        "columns": columns,
                        "row_count": total_fetched,
                        "limited": total_fetched == MAX_RESULT_ROWS,
                    }
                    query_cache.set(sql_query, db_name, output_data)
                    return f"SQL: `{sql_query}`\nOutput: {json.dumps(output_data)}"
                finally:
                    if result_proxy is not None:
                        result_proxy.close()
            except Exception as select_error:
                error_message = str(select_error)
                if "only_full_group_by" in error_message or "1140" in error_message:
                    helpful_msg = (
                        "⚠️ GROUP BY Error: When using aggregate functions like COUNT, AVG, SUM, "
                        "all non-aggregated columns must be included in the GROUP BY clause.\n\n"
                        f"SQL attempted: {sql_query}\n\nTechnical error: {error_message}\n\n"
                        "💡 Tip: Try rephrasing your question."
                    )
                    output_data = {"type": "error", "message": helpful_msg}
                elif "doesn't exist" in error_message.lower() or "unknown column" in error_message.lower():
                    helpful_msg = (
                        "⚠️ Table/Column Not Found: The query references a table or column that doesn't exist.\n\n"
                        f"SQL attempted: {sql_query}\n\nTechnical error: {error_message}\n\n"
                        "💡 Tip: Ask me to show you the available tables and columns."
                    )
                    output_data = {"type": "error", "message": helpful_msg}
                elif "syntax error" in error_message.lower():
                    helpful_msg = (
                        f"⚠️ SQL Syntax Error: The generated query has a syntax problem.\n\n"
                        f"SQL attempted: {sql_query}\n\nTechnical error: {error_message}\n\n"
                        "💡 Tip: Try rephrasing your question."
                    )
                    output_data = {"type": "error", "message": helpful_msg}
                else:
                    output_data = {
                        "type": "error",
                        "message": f"Query execution failed: {error_message}",
                        "sql": sql_query,
                    }
            finally:
                if connection:
                    try:
                        connection.close()
                    except Exception as e:
                        print(f"Error closing connection: {e}")
            return f"SQL: `{sql_query}`\nOutput: {json.dumps(output_data)}"

        else:
            # Non-SELECT  (UPDATE / DELETE / INSERT after confirmation)
            result = db.run(sql_query)
            clean_result = result.strip() if result else ""

            if 'Query OK' in clean_result or 'rows affected' in clean_result or 'row affected' in clean_result:
                match = re.search(r'(\d+) rows? affected', clean_result)
                affected_rows = int(match.group(1)) if match else 0
                message = f"✅ Statement executed successfully. {affected_rows} row{'s' if affected_rows != 1 else ''} affected."
            else:
                message = clean_result or "✅ Statement executed successfully."
                affected_rows = 0

            output_data = {
                "type": "status",
                "message": message,
                "affected_rows": affected_rows,
            }
            return f"SQL: `{sql_query}`\nOutput: {json.dumps(output_data)}"

    except Exception as e:
        print(f"Error in get_response: {str(e)}")
        return json.dumps({
            "type": "error",
            "message": f"Error: {str(e)}",
        })
    finally:
        if connection and not connection.closed:
            try:
                connection.close()
            except Exception:
                pass


# ─────────────────────────────────────────────
# AUTH ENDPOINTS
# ─────────────────────────────────────────────
@app.post("/api/send-otp")
@limiter.limit("5/minute")
async def send_otp_for_signup(request: Request, otp_request: OtpRequest):
    try:
        validate_email(otp_request.email)
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=f"Invalid email address: {str(e)}")

    otp = generate_otp()
    otp_manager.store(otp_request.email, otp)
    # OTP is NOT logged to stdout
    send_otp_email(otp_request.email, otp)
    return {"success": True, "message": "OTP has been sent to your email."}


@app.post("/api/signup", status_code=201)
async def signup_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        validate_email(user.email)
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=f"Invalid email address: {str(e)}")

    is_valid, error_msg = otp_manager.verify(user.email, user.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    if get_user(user.email, db):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        firstName=user.firstName,
        lastName=user.lastName,
        gender=user.gender,
        username=user.username,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Return user so frontend can auto-login without a second round-trip
    return {
        "success": True,
        "message": "User created successfully",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "firstName": db_user.firstName,
            "lastName": db_user.lastName,
            "username": db_user.username,
            "gender": db_user.gender,
        },
    }


@app.post("/api/login")
@limiter.limit("10/minute")
async def login_for_access_token(request: Request, form_data: UserLogin, db: Session = Depends(get_db)):
    user = get_user(form_data.identifier, db)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "username": user.username,
            "gender": user.gender,
        },
    }


@app.get("/api/profile/{user_id}")
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "success": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "username": user.username,
            "gender": user.gender,
        },
    }


# ─────────────────────────────────────────────
# DATABASE CONNECTION  (per-user session tokens)
# ─────────────────────────────────────────────
@app.post("/api/list-databases")
async def list_databases(config: ServerConnectionConfig):
    try:
        import mysql.connector
        connection = mysql.connector.connect(
            host=config.host, port=config.port,
            user=config.user, password=config.password,
        )
        cursor = connection.cursor()
        cursor.execute("SHOW DATABASES")
        result: list[Any] = cursor.fetchall()
        databases = [str(row[0]) for row in result]
        system_dbs = {'information_schema', 'mysql', 'performance_schema', 'sys'}
        user_databases = [db for db in databases if db not in system_dbs]
        cursor.close()
        connection.close()
        return {"success": True, "databases": user_databases, "total": len(user_databases)}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/create-database")
async def create_database(request: CreateDatabaseRequest):
    try:
        import mysql.connector
        if not re.match(r'^[a-zA-Z0-9_]+$', request.database_name):
            raise ValueError("Database name can only contain letters, numbers, and underscores")
        connection = mysql.connector.connect(
            host=request.host, port=request.port,
            user=request.user, password=request.password,
        )
        cursor = connection.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{request.database_name}`")
        connection.commit()
        cursor.close()
        connection.close()
        return {"success": True, "message": f"Database '{request.database_name}' created successfully", "database": request.database_name}
    except ValueError as ve:
        return {"success": False, "error": str(ve)}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/connect")
async def connect_db(config: DBConfig):
    """
    Validates the connection and returns a per-user session token.
    The client MUST store this token and send it as X-DB-Session header
    on every subsequent API call that needs database access.
    """
    print(f"Connect request: host={config.host}, port={config.port}, database={config.database}")
    try:
        db_uri = (
            f"mysql+mysqlconnector://{config.user}:{config.password}"
            f"@{config.host}:{config.port}/{config.database}"
        )
        _validate_database_connection(db_uri)
        token = db_session_store.create(db_uri, config.database)
        print("Database connection successful, session token issued")
        return {"success": True, "database": config.database, "session_token": token}
    except Exception as e:
        print(f"Database connection failed: {str(e)}")
        return {"success": False, "error": str(e)}


def _validate_database_connection(db_uri: str):
    test_engine = create_engine(db_uri, pool_pre_ping=True)
    try:
        with test_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    finally:
        test_engine.dispose()


@app.post("/api/disconnect")
async def disconnect_db(x_db_session: Optional[str] = Header(default=None)):
    if x_db_session:
        db_session_store.delete(x_db_session)
    query_cache.clear()
    return {"success": True, "message": "Database disconnected successfully"}


@app.get("/api/connection-status")
async def get_connection_status(x_db_session: Optional[str] = Header(default=None)):
    if not x_db_session:
        return {"success": True, "connected": False, "database": None}
    session = db_session_store.get(x_db_session)
    if not session:
        return {"success": True, "connected": False, "database": None}
    try:
        _validate_database_connection(session["db_uri"])
        return {"success": True, "connected": True, "database": session["db_name"]}
    except Exception:
        db_session_store.delete(x_db_session)
        return {"success": True, "connected": False, "database": None}


# ─────────────────────────────────────────────
# DATABASE SCHEMA / TABLE ENDPOINTS
# ─────────────────────────────────────────────
@app.get("/api/table-schema/{table_name}")
async def get_table_schema(
    table_name: str,
    db_session: Dict[str, Any] = Depends(get_db_session),
):
    try:
        db = SQLDatabase.from_uri(db_session["db_uri"])
        connection = db._engine.connect()
        result = connection.execute(text(f"DESCRIBE `{table_name}`"))
        columns_data = result.fetchall()
        columns = []
        for row in columns_data:
            columns.append({
                "name": row[0],
                "type": row[1],
                "nullable": row[2] == "YES",
                "key": row[3] if row[3] else None,
                "default": row[4],
                "autoincrement": "auto_increment" in str(row[5]).lower() if row[5] else False,
            })
        connection.close()
        return {"success": True, "table_name": table_name, "columns": columns}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/database-tables")
async def get_database_tables(db_session: Dict[str, Any] = Depends(get_db_session)):
    try:
        db = SQLDatabase.from_uri(db_session["db_uri"])
        connection = db._engine.connect()
        result = connection.execute(text("SHOW TABLES"))
        table_names = [row[0] for row in result.fetchall()]
        tables_info = []
        for table_name in table_names:
            try:
                count_result = connection.execute(text(f"SELECT COUNT(*) FROM `{table_name}`"))
                count_row = count_result.fetchone()
                row_count = count_row[0] if count_row else 0
                status_result = connection.execute(text(f"SHOW TABLE STATUS LIKE '{table_name}'"))
                status_row = status_result.fetchone()
                last_updated = "just now"
                if status_row and len(status_row) > 12 and status_row[12]:
                    last_updated = str(status_row[12])
                tables_info.append({"name": table_name, "rowCount": row_count, "lastUpdated": last_updated})
            except Exception as table_error:
                print(f"Error processing table {table_name}: {str(table_error)}")
                tables_info.append({"name": table_name, "rowCount": 0, "lastUpdated": "unknown"})
        connection.close()
        return {"success": True, "tables": tables_info, "total": len(tables_info)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# CHAT ENDPOINT
# ─────────────────────────────────────────────
@app.post("/api/chat")
@limiter.limit("60/minute")
async def chat_endpoint(
    request: Request,
    chat_request: ChatRequest,
    db_session: Dict[str, Any] = Depends(get_db_session),
):
    try:
        # Reuse engine per request – no new engine created every call
        db_uri = db_session["db_uri"]
        db_name = db_session["db_name"]

        db = SQLDatabase.from_uri(db_uri)
        response = get_response(
            question=chat_request.question,
            db=db,
            db_name=db_name,
            chat_history=chat_request.chat_history,
        )
        return {"success": True, "response": response}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Chat endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# ─────────────────────────────────────────────
# CONFIRM-SQL  — DISABLED until properly secured
# ─────────────────────────────────────────────
@app.post("/api/confirm-sql")
async def confirm_sql_action():
    """
    Write-SQL execution is temporarily disabled pending full
    server-side pending-action implementation with audit logging.
    """
    raise HTTPException(
        status_code=503,
        detail="Write operations are temporarily disabled. Contact support for updates.",
    )


# ─────────────────────────────────────────────
# CHAT SESSIONS
# NOTE: delete-all MUST be declared before /{session_id}
# ─────────────────────────────────────────────
@app.get("/api/chat-sessions")
async def get_chat_sessions(user_id: int):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    db_session = SessionLocal()
    try:
        sessions = db_session.query(ChatSession).filter(ChatSession.user_id == user_id).all()
        result = []
        for session in sessions:
            result.append({
                "id": session.id,
                "title": session.title,
                "messages": json.loads(str(session.messages)),
                "timestamp": datetime.utcnow().isoformat(),
            })
        return result
    finally:
        db_session.close()


@app.post("/api/chat-sessions")
async def create_chat_session(session: dict):
    db_session = SessionLocal()
    try:
        new_session = ChatSession(
            user_id=session.get("user_id"),
            title=session.get("title", "Untitled Chat"),
            messages=json.dumps(session.get("messages", [])),
        )
        db_session.add(new_session)
        db_session.commit()
        db_session.refresh(new_session)
        return {
            "id": new_session.id,
            "title": new_session.title,
            "messages": json.loads(str(new_session.messages)),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create chat session: {str(e)}")
    finally:
        db_session.close()


@app.put("/api/chat-sessions/{session_id}")
async def update_chat_session(session_id: int, session: dict):
    db_session = SessionLocal()
    try:
        existing_session = db_session.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not existing_session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        if cast(int, existing_session.user_id) != session.get("user_id"):
            raise HTTPException(status_code=403, detail="Unauthorized to update this session")
        if "title" in session:
            existing_session.title = session["title"]
        if "messages" in session:
            setattr(existing_session, 'messages', json.dumps(session["messages"]))
        db_session.commit()
        return {
            "id": existing_session.id,
            "title": existing_session.title,
            "messages": json.loads(str(existing_session.messages)),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update chat session: {str(e)}")
    finally:
        db_session.close()


# IMPORTANT: delete-all must come BEFORE the dynamic {session_id} route
@app.delete("/api/chat-sessions/delete-all")
async def delete_all_chat_sessions(user_id: int):
    if user_id is None:
        raise HTTPException(status_code=400, detail="user_id is required")
    db_session = SessionLocal()
    try:
        sessions = db_session.query(ChatSession).filter(ChatSession.user_id == user_id).all()
        if not sessions:
            return {"success": True, "message": "No chat sessions to delete"}
        for session in sessions:
            db_session.delete(session)
        db_session.commit()
        return {"success": True, "message": f"Deleted {len(sessions)} chat sessions"}
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete chat sessions: {str(e)}")
    finally:
        db_session.close()


@app.delete("/api/chat-sessions/{session_id}")
async def delete_chat_session(
    session_id: int = Path(..., description="The ID of the chat session to delete"),
    user_id: Optional[int] = None,
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="user_id is required")
    db_session = SessionLocal()
    try:
        chat_session = db_session.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not chat_session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        if cast(int, chat_session.user_id) != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized to delete this session")
        db_session.delete(chat_session)
        db_session.commit()
        return {"success": True, "message": "Chat session deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete chat session: {str(e)}")
    finally:
        db_session.close()


# ─────────────────────────────────────────────
# FAVORITES
# ─────────────────────────────────────────────
@app.get("/api/favorites/{user_id}")
async def get_favorites(user_id: int, db: Session = Depends(get_db)):
    favorites = db.query(FavoriteQuery).filter(
        FavoriteQuery.user_id == user_id
    ).order_by(FavoriteQuery.created_at.desc()).all()
    return [{
        "id": fav.id,
        "question": fav.question,
        "sql_query": fav.sql_query,
        "tags": fav.tags,
        "description": fav.description,
        "created_at": fav.created_at.isoformat(),
    } for fav in favorites]


@app.get("/api/favorites/{user_id}/check")
async def check_favorite(user_id: int, sql: str, db: Session = Depends(get_db)):
    favorite = db.query(FavoriteQuery).filter(
        FavoriteQuery.user_id == user_id,
        FavoriteQuery.sql_query == sql,
    ).first()
    return {
        "is_favorite": favorite is not None,
        "favorite_id": favorite.id if favorite else None,
    }


@app.post("/api/favorites")
async def add_favorite(favorite: FavoriteQueryCreate, db: Session = Depends(get_db)):
    existing = db.query(FavoriteQuery).filter(
        FavoriteQuery.user_id == favorite.user_id,
        FavoriteQuery.sql_query == favorite.sql_query,
    ).first()
    if existing:
        return {"success": False, "message": "Query already in favorites"}
    new_favorite = FavoriteQuery(
        user_id=favorite.user_id,
        question=favorite.question,
        sql_query=favorite.sql_query,
        tags=favorite.tags,
        description=favorite.description,
    )
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    return {"success": True, "message": "Added to favorites", "id": new_favorite.id}


@app.delete("/api/favorites/{favorite_id}")
async def remove_favorite(favorite_id: int, user_id: int, db: Session = Depends(get_db)):
    favorite = db.query(FavoriteQuery).filter(
        FavoriteQuery.id == favorite_id,
        FavoriteQuery.user_id == user_id,
    ).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(favorite)
    db.commit()
    return {"success": True, "message": "Removed from favorites"}


# ─────────────────────────────────────────────
# USER SETTINGS
# ─────────────────────────────────────────────
@app.get("/api/settings/{user_id}")
async def get_user_settings(user_id: int, db: Session = Depends(get_db)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return {
        "theme": settings.theme,
        "language": settings.language,
        "results_per_page": settings.results_per_page,
        "auto_save_sessions": settings.auto_save_sessions,
        "sql_syntax_highlighting": settings.sql_syntax_highlighting,
        "notification_preferences": settings.notification_preferences or {},
    }


@app.put("/api/settings/{user_id}")
async def update_user_settings(
    user_id: int,
    settings_update: UserSettingsUpdate,
    db: Session = Depends(get_db),
):
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
    update_data = settings_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    setattr(settings, 'updated_at', datetime.utcnow())
    db.commit()
    db.refresh(settings)
    return {"success": True, "message": "Settings updated successfully"}


# ─────────────────────────────────────────────
# EXPORT
# ─────────────────────────────────────────────
@app.post("/api/export")
async def export_results(request: ExportRequest):
    try:
        if request.format == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(request.columns)
            writer.writerows(request.data)
            return {
                "success": True,
                "format": "csv",
                "data": output.getvalue(),
                "filename": f"query_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            }
        elif request.format == "json":
            results = []
            for row in request.data:
                row_dict = {}
                for i, col in enumerate(request.columns):
                    row_dict[col] = row[i] if i < len(row) else None
                results.append(row_dict)
            return {
                "success": True,
                "format": "json",
                "data": json.dumps(results, indent=2),
                "filename": f"query_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            }
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format. Use 'csv' or 'json'")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


# ─────────────────────────────────────────────
# SEARCH TABLES
# ─────────────────────────────────────────────
@app.get("/api/search/tables")
async def search_tables(query: str, db_session: Dict[str, Any] = Depends(get_db_session)):
    try:
        db = SQLDatabase.from_uri(db_session["db_uri"])
        schema_info = db.get_table_info()
        query_lower = query.lower()
        results = {"tables": [], "columns": []}
        lines = schema_info.split('\n')
        current_table = None
        for line in lines:
            if 'CREATE TABLE' in line:
                table_name = line.split('`')[1] if '`' in line else None
                current_table = table_name
                if table_name and query_lower in table_name.lower():
                    results["tables"].append(table_name)
            elif current_table and '`' in line:
                col_name = line.split('`')[1]
                if query_lower in col_name.lower():
                    results["columns"].append({"table": current_table, "column": col_name})
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


# ─────────────────────────────────────────────
# QUERY HISTORY
# ─────────────────────────────────────────────
@app.post("/api/history/track")
async def track_query_execution(data: dict, db: Session = Depends(get_db)):
    history = QueryHistory(
        user_id=data.get("user_id"),
        session_id=data.get("session_id"),
        question=data.get("question"),
        sql_query=data.get("sql_query"),
        success=data.get("success", True),
        execution_time_ms=data.get("execution_time_ms"),
        row_count=data.get("row_count"),
    )
    db.add(history)
    db.commit()
    return {"success": True, "message": "Query tracked"}


@app.get("/api/history/{user_id}")
async def get_query_history(user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    history = db.query(QueryHistory).filter(
        QueryHistory.user_id == user_id
    ).order_by(QueryHistory.created_at.desc()).limit(limit).all()
    return [{
        "id": h.id,
        "question": h.question,
        "sql_query": h.sql_query,
        "success": h.success,
        "execution_time_ms": h.execution_time_ms,
        "row_count": h.row_count,
        "created_at": h.created_at.isoformat(),
    } for h in history]


@app.get("/api/history/{user_id}/stats")
async def get_query_stats(user_id: int, db: Session = Depends(get_db)):
    total_queries = db.query(QueryHistory).filter(QueryHistory.user_id == user_id).count()
    successful_queries = db.query(QueryHistory).filter(
        QueryHistory.user_id == user_id,
        QueryHistory.success.is_(True),
    ).count()
    return {
        "total_queries": total_queries,
        "successful_queries": successful_queries,
        "success_rate": (successful_queries / total_queries * 100) if total_queries > 0 else 0,
    }


# ─────────────────────────────────────────────
# CUSTOM DASHBOARDS
# ─────────────────────────────────────────────
def serialize_dashboard(dashboard: UserDashboard) -> Dict[str, Any]:
    return {
        "id": dashboard.id,
        "dashboard_id": dashboard.dashboard_id,
        "user_id": dashboard.user_id,
        "name": dashboard.name,
        "description": dashboard.description,
        "charts": json.loads(dashboard.charts_data),
        "created_at": dashboard.created_at.isoformat() if dashboard.created_at else None,
        "updated_at": dashboard.updated_at.isoformat() if dashboard.updated_at else None,
    }


@app.get("/api/custom-dashboards/{user_id}")
async def get_user_dashboards(user_id: int, db: Session = Depends(get_db)):
    dashboards = db.query(UserDashboard).filter(UserDashboard.user_id == user_id).all()
    return [serialize_dashboard(dashboard) for dashboard in dashboards]


@app.post("/api/custom-dashboards")
async def create_dashboard(dashboard: DashboardCreate, db: Session = Depends(get_db)):
    existing = db.query(UserDashboard).filter(
        UserDashboard.dashboard_id == dashboard.dashboard_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Dashboard ID already exists")
    new_dashboard = UserDashboard(
        user_id=dashboard.user_id,
        dashboard_id=dashboard.dashboard_id,
        name=dashboard.name,
        description=dashboard.description or '',
        charts_data=json.dumps(dashboard.charts),
    )
    db.add(new_dashboard)
    db.commit()
    db.refresh(new_dashboard)
    return serialize_dashboard(new_dashboard)


@app.put("/api/custom-dashboards/{dashboard_id}")
async def update_dashboard(dashboard_id: str, updates: DashboardUpdate, user_id: int, db: Session = Depends(get_db)):
    dashboard = db.query(UserDashboard).filter(
        UserDashboard.dashboard_id == dashboard_id,
        UserDashboard.user_id == user_id,
    ).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    if updates.name is not None:
        dashboard.name = updates.name
    if updates.description is not None:
        dashboard.description = updates.description
    if updates.charts is not None:
        dashboard.charts_data = json.dumps(updates.charts)
    dashboard.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(dashboard)
    return serialize_dashboard(dashboard)


@app.delete("/api/custom-dashboards/{dashboard_id}")
async def delete_dashboard(dashboard_id: str, user_id: int, db: Session = Depends(get_db)):
    dashboard = db.query(UserDashboard).filter(
        UserDashboard.dashboard_id == dashboard_id,
        UserDashboard.user_id == user_id,
    ).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    db.delete(dashboard)
    db.commit()
    return {"success": True, "message": "Dashboard deleted"}


@app.post("/api/custom-dashboards/migrate-from-localstorage")
async def migrate_dashboards(migration: DashboardMigrate, db: Session = Depends(get_db)):
    try:
        migrated_count = 0
        skipped_count = 0
        for dashboard_data in migration.dashboards_data:
            existing = db.query(UserDashboard).filter(
                UserDashboard.dashboard_id == dashboard_data.get('id'),
                UserDashboard.user_id == migration.user_id,
            ).first()
            if existing:
                skipped_count += 1
                continue
            new_dashboard = UserDashboard(
                user_id=migration.user_id,
                dashboard_id=dashboard_data.get('id'),
                name=dashboard_data.get('name', 'Untitled Dashboard'),
                description=dashboard_data.get('description', ''),
                charts_data=json.dumps(dashboard_data.get('charts', [])),
                created_at=datetime.fromisoformat(
                    dashboard_data.get('createdAt', datetime.utcnow().isoformat()).replace('Z', '+00:00')
                ),
                updated_at=datetime.fromisoformat(
                    dashboard_data.get('updatedAt', datetime.utcnow().isoformat()).replace('Z', '+00:00')
                ),
            )
            db.add(new_dashboard)
            migrated_count += 1
        db.commit()
        message = f"Migrated {migrated_count} dashboards, skipped {skipped_count} existing"
        return {"success": True, "message": message, "migrated": migrated_count, "skipped": skipped_count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.on_event("shutdown")
async def shutdown_event():
    print("Application shutdown - resources cleaned up")
