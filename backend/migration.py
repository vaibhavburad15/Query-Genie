"""
Database Migration Script for Query Genie
Run this ONCE to create new tables and seed default data
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from extended_models import Base, TipOfTheDay, QueryRecommendation
from datetime import datetime
import os

# Read database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost/querygenie")

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

# Create tables
def create_tables():
    """Create all new tables"""
    print("\n" + "="*60)
    print("     QUERY GENIE - DATABASE MIGRATION")
    print("="*60)
    print("🚀 Starting database migration...\n")
    
    try:
        Base.metadata.create_all(engine)
        print("✅ Migration completed successfully!\n")
        print("New tables created:")
        print("  - favorite_queries")
        print("  - user_settings")
        print("  - tips_of_the_day")
        print("  - query_recommendations")
        print("  - query_history")
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

def seed_tips(session):
    """Add default tips"""
    print("\n📝 Adding default tips...")
    
    tips = [
        {
            "title": "Natural Language Works!",
            "content": "You can ask questions like 'Show me all customers' instead of writing SQL. Query Genie understands natural language!",
            "category": "general"
        },
        {
            "title": "Use Specific Column Names",
            "content": "Be specific about which columns you want: 'Show customer name and email' works better than 'Show customers'.",
            "category": "sql"
        },
        {
            "title": "Favorite Your Queries",
            "content": "Click the heart icon to save frequently used queries for quick access later!",
            "category": "general"
        },
        {
            "title": "Filter with Conditions",
            "content": "You can add conditions like 'Show orders from last month' or 'Find customers in New York'.",
            "category": "sql"
        },
        {
            "title": "Export Your Results",
            "content": "Download query results as CSV or JSON files using the export button!",
            "category": "general"
        },
        {
            "title": "Use Aggregations",
            "content": "Ask for summaries: 'What is the total revenue?' or 'Count orders by status'.",
            "category": "sql"
        },
        {
            "title": "Join Multiple Tables",
            "content": "You can query across tables: 'Show orders with customer names' will automatically join tables.",
            "category": "sql"
        },
        {
            "title": "Sort Your Results",
            "content": "Add sorting: 'Show top 10 customers by revenue' or 'List products ordered by price'.",
            "category": "sql"
        },
        {
            "title": "Session History",
            "content": "All your queries are saved in chat sessions. You can switch between sessions anytime!",
            "category": "general"
        },
        {
            "title": "SQL Safety Checks",
            "content": "Dangerous queries (DELETE, DROP) require confirmation to prevent accidental data loss.",
            "category": "security"
        }
    ]
    
    for tip_data in tips:
        existing = session.query(TipOfTheDay).filter_by(title=tip_data["title"]).first()
        if not existing:
            tip = TipOfTheDay(**tip_data)
            session.add(tip)
    
    session.commit()
    print("  ✓ Added 10 tips")

def seed_recommendations(session):
    """Add default query recommendations"""
    print("\n💡 Adding default recommendations...")
    
    recommendations = [
        {
            "category": "basic",
            "title": "View All Records",
            "question": "Show me all records from [table_name]",
            "description": "Display all data from a specific table"
        },
        {
            "category": "basic",
            "title": "Count Records",
            "question": "How many records are in [table_name]?",
            "description": "Get the total count of rows"
        },
        {
            "category": "analytics",
            "title": "Top Results",
            "question": "Show me the top 10 [items] by [metric]",
            "description": "Find highest/lowest values"
        },
        {
            "category": "analytics",
            "title": "Group and Count",
            "question": "Count [items] grouped by [category]",
            "description": "See distribution across categories"
        },
        {
            "category": "filtering",
            "title": "Filter by Date",
            "question": "Show [records] from the last [time period]",
            "description": "Filter data by time range"
        },
        {
            "category": "filtering",
            "title": "Search Records",
            "question": "Find [records] where [column] contains '[value]'",
            "description": "Search for specific values"
        },
        {
            "category": "joins",
            "title": "Related Data",
            "question": "Show [table1] with their related [table2]",
            "description": "Join data from multiple tables"
        },
        {
            "category": "aggregation",
            "title": "Calculate Sum",
            "question": "What is the total [metric] for [category]?",
            "description": "Sum values across records"
        },
        {
            "category": "aggregation",
            "title": "Average Value",
            "question": "What is the average [metric] by [category]?",
            "description": "Calculate averages"
        },
        {
            "category": "sorting",
            "title": "Sort Results",
            "question": "List [items] ordered by [column] descending",
            "description": "Sort data in ascending or descending order"
        }
    ]
    
    for rec_data in recommendations:
        existing = session.query(QueryRecommendation).filter_by(title=rec_data["title"]).first()
        if not existing:
            rec = QueryRecommendation(**rec_data)
            session.add(rec)
    
    session.commit()
    print("  ✓ Added 10 recommendations")

def run_migration():
    """Main migration function"""
    # Create tables
    if not create_tables():
        return
    
    # Create session for seeding data
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Seed default data
        seed_tips(session)
        seed_recommendations(session)
        
        print("\n✅ Default data seeded successfully!")
        print("="*60)
        print("\n🎉 Migration complete! You can now restart your backend.\n")
        
    except Exception as e:
        print(f"\n❌ Error seeding data: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    run_migration()