import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

# Load .env file
# Try loading from current directory first, then parent directory
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()  # Try default locations

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Provide helpful debugging info
    env_file_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_file_path):
        raise ValueError(
            f"❌ .env file not found at: {env_file_path}\n"
            f"   Please create a .env file in the backend directory with:\n"
            f"   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require"
        )
    else:
        raise ValueError(
            f"❌ DATABASE_URL not found in .env file at: {env_file_path}\n"
            f"   Please add your Neon PostgreSQL connection string:\n"
            f"   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require"
        )

# Strip any whitespace, quotes, or newlines that might have been accidentally added
DATABASE_URL = DATABASE_URL.strip().strip('"').strip("'")

# Fix common issues: Remove "psql" command prefix if accidentally included
# Some users copy the connection string from Neon docs which includes "psql '...'"
if DATABASE_URL.startswith("psql "):
    DATABASE_URL = DATABASE_URL[5:].strip()  # Remove "psql " prefix
    # Remove any remaining quotes
    DATABASE_URL = DATABASE_URL.strip().strip('"').strip("'")

# Validate that it's a valid URL format
if not DATABASE_URL or len(DATABASE_URL) < 10:
    raise ValueError(
        f"❌ DATABASE_URL appears to be invalid or too short.\n"
        f"   Length: {len(DATABASE_URL) if DATABASE_URL else 0}\n"
        f"   First 50 chars: '{DATABASE_URL[:50] if DATABASE_URL else 'None'}...'\n"
        f"   Expected format: postgresql://user:password@host/dbname?sslmode=require"
    )

# Convert postgres:// to postgresql:// (required by some SQLAlchemy versions)
# Neon provides both formats, but SQLAlchemy prefers postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Check if it's a PostgreSQL connection (Neon uses postgres:// or postgresql://)
is_postgres = DATABASE_URL.startswith("postgresql://")

# Debug: If it's not recognized as postgres, show what we got
if not is_postgres and not DATABASE_URL.startswith("sqlite"):
    # Show first 50 chars for debugging (without exposing full credentials)
    preview = DATABASE_URL[:50] + "..." if len(DATABASE_URL) > 50 else DATABASE_URL
    raise ValueError(
        f"❌ DATABASE_URL does not start with a recognized protocol.\n"
        f"   Expected: postgresql:// or postgres:// or sqlite:///\n"
        f"   Got: {preview}\n"
        f"   Full length: {len(DATABASE_URL)} characters\n"
        f"   \n"
        f"   Common fixes:\n"
        f"   1. Check for extra quotes: Remove any \" or ' around the URL\n"
        f"   2. Check for spaces: No spaces before/after the URL\n"
        f"   3. Check protocol: Must start with postgresql:// or postgres://\n"
        f"   4. Check for line breaks: URL must be on a single line\n"
        f"   \n"
        f"   Run 'python debug_env.py' to see your .env file contents."
    )

# Configure connection args based on database type
if DATABASE_URL.startswith("sqlite"):
    # SQLite configuration
    connect_args = {"check_same_thread": False}
    # Use NullPool for SQLite to avoid connection issues
    engine = create_engine(DATABASE_URL, connect_args=connect_args, poolclass=NullPool)
elif is_postgres:
    # PostgreSQL/Neon configuration
    # Neon requires SSL mode, so ensure the connection string includes sslmode=require
    # If not present, we'll add it
    if "sslmode" not in DATABASE_URL:
        # Add sslmode=require if not already specified
        separator = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL = f"{DATABASE_URL}{separator}sslmode=require"
    
    # PostgreSQL connection pooling settings for Neon
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,  # Number of connections to maintain
        max_overflow=10,  # Additional connections beyond pool_size
        pool_pre_ping=True,  # Verify connections before using (important for serverless)
        pool_recycle=3600,  # Recycle connections after 1 hour
        echo=False,  # Set to True for SQL query logging (useful for debugging)
    )
else:
    # Fallback for other database types
    try:
        engine = create_engine(DATABASE_URL)
    except Exception as e:
        # Provide a more helpful error message
        error_msg = str(e)
        if "Could not parse" in error_msg or "parse" in error_msg.lower():
            raise ValueError(
                f"❌ Could not parse DATABASE_URL. The connection string format is invalid.\n"
                f"   Error: {error_msg}\n"
                f"   Your DATABASE_URL should look like:\n"
                f"   postgresql://username:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require\n"
                f"   or\n"
                f"   postgres://username:password@ep-xxxxx.region.aws.neon.tech/dbname\n"
                f"   \n"
                f"   Common issues:\n"
                f"   - Missing quotes around the URL in .env (don't use quotes)\n"
                f"   - Extra spaces or newlines\n"
                f"   - Invalid characters in the URL\n"
                f"   - Missing protocol (postgresql:// or postgres://)"
            ) from e
        else:
            raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Test connection on import (optional - comment out if you want to defer connection testing)
try:
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✅ Successfully connected to database")
except Exception as e:
    print(f"⚠️  Warning: Could not connect to database: {e}")
    print("   Make sure your DATABASE_URL in .env is correct and the database is accessible.")
    # Show a hint about the URL format (without exposing credentials)
    if DATABASE_URL:
        url_parts = DATABASE_URL.split("@")
        if len(url_parts) > 1:
            print(f"   URL format check: postgresql://...@{url_parts[-1][:50]}...")
        else:
            print(f"   URL appears malformed. Expected format: postgresql://user:pass@host/dbname")
