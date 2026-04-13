"""
Load seed data (source_posts, trend_headlines) into Supabase.
Usage:
  python scripts/seed_data.py --posts     # Load source_posts from seeds/source_posts.json
  python scripts/seed_data.py --trends    # Load trend headlines from seeds/trend_headlines.json
"""
from __future__ import annotations
import asyncio
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db import get_supabase

SEEDS_DIR = Path(__file__).parent.parent / "seeds"


def seed_source_posts():
    posts_file = SEEDS_DIR / "source_posts.json"
    if not posts_file.exists():
        print(f"ERROR: {posts_file} not found. Create it with ~20 EPIC Lab posts.")
        return

    posts = json.loads(posts_file.read_text(encoding="utf-8"))
    supabase = get_supabase()

    # Clear existing and re-insert
    supabase.table("source_posts").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    result = supabase.table("source_posts").insert(posts).execute()
    print(f"[SEED] Inserted {len(result.data)} source posts.")


def seed_trends():
    trends_file = SEEDS_DIR / "trend_headlines.json"
    if not trends_file.exists():
        print(f"ERROR: {trends_file} not found.")
        return

    trends = json.loads(trends_file.read_text(encoding="utf-8"))
    print(f"[SEED] {len(trends)} trend headlines loaded. Run trends pipeline to embed + match.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--posts", action="store_true", help="Seed source posts")
    parser.add_argument("--trends", action="store_true", help="Show trend headlines")
    args = parser.parse_args()

    if args.posts:
        seed_source_posts()
    elif args.trends:
        seed_trends()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
