"""
Debug script to check .env file and DATABASE_URL format.
Run this to diagnose connection string issues.
"""
import os
from pathlib import Path

print("=" * 70)
print("Debugging .env File and DATABASE_URL")
print("=" * 70)
print()

# Check if .env file exists
backend_dir = Path(__file__).parent
env_file = backend_dir / ".env"

print(f"1. Checking for .env file...")
print(f"   Looking in: {env_file}")
if env_file.exists():
    print(f"   ✅ .env file found")
    print(f"   File size: {env_file.stat().st_size} bytes")
else:
    print(f"   ❌ .env file NOT found!")
    print(f"   Please create a .env file in: {backend_dir}")
    print()
    exit(1)

print()
print(f"2. Reading .env file contents...")
try:
    with open(env_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"   Found {len(lines)} line(s) in .env file")
    print()
    
    # Look for DATABASE_URL
    database_url_found = False
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if line.startswith("DATABASE_URL"):
            database_url_found = True
            print(f"   Line {i}: DATABASE_URL found")
            
            # Check for common issues
            if "=" in line:
                value = line.split("=", 1)[1].strip()
                
                # Check for quotes
                if value.startswith('"') and value.endswith('"'):
                    print(f"   ⚠️  WARNING: URL is wrapped in double quotes")
                    print(f"      Remove quotes from .env file")
                elif value.startswith("'") and value.endswith("'"):
                    print(f"   ⚠️  WARNING: URL is wrapped in single quotes")
                    print(f"      Remove quotes from .env file")
                
                # Check for protocol
                if not value.startswith(("postgres://", "postgresql://", "sqlite:///")):
                    print(f"   ❌ ERROR: Missing protocol (postgresql:// or postgres://)")
                    print(f"      Current start: {value[:20]}...")
                
                # Check length
                clean_value = value.strip('"').strip("'")
                if len(clean_value) < 20:
                    print(f"   ⚠️  WARNING: URL seems too short ({len(clean_value)} chars)")
                
                # Show first and last part (without exposing password)
                clean_value = clean_value.strip('"').strip("'")
                if "@" in clean_value:
                    parts = clean_value.split("@")
                    if len(parts) == 2:
                        print(f"   Format check:")
                        print(f"      Protocol: {parts[0].split('://')[0] if '://' in parts[0] else 'MISSING'}://")
                        print(f"      Host: {parts[1].split('/')[0] if '/' in parts[1] else parts[1][:50]}")
                        print(f"      Database: {parts[1].split('/')[1].split('?')[0] if '/' in parts[1] else 'UNKNOWN'}")
                
                # Show raw value (truncated for security)
                print(f"   Raw value (first 60 chars): {value[:60]}...")
                if len(value) > 60:
                    print(f"   Raw value (last 30 chars): ...{value[-30:]}")
            else:
                print(f"   ⚠️  WARNING: DATABASE_URL line missing '=' sign")
            
            print()
    
    if not database_url_found:
        print(f"   ❌ DATABASE_URL not found in .env file!")
        print(f"   Please add: DATABASE_URL=postgresql://user:pass@host/dbname")
        print()
    
    # Show all non-empty lines (for debugging)
    print(f"3. All non-empty lines in .env:")
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if line and not line.startswith("#"):
            # Mask sensitive values
            if "=" in line and "DATABASE_URL" in line:
                parts = line.split("=", 1)
                if len(parts) == 2:
                    value = parts[1]
                    if "@" in value:
                        # Mask password
                        url_parts = value.split("@")
                        if len(url_parts) > 0 and "://" in url_parts[0]:
                            protocol_user = url_parts[0].split("://")
                            if len(protocol_user) == 2:
                                protocol = protocol_user[0]
                                user_pass = protocol_user[1]
                                if ":" in user_pass:
                                    user = user_pass.split(":")[0]
                                    masked = f"{protocol}://{user}:***@{url_parts[1][:30]}..."
                                    print(f"   Line {i}: {parts[0]}={masked}")
                                else:
                                    print(f"   Line {i}: {line[:80]}...")
                            else:
                                print(f"   Line {i}: {line[:80]}...")
                        else:
                            print(f"   Line {i}: {line[:80]}...")
                    else:
                        print(f"   Line {i}: {line[:80]}...")
                else:
                    print(f"   Line {i}: {line[:80]}...")
            else:
                print(f"   Line {i}: {line[:80]}...")
    
except Exception as e:
    print(f"   ❌ Error reading .env file: {e}")
    print()

print()
print("=" * 70)
print("Testing with python-dotenv...")
print("=" * 70)

try:
    from dotenv import load_dotenv
    load_dotenv(env_file)
    db_url = os.getenv("DATABASE_URL")
    
    if db_url:
        print(f"✅ DATABASE_URL loaded successfully")
        print(f"   Length: {len(db_url)} characters")
        print(f"   Starts with: {db_url[:20]}...")
        has_quotes = db_url.startswith(('"', "'"))
        print(f"   Has quotes: {has_quotes}")
        
        # Clean version
        clean = db_url.strip().strip('"').strip("'")
        print(f"   After cleaning: {clean[:30]}...")
    else:
        print(f"❌ DATABASE_URL is None after loading")
        print(f"   Check your .env file format")
except Exception as e:
    print(f"❌ Error loading .env: {e}")

print()
print("=" * 70)
print("Recommendations:")
print("=" * 70)
print("1. Make sure DATABASE_URL is on a single line (no line breaks)")
print("2. Don't use quotes around the URL in .env file")
print("3. Format should be: DATABASE_URL=postgresql://user:pass@host/dbname")
print("4. Or: DATABASE_URL=postgres://user:pass@host/dbname")
print("5. No spaces around the = sign")
print("=" * 70)

