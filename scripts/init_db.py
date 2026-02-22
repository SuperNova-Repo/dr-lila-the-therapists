#!/usr/bin/env python3
"""Initialize database"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, Base

def init_database():
    """Create all database tables"""
    print("Creating database tables...")
    
    # Import models to register them with Base
    from backend.models.user import User
    from backend.models.chat import Chat, Message
    
    Base.metadata.create_all(bind=engine)
    print("✓ Database initialized successfully!")

if __name__ == "__main__":
    init_database()