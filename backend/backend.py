import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Path
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
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import json
import re
from typing import cast
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import List, Optional  # Add Optional if not already there
import csv
import io
# Replace the import with:
from extended_models import (
    FavoriteQuery,
    UserSettings,
    TipOfTheDay,
    QueryRecommendation,
    QueryHistory,
    Base  # ← Import the SAME Base used by extended models
)
# Import the system prompt from your separate file
from sql_system_prompt import SQL_SYSTEM_PROMPT

# Load environment variables
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("WARNING: GROQ_API_KEY not found in environment variables. Please set it to enable AI features.")
    GROQ_API_KEY = ""
else:
    GROQ_API_KEY = cast(str, groq_api_key)

#              >>>>> EMAIL CONFIGURATION <<<
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
    print("WARNING: Email credentials not found. OTP sending will be disabled.")

# --- Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- SQLite Database Setup with Connection Pooling ---
SQLITE_DB_FILE = "users.db"
engine = create_engine(
    f"sqlite:///{SQLITE_DB_FILE}", 
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=5,
    max_overflow=10
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

# Create the database tables
Base.metadata.create_all(engine)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:8081", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Vars ---
otp_storage = {}  
pending_sql_actions = {}

# --- Pydantic Models ---
class DBConfig(BaseModel):
    host: str
    port: int
    user: str
    password: str = ""
    database: str

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
    format: str  # csv, json
# --- Database Session Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- OTP Functions ---
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

# ---------------- SQL SAFETY HELPERS ----------------
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

# --- Auth Helpers ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(identifier: str, db):
    return db.query(User).filter(User.email == identifier).first()

# ═══════════════════════════════════════════════════════════════
#                    DB & LANGCHAIN HELPERS
# ═══════════════════════════════════════════════════════════════

def get_sql_chain(db):
    """
    ✅ IMPROVED: Uses system message for permanent instructions
    - System message = permanent rules (sent once per conversation)
    - User message = dynamic content (schema + question)
    - More efficient token usage
    - Better consistency in SQL generation
    """
    
    # User message template - only dynamic content
    user_template = """Database Schema:
{schema}

User Question:
{question}"""
    
    # Create prompt with system and user messages
    prompt = ChatPromptTemplate.from_messages([
        ("system", SQL_SYSTEM_PROMPT),  # ← Permanent instructions from separate file
        ("user", user_template)          # ← Dynamic content (changes each time)
    ])
    
    # Initialize the LLM with optimal settings
    llm = ChatGroq(
        api_key=SecretStr(str(GROQ_API_KEY)),
        model="llama-3.3-70b-versatile",
        temperature=0,          # Deterministic output for consistency
        max_tokens=500,         # Sufficient for complex queries
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
    """
    ✅ ENHANCED: Improved error handling and user feedback
    - No chat_history parameter - each query is independent
    - LLM generates SQL from current question + schema
    - Execution happens locally via SQLAlchemy
    - Better error messages for common issues
    """
    chain = get_sql_chain(db)
    
    connection = None
    sql_query = "N/A"
    
    try:
        # Generate SQL using the chain (system prompt is automatic)
        response_text = chain.invoke({"question": question})
        sql_query = response_text.strip()
        
        # Clean up any markdown formatting that might slip through
        if sql_query.startswith("```"):
            sql_query = re.sub(r'^```[\w]*\n?', '', sql_query)
            sql_query = re.sub(r'\n?```$', '', sql_query)
            sql_query = sql_query.strip()
        
        # Remove trailing semicolon if present
        sql_query = sql_query.rstrip(';')
        
        # Check for dangerous operations
        dangerous_ops = detect_dangerous_sql(sql_query)
        if dangerous_ops:
            return json.dumps({
                "type": "confirmation_required",
                "sql": sql_query,
                "dangerous_operations": dangerous_ops,
                "table": sql_to_table_preview(sql_query)
            })

        # Detect SQL type
        sql_upper = sql_query.upper().strip()
        if sql_upper.startswith('SELECT'):
            sql_type = 'select'
        else:
            sql_type = 'other'

        if sql_type == 'select':
            try:
                connection = db._engine.connect()
                result_proxy = connection.execute(text(sql_query))
                
                columns = list(result_proxy.keys())
                rows = result_proxy.fetchall()
                
                data = []
                for row in rows:
                    row_data = []
                    for cell in row:
                        if cell is None:
                            row_data.append('')
                        else:
                            row_data.append(str(cell))
                    data.append(row_data)
                
                output_data = {
                    "type": "select",
                    "data": data,
                    "columns": columns,
                    "row_count": len(data)
                }
                
            except Exception as select_error:
                error_message = str(select_error)
                
                # Provide helpful error messages for common issues
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
                if connection:
                    try:
                        connection.close()
                    except Exception as close_error:
                        print(f"Error closing connection: {close_error}")
                    
        else:
            # Handle non-SELECT queries (INSERT, UPDATE, etc.)
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
        error_data = {
            "type": "error", 
            "message": f"Failed to generate or execute query: {str(e)}",
            "sql_attempted": sql_query
        }
        return f"SQL: `{sql_query}`\nOutput: {json.dumps(error_data)}"
    finally:
        if connection:
            try:
                connection.close()
            except Exception as final_close_error:
                print(f"Final connection close error: {final_close_error}")

# ===============================================================
#                    API ENDPOINTS
# ===============================================================

@app.post("/api/send-otp")
async def send_otp_for_signup(request: OtpRequest):
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    otp_storage[request.email] = {"otp": otp, "expires_at": expires_at}
    send_otp_email(request.email, otp)
    print(f"OTP for {request.email}: {otp}")
    return {"success": True, "message": "OTP has been sent to your email."}

@app.post("/api/signup", status_code=201)
async def signup_user(user: UserCreate, db: Session = Depends(get_db)):
    stored_otp_data = otp_storage.get(user.email)
    if not stored_otp_data:
        raise HTTPException(status_code=400, detail="OTP not requested or expired.")

    if datetime.now(timezone.utc) > stored_otp_data["expires_at"]:
        del otp_storage[user.email]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        
    if stored_otp_data["otp"] != user.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP provided.")
    
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
    del otp_storage[user.email]

    return {"success": True, "message": "User created successfully"}

@app.post("/api/login")
async def login_for_access_token(form_data: UserLogin, db: Session = Depends(get_db)):
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
        print("Database disconnected successfully")
        return {"success": True, "message": "Database disconnected successfully"}
    except Exception as e:
        print(f"Database disconnect failed: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    if not hasattr(app.state, "db_uri"):
        raise HTTPException(status_code=400, detail="Database not connected")
    
    try:
        db = SQLDatabase.from_uri(app.state.db_uri)
        
        # ✅ FIXED: Don't pass chat_history to get_response
        response = get_response(request.question, db)
        return {"success": True, "response": response}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Chat endpoint error: {str(e)}")
        print(f"Request data: question={request.question}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# --- Chat Session Endpoints ---

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
        if existing_session.user_id != session.get("user_id"):
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
        session = db_session.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        if session.user_id != user_id:  # type: ignore
            raise HTTPException(status_code=403, detail="Unauthorized to delete this session")
        db_session.delete(session)
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


# -------- RECOMMENDATIONS --------

@app.get("/api/recommendations/{user_id}")
async def get_recommendations(user_id: int, db: Session = Depends(get_db)):
    """Get personalized query recommendations"""
    general_recs = db.query(QueryRecommendation).filter(
        QueryRecommendation.is_active == True
    ).order_by(QueryRecommendation.use_count.desc()).limit(5).all()
    
    recent_queries = db.query(QueryHistory).filter(
        QueryHistory.user_id == user_id,
        QueryHistory.success == True
    ).order_by(QueryHistory.created_at.desc()).limit(3).all()
    
    recommendations = []
    
    for rec in general_recs:
        recommendations.append({
            "type": "template",
            "category": rec.category,
            "title": rec.title,
            "question": rec.question,
            "description": rec.description,
            "icon": "⭐"
        })
    
    for query in recent_queries:
        recommendations.append({
            "type": "history",
            "category": "recent",
            "title": "Recent Query",
            "question": query.question,
            "sql": query.sql_query,
            "icon": "🕐"
        })
    
    return recommendations


@app.post("/api/recommendations/{rec_id}/use")
async def track_recommendation_use(rec_id: int, db: Session = Depends(get_db)):
    """Track when a recommendation is used"""
    rec = db.query(QueryRecommendation).filter(
        QueryRecommendation.id == rec_id
    ).first()
    
    if rec:
        # ✅ FIX: Use setattr() to avoid Pylance type errors
        current_count = rec.use_count
        setattr(rec, 'use_count', current_count + 1)
        db.commit()
        return {"success": True}
    
    return {"success": False, "message": "Recommendation not found"}


# -------- TIPS OF THE DAY --------

@app.get("/api/tips/daily")
async def get_daily_tip(db: Session = Depends(get_db)):
    """Get a random tip of the day"""
    import random
    
    tips = db.query(TipOfTheDay).filter(TipOfTheDay.is_active == True).all()
    
    if not tips:
        return {
            "title": "Welcome to Query Genie! 👋",
            "content": "Start by connecting to your database and asking questions in natural language.",
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
    tips = db.query(TipOfTheDay).filter(
        TipOfTheDay.category == category,
        TipOfTheDay.is_active == True
    ).all()
    
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
        QueryHistory.success == True
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