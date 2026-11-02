#!/usr/bin/env python3
"""
Bootstrap release-v1 staff only (no sample events / bookings / hotels / demo people).

Creates:
  PSSM Admin              7093405071 / Srini0101
  Accommodation Volunteer 9966362691 / Meena1005

Usage:
  python scripts/seed_release_v1_staff.py
  python scripts/seed_release_v1_staff.py --keep-places
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from pymongo.errors import OperationFailure, PyMongoError
except ImportError:
    print("Install deps first:  pip install -r scripts/requirements-db.txt", file=sys.stderr)
    sys.exit(1)

SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from sangha_mongo_common import composed_password, connect, upsert_person

SEED_SOURCE = "release_v1"

STAFF = [
    {
        "person": {
            "mobile": "7093405071",
            "fullName": "Srinivasa Rao",
            "email": "srinivasa@pssm.example",
            "gender": "male",
            "ageGroup": "adult",
            "meditation": "6",
            "profession": "Administrator",
            "birthDate": "01",
            "birthMonth": "01",
            "language": "Telugu",
            "pyramidCenter": "Santh Kabir Das Pyramid Centre",
            "sinceYear": "2010",
            "idType": "aadhaar",
            "place": {
                "kind": "urban",
                "city": "Hyderabad",
                "state": "Telangana",
                "country": "India",
            },
            "seedSource": SEED_SOURCE,
        },
        "roles": ["pssm_admin"],
        "members": [],
    },
    {
        "person": {
            "mobile": "9966362691",
            "fullName": "Meenakshi Devi",
            "email": "meenakshi@pssm.example",
            "gender": "female",
            "ageGroup": "adult",
            "meditation": "6",
            "profession": "Accommodation Volunteer",
            "birthDate": "10",
            "birthMonth": "05",
            "language": "Telugu",
            "pyramidCenter": "Santh Kabir Das Pyramid Centre",
            "sinceYear": "2015",
            "idType": "aadhaar",
            "place": {
                "kind": "urban",
                "city": "Hyderabad",
                "state": "Telangana",
                "country": "India",
            },
            "seedSource": SEED_SOURCE,
        },
        "roles": ["accommodation_volunteer"],
        "members": [],
    },
]


def clear_sample_data(db, *, keep_places: bool) -> None:
    staff_mobiles = {item["person"]["mobile"] for item in STAFF}
    deleted = {
        "stay_allotments": db["stay_allotments"].delete_many({}).deleted_count,
        "stay_bookings": db["stay_bookings"].delete_many({}).deleted_count,
        "hotels": db["hotels"].delete_many({}).deleted_count,
        "events": db["events"].delete_many({}).deleted_count,
        "people": db["people"].delete_many({"mobile": {"$nin": list(staff_mobiles)}}).deleted_count,
    }
    # Drop leftover staff docs that aren't our two roles; upsert recreates them cleanly.
    deleted["extra_staff"] = db["people"].delete_many(
        {"mobile": {"$in": list(staff_mobiles)}}
    ).deleted_count
    if not keep_places:
        deleted["places"] = db["places"].delete_many({}).deleted_count
        deleted["pyramid_centers"] = db["pyramid_centers"].delete_many({}).deleted_count
    print("Cleared sample data:")
    for key, count in deleted.items():
        print(f"  {key}={count}")


def seed_staff(db) -> None:
    print("\nSeeding release-v1 staff…")
    for item in STAFF:
        person = item["person"]
        plain = composed_password(person["fullName"], person["birthDate"], person["birthMonth"])
        upsert_person(db, person, item["roles"], plain, item.get("members"))
        print(
            f"  {person['mobile']}  {plain:12}  {person['fullName']}  "
            f"[{','.join(item['roles'])}]"
        )


def parse_args():
    p = argparse.ArgumentParser(description="Seed release-v1 staff only (no sample data)")
    p.add_argument("--uri", default="mongodb://localhost:27017/?replicaSet=rs0")
    p.add_argument("--database", default="pssm_sangha")
    p.add_argument(
        "--keep-places",
        action="store_true",
        help="Keep places + pyramid_centers reference data for autocomplete",
    )
    p.add_argument(
        "--no-clear",
        action="store_true",
        help="Only upsert staff; do not wipe events/bookings/hotels/people",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    try:
        client = connect(args.uri)
        client.admin.command("ping")
        db = client[args.database]
        if not args.no_clear:
            clear_sample_data(db, keep_places=args.keep_places)
        seed_staff(db)
    except PyMongoError as exc:
        print(f"MongoDB error: {exc}", file=sys.stderr)
        print("Is Mongo running? Try: docker compose up -d mongo", file=sys.stderr)
        return 1
    except OperationFailure as exc:
        print(f"MongoDB operation failed: {exc}", file=sys.stderr)
        return 1

    print(
        """
Done. Clean DB ready for release-v1.

Logins (password = up to 5 letters of name + DDMM):
  7093405071 / Srini0101     PSSM Admin
  9966362691 / Meena1005     Accommodation Volunteer

Create a new event in the UI, add hotels, then register people.
"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
