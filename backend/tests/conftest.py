"""
Shared test fixtures for Query Genie backend tests.
"""
import os
import sys
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from extended_models import Base, FavoriteQuery, UserSettings, TipOfTheDay, QueryHistory


@pytest.fixture(scope="function")
def test_engine():
    """Create an in-memory SQLite engine for testing."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    return engine


@pytest.fixture(scope="function")
def test_db(test_engine):
    """Create all tables and return a session."""
    # Import models to register them
    from backend import User, ChatSession, UserDashboard
    
    Base.metadata.create_all(test_engine)
    # Also create backend-specific tables
    User.__table__.create(test_engine, checkfirst=True)
    ChatSession.__table__.create(test_engine, checkfirst=True)
    UserDashboard.__table__.create(test_engine, checkfirst=True)
    
    Session = sessionmaker(bind=test_engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture(scope="function")
def test_user(test_db):
    """Create a test user and return it."""
    from backend import User, get_password_hash
    
    user = User(
        email="testuser@example.com",
        firstName="Test",
        lastName="User",
        gender="male",
        username="testuser",
        hashed_password=get_password_hash("TestPassword123")
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture(scope="function")
def app_client():
    """Create a FastAPI test client."""
    from fastapi.testclient import TestClient
    from backend import app, SessionLocal, engine, Base
    
    # Use the actual app but override the database dependency
    client = TestClient(app)
    return client
