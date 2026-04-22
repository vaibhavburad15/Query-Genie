import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Path, Request, Header
from fastapi.concurrency import run_in_threadpool
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from email_validator import validate_email, EmailNotValidError
from pydantic import BaseModel, EmailStr, SecretStr, Field
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
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, text, or_
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
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    firstName: Mapped[str] = mapped_column(String, nullable=False)
    lastName: Mapped[str] = mapped_column(String, nullable=False)
    gender: Mapped[str] = mapped_column(String, nullable=False)
    username: Mapped[str] = mapped_column(String, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    messages: Mapped[str] = mapped_column(Text, nullable=False)


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


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class DatabaseSession(Base):
    __tablename__ = "database_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    db_uri: Mapped[str] = mapped_column(Text, nullable=False)
    db_name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class OtpCode(Base):
    __tablename__ = "otp_codes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    otp_hash: Mapped[str] = mapped_column(String, nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


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
    """Database-backed, per-user database connection store."""

    def __init__(self, ttl_seconds: int = 3600):
        self._ttl = ttl_seconds

    def _cleanup_expired(self, db: Session) -> None:
        db.query(DatabaseSession).filter(DatabaseSession.expires_at <= datetime.utcnow()).delete()
        db.flush()

    def create(self, user_id: int, db_uri: str, db_name: str, db: Session) -> str:
        """Store a new connection and return an opaque session token."""
        token = secrets.token_urlsafe(32)
        self._cleanup_expired(db)
        db.query(DatabaseSession).filter(DatabaseSession.user_id == user_id).delete()
        db.add(
            DatabaseSession(
                user_id=user_id,
                token_hash=hash_token(token),
                db_uri=db_uri,
                db_name=db_name,
                expires_at=datetime.utcnow() + timedelta(seconds=self._ttl),
            )
        )
        db.commit()
        return token

    def get(self, token: str, db: Session, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Return the session dict or None if missing / expired."""
        query = db.query(DatabaseSession).filter(
            DatabaseSession.token_hash == hash_token(token),
            DatabaseSession.expires_at > datetime.utcnow(),
        )
        if user_id is not None:
            query = query.filter(DatabaseSession.user_id == user_id)
        session = query.first()
        if session is None:
            return None
        return {
            "db_uri": session.db_uri,
            "db_name": session.db_name,
            "session_id": session.id,
            "user_id": session.user_id,
        }

    def delete(self, token: str, db: Session, user_id: Optional[int] = None) -> None:
        query = db.query(DatabaseSession).filter(DatabaseSession.token_hash == hash_token(token))
        if user_id is not None:
            query = query.filter(DatabaseSession.user_id == user_id)
        query.delete()
        db.commit()


db_session_store = DbSessionStore(ttl_seconds=int(os.getenv("DB_SESSION_TTL", "3600")))


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
    """Database-backed OTP manager."""

    def _cleanup_expired(self, db: Session) -> None:
        db.query(OtpCode).filter(OtpCode.expires_at <= datetime.utcnow()).delete()
        db.flush()

    def store(self, email: str, otp: str, db: Session, expiry_minutes: int = 5) -> None:
        self._cleanup_expired(db)
        existing = db.query(OtpCode).filter(OtpCode.email == email).first()
        if existing:
            db.delete(existing)
            db.flush()
        db.add(
            OtpCode(
                email=email,
                otp_hash=get_password_hash(otp),
                attempts=0,
                expires_at=datetime.utcnow() + timedelta(minutes=expiry_minutes),
            )
        )
        db.commit()

    def verify(self, email: str, otp: str, db: Session) -> Tuple[bool, str]:
        self._cleanup_expired(db)
        otp_record = db.query(OtpCode).filter(OtpCode.email == email).first()
        if otp_record is None:
            return False, "OTP not requested or already used"
        if otp_record.expires_at <= datetime.utcnow():
            db.delete(otp_record)
            db.commit()
            return False, "OTP has expired"
        if otp_record.attempts >= 5:
            db.delete(otp_record)
            db.commit()
            return False, "Too many failed attempts. Request a new OTP."
        if not verify_password(otp, otp_record.otp_hash):
            otp_record.attempts += 1
            db.commit()
            return False, "Invalid OTP"
        db.delete(otp_record)
        db.commit()
        return True, "OTP verified"


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
    chat_history: list = Field(default_factory=list)


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
    user_id: Optional[int] = None
    question: str
    sql_query: str
    tags: Optional[str] = None
    description: Optional[str] = None


class ChatSessionCreateRequest(BaseModel):
    title: str = "Untitled Chat"
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    user_id: Optional[int] = None


class ChatSessionUpdateRequest(BaseModel):
    title: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None
    user_id: Optional[int] = None


class QueryHistoryTrackRequest(BaseModel):
    user_id: Optional[int] = None
    session_id: Optional[int] = None
    question: str
    sql_query: str
    success: bool = True
    execution_time_ms: Optional[int] = None
    row_count: Optional[int] = None


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
    user_id: Optional[int] = None
    dashboard_id: str
    name: str
    description: Optional[str] = ""
    charts: List[Dict[str, Any]]


class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    charts: Optional[List[Dict[str, Any]]] = None


class DashboardMigrate(BaseModel):
    user_id: Optional[int] = None
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


AUTH_SESSION_TTL_SECONDS = int(os.getenv("AUTH_SESSION_TTL", "604800"))
READ_ONLY_SQL_PREFIXES = ("SELECT", "WITH", "SHOW", "DESCRIBE", "DESC", "EXPLAIN")


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_auth_token(user_id: int, db: Session) -> str:
    token = secrets.token_urlsafe(32)
    db.query(AuthSession).filter(AuthSession.expires_at <= datetime.utcnow()).delete()
    db.add(
        AuthSession(
            user_id=user_id,
            token_hash=hash_token(token),
            expires_at=datetime.utcnow() + timedelta(seconds=AUTH_SESSION_TTL_SECONDS),
        )
    )
    db.commit()
    return token


def extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return token


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    token = extract_bearer_token(authorization)
    token_hash = hash_token(token)
    auth_session = db.query(AuthSession).filter(AuthSession.token_hash == token_hash).first()
    if auth_session is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if auth_session.expires_at <= datetime.utcnow():
        db.delete(auth_session)
        db.commit()
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    user = db.query(User).filter(User.id == auth_session.user_id).first()
    if user is None:
        db.delete(auth_session)
        db.commit()
        raise HTTPException(status_code=401, detail="User not found for this session")
    return user


def revoke_auth_token(token: str, db: Session) -> None:
    db.query(AuthSession).filter(AuthSession.token_hash == hash_token(token)).delete()
    db.commit()


def assert_user_access(requested_user_id: Optional[int], current_user: User) -> None:
    if requested_user_id is not None and requested_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to access another user's data")


def get_db_session(
    x_db_session: Optional[str] = Header(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """FastAPI dependency – resolves the per-user DB session from the header."""
    if not x_db_session:
        raise HTTPException(status_code=400, detail="X-DB-Session header is required. Connect to a database first.")
    session = db_session_store.get(x_db_session, db, current_user.id)
    if session is None:
        raise HTTPException(status_code=401, detail="Database session expired or not found. Please reconnect.")
    return session


class EngineCache:
    def __init__(self):
        self._engines: Dict[str, Any] = {}
        self._lock = threading.Lock()

    def get(self, db_uri: str):
        with self._lock:
            engine = self._engines.get(db_uri)
            if engine is None:
                engine = create_engine(
                    db_uri,
                    pool_pre_ping=True,
                    pool_recycle=3600,
                    pool_size=10,
                    max_overflow=20,
                )
                self._engines[db_uri] = engine
            return engine

    def dispose_all(self) -> None:
        with self._lock:
            for engine in self._engines.values():
                engine.dispose()
            self._engines.clear()


engine_cache = EngineCache()


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


DANGEROUS_KEYWORDS = [
    "DROP",
    "TRUNCATE",
    "DELETE",
    "ALTER",
    "UPDATE",
    "INSERT",
    "CREATE",
    "REPLACE",
    "MERGE",
    "RENAME",
    "GRANT",
    "REVOKE",
]


def detect_dangerous_sql(sql: str):
    sql_upper = sql.upper()
    return [kw for kw in DANGEROUS_KEYWORDS if kw in sql_upper]


def is_read_only_sql(sql: str) -> bool:
    return sql.upper().strip().startswith(READ_ONLY_SQL_PREFIXES)


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
    return db.query(User).filter(
        or_(User.email == identifier, User.username == identifier)
    ).first()


def format_chat_history(chat_history: list) -> str:
    if not chat_history:
        return "No previous conversation history."
    recent_history = chat_history[-10:] if len(chat_history) > 10 else chat_history
    normalized_history = []

    if recent_history and isinstance(recent_history[0], dict) and "role" in recent_history[0]:
        pending_user = ""
        for item in recent_history:
            role = item.get("role")
            content = item.get("content", "")
            if role == "user":
                if pending_user:
                    normalized_history.append({"user": pending_user, "assistant": ""})
                pending_user = content
            elif role in {"assistant", "ai"}:
                normalized_history.append({"user": pending_user, "assistant": content})
                pending_user = ""
        if pending_user:
            normalized_history.append({"user": pending_user, "assistant": ""})
    else:
        normalized_history = recent_history[-5:]

    formatted = []
    for idx, item in enumerate(normalized_history[-5:], 1):
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
def get_sql_chain(db, chat_history: Optional[list] = None):
    history_context = format_chat_history(chat_history or [])

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


def get_response(question: str, db, db_name: str, chat_history: Optional[list] = None):
    """Generate SQL via LLM, execute it, return structured response string."""
    chain = get_sql_chain(db, chat_history or [])
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

        if not is_read_only_sql(sql_query):
            return json.dumps({
                "type": "error",
                "sql": sql_query,
                "message": "Write operations are temporarily disabled for security reasons. Only read-only queries are allowed.",
            })

        sql_upper = sql_query.upper().strip()
        sql_type = 'select' if sql_upper.startswith(("SELECT", "WITH", "SHOW", "DESCRIBE", "DESC", "EXPLAIN")) else 'other'

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
            return json.dumps({
                "type": "error",
                "sql": sql_query,
                "message": "Only read-only SQL queries are supported in production mode.",
            })

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


def run_chat_query(question: str, db_uri: str, db_name: str, chat_history: Optional[list] = None) -> str:
    db = SQLDatabase(engine_cache.get(db_uri))
    return get_response(question=question, db=db, db_name=db_name, chat_history=chat_history or [])


# ─────────────────────────────────────────────
# AUTH ENDPOINTS
# ─────────────────────────────────────────────
@app.post("/api/send-otp")
@limiter.limit("5/minute")
async def send_otp_for_signup(request: Request, otp_request: OtpRequest, db: Session = Depends(get_db)):
    try:
        validate_email(otp_request.email)
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=f"Invalid email address: {str(e)}")

    otp = generate_otp()
    otp_manager.store(otp_request.email, otp, db)
    # OTP is NOT logged to stdout
    send_otp_email(otp_request.email, otp)
    return {"success": True, "message": "OTP has been sent to your email."}


@app.post("/api/signup", status_code=201)
async def signup_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        validate_email(user.email)
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=f"Invalid email address: {str(e)}")

    is_valid, error_msg = otp_manager.verify(user.email, user.otp, db)
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
    auth_token = create_auth_token(db_user.id, db)

    # Return user so frontend can auto-login without a second round-trip
    return {
        "success": True,
        "message": "User created successfully",
        "auth_token": auth_token,
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
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    auth_token = create_auth_token(user.id, db)

    return {
        "success": True,
        "message": "Login successful",
        "auth_token": auth_token,
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
async def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
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


@app.post("/api/logout")
async def logout_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    if authorization:
        try:
            revoke_auth_token(extract_bearer_token(authorization), db)
        except HTTPException:
            pass
    return {"success": True, "message": "Logged out successfully"}


# ─────────────────────────────────────────────
# DATABASE CONNECTION  (per-user session tokens)
# ─────────────────────────────────────────────
@app.post("/api/list-databases")
async def list_databases(
    config: ServerConnectionConfig,
    current_user: User = Depends(get_current_user),
):
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
async def create_database(
    request: CreateDatabaseRequest,
    current_user: User = Depends(get_current_user),
):
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
async def connect_db(
    config: DBConfig,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
        token = db_session_store.create(current_user.id, db_uri, config.database, db)
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
async def disconnect_db(
    x_db_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if x_db_session:
        db_session_store.delete(x_db_session, db, current_user.id)
    query_cache.clear()
    return {"success": True, "message": "Database disconnected successfully"}


@app.get("/api/connection-status")
async def get_connection_status(
    x_db_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not x_db_session:
        return {"success": True, "connected": False, "database": None}
    session = db_session_store.get(x_db_session, db, current_user.id)
    if session is None:
        return {"success": True, "connected": False, "database": None}
    try:
        _validate_database_connection(session["db_uri"])
        return {"success": True, "connected": True, "database": session["db_name"]}
    except Exception:
        db_session_store.delete(x_db_session, db, current_user.id)
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
        db = SQLDatabase(engine_cache.get(db_session["db_uri"]))
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
        db = SQLDatabase(engine_cache.get(db_session["db_uri"]))
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
        db_uri = db_session["db_uri"]
        db_name = db_session["db_name"]
        response = await run_in_threadpool(
            run_chat_query,
            chat_request.question,
            db_uri,
            db_name,
            chat_request.chat_history,
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
async def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).all()
    result = []
    for session in sessions:
        result.append({
            "id": session.id,
            "title": session.title,
            "messages": json.loads(str(session.messages)),
            "timestamp": datetime.utcnow().isoformat(),
        })
    return result


@app.post("/api/chat-sessions")
async def create_chat_session(
    session: ChatSessionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(session.user_id, current_user)
    try:
        new_session = ChatSession(
            user_id=current_user.id,
            title=session.title or "Untitled Chat",
            messages=json.dumps(session.messages),
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return {
            "id": new_session.id,
            "title": new_session.title,
            "messages": json.loads(str(new_session.messages)),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create chat session: {str(e)}")


@app.put("/api/chat-sessions/{session_id}")
async def update_chat_session(
    session_id: int,
    session: ChatSessionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(session.user_id, current_user)
    try:
        existing_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not existing_session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        if cast(int, existing_session.user_id) != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized to update this session")
        if session.title is not None:
            existing_session.title = session.title
        if session.messages is not None:
            setattr(existing_session, 'messages', json.dumps(session.messages))
        db.commit()
        return {
            "id": existing_session.id,
            "title": existing_session.title,
            "messages": json.loads(str(existing_session.messages)),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update chat session: {str(e)}")


# IMPORTANT: delete-all must come BEFORE the dynamic {session_id} route
@app.delete("/api/chat-sessions/delete-all")
async def delete_all_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).all()
        if not sessions:
            return {"success": True, "message": "No chat sessions to delete"}
        for session in sessions:
            db.delete(session)
        db.commit()
        return {"success": True, "message": f"Deleted {len(sessions)} chat sessions"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete chat sessions: {str(e)}")


@app.delete("/api/chat-sessions/{session_id}")
async def delete_chat_session(
    session_id: int = Path(..., description="The ID of the chat session to delete"),
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
    try:
        chat_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not chat_session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        if cast(int, chat_session.user_id) != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized to delete this session")
        db.delete(chat_session)
        db.commit()
        return {"success": True, "message": "Chat session deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete chat session: {str(e)}")


# ─────────────────────────────────────────────
# FAVORITES
# ─────────────────────────────────────────────
@app.get("/api/favorites/{user_id}")
async def get_favorites(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
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
async def check_favorite(
    user_id: int,
    sql: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
    favorite = db.query(FavoriteQuery).filter(
        FavoriteQuery.user_id == user_id,
        FavoriteQuery.sql_query == sql,
    ).first()
    return {
        "is_favorite": favorite is not None,
        "favorite_id": favorite.id if favorite else None,
    }


@app.post("/api/favorites")
async def add_favorite(
    favorite: FavoriteQueryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(favorite.user_id, current_user)
    existing = db.query(FavoriteQuery).filter(
        FavoriteQuery.user_id == current_user.id,
        FavoriteQuery.sql_query == favorite.sql_query,
    ).first()
    if existing:
        return {"success": False, "message": "Query already in favorites"}
    new_favorite = FavoriteQuery(
        user_id=current_user.id,
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
async def remove_favorite(
    favorite_id: int,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
    favorite = db.query(FavoriteQuery).filter(
        FavoriteQuery.id == favorite_id,
        FavoriteQuery.user_id == current_user.id,
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
async def get_user_settings(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
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
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


# ─────────────────────────────────────────────
# SEARCH TABLES
# ─────────────────────────────────────────────
@app.get("/api/search/tables")
async def search_tables(query: str, db_session: Dict[str, Any] = Depends(get_db_session)):
    try:
        db = SQLDatabase(engine_cache.get(db_session["db_uri"]))
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
async def track_query_execution(
    data: QueryHistoryTrackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(data.user_id, current_user)
    history = QueryHistory(
        user_id=current_user.id,
        session_id=data.session_id,
        question=data.question,
        sql_query=data.sql_query,
        success=data.success,
        execution_time_ms=data.execution_time_ms,
        row_count=data.row_count,
    )
    db.add(history)
    db.commit()
    return {"success": True, "message": "Query tracked"}


@app.get("/api/history/{user_id}")
async def get_query_history(
    user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
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
async def get_query_stats(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
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
async def get_user_dashboards(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
    dashboards = db.query(UserDashboard).filter(UserDashboard.user_id == user_id).all()
    return [serialize_dashboard(dashboard) for dashboard in dashboards]


@app.post("/api/custom-dashboards")
async def create_dashboard(
    dashboard: DashboardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(dashboard.user_id, current_user)
    existing = db.query(UserDashboard).filter(
        UserDashboard.dashboard_id == dashboard.dashboard_id,
        UserDashboard.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Dashboard ID already exists")
    new_dashboard = UserDashboard(
        user_id=current_user.id,
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
async def update_dashboard(
    dashboard_id: str,
    updates: DashboardUpdate,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
    dashboard = db.query(UserDashboard).filter(
        UserDashboard.dashboard_id == dashboard_id,
        UserDashboard.user_id == current_user.id,
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
async def delete_dashboard(
    dashboard_id: str,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(user_id, current_user)
    dashboard = db.query(UserDashboard).filter(
        UserDashboard.dashboard_id == dashboard_id,
        UserDashboard.user_id == current_user.id,
    ).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    db.delete(dashboard)
    db.commit()
    return {"success": True, "message": "Dashboard deleted"}


@app.post("/api/custom-dashboards/migrate-from-localstorage")
async def migrate_dashboards(
    migration: DashboardMigrate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_user_access(migration.user_id, current_user)
    try:
        migrated_count = 0
        skipped_count = 0
        for dashboard_data in migration.dashboards_data:
            existing = db.query(UserDashboard).filter(
                UserDashboard.dashboard_id == dashboard_data.get('id'),
                UserDashboard.user_id == current_user.id,
            ).first()
            if existing:
                skipped_count += 1
                continue
            new_dashboard = UserDashboard(
                user_id=current_user.id,
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
    engine_cache.dispose_all()
    print("Application shutdown - resources cleaned up")
