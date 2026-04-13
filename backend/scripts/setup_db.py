"""
Apply schema.sql to Supabase database.
Requires DATABASE_URL in backend/.env (PostgreSQL direct connection).

Usage:
  python scripts/setup_db.py

DATABASE_URL format:
  postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
"""
from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import psycopg2
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

import os

DATABASE_URL = os.environ.get("DATABASE_URL", "")

if not DATABASE_URL:
    # Try loading from .env
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith("DATABASE_URL="):
                DATABASE_URL = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

if not DATABASE_URL:
    print(
        "\nERROR: DATABASE_URL not set.\n"
        "Add it to backend/.env:\n"
        "  DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres\n"
        "\nAlternative: paste supabase/schema.sql into the Supabase Dashboard SQL Editor."
    )
    sys.exit(1)

SCHEMA_PATH = Path(__file__).parent.parent.parent / "supabase" / "schema.sql"

if not SCHEMA_PATH.exists():
    print(f"ERROR: Schema file not found at {SCHEMA_PATH}")
    sys.exit(1)

print(f"[DB] Connecting to Supabase...")
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cursor = conn.cursor()

schema_sql = SCHEMA_PATH.read_text()

print(f"[DB] Applying schema from {SCHEMA_PATH}...")
try:
    cursor.execute(schema_sql)
    print("[DB] Schema applied successfully!")
    print("[DB] Tables created: talks, insights, briefs, voice_pack, trend_matches, source_posts")
except Exception as e:
    print(f"[DB] Error: {e}")
    print("\nTIP: If you see 'already exists' errors, the schema may already be applied.")
finally:
    cursor.close()
    conn.close()
