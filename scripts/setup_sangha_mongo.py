#!/usr/bin/env python3
"""
Create MongoDB indexes + sample sangha data (people, events, places)
so you can browse Join / Login / Admin / Events against Spring Boot.

Defaults:
  mongodb://localhost:27017  database=pssm_sangha  replicaSet=rs0

Usage:
  pip install -r scripts/requirements-db.txt
  docker compose up -d mongo
  python scripts/setup_sangha_mongo.py

Then start backend and React with VITE_USE_MOCK=false:
  cd backend && mvn spring-boot:run
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import bcrypt
    from pymongo import ASCENDING, DESCENDING, MongoClient
    from pymongo.errors import DuplicateKeyError, OperationFailure, PyMongoError
except ImportError:
    print("Install deps first:  pip install -r scripts/requirements-db.txt", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
PLACES_CSV = ROOT / "scripts" / "data" / "sangha_places.csv"


def composed_password(full_name: str, birth_date: str, birth_month: str) -> str:
    letters = re.sub(r"[^A-Za-z]", "", full_name or "")[:5]
    if not letters or not birth_date or not birth_month:
        return ""
    return f"{letters}{str(birth_date).zfill(2)[:2]}{str(birth_month).zfill(2)[:2]}"


def bcrypt_hash(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


def connect(args) -> MongoClient:
    return MongoClient(args.uri, serverSelectionTimeoutMS=8000)


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
    print("Indexes ensured on people, places, events")


def import_places(db) -> None:
    if not PLACES_CSV.exists():
        print(f"Place seed CSV missing: {PLACES_CSV}", file=sys.stderr)
        return

    now = datetime.now(timezone.utc)
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
                    "usageCount": 0,
                    "createdAt": now,
                    "updatedAt": now,
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
    print(f"Places seeded: {len(rows)} CSV rows ({upserted} inserted, table now has {places.count_documents({})}).")


def upsert_person(db, person: dict, roles: list[str], plain: str, members: list[dict] | None) -> None:
    now = datetime.now(timezone.utc)
    doc = {
        **person,
        "passwordHash": bcrypt_hash(plain),
        "roles": list(roles),
        "members": members or [],
        "updatedAt": now,
    }
    existing = db["people"].find_one({"mobile": person["mobile"]})
    if existing:
        doc["createdAt"] = existing.get("createdAt", now)
        db["people"].replace_one({"_id": existing["_id"]}, {**existing, **doc, "_id": existing["_id"]})
    else:
        doc["createdAt"] = now
        try:
            db["people"].insert_one(doc)
        except DuplicateKeyError:
            db["people"].update_one({"mobile": person["mobile"]}, {"$set": doc})


def import_sample_data(db) -> None:
    samples = [
        {
            "person": {
                "mobile": "9000000001",
                "fullName": "Pssm Admin",
                "email": "admin@pssm.example",
                "altMobile": "9000000002",
                "gender": "male",
                "ageGroup": "adult",
                "meditation": "6",
                "birthDate": "01",
                "birthMonth": "01",
                "language": "English",
                "pyramidCenter": "Pyramid Meditation Center, Hyderabad",
                "sinceYear": "2010",
                "idType": "aadhaar",
                "place": {
                    "kind": "urban",
                    "city": "Hyderabad",
                    "state": "Telangana",
                    "country": "India",
                },
            },
            "roles": ["pssm_admin"],
            "members": [],
        },
        {
            "person": {
                "mobile": "9876543210",
                "fullName": "Ramakrishna",
                "email": "rama@pssm.example",
                "altMobile": "9876543211",
                "gender": "male",
                "ageGroup": "adult",
                "meditation": "5",
                "birthDate": "15",
                "birthMonth": "08",
                "language": "Telugu",
                "pyramidCenter": "Pyramid Meditation Center, Vijayawada",
                "sinceYear": "2019",
                "idType": "aadhaar",
                "place": {
                    "kind": "urban",
                    "city": "Vijayawada",
                    "state": "Andhra Pradesh",
                    "country": "India",
                },
            },
            "roles": ["event_organizer"],
            "members": [
                {
                    "sortOrder": 0,
                    "name": "Sita Devi",
                    "relation": "Spouse",
                    "mobile": "9876543212",
                    "gender": "female",
                    "ageGroup": "adult",
                    "meditation": "4",
                    "addrMode": "same",
                    "idType": "aadhaar",
                },
                {
                    "sortOrder": 1,
                    "name": "Ananya",
                    "relation": "Child",
                    "mobile": "",
                    "gender": "female",
                    "ageGroup": "child",
                    "meditation": "new",
                    "addrMode": "same",
                    "idType": "",
                },
            ],
        },
        {
            "person": {
                "mobile": "9876501234",
                "fullName": "Lakshmi Devi",
                "email": "lakshmi@pssm.example",
                "altMobile": "",
                "gender": "female",
                "ageGroup": "adult",
                "meditation": "3",
                "birthDate": "22",
                "birthMonth": "03",
                "language": "Telugu",
                "pyramidCenter": "Indiranagar Pyramid Group",
                "sinceYear": "2021",
                "idType": "voter",
                "place": {
                    "kind": "urban",
                    "city": "Bengaluru",
                    "state": "Karnataka",
                    "country": "India",
                },
            },
            "roles": ["pyramid_sevadal"],
            "members": [
                {
                    "sortOrder": 0,
                    "name": "Venkat Rao",
                    "relation": "Spouse",
                    "mobile": "9876501235",
                    "gender": "male",
                    "ageGroup": "adult",
                    "meditation": "2",
                    "addrMode": "same",
                    "idType": "pan",
                }
            ],
        },
        {
            "person": {
                "mobile": "9876511111",
                "fullName": "Meena Shah",
                "email": "meena@pssm.example",
                "altMobile": "9876511112",
                "gender": "female",
                "ageGroup": "adult",
                "meditation": "2",
                "birthDate": "10",
                "birthMonth": "05",
                "language": "Hindi",
                "pyramidCenter": "Pyramid Meditation Center, Hyderabad",
                "sinceYear": "2020",
                "idType": "passport",
                "place": {
                    "kind": "urban",
                    "city": "Hyderabad",
                    "state": "Telangana",
                    "country": "India",
                },
            },
            "roles": ["pmma_member"],
            "members": [],
        },
        {
            "person": {
                "mobile": "9876522222",
                "fullName": "Ravi Kumar",
                "email": "ravi@pssm.example",
                "altMobile": "",
                "gender": "male",
                "ageGroup": "senior",
                "meditation": "6",
                "birthDate": "05",
                "birthMonth": "11",
                "language": "Telugu",
                "pyramidCenter": "Village Pyramid Group, Kadthal",
                "sinceYear": "2012",
                "idType": "aadhaar",
                "place": {
                    "kind": "rural",
                    "village": "Kadthal",
                    "town": "Amangal",
                    "district": "Ranga Reddy",
                    "state": "Telangana",
                    "country": "India",
                },
            },
            "roles": [],
            "members": [
                {
                    "sortOrder": 0,
                    "name": "Padma",
                    "relation": "Spouse",
                    "mobile": "9876522223",
                    "gender": "female",
                    "ageGroup": "senior",
                    "meditation": "5",
                    "addrMode": "same",
                    "idType": "aadhaar",
                },
                {
                    "sortOrder": 1,
                    "name": "Karthik",
                    "relation": "Child",
                    "mobile": "9876522224",
                    "gender": "male",
                    "ageGroup": "adult",
                    "meditation": "1",
                    "addrMode": "new",
                    "idType": "driving",
                    "place": {
                        "kind": "urban",
                        "city": "Hyderabad",
                        "state": "Telangana",
                        "country": "India",
                    },
                },
            ],
        },
    ]

    print("\nSample logins (password = ≤5 letters of name + DDMM):")
    for item in samples:
        p = item["person"]
        plain = composed_password(p["fullName"], p["birthDate"], p["birthMonth"])
        upsert_person(db, p, item["roles"], plain, item.get("members"))
        roles = ",".join(item["roles"]) or "(none)"
        fam = len(item.get("members") or [])
        place = (p.get("place") or {}).get("kind")
        print(f"  {p['mobile']}  {plain:12}  {p['fullName']}  [{roles}]  family={fam}  place={place}")

    now = datetime.now(timezone.utc)
    events = [
        {
            "_id": "evt_sample_dhyana",
            "name": "Dhyana Maha Yagam - 5",
            "startDate": datetime(2026, 12, 21),
            "endDate": datetime(2026, 12, 31),
            "createdBy": "9876543210",
            "createdAt": now,
        },
        {
            "_id": "evt_sample_dussehra",
            "name": "Dussehra Sangeetha Dhyana Maha Yagnam",
            "startDate": datetime(2026, 10, 17),
            "endDate": datetime(2026, 10, 20),
            "createdBy": "9876543210",
            "createdAt": now,
        },
    ]
    for event in events:
        db["events"].replace_one({"_id": event["_id"]}, event, upsert=True)
    print("\nSample events: Dhyana Maha Yagam - 5, Dussehra Sangeetha Dhyana Maha Yagnam")
    print("\nSample data imported (people + family + events).")


def parse_args():
    p = argparse.ArgumentParser(description="Create MongoDB indexes and sample sangha data")
    p.add_argument(
        "--uri",
        default="mongodb://localhost:27017/?replicaSet=rs0",
        help="MongoDB connection URI",
    )
    p.add_argument("--database", default="pssm_sangha")
    p.add_argument("--skip-indexes", action="store_true")
    p.add_argument("--data-only", action="store_true", help="Skip indexes; only upsert sample rows")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    try:
        client = connect(args)
        client.admin.command("ping")
        db = client[args.database]
        if not args.data_only and not args.skip_indexes:
            ensure_indexes(db)
        import_places(db)
        import_sample_data(db)
    except PyMongoError as exc:
        print(f"MongoDB error: {exc}", file=sys.stderr)
        print("Is Mongo running? Try: docker compose up -d mongo", file=sys.stderr)
        return 1
    except OperationFailure as exc:
        print(f"MongoDB operation failed: {exc}", file=sys.stderr)
        return 1

    print(
        """
Next:
  1. cd backend
     mvn spring-boot:run
  2. In frontend/.env set VITE_USE_MOCK=false
  3. cd frontend && npm run dev
  4. Login as 9000000001 / PssmA0101  (PSSM Admin)
     or 9876543210 / Ramak1508        (Event Organizer)
"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
