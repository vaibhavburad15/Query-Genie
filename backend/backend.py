import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Path, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from email_validator import validate_email, EmailNotValidError
from pydantic import BaseModel, EmailStr, SecretStr
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from passlib.context import CryptContext
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_community.utilities import SQLDatabase
from langchain_groq import ChatGroq
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, text, and_
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import json
import re
from typing import cast, Any
from typing import List, Optional
import csv
import io
import hashlib
from extended_models import (
    FavoriteQuery,
    UserSettings,
    TipOfTheDay,
    QueryHistory,
    Base
)
from sql_system_prompt import SQL_SYSTEM_PROMPT
import re
from typing import Tuple
import threading
import time
# Load environment variables
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("WARNING: GROQ_API_KEY not found in environment variables. Please set it to enable AI features.")
    GROQ_API_KEY = ""
else:
    GROQ_API_KEY = cast(str, groq_api_key)

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
    print("WARNING: Email credentials not found. OTP sending will be disabled.")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SQLITE_DB_FILE = "users.db"
engine = create_engine(
    f"sqlite:///{SQLITE_DB_FILE}", 
    echo=False,
    pool_pre_ping=True,              # ✅ Test connections before using
    pool_recycle=3600,               # ✅ Recycle connections every hour
    pool_size=10,                    # ✅ INCREASED: Increased from 5
    max_overflow=20,                 # ✅ INCREASED: Increased from 10
    connect_args={
        "timeout": 30,               # ✅ NEW: Connection timeout
        "check_same_thread": False   # ✅ For SQLite multi-threading
    },
    execution_options={
        "sqlite_synchronous": 0,     # ✅ Performance: Use async writes
    }
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

Base.metadata.create_all(engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class QueryCache:
    """Cache for query results with TTL"""
    def __init__(self, ttl_seconds: int = 300):
        self.cache = {}
        self.ttl = ttl_seconds
        self.timestamps = {}
    
    def get_cache_key(self, sql: str, database: str) -> str:
        """Generate cache key from query and database"""
        return hashlib.md5(f"{sql}:{database}".encode()).hexdigest()
    
    def get(self, key: str) -> Optional[dict]:
        """Get cached result if not expired"""
        if key not in self.cache:
            return None
        
        if time.time() - self.timestamps[key] > self.ttl:
            del self.cache[key]
            del self.timestamps[key]
            return None
        
        return self.cache[key]
    
    def set(self, key: str, value: dict):
        """Cache result"""
        self.cache[key] = value
        self.timestamps[key] = time.time()
    
    def clear(self):
        """Clear entire cache"""
        self.cache.clear()
        self.timestamps.clear()

query_cache = QueryCache(ttl_seconds=300)

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SlowAPIMiddleware)

class OtpManager:
    """Thread-safe OTP manager with auto-cleanup"""
    def __init__(self):
        self.storage = {}
        self.lock = threading.Lock()
        self.cleanup_thread = None
    
    def store(self, email: str, otp: str, expiry_minutes: int = 5):
        with self.lock:
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes)
            self.storage[email] = {
                "otp": otp,
                "expires_at": expires_at,
                "attempts": 0
            }
            self._schedule_cleanup(email, expiry_minutes)
    
    def verify(self, email: str, otp: str) -> Tuple[bool, str]:
        with self.lock:
            data = self.storage.get(email)
            
            if not data:
                return False, "OTP not requested or expired"
            
            if datetime.now(timezone.utc) > data["expires_at"]:
                del self.storage[email]
                return False, "OTP has expired"
            
            # Prevent brute force
            if data["attempts"] >= 5:
                del self.storage[email]
                return False, "Too many failed attempts. Request new OTP"
            
            if data["otp"] != otp:
                data["attempts"] += 1
                return False, "Invalid OTP"
            
            del self.storage[email]
            return True, "OTP verified"
    
    def _schedule_cleanup(self, email: str, minutes: int):
        def cleanup():
            time.sleep(minutes * 60)
            with self.lock:
                if email in self.storage:
                    del self.storage[email]
        
        thread = threading.Thread(target=cleanup, daemon=True)
        thread.start()

otp_manager = OtpManager()
pending_sql_actions = {}

# Pydantic Models
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

class ConfirmSQLRequest(BaseModel):
    user_id: int
    confirm: bool
    sql: str

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
    show_tips: Optional[bool] = None
    auto_save_sessions: Optional[bool] = None
    sql_syntax_highlighting: Optional[bool] = None
    notification_preferences: Optional[dict] = None

class ExportRequest(BaseModel):
    data: List[List]
    columns: List[str]
    format: str

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
        print(f"Skipping email send. OTP for {recipient_email} is {otp}")
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
        "data": [[action, table, condition, "Removes record(s) permanently"]]
    }

def validate_sql_safety(sql: str) -> Tuple[bool, str]:
    """Comprehensive SQL safety validation"""
    sql_upper = sql.upper().strip()
    
    # Check for dangerous keywords in wrong context
    if sql_upper.startswith(("DROP", "TRUNCATE")):
        return False, "DROP and TRUNCATE operations are not allowed"
    
    # Check for multiple statements (SQL injection technique)
    statements = sql.split(";")
    if len([s for s in statements if s.strip()]) > 1:
        return False, "Multiple SQL statements are not allowed"
    
    # Check for comment injection
    if "--" in sql or "/*" in sql or "*/" in sql:
        return False, "SQL comments are not allowed for security"
    
    # Check for UNION-based injection
    if " UNION " in sql_upper and sql_upper.startswith("SELECT"):
        # UNION is allowed in SELECT but warn for auditing
        pass
    
    return True, ""

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(identifier: str, db):
    return db.query(User).filter(User.email == identifier).first()

def get_sql_chain(db):
    user_template = """Database Schema:
{schema}

User Question:
{question}"""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SQL_SYSTEM_PROMPT),
        ("user", user_template)
    ])
    
    llm = ChatGroq(
        api_key=SecretStr(str(GROQ_API_KEY)),
        model="llama-3.3-70b-versatile",
        temperature=0,
        max_tokens=500,
        stop_sequences=None
    )
    
    def get_schema(_):
        return db.get_table_info()
    
    return (
        RunnablePassthrough.assign(schema=get_schema)
        | prompt
        | llm
        | StrOutputParser()
    )

def get_response(question, db):
    chain = get_sql_chain(db)
    connection = None
    sql_query = "N/A"
    
    try:
        response_text = chain.invoke({"question": question})
        sql_query = response_text.strip()
        
        if sql_query.startswith("```"):
            sql_query = re.sub(r'^```[\w]*\n?', '', sql_query)
            sql_query = re.sub(r'\n?```$', '', sql_query)
            sql_query = sql_query.strip()
        
        sql_query = sql_query.rstrip(';')
        
        # ✅ NEW: Validate SQL safety
        is_safe, error_msg = validate_sql_safety(sql_query)
        if not is_safe:
            return json.dumps({
                "type": "error",
                "message": f"❌ Security Check Failed: {error_msg}",
                "sql": sql_query
            })
        
        dangerous_ops = detect_dangerous_sql(sql_query)
        if len(dangerous_ops) > 0:
            return json.dumps({
                "type": "confirmation_required",
                "sql": sql_query,
                "dangerous_operations": dangerous_ops,
                "table": sql_to_table_preview(sql_query)
            })

        sql_upper = sql_query.upper().strip()
        if sql_upper.startswith('SELECT'):
            sql_type = 'select'
        else:
            sql_type = 'other'

        if sql_type == 'select':
            # ✅ Check cache first
            cache_key = query_cache.get_cache_key(sql_query, app.state.db_name)
            cached_result = query_cache.get(cache_key)
            
            if cached_result:
                return f"SQL: `{sql_query}`\nOutput: {json.dumps(cached_result)}"
            
            try:
                connection = db._engine.connect()
                # ✅ CRITICAL: Use context manager for automatic cleanup
                result_proxy = None
                try:
                    result_proxy = connection.execute(text(sql_query))
                    columns = list(result_proxy.keys())
                    rows = result_proxy.fetchall()
                    
                    data = []
                    for row in rows:
                        row_data = [str(cell) if cell is not None else '' for cell in row]
                        data.append(row_data)
                    
                    output_data = {
                        "type": "select",
                        "data": data,
                        "columns": columns,
                        "row_count": len(data)
                    }
                    
                    # ✅ Cache the result
                    query_cache.set(cache_key, output_data)
                    
                    return f"SQL: `{sql_query}`\nOutput: {json.dumps(output_data)}"
                    
                finally:
                    # result is closed
                    if result_proxy is not None:
                        result_proxy.close()
                    
            except Exception as select_error:
                error_message = str(select_error)
                
                if "only_full_group_by" in error_message or "1140" in error_message:
                    helpful_msg = (
                        "⚠️ GROUP BY Error: When using aggregate functions like COUNT, AVG, SUM, "
                        "all non-aggregated columns must be included in the GROUP BY clause.\n\n"
                        f"SQL attempted: {sql_query}\n\n"
                        f"Technical error: {error_message}\n\n"
                        "💡 Tip: Try rephrasing your question or be more specific about what you want to group by."
                    )
                    output_data = {"type": "error", "message": helpful_msg}
                elif "doesn't exist" in error_message.lower() or "unknown column" in error_message.lower():
                    helpful_msg = (
                        f"⚠️ Table/Column Not Found: The query references a table or column that doesn't exist in the database.\n\n"
                        f"SQL attempted: {sql_query}\n\n"
                        f"Technical error: {error_message}\n\n"
                        "💡 Tip: Please check the spelling or ask me to show you the available tables and columns."
                    )
                    output_data = {"type": "error", "message": helpful_msg}
                elif "syntax error" in error_message.lower():
                    helpful_msg = (
                        f"⚠️ SQL Syntax Error: The generated query has a syntax problem.\n\n"
                        f"SQL attempted: {sql_query}\n\n"
                        f"Technical error: {error_message}\n\n"
                        "💡 Tip: Try rephrasing your question in a different way."
                    )
                    output_data = {"type": "error", "message": helpful_msg}
                else:
                    output_data = {
                        "type": "error", 
                        "message": f"Query execution failed: {error_message}",
                        "sql": sql_query
                    }
            finally:
                # ✅ ALWAYS close connection
                if connection:
                    try:
                        connection.close()
                    except Exception as e:
                        print(f"Error closing connection: {e}")
        
        else:
            result = db.run(sql_query)
            clean_result = result.strip()
            
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
                "affected_rows": affected_rows
            }

        return f"SQL: `{sql_query}`\nOutput: {json.dumps(output_data)}"
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return json.dumps({
            "type": "error",
            "message": f"Error: {str(e)}"
        })
    finally:
        # ✅ Double-check cleanup
        if connection and not connection.closed:
            try:
                connection.close()
            except:
                pass

# API ENDPOINTS

@app.post("/api/send-otp")
@limiter.limit("5/minute")  # Max 5 OTP requests per minute
async def send_otp_for_signup(request: Request, otp_request: OtpRequest):
    try:
        validate_email(otp_request.email)
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=f"Invalid email address: {str(e)}")
    
    otp = generate_otp()
    otp_manager.store(otp_request.email, otp)
    send_otp_email(otp_request.email, otp)
    print(f"OTP for {otp_request.email}: {otp}")
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
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {"success": True, "message": "User created successfully"}

@app.post("/api/login")
@limiter.limit("10/minute")  # Max 10 login attempts per minute
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
            "gender": user.gender
        }
    }

@app.get("/api/profile/{user_id}")
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Get user profile information"""
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
            "gender": user.gender
        }
    }

@app.post("/api/list-databases")
async def list_databases(config: ServerConnectionConfig):
    """Connect to MySQL server and list all available databases"""
    print(f"Listing databases for: {config.user}@{config.host}:{config.port}")
    
    try:
        import mysql.connector
        
        connection = mysql.connector.connect(
            host=config.host,
            port=config.port,
            user=config.user,
            password=config.password
        )
        
        cursor = connection.cursor()
        cursor.execute("SHOW DATABASES")
        
        result: list[Any] = cursor.fetchall()
        databases = [str(row[0]) for row in result]
        
        system_dbs = {'information_schema', 'mysql', 'performance_schema', 'sys'}
        user_databases = [db for db in databases if db not in system_dbs]
        
        cursor.close()
        connection.close()
        
        print(f"Found {len(user_databases)} user databases")
        return {
            "success": True, 
            "databases": user_databases,
            "total": len(user_databases)
        }
        
    except Exception as e:
        print(f"Failed to list databases: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/api/create-database")
async def create_database(request: CreateDatabaseRequest):
    """Create a new database on the MySQL server"""
    print(f"Creating database: {request.database_name}")
    
    try:
        import mysql.connector
        
        if not re.match(r'^[a-zA-Z0-9_]+$', request.database_name):
            raise ValueError("Database name can only contain letters, numbers, and underscores")
        
        connection = mysql.connector.connect(
            host=request.host,
            port=request.port,
            user=request.user,
            password=request.password
        )
        
        cursor = connection.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{request.database_name}`")
        connection.commit()
        
        cursor.close()
        connection.close()
        
        print(f"Database '{request.database_name}' created successfully")
        return {
            "success": True, 
            "message": f"Database '{request.database_name}' created successfully",
            "database": request.database_name
        }
        
    except ValueError as ve:
        print(f"Validation error: {str(ve)}")
        return {"success": False, "error": str(ve)}
    except Exception as e:
        print(f"Failed to create database: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/api/connect")
async def connect_db(config: DBConfig):
    print(f"Received connect request: host={config.host}, port={config.port}, database={config.database}")
    try:
        db_uri = f"mysql+mysqlconnector://{config.user}:{config.password}@{config.host}:{config.port}/{config.database}"
        app.state.db_uri = db_uri
        app.state.db_name = config.database
        print("Database connection successful")
        return {"success": True, "database": config.database}
    except Exception as e:
        print(f"Database connection failed: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/api/disconnect")
async def disconnect_db():
    try:
        if hasattr(app.state, "db_uri"):
            delattr(app.state, "db_uri")
        if hasattr(app.state, "db_name"):
            delattr(app.state, "db_name")
        query_cache.clear()
        print("Database disconnected successfully")
        return {"success": True, "message": "Database disconnected successfully"}
    except Exception as e:
        print(f"Database disconnect failed: {str(e)}")
        return {"success": False, "error": str(e)}
@app.get("/api/table-schema/{table_name}")
async def get_table_schema(table_name: str):
    """Get detailed schema information for a specific table"""
    if not hasattr(app.state, "db_uri"):
        raise HTTPException(status_code=400, detail="Database not connected")
    
    try:
        db = SQLDatabase.from_uri(app.state.db_uri)
        connection = db._engine.connect()
        
        # Get column information using DESCRIBE
        result = connection.execute(text(f"DESCRIBE `{table_name}`"))
        columns_data = result.fetchall()
        
        columns = []
        for row in columns_data:
            # row format: (Field, Type, Null, Key, Default, Extra)
            columns.append({
                "name": row[0],
                "type": row[1],
                "nullable": row[2] == "YES",
                "key": row[3] if row[3] else None,  # PRI, MUL, UNI
                "default": row[4],
                "autoincrement": "auto_increment" in str(row[5]).lower() if row[5] else False
            })
        
        connection.close()
        
        return {
            "success": True,
            "table_name": table_name,
            "columns": columns
        }
        
    except Exception as e:
        print(f"Error fetching schema for {table_name}: {str(e)}")
        return {"success": False, "error": str(e)}


@app.get("/api/database-tables")
async def get_database_tables():
    """Get all tables with their row counts and metadata"""
    if not hasattr(app.state, "db_uri"):
        raise HTTPException(status_code=400, detail="Database not connected")
    
    try:
        db = SQLDatabase.from_uri(app.state.db_uri)
        connection = db._engine.connect()
        
        # Get all table names
        result = connection.execute(text("SHOW TABLES"))
        table_names = [row[0] for row in result.fetchall()]
        
        tables_info = []
        
        for table_name in table_names:
            try:
                # Get row count
                count_result = connection.execute(text(f"SELECT COUNT(*) FROM `{table_name}`"))
                count_row = count_result.fetchone()
                row_count = count_row[0] if count_row else 0
                
                # Get table status for last update time
                status_result = connection.execute(text(f"SHOW TABLE STATUS LIKE '{table_name}'"))
                status_row = status_result.fetchone()
                
                last_updated = "just now"
                if status_row and len(status_row) > 12 and status_row[12]:
                    # Update_time is at index 12
                    last_updated = str(status_row[12])
                
                tables_info.append({
                    "name": table_name,
                    "rowCount": row_count,
                    "lastUpdated": last_updated
                })
                
            except Exception as table_error:
                print(f"Error processing table {table_name}: {str(table_error)}")
                tables_info.append({
                    "name": table_name,
                    "rowCount": 0,
                    "lastUpdated": "unknown"
                })
        
        connection.close()
        
        return {
            "success": True,
            "tables": tables_info,
            "total": len(tables_info)
        }
        
    except Exception as e:
        print(f"Error fetching database tables: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/chat")
@limiter.limit("60/minute")  # Max 30 chats per minute
async def chat_endpoint(request: Request, chat_request: ChatRequest):
    if not hasattr(app.state, "db_uri"):
        raise HTTPException(status_code=400, detail="Database not connected")
    
    try:
        engine = create_engine(
            app.state.db_uri,
            pool_pre_ping=True,              # ✅ Test connections before using
            pool_recycle=3600,               # ✅ Recycle connections every hour
            pool_size=10,                    # ✅ INCREASED: Increased from default 5
            max_overflow=20,                 # ✅ INCREASED: Increased from default 10
            connect_args={
                "connect_timeout": 30,       # ✅ NEW: Connection timeout
            }
        )
        db = SQLDatabase(engine=engine)
        response = get_response(chat_request.question, db)
        return {"success": True, "response": response}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Chat endpoint error: {str(e)}")
        print(f"Request data: question={chat_request.question}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/chat-sessions")
async def get_chat_sessions(user_id: int):
    db_session = SessionLocal()
    try:
        sessions = db_session.query(ChatSession).filter(ChatSession.user_id == user_id).all()
        result = []
        for session in sessions:
            result.append({
                "id": session.id,
                "title": session.title,
                "messages": json.loads(str(session.messages)),
                "timestamp": datetime.utcnow().isoformat()
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
            messages=json.dumps(session.get("messages", []))
        )
        db_session.add(new_session)
        db_session.commit()
        db_session.refresh(new_session)
        return {
            "id": new_session.id,
            "title": new_session.title,
            "messages": json.loads(str(new_session.messages)),
            "timestamp": datetime.utcnow().isoformat()
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
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update chat session: {str(e)}")
    finally:
        db_session.close()

@app.delete("/api/chat-sessions/{session_id}")
async def delete_chat_session(
    session_id: int = Path(..., description="The ID of the chat session to delete"),
    user_id: int | None = None
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
    except HTTPException as e:
        raise e
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete chat session: {str(e)}")
    finally:
        db_session.close()

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

@app.post("/api/confirm-sql")
async def confirm_sql_action(req: ConfirmSQLRequest):
    if not req.confirm:
        return {"type": "status", "message": "SQL execution cancelled by user"}

    try:
        if not hasattr(app.state, "db_uri"):
            raise HTTPException(status_code=400, detail="Database not connected")

        db = SQLDatabase.from_uri(app.state.db_uri)
        db.run(req.sql)

        return {"type": "status", "message": "SQL executed successfully"}
    except Exception as e:
        return {"type": "error", "message": str(e)}

@app.get("/api/favorites/{user_id}")
async def get_favorites(user_id: int, db: Session = Depends(get_db)):
    """Get all favorite queries for a user"""
    favorites = db.query(FavoriteQuery).filter(
        FavoriteQuery.user_id == user_id
    ).order_by(FavoriteQuery.created_at.desc()).all()
    
    return [{
        "id": fav.id,
        "question": fav.question,
        "sql_query": fav.sql_query,
        "tags": fav.tags,
        "description": fav.description,
        "created_at": fav.created_at.isoformat()
    } for fav in favorites]

@app.post("/api/favorites")
async def add_favorite(favorite: FavoriteQueryCreate, db: Session = Depends(get_db)):
    """Add a query to favorites"""
    existing = db.query(FavoriteQuery).filter(
        FavoriteQuery.user_id == favorite.user_id,
        FavoriteQuery.sql_query == favorite.sql_query
    ).first()
    
    if existing:
        return {
            "success": False,
            "message": "Query already in favorites",
            "favorite_id": existing.id
        }
    
    new_fav = FavoriteQuery(
        user_id=favorite.user_id,
        question=favorite.question,
        sql_query=favorite.sql_query,
        tags=favorite.tags,
        description=favorite.description
    )
    db.add(new_fav)
    db.commit()
    db.refresh(new_fav)
    
    return {
        "success": True,
        "favorite_id": new_fav.id,
        "message": "Query added to favorites"
    }

@app.delete("/api/favorites/{favorite_id}")
async def remove_favorite(favorite_id: int, user_id: int, db: Session = Depends(get_db)):
    """Remove a query from favorites"""
    fav = db.query(FavoriteQuery).filter(
        FavoriteQuery.id == favorite_id,
        FavoriteQuery.user_id == user_id
    ).first()
    
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    db.delete(fav)
    db.commit()
    return {"success": True, "message": "Removed from favorites"}

@app.get("/api/favorites/{user_id}/check")
async def check_favorite(user_id: int, sql: str, db: Session = Depends(get_db)):
    """Check if a query is already favorited"""
    exists = db.query(FavoriteQuery).filter(
        FavoriteQuery.user_id == user_id,
        FavoriteQuery.sql_query == sql
    ).first()
    
    return {
        "is_favorite": exists is not None,
        "favorite_id": exists.id if exists else None
    }

@app.get("/api/tips/daily")
async def get_daily_tip(db: Session = Depends(get_db)):
    """Get a random tip of the day"""
    import random
    
    tips = db.query(TipOfTheDay).filter(TipOfTheDay.is_active.is_(True)).all()
    
    if not tips:
        return {
            "title": "Welcome to Query Genie! 👋",
            "content": "Start using Query Genie by connecting to your database and asking questions in natural language.",
            "category": "general",
            "icon": "💡"
        }
    
    tip = random.choice(tips)
    return {
        "id": tip.id,
        "title": tip.title,
        "content": tip.content,
        "category": tip.category,
        "icon": "💡"
    }


@app.get("/api/tips/category/{category}")
async def get_tips_by_category(category: str, db: Session = Depends(get_db)):
    """Get all tips in a specific category"""
    tips = db.query(TipOfTheDay).filter(and_(
        TipOfTheDay.category == category,
        TipOfTheDay.is_active.is_(True)
    )).all()
    
    return [{
        "id": tip.id,
        "title": tip.title,
        "content": tip.content,
        "category": tip.category
    } for tip in tips]


# -------- USER SETTINGS --------

@app.get("/api/settings/{user_id}")
async def get_user_settings(user_id: int, db: Session = Depends(get_db)):
    """Get user settings"""
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
        "show_tips": settings.show_tips,
        "auto_save_sessions": settings.auto_save_sessions,
        "sql_syntax_highlighting": settings.sql_syntax_highlighting,
        "notification_preferences": settings.notification_preferences or {}
    }


@app.put("/api/settings/{user_id}")
async def update_user_settings(
    user_id: int,
    settings_update: UserSettingsUpdate,
    db: Session = Depends(get_db)
):
    """Update user settings"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
    
    # ✅ FIXED: Use setattr() for dynamic updates
    update_data = settings_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    # ✅ FIXED: Use setattr for updated_at too
    setattr(settings, 'updated_at', datetime.utcnow())
    db.commit()
    db.refresh(settings)
    
    return {"success": True, "message": "Settings updated successfully"}

# -------- EXPORT RESULTS --------

@app.post("/api/export")
async def export_results(request: ExportRequest):
    """Export query results to CSV or JSON"""
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
                "filename": f"query_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
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
                "filename": f"query_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            }
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format. Use 'csv' or 'json'")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


# -------- SEARCH TABLE DATA --------

@app.get("/api/search/tables")
async def search_tables(query: str):
    """Search for tables and columns in the connected database"""
    if not hasattr(app.state, "db_uri"):
        raise HTTPException(status_code=400, detail="Database not connected")
    
    try:
        from langchain_community.utilities import SQLDatabase
        db = SQLDatabase.from_uri(app.state.db_uri)
        
        schema_info = db.get_table_info()
        query_lower = query.lower()
        results = {
            "tables": [],
            "columns": []
        }
        
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
                    results["columns"].append({
                        "table": current_table,
                        "column": col_name
                    })
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


# -------- QUERY HISTORY TRACKING --------

@app.post("/api/history/track")
async def track_query_execution(data: dict, db: Session = Depends(get_db)):
    """Track query execution for analytics"""
    history = QueryHistory(
        user_id=data.get("user_id"),
        session_id=data.get("session_id"),
        question=data.get("question"),
        sql_query=data.get("sql_query"),
        success=data.get("success", True),
        execution_time_ms=data.get("execution_time_ms"),
        row_count=data.get("row_count")
    )
    db.add(history)
    db.commit()
    
    return {"success": True, "message": "Query tracked"}


@app.get("/api/history/{user_id}")
async def get_query_history(user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """Get query history for a user"""
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
        "created_at": h.created_at.isoformat()
    } for h in history]


@app.get("/api/history/{user_id}/stats")
async def get_query_stats(user_id: int, db: Session = Depends(get_db)):
    """Get query statistics for a user"""
    total_queries = db.query(QueryHistory).filter(
        QueryHistory.user_id == user_id
    ).count()
    
    successful_queries = db.query(QueryHistory).filter(
        QueryHistory.user_id == user_id,
        QueryHistory.success.is_(True)
    ).count()
    
    return {
        "total_queries": total_queries,
        "successful_queries": successful_queries,
        "success_rate": (successful_queries / total_queries * 100) if total_queries > 0 else 0
    }

@app.on_event("shutdown")
async def shutdown_event():
    if hasattr(app.state, "db_uri"):
        delattr(app.state, "db_uri")
    print("Application shutdown - resources cleaned up")