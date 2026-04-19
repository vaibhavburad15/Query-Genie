"""
============================================
UNIT TESTS - Query Genie Backend
============================================
Tests individual functions and classes in isolation,
without requiring network/database connections.
"""

import os
import sys
import pytest
import json
import time
import hashlib
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock

# Fix import path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ====================================================
# 1. PASSWORD HASHING & VERIFICATION TESTS
# ====================================================
class TestPasswordHashing:
    """Unit tests for password hashing utilities."""

    def test_password_hash_produces_bcrypt_hash(self):
        from backend import get_password_hash
        hashed = get_password_hash("MySecret123")
        assert hashed is not None
        assert hashed != "MySecret123"
        assert hashed.startswith("$2b$")  # bcrypt prefix

    def test_password_verification_succeeds_for_correct_password(self):
        from backend import get_password_hash, verify_password
        password = "CorrectPassword!"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_password_verification_fails_for_wrong_password(self):
        from backend import get_password_hash, verify_password
        hashed = get_password_hash("CorrectPassword!")
        assert verify_password("WrongPassword!", hashed) is False

    def test_different_passwords_produce_different_hashes(self):
        from backend import get_password_hash
        hash1 = get_password_hash("Password1")
        hash2 = get_password_hash("Password2")
        assert hash1 != hash2

    def test_same_password_produces_different_hashes_due_to_salt(self):
        from backend import get_password_hash
        hash1 = get_password_hash("SamePassword")
        hash2 = get_password_hash("SamePassword")
        assert hash1 != hash2  # bcrypt uses random salt


# ====================================================
# 2. OTP GENERATION TESTS
# ====================================================
class TestOTPGeneration:
    """Unit tests for OTP generation."""

    def test_otp_is_six_digits(self):
        from backend import generate_otp
        otp = generate_otp()
        assert len(otp) == 6
        assert otp.isdigit()

    def test_otp_is_within_valid_range(self):
        from backend import generate_otp
        otp = int(generate_otp())
        assert 100000 <= otp <= 999999

    def test_otp_generates_different_values(self):
        from backend import generate_otp
        otps = {generate_otp() for _ in range(100)}
        assert len(otps) > 1  # At least some should be different


# ====================================================
# 3. OTP MANAGER TESTS
# ====================================================
class TestOtpManager:
    """Unit tests for the OtpManager class."""

    def test_store_and_verify_otp_success(self):
        from backend import OtpManager
        mgr = OtpManager()
        mgr.store("user@test.com", "123456", expiry_minutes=5)
        is_valid, msg = mgr.verify("user@test.com", "123456")
        assert is_valid is True
        assert msg == "OTP verified"

    def test_verify_wrong_otp_fails(self):
        from backend import OtpManager
        mgr = OtpManager()
        mgr.store("user@test.com", "123456")
        is_valid, msg = mgr.verify("user@test.com", "999999")
        assert is_valid is False
        assert msg == "Invalid OTP"

    def test_verify_unregistered_email_fails(self):
        from backend import OtpManager
        mgr = OtpManager()
        is_valid, msg = mgr.verify("nobody@test.com", "123456")
        assert is_valid is False
        assert "not requested" in msg.lower() or "expired" in msg.lower()

    def test_otp_consumed_after_successful_verification(self):
        from backend import OtpManager
        mgr = OtpManager()
        mgr.store("user@test.com", "123456")
        mgr.verify("user@test.com", "123456")  # First attempt succeeds
        is_valid, msg = mgr.verify("user@test.com", "123456")  # Second attempt
        assert is_valid is False  # OTP already consumed

    def test_brute_force_protection_after_5_attempts(self):
        from backend import OtpManager
        mgr = OtpManager()
        mgr.store("user@test.com", "123456")
        
        # Make 5 wrong attempts
        for _ in range(5):
            mgr.verify("user@test.com", "000000")
        
        # 6th attempt should be blocked even with correct OTP
        is_valid, msg = mgr.verify("user@test.com", "123456")
        assert is_valid is False
        assert "too many" in msg.lower() or "expired" in msg.lower() or "not requested" in msg.lower()

    def test_otp_expiration(self):
        from backend import OtpManager
        mgr = OtpManager()
        mgr.store("user@test.com", "123456", expiry_minutes=0)  # Expires immediately
        
        # Manually expire it
        with mgr.lock:
            if "user@test.com" in mgr.storage:
                mgr.storage["user@test.com"]["expires_at"] = datetime.now(timezone.utc) - timedelta(minutes=1)
        
        is_valid, msg = mgr.verify("user@test.com", "123456")
        assert is_valid is False
        assert "expired" in msg.lower()


# ====================================================
# 4. SQL SAFETY & VALIDATION TESTS
# ====================================================
class TestSQLSafety:
    """Unit tests for SQL safety checks."""

    def test_detect_dangerous_keywords_delete(self):
        from backend import detect_dangerous_sql
        result = detect_dangerous_sql("DELETE FROM users WHERE id = 1")
        assert "DELETE" in result

    def test_detect_dangerous_keywords_drop(self):
        from backend import detect_dangerous_sql
        result = detect_dangerous_sql("DROP TABLE users")
        assert "DROP" in result

    def test_detect_dangerous_keywords_truncate(self):
        from backend import detect_dangerous_sql
        result = detect_dangerous_sql("TRUNCATE TABLE users")
        assert "TRUNCATE" in result

    def test_detect_dangerous_keywords_update(self):
        from backend import detect_dangerous_sql
        result = detect_dangerous_sql("UPDATE users SET name = 'test'")
        assert "UPDATE" in result

    def test_detect_dangerous_keywords_alter(self):
        from backend import detect_dangerous_sql
        result = detect_dangerous_sql("ALTER TABLE users ADD COLUMN age INT")
        assert "ALTER" in result

    def test_safe_select_query_returns_empty(self):
        from backend import detect_dangerous_sql
        result = detect_dangerous_sql("SELECT * FROM users")
        assert len(result) == 0

    def test_validate_sql_safety_blocks_drop(self):
        from backend import validate_sql_safety
        is_safe, msg = validate_sql_safety("DROP TABLE users")
        assert is_safe is False
        assert "not allowed" in msg.lower()

    def test_validate_sql_safety_blocks_truncate(self):
        from backend import validate_sql_safety
        is_safe, msg = validate_sql_safety("TRUNCATE TABLE users")
        assert is_safe is False

    def test_validate_sql_safety_blocks_multiple_statements(self):
        from backend import validate_sql_safety
        is_safe, msg = validate_sql_safety("SELECT 1; DROP TABLE users")
        assert is_safe is False
        assert "multiple" in msg.lower()

    def test_validate_sql_safety_blocks_comment_injection(self):
        from backend import validate_sql_safety
        is_safe, msg = validate_sql_safety("SELECT * FROM users -- WHERE id = 1")
        assert is_safe is False
        assert "comment" in msg.lower()

    def test_validate_sql_safety_blocks_block_comments(self):
        from backend import validate_sql_safety
        is_safe, msg = validate_sql_safety("SELECT * FROM users /* hack */")
        assert is_safe is False

    def test_validate_sql_safety_allows_safe_select(self):
        from backend import validate_sql_safety
        is_safe, msg = validate_sql_safety("SELECT * FROM users WHERE id = 1")
        assert is_safe is True
        assert msg == ""

    def test_validate_sql_safety_allows_insert(self):
        from backend import validate_sql_safety
        is_safe, msg = validate_sql_safety("INSERT INTO users (name) VALUES ('test')")
        assert is_safe is True


# ====================================================
# 5. SQL TABLE PREVIEW TESTS
# ====================================================
class TestSqlTablePreview:
    """Unit tests for sql_to_table_preview."""

    def test_delete_preview_extracts_table_name(self):
        from backend import sql_to_table_preview
        result = sql_to_table_preview("DELETE FROM users WHERE id = 5")
        assert result["columns"] == ["Action", "Table", "Condition", "Impact"]
        assert result["data"][0][0] == "DELETE"
        assert result["data"][0][1] == "USERS"

    def test_delete_preview_extracts_condition(self):
        from backend import sql_to_table_preview
        result = sql_to_table_preview("DELETE FROM orders WHERE amount > 100")
        assert "amount > 100" in result["data"][0][2]

    def test_unknown_action_for_non_delete(self):
        from backend import sql_to_table_preview
        result = sql_to_table_preview("SELECT * FROM users")
        assert result["data"][0][0] == "UNKNOWN"


# ====================================================
# 6. QUERY CACHE TESTS
# ====================================================
class TestQueryCache:
    """Unit tests for the QueryCache class."""

    def test_cache_set_and_get(self):
        from backend import QueryCache
        cache = QueryCache(ttl_seconds=300)
        cache.set("test-key", {"data": [1, 2, 3]})
        result = cache.get("test-key")
        assert result == {"data": [1, 2, 3]}

    def test_cache_miss_returns_none(self):
        from backend import QueryCache
        cache = QueryCache(ttl_seconds=300)
        assert cache.get("nonexistent") is None

    def test_cache_expiration(self):
        from backend import QueryCache
        cache = QueryCache(ttl_seconds=1)
        cache.set("temp-key", {"value": 42})
        time.sleep(1.5)
        assert cache.get("temp-key") is None

    def test_cache_clear(self):
        from backend import QueryCache
        cache = QueryCache(ttl_seconds=300)
        cache.set("key1", {"a": 1})
        cache.set("key2", {"b": 2})
        cache.clear()
        assert cache.get("key1") is None
        assert cache.get("key2") is None

    def test_cache_key_generation(self):
        from backend import QueryCache
        cache = QueryCache()
        key1 = cache.get_cache_key("SELECT * FROM users", "testdb")
        key2 = cache.get_cache_key("SELECT * FROM orders", "testdb")
        key3 = cache.get_cache_key("SELECT * FROM users", "testdb")
        assert key1 != key2
        assert key1 == key3  # Same query + db should give same key

    def test_cache_key_is_md5_hash(self):
        from backend import QueryCache
        cache = QueryCache()
        sql = "SELECT 1"
        db = "mydb"
        expected = hashlib.md5(f"{sql}:{db}".encode()).hexdigest()
        assert cache.get_cache_key(sql, db) == expected


# ====================================================
# 7. CHAT HISTORY FORMATTING TESTS
# ====================================================
class TestChatHistoryFormatting:
    """Unit tests for format_chat_history."""

    def test_empty_history_returns_default_message(self):
        from backend import format_chat_history
        result = format_chat_history([])
        assert "no previous" in result.lower()

    def test_history_limits_to_last_5(self):
        from backend import format_chat_history
        # Create 10 history items
        history = [
            {
                "user": f"Question {i}",
                "assistant": f"SQL: `SELECT {i}`\nOutput: {{\"type\": \"select\", \"columns\": [\"col{i}\"], \"row_count\": {i}}}"
            }
            for i in range(10)
        ]
        result = format_chat_history(history)
        # Should only contain the last 5 (indices 5-9)
        assert "Question 9" in result
        assert "Question 5" in result

    def test_history_extracts_sql_query(self):
        from backend import format_chat_history
        history = [{
            "user": "Show all users",
            "assistant": "SQL: `SELECT * FROM users`\nOutput: {\"type\": \"select\", \"columns\": [\"id\", \"name\"], \"row_count\": 5}"
        }]
        result = format_chat_history(history)
        assert "SELECT * FROM users" in result

    def test_history_includes_user_question(self):
        from backend import format_chat_history
        history = [{
            "user": "How many orders?",
            "assistant": "SQL: `SELECT COUNT(*) FROM orders`\nOutput: {\"type\": \"select\", \"columns\": [\"count\"], \"row_count\": 1}"
        }]
        result = format_chat_history(history)
        assert "How many orders?" in result


# ====================================================
# 8. PYDANTIC MODEL VALIDATION TESTS
# ====================================================
class TestPydanticModels:
    """Unit tests for Pydantic request models."""

    def test_dbconfig_valid(self):
        from backend import DBConfig
        config = DBConfig(host="localhost", port=3306, user="root", password="pass", database="testdb")
        assert config.host == "localhost"
        assert config.port == 3306

    def test_dbconfig_default_password(self):
        from backend import DBConfig
        config = DBConfig(host="localhost", port=3306, user="root", database="testdb")
        assert config.password == ""

    def test_chat_request_valid(self):
        from backend import ChatRequest
        req = ChatRequest(question="Show all tables", chat_history=[])
        assert req.question == "Show all tables"
        assert req.chat_history == []

    def test_chat_request_default_history(self):
        from backend import ChatRequest
        req = ChatRequest(question="Test query")
        assert req.chat_history == []

    def test_user_create_requires_all_fields(self):
        from backend import UserCreate
        user = UserCreate(
            firstName="John",
            lastName="Doe",
            email="john@example.com",
            password="securepass",
            otp="123456",
            gender="male",
            username="johnd"
        )
        assert user.firstName == "John"
        assert user.email == "john@example.com"

    def test_user_login_model(self):
        from backend import UserLogin
        login = UserLogin(identifier="test@example.com", password="mypass")
        assert login.identifier == "test@example.com"

    def test_export_request_model(self):
        from backend import ExportRequest
        req = ExportRequest(
            data=[[1, "test"], [2, "test2"]],
            columns=["id", "name"],
            format="csv"
        )
        assert len(req.data) == 2
        assert req.format == "csv"

    def test_favorite_query_create_optional_fields(self):
        from backend import FavoriteQueryCreate
        fav = FavoriteQueryCreate(
            user_id=1,
            question="Show users",
            sql_query="SELECT * FROM users"
        )
        assert fav.tags is None
        assert fav.description is None

    def test_confirm_sql_request(self):
        from backend import ConfirmSQLRequest
        req = ConfirmSQLRequest(
            user_id=1,
            confirm=True,
            sql="DELETE FROM users WHERE id = 5"
        )
        assert req.confirm is True

    def test_dashboard_create_model(self):
        from backend import DashboardCreate
        dash = DashboardCreate(
            user_id=1,
            dashboard_id="dash-123",
            name="My Dashboard",
            charts=[]
        )
        assert dash.name == "My Dashboard"
        assert dash.description == ""

    def test_user_settings_update_all_optional(self):
        from backend import UserSettingsUpdate
        update = UserSettingsUpdate()
        assert update.theme is None
        assert update.language is None
        assert update.results_per_page is None


# ====================================================
# 9. DANGEROUS KEYWORDS CONSTANT TEST
# ====================================================
class TestConstants:
    """Unit tests for backend constants."""

    def test_dangerous_keywords_list(self):
        from backend import DANGEROUS_KEYWORDS
        expected = ["DROP", "TRUNCATE", "DELETE", "ALTER", "UPDATE"]
        assert set(DANGEROUS_KEYWORDS) == set(expected)


# ====================================================
# 10. EXTENDED MODELS TESTS
# ====================================================
class TestExtendedModels:
    """Unit tests for SQLAlchemy extended models."""

    def test_favorite_query_model_has_required_columns(self):
        from extended_models import FavoriteQuery
        assert hasattr(FavoriteQuery, 'id')
        assert hasattr(FavoriteQuery, 'user_id')
        assert hasattr(FavoriteQuery, 'question')
        assert hasattr(FavoriteQuery, 'sql_query')
        assert hasattr(FavoriteQuery, 'tags')
        assert hasattr(FavoriteQuery, 'description')
        assert hasattr(FavoriteQuery, 'created_at')

    def test_user_settings_model_has_defaults(self):
        from extended_models import UserSettings
        assert hasattr(UserSettings, 'theme')
        assert hasattr(UserSettings, 'language')
        assert hasattr(UserSettings, 'results_per_page')
        assert hasattr(UserSettings, 'show_tips')

    def test_tip_of_the_day_model(self):
        from extended_models import TipOfTheDay
        assert TipOfTheDay.__tablename__ == "tips_of_the_day"
        assert hasattr(TipOfTheDay, 'title')
        assert hasattr(TipOfTheDay, 'content')
        assert hasattr(TipOfTheDay, 'category')

    def test_query_history_model(self):
        from extended_models import QueryHistory
        assert QueryHistory.__tablename__ == "query_history"
        assert hasattr(QueryHistory, 'user_id')
        assert hasattr(QueryHistory, 'sql_query')
        assert hasattr(QueryHistory, 'success')
        assert hasattr(QueryHistory, 'execution_time_ms')

    def test_query_recommendation_model(self):
        from extended_models import QueryRecommendation
        assert hasattr(QueryRecommendation, 'category')
        assert hasattr(QueryRecommendation, 'title')
        assert hasattr(QueryRecommendation, 'question')
        assert hasattr(QueryRecommendation, 'use_count')


# ====================================================
# 11. SQL SYSTEM PROMPT TESTS
# ====================================================
class TestSQLSystemPrompt:
    """Unit tests for the SQL system prompt module."""

    def test_prompt_exists_and_is_string(self):
        from sql_system_prompt import SQL_SYSTEM_PROMPT
        assert isinstance(SQL_SYSTEM_PROMPT, str)
        assert len(SQL_SYSTEM_PROMPT) > 500

    def test_prompt_contains_key_instructions(self):
        from sql_system_prompt import SQL_SYSTEM_PROMPT
        assert "SQL" in SQL_SYSTEM_PROMPT
        assert "SELECT" in SQL_SYSTEM_PROMPT
        assert "INFORMATION_SCHEMA" in SQL_SYSTEM_PROMPT

    def test_prompt_prohibits_show_tables(self):
        from sql_system_prompt import SQL_SYSTEM_PROMPT
        assert "SHOW TABLES" in SQL_SYSTEM_PROMPT
        assert "NEVER" in SQL_SYSTEM_PROMPT.upper() or "NEVER" in SQL_SYSTEM_PROMPT

    def test_prompt_includes_safety_rules(self):
        from sql_system_prompt import SQL_SYSTEM_PROMPT
        assert "GROUP BY" in SQL_SYSTEM_PROMPT
        assert "JOIN" in SQL_SYSTEM_PROMPT
        assert "NULL" in SQL_SYSTEM_PROMPT


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
