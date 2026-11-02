#!/usr/bin/env python3
"""
Bootstrap release-v1: staff + one event (no hotels / registrations / demo people).

Creates:
  PSSM Admin + Event Org  9445560075 / Dhana1405
  Accommodation Volunteer 9966362691 / Meena1005
  Event                   Patriji Dhayana Mahayagam - 5 (2026-12-21 … 2026-12-31)

Usage:
  python scripts/seed_release_v1_staff.py
  python scripts/seed_release_v1_staff.py --keep-places
  python scripts/seed_release_v1_staff.py --no-clear
"""

from __future__ import annotations

import argparse
import base64
import sys
from datetime import date, datetime, timezone
from pathlib import Path

try:
    from pymongo.errors import OperationFailure, PyMongoError
except ImportError:
    print("Install deps first:  pip install -r scripts/requirements-db.txt", file=sys.stderr)
    sys.exit(1)

SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from sangha_mongo_common import composed_password, connect, upsert_person, utc_now

SEED_SOURCE = "release_v1"
EVT_ID = "evt_patriji_dhayana_mahayagam_5"
EVT_NAME = "Patriji Dhayana Mahayagam - 5"
EVT_START = date(2026, 12, 21)
EVT_END = date(2026, 12, 31)

# Prior release admin — always removed when seeding.
LEGACY_ADMIN_MOBILE = "7093405071"

ADMIN_PHOTO = SCRIPTS / "assets" / "release_v1_pssm_admin.jpg"


def _live_photo_data_url(path: Path) -> str:
    raw = path.read_bytes()
    return "data:image/jpeg;base64," + base64.b64encode(raw).decode("ascii")


STAFF = [
    {
        "person": {
            "mobile": "9445560075",
            "fullName": "Dhana kumar A",
            "email": "dhana.anem@gmail.com",
            "gender": "male",
            "ageGroup": "adult",
            "meditation": "5",
            "profession": "IT",
            "birthDate": "14",
            "birthMonth": "05",
            "language": "Tamil",
            "pyramidCenter": "",
            "sinceYear": "2021",
            "idType": "aadhaar",
            "place": {
                "kind": "urban",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "country": "India",
            },
            "seedSource": SEED_SOURCE,
        },
        "roles": ["pssm_admin", "event_organizer"],
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


def remove_legacy_admin(db) -> None:
    admin_mobile = next(
        item["person"]["mobile"] for item in STAFF if "pssm_admin" in item["roles"]
    )
    removed_legacy = db["people"].delete_many({"mobile": LEGACY_ADMIN_MOBILE}).deleted_count
    removed_other = db["people"].delete_many(
        {"roles": "pssm_admin", "mobile": {"$ne": admin_mobile}}
    ).deleted_count
    if removed_legacy:
        print(f"Removed legacy PSSM Admin ({LEGACY_ADMIN_MOBILE}): {removed_legacy}")
    if removed_other:
        print(f"Removed other PSSM Admin account(s): {removed_other}")


def seed_staff(db) -> None:
    print("\nSeeding release-v1 staff…")
    admin_photo = ""
    if ADMIN_PHOTO.is_file():
        admin_photo = _live_photo_data_url(ADMIN_PHOTO)
    else:
        print(f"  Warning: admin photo missing at {ADMIN_PHOTO}", file=sys.stderr)

    for item in STAFF:
        person = dict(item["person"])
        if "pssm_admin" in item["roles"] and admin_photo:
            person["livePhoto"] = admin_photo
        plain = composed_password(person["fullName"], person["birthDate"], person["birthMonth"])
        upsert_person(db, person, item["roles"], plain, item.get("members"))
        print(
            f"  {person['mobile']}  {plain:12}  {person['fullName']}  "
            f"[{','.join(item['roles'])}]"
            + ("  photo" if person.get("livePhoto") else "")
        )


def seed_event(db) -> None:
    print("\nSeeding release-v1 event…")
    # Wipe any other events so the header only shows this one.
    removed = db["events"].delete_many({"_id": {"$ne": EVT_ID}})
    if removed.deleted_count:
        print(f"  Removed {removed.deleted_count} other event(s)")
    admin_mobile = next(
        item["person"]["mobile"] for item in STAFF if "pssm_admin" in item["roles"]
    )
    event = {
        "_id": EVT_ID,
        "name": EVT_NAME,
        "startDate": datetime(EVT_START.year, EVT_START.month, EVT_START.day, tzinfo=timezone.utc),
        "endDate": datetime(EVT_END.year, EVT_END.month, EVT_END.day, tzinfo=timezone.utc),
        "location": "Santh Kabir Das Pyramid Centre, Hyderabad",
        "expectedBudgetInr": 0,
        "meditationHoursPerDay": 6.0,
        "createdBy": admin_mobile,
        "createdAt": utc_now(),
        "seedSource": SEED_SOURCE,
    }
    db["events"].replace_one({"_id": EVT_ID}, event, upsert=True)
    print(f"  {EVT_ID}: {EVT_NAME}  ({EVT_START.isoformat()} – {EVT_END.isoformat()})")


def parse_args():
    p = argparse.ArgumentParser(
        description="Seed release-v1 staff + Patriji Dhayana Mahayagam - 5 event"
    )
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
        help="Only upsert staff + event; do not wipe bookings/hotels/other people",
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
        remove_legacy_admin(db)
        seed_staff(db)
        seed_event(db)
    except PyMongoError as exc:
        print(f"MongoDB error: {exc}", file=sys.stderr)
        print("Is Mongo running? Try: docker compose up -d mongo", file=sys.stderr)
        return 1
    except OperationFailure as exc:
        print(f"MongoDB operation failed: {exc}", file=sys.stderr)
        return 1

    print(
        f"""
Done. release-v1 ready.

Logins (password = up to 5 letters of name + DDMM):
  9445560075 / Dhana1405     PSSM Admin + Event Organizer
  9966362691 / Meena1005     Accommodation Volunteer

Event:
  {EVT_NAME}
  {EVT_START.isoformat()} – {EVT_END.isoformat()}

Next: add hotels in the UI, then register people.
"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
