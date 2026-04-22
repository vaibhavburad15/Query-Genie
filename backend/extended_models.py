# extended_models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import declarative_base
from datetime import datetime

# Create Base here - this will be the ONLY Base
Base = declarative_base()

class FavoriteQuery(Base):
    __tablename__ = "favorite_queries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    question = Column(Text, nullable=False)
    sql_query = Column(Text, nullable=False)
    tags = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserSettings(Base):
    __tablename__ = "user_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    theme = Column(String(50), default='light')
    language = Column(String(10), default='en')
    results_per_page = Column(Integer, default=10)
    auto_save_sessions = Column(Boolean, default=True)
    sql_syntax_highlighting = Column(Boolean, default=True)
    notification_preferences = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class QueryRecommendation(Base):
    __tablename__ = "query_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    question = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    use_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

class QueryHistory(Base):
    __tablename__ = "query_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    session_id = Column(Integer, nullable=True)
    question = Column(Text, nullable=False)
    sql_query = Column(Text, nullable=False)
    success = Column(Boolean, default=True)
    execution_time_ms = Column(Integer, nullable=True)
    row_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
