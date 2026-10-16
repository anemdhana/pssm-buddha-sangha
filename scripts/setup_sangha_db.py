#!/usr/bin/env python3
"""
Bootstrap MongoDB so the sangha app can start.

Ensures indexes and loads master lists (places + pyramid centers) from CSV.
Does **not** create sample people, events, or stay bookings — use:

  python scripts/seed_sangha_samples.py --help

Defaults:
  mongodb://localhost:27017/?replicaSet=rs0  database=pssm_sangha

Usage:
  pip install -r scripts/requirements-db.txt
  docker compose up -d mongo
  python scripts/setup_sangha_db.py
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from pymongo import ASCENDING, DESCENDING
    from pymongo.errors import OperationFailure, PyMongoError
except ImportError:
    print("Install deps first:  pip install -r scripts/requirements-db.txt", file=sys.stderr)
    sys.exit(1)

SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from sangha_mongo_common import connect, utc_now

ROOT = SCRIPTS.parent
# Single source of truth — same CSVs Spring Boot seeds from classpath
DATA = ROOT / "backend" / "src" / "main" / "resources" / "data"
PLACES_CSV = DATA / "sangha_places.csv"
CENTERS_CSV = DATA / "sangha_pyramid_centers.csv"


def ensure_indexes(db) -> None:
    people = db["people"]
    people.create_index("mobile", unique=True, name="uk_people_mobile")
    people.create_index("roles", name="idx_people_roles")
    people.create_index("fullName", name="idx_people_full_name")

    places = db["places"]
    places.create_index(
        [("kind", ASCENDING), ("name", ASCENDING), ("state", ASCENDING), ("country", ASCENDING)],
        unique=True,
        name="uk_places_kind_name_state_country",
    )
    places.create_index(
        [("kind", ASCENDING), ("usageCount", DESCENDING), ("name", ASCENDING)],
        name="idx_places_kind_usage_name",
    )
    places.create_index([("kind", ASCENDING), ("name", ASCENDING)], name="idx_places_kind_name")

    events = db["events"]
    events.create_index("startDate", name="idx_events_start_date")
    events.create_index("createdBy", name="idx_events_created_by")
    events.create_index([("createdAt", DESCENDING)], name="idx_events_created_at")

    centers = db["pyramid_centers"]
    centers.create_index("name", unique=True, name="uk_pyramid_centers_name")
    centers.create_index(
        [("usageCount", DESCENDING), ("name", ASCENDING)],
        name="idx_pyramid_centers_usage_name",
    )

    bookings = db["stay_bookings"]
    bookings.create_index([("eventId", ASCENDING), ("createdAt", DESCENDING)], name="idx_stay_event_created")
    bookings.create_index("familyMobile", name="idx_stay_family_mobile")
    # Drop pre-rename index if present
    try:
        bookings.drop_index("idx_stay_party_mobile")
    except Exception:
        pass
    print("Indexes ensured on people, places, events, pyramid_centers, stay_bookings")


def import_places(db) -> None:
    if not PLACES_CSV.exists():
        print(f"Place seed CSV missing: {PLACES_CSV}", file=sys.stderr)
        return

    now = utc_now()
    rows = []
    with PLACES_CSV.open(encoding="utf-8") as fh:
        header = fh.readline()
        if not header:
            return
        for line in fh:
            line = line.strip()
            if not line:
                continue
            parts = line.split(",")
            if len(parts) < 6:
                continue
            kind, name, town, district, state, country = [p.strip() for p in parts[:6]]
            kind = kind.lower()
            if kind not in ("urban", "rural") or not name:
                continue
            rows.append(
                {
                    "kind": kind,
                    "name": name,
                    "town": town or None,
                    "district": district or None,
                    "state": state or "",
                    "country": country or "India",
                }
            )

    places = db["places"]
    upserted = 0
    for row in rows:
        result = places.update_one(
            {
                "kind": row["kind"],
                "name": row["name"],
                "state": row["state"],
                "country": row["country"],
            },
            {
                "$setOnInsert": {
                    "town": row["town"],
                    "district": row["district"],
                    "usageCount": 0,
                    "createdAt": now,
                },
                "$set": {"updatedAt": now},
            },
            upsert=True,
        )
        if result.upserted_id is not None:
            upserted += 1
    print(f"Places: {len(rows)} CSV rows ({upserted} inserted, total {places.count_documents({})}).")


def import_pyramid_centers(db, *, replace: bool = False) -> None:
    if not CENTERS_CSV.exists():
        print(f"Pyramid center seed CSV missing: {CENTERS_CSV}", file=sys.stderr)
        return

    import csv

    now = utc_now()
    rows = []
    with CENTERS_CSV.open(encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            name = (row.get("name") or "").strip()
            if not name:
                continue
            rows.append(
                {
                    "name": name,
                    "locality": (row.get("locality") or "").strip(),
                    "city": (row.get("city") or "").strip(),
                    "state": (row.get("state") or "").strip(),
                    "country": (row.get("country") or "India").strip() or "India",
                    "address": (row.get("address") or "").strip(),
                }
            )

    centers = db["pyramid_centers"]
    if replace:
        removed = centers.delete_many({}).deleted_count
        print(f"Pyramid centers: cleared {removed} existing row(s).")
    upserted = 0
    for row in rows:
        result = centers.update_one(
            {"name": row["name"]},
            {
                "$setOnInsert": {"name": row["name"], "usageCount": 0, "createdAt": now},
                "$set": {
                    "locality": row["locality"] or None,
                    "city": row["city"] or None,
                    "state": row["state"] or None,
                    "country": row["country"] or None,
                    "address": row["address"] or None,
                    "updatedAt": now,
                },
            },
            upsert=True,
        )
        if result.upserted_id is not None:
            upserted += 1
    print(
        f"Pyramid centers: {len(rows)} CSV rows "
        f"({upserted} inserted, total {centers.count_documents({})})."
    )


def parse_args():
    p = argparse.ArgumentParser(
        description="Bootstrap MongoDB for PSSM Buddha Sangha (indexes + places/centers only)"
    )
    p.add_argument(
        "--uri",
        default="mongodb://localhost:27017/?replicaSet=rs0",
        help="MongoDB connection URI",
    )
    p.add_argument("--database", default="pssm_sangha")
    p.add_argument("--skip-indexes", action="store_true")
    p.add_argument("--skip-places", action="store_true")
    p.add_argument("--skip-centers", action="store_true")
    p.add_argument(
        "--replace-centers",
        action="store_true",
        help="Delete existing pyramid_centers before importing the CSV (real PSSM list)",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    try:
        client = connect(args.uri)
        client.admin.command("ping")
        db = client[args.database]
        if not args.skip_indexes:
            ensure_indexes(db)
        if not args.skip_places:
            import_places(db)
        if not args.skip_centers:
            import_pyramid_centers(db, replace=args.replace_centers)
    except PyMongoError as exc:
        print(f"MongoDB error: {exc}", file=sys.stderr)
        print("Is Mongo running? Try: docker compose up -d mongo", file=sys.stderr)
        return 1
    except OperationFailure as exc:
        print(f"MongoDB operation failed: {exc}", file=sys.stderr)
        return 1

    print(
        """
Bootstrap done. App can start:
  cd backend && mvn spring-boot:run
  # frontend/.env -> VITE_USE_MOCK=false

Sample people / events / stay interest:
  python scripts/seed_sangha_samples.py --clear --all
"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
