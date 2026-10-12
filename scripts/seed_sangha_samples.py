#!/usr/bin/env python3
"""
Load / clear demo data for development (people, events, stay interest).

Does not touch places or pyramid_centers master lists — run setup_sangha_db.py for those.

Usage:
  python scripts/seed_sangha_samples.py --clear --all
  python scripts/seed_sangha_samples.py --people
  python scripts/seed_sangha_samples.py --events --bookings
  python scripts/seed_sangha_samples.py --clear
"""

from __future__ import annotations

import argparse
import base64
import html
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timezone
from functools import lru_cache
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

# Stable ids so re-seed is idempotent
EVT_DHYANA = "evt_sample_dhyana"
EVT_DUSSEHRA = "evt_sample_dussehra"
EVT_ANANDOTSAVAM = "evt_sample_anandotsavam"

# Free demo portraits (not social media). Cached under scripts/.cache/sample_photos/
PHOTO_CACHE = SCRIPTS / ".cache" / "sample_photos"

# Stable portrait indices from randomuser.me (men/women 0–99)
PHOTO_BY_KEY: dict[str, tuple[str, int]] = {
    "9000000001": ("male", 12),
    "9876543210": ("male", 32),
    "9876543212": ("female", 44),
    "ananya": ("female", 68),
    "9876501234": ("female", 21),
    "9876501235": ("male", 45),
    "9876511111": ("female", 33),
    "9876522222": ("male", 75),
    "9876522223": ("female", 65),
    "9876522224": ("male", 22),
    "9876533333": ("female", 47),
    "9876544444": ("male", 55),
    "9876544445": ("female", 28),
}


def _initials_svg_data_url(label: str) -> str:
    letters = "".join(ch for ch in (label or "?") if ch.isalpha())[:2].upper() or "?"
    safe = html.escape(letters)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">'
        f'<rect width="256" height="256" fill="#3d5a40"/>'
        f'<text x="128" y="140" text-anchor="middle" font-family="Arial,sans-serif" '
        f'font-size="96" fill="#f4f7f2">{safe}</text></svg>'
    )
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode("utf-8")).decode("ascii")


def _id_proof_data_url(name: str, id_type: str) -> str:
    title = (id_type or "id").replace("_", " ").title() or "ID"
    safe_name = html.escape(name or "Sample")
    safe_title = html.escape(title)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200">'
        f'<rect width="320" height="200" rx="12" fill="#eef2ea"/>'
        f'<rect x="12" y="12" width="296" height="176" rx="8" fill="#fff" '
        f'stroke="#9aab95" stroke-width="2"/>'
        f'<text x="28" y="52" font-family="Arial,sans-serif" font-size="18" fill="#3d5a40">'
        f"Sample {safe_title}</text>"
        f'<text x="28" y="96" font-family="Arial,sans-serif" font-size="22" fill="#1f2a1c">'
        f"{safe_name}</text>"
        f'<text x="28" y="140" font-family="Arial,sans-serif" font-size="14" fill="#667766">'
        f"DEMO ONLY — not a real document</text></svg>"
    )
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode("utf-8")).decode("ascii")


@lru_cache(maxsize=32)
def portrait_data_url(gender: str, index: int, label: str = "") -> str:
    """Fetch a free demo face; fall back to initials SVG if offline."""
    folder = "women" if gender == "female" else "men"
    cache_path = PHOTO_CACHE / f"{folder}_{index}.jpg"
    try:
        if not cache_path.exists():
            PHOTO_CACHE.mkdir(parents=True, exist_ok=True)
            url = f"https://randomuser.me/api/portraits/{folder}/{index}.jpg"
            req = urllib.request.Request(url, headers={"User-Agent": "pssm-sangha-seed/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                cache_path.write_bytes(resp.read())
        raw = cache_path.read_bytes()
        if raw:
            return "data:image/jpeg;base64," + base64.b64encode(raw).decode("ascii")
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"  Photo fetch failed ({folder}/{index}): {exc} — using initials", file=sys.stderr)
    return _initials_svg_data_url(label)


def _photo_key(mobile: str, name: str) -> str:
    m = (mobile or "").strip()
    if m and m in PHOTO_BY_KEY:
        return m
    slug = "".join(ch for ch in (name or "").lower() if ch.isalpha())
    return slug if slug in PHOTO_BY_KEY else m or slug


def attach_sample_photos(items: list[dict]) -> list[dict]:
    """Add livePhoto + idProofPhoto (data URLs) to people and family members."""
    for item in items:
        person = item["person"]
        key = _photo_key(person.get("mobile", ""), person.get("fullName", ""))
        gender, index = PHOTO_BY_KEY.get(key, (person.get("gender") or "male", 10))
        person["livePhoto"] = portrait_data_url(gender, index, person.get("fullName", ""))
        if person.get("idType"):
            person["idProofPhoto"] = _id_proof_data_url(person.get("fullName", ""), person.get("idType", ""))
        for member in item.get("members") or []:
            mkey = _photo_key(member.get("mobile", ""), member.get("name", ""))
            mg, mi = PHOTO_BY_KEY.get(mkey, (member.get("gender") or "male", 40))
            member["livePhoto"] = portrait_data_url(mg, mi, member.get("name", ""))
            if member.get("idType"):
                member["idProofPhoto"] = _id_proof_data_url(member.get("name", ""), member.get("idType", ""))
    return items


def clear_sample_data(db) -> None:
    """Remove transactional / demo collections. Keeps places + pyramid_centers."""
    for name in ("stay_bookings", "events", "people"):
        result = db[name].delete_many({})
        print(f"Cleared {name}: {result.deleted_count} document(s)")


def sample_people() -> list[dict]:
    return attach_sample_photos(
        [
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
                "roles": ["accommodation_volunteer", "pmma_member"],
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
            {
                "person": {
                    "mobile": "9876533333",
                    "fullName": "Anita Reddy",
                    "email": "anita@pssm.example",
                    "altMobile": "",
                    "gender": "female",
                    "ageGroup": "adult",
                    "meditation": "4",
                    "birthDate": "18",
                    "birthMonth": "07",
                    "language": "Telugu",
                    "pyramidCenter": "Pyramid Meditation Center, Hyderabad",
                    "sinceYear": "2017",
                    "idType": "aadhaar",
                    "place": {
                        "kind": "urban",
                        "city": "Hyderabad",
                        "state": "Telangana",
                        "country": "India",
                    },
                },
                "roles": [],
                "members": [],
            },
            {
                "person": {
                    "mobile": "9876544444",
                    "fullName": "Suresh Naidu",
                    "email": "suresh@pssm.example",
                    "altMobile": "",
                    "gender": "male",
                    "ageGroup": "adult",
                    "meditation": "new",
                    "birthDate": "03",
                    "birthMonth": "09",
                    "language": "Telugu",
                    "pyramidCenter": "Village Pyramid Group, Pamarru",
                    "sinceYear": "2024",
                    "idType": "voter",
                    "place": {
                        "kind": "rural",
                        "village": "Pamarru",
                        "town": "Pamarru",
                        "district": "Krishna",
                        "state": "Andhra Pradesh",
                        "country": "India",
                    },
                },
                "roles": [],
                "members": [
                    {
                        "sortOrder": 0,
                        "name": "Jyothi",
                        "relation": "Spouse",
                        "mobile": "9876544445",
                        "gender": "female",
                        "ageGroup": "adult",
                        "meditation": "new",
                        "addrMode": "same",
                        "idType": "voter",
                    }
                ],
            },
        ]
    )


def seed_people(db) -> None:
    print("\nSample logins (password = up to 5 letters of name + DDMM):")
    print("Fetching demo portraits (randomuser.me)…")
    people = sample_people()
    for item in people:
        p = item["person"]
        plain = composed_password(p["fullName"], p["birthDate"], p["birthMonth"])
        upsert_person(db, p, item["roles"], plain, item.get("members"))
        roles = ",".join(item["roles"]) or "(none)"
        fam = len(item.get("members") or [])
        place = (p.get("place") or {}).get("kind")
        has_photo = "photo" if p.get("livePhoto") else "no-photo"
        print(f"  {p['mobile']}  {plain:12}  {p['fullName']}  [{roles}]  family={fam}  {place}  {has_photo}")
    print(f"People seeded: {len(people)}")


def sample_events() -> list[dict]:
    now = utc_now()
    return [
        {
            "_id": EVT_DHYANA,
            "name": "Dhyana Maha Yagam - 5",
            "startDate": datetime(2026, 12, 21, tzinfo=timezone.utc),
            "endDate": datetime(2026, 12, 31, tzinfo=timezone.utc),
            "location": "Pyramid Meditation Center, Hyderabad",
            "expectedBudgetInr": 500000,
            "meditationHoursPerDay": 3.0,
            "createdBy": "9876543210",
            "createdAt": now,
        },
        {
            "_id": EVT_DUSSEHRA,
            "name": "Dussehra Sangeetha Dhyana Maha Yagnam",
            "startDate": datetime(2026, 10, 17, tzinfo=timezone.utc),
            "endDate": datetime(2026, 10, 20, tzinfo=timezone.utc),
            "location": "Pyramid Meditation Center, Vijayawada",
            "expectedBudgetInr": 250000,
            "meditationHoursPerDay": 2.5,
            "createdBy": "9876543210",
            "createdAt": now,
        },
        {
            "_id": EVT_ANANDOTSAVAM,
            "name": "Dhyana Dussera Anandotsavam - 2026",
            "startDate": datetime(2026, 10, 28, tzinfo=timezone.utc),
            "endDate": datetime(2026, 10, 31, tzinfo=timezone.utc),
            "location": "Pyramid Meditation Center, Hyderabad",
            "expectedBudgetInr": 1000000,
            "meditationHoursPerDay": 6.0,
            "createdBy": "9876543210",
            "createdAt": now,
        },
    ]


def seed_events(db) -> None:
    """Upsert sample events and drop any other events (avoids duplicate names in the header)."""
    wanted = sample_events()
    wanted_ids = {e["_id"] for e in wanted}
    removed = db["events"].delete_many({"_id": {"$nin": list(wanted_ids)}})
    if removed.deleted_count:
        print(f"  Removed {removed.deleted_count} non-sample event(s)")
    for event in wanted:
        db["events"].replace_one({"_id": event["_id"]}, event, upsert=True)
        print(
            f"  Event {event['_id']}: {event['name']} "
            f"({event['startDate'].date()} - {event['endDate'].date()})"
        )
    print(f"Events seeded: {len(wanted)}")


def _iso(d: date) -> str:
    return d.isoformat()


def _guest(
    *,
    name: str,
    mobile: str,
    gender: str,
    age: str,
    start: date,
    end: date,
    primary: bool = False,
    relation: str = "",
) -> dict:
    return {
        "name": name,
        "relation": relation,
        "mobile": mobile,
        "gender": gender,
        "age": age,
        "stayStartDate": _iso(start),
        "stayEndDate": _iso(end),
        "primary": primary,
    }


def _booking(
    *,
    booking_id: str,
    event_id: str,
    event_name: str,
    plan: str,
    person: dict,
    members: list[dict],
    guests: list[dict],
    created_by: str,
    booked_at: datetime,
) -> dict:
    family = {
        "fullName": person["fullName"],
        "mobile": person["mobile"],
        "email": person.get("email") or "",
        "altMobile": person.get("altMobile") or "",
        "gender": person.get("gender") or "",
        "age": person.get("ageGroup") or "adult",
        "meditation": person.get("meditation") or "",
        "birthDate": person.get("birthDate") or "",
        "birthMonth": person.get("birthMonth") or "",
        "language": person.get("language") or "",
        "pyramidCenter": person.get("pyramidCenter") or "",
        "sinceYear": person.get("sinceYear") or "",
        "idType": person.get("idType") or "",
        "livePhoto": person.get("livePhoto") or "",
        "idProofPhoto": person.get("idProofPhoto") or "",
        "place": person.get("place") or {},
        "members": [],
        "roles": [],
        "stayStartDate": guests[0]["stayStartDate"],
        "stayEndDate": guests[0]["stayEndDate"],
    }
    for guest, member in zip(guests[1:], members):
        # Only MemberDto fields — avoid sortOrder / ageGroup leaking into familyDetail
        family["members"].append(
            {
                "name": member.get("name") or guest.get("name") or "",
                "relation": member.get("relation") or guest.get("relation") or "",
                "mobile": member.get("mobile") or guest.get("mobile") or "",
                "gender": member.get("gender") or guest.get("gender") or "",
                "age": member.get("ageGroup") or member.get("age") or guest.get("age") or "adult",
                "meditation": member.get("meditation") or "",
                "addrMode": member.get("addrMode") or "same",
                "idType": member.get("idType") or "",
                "livePhoto": member.get("livePhoto") or "",
                "idProofPhoto": member.get("idProofPhoto") or "",
                "place": member.get("place") or {},
                "stayStartDate": guest["stayStartDate"],
                "stayEndDate": guest["stayEndDate"],
            }
        )
    return {
        "_id": booking_id,
        "eventId": event_id,
        "eventName": event_name,
        "plan": plan,
        "status": "registered",
        "createdByMobile": created_by,
        "familyMobile": person["mobile"],
        "familyFullName": person["fullName"],
        "registeredFamily": False,
        "place": person.get("place") or {},
        "guests": guests,
        "familyDetail": family,
        "createdAt": booked_at,
    }


def sample_bookings() -> list[dict]:
    """Varied families: alone, couple, family with child, rural, paid/free, staggered dates."""
    people_by_mobile = {item["person"]["mobile"]: item for item in sample_people()}
    events_by_id = {e["_id"]: e for e in sample_events()}
    now = utc_now()
    rows = []

    # 1) Meena alone — free — full Anandotsavam
    meena = people_by_mobile["9876511111"]
    evt = events_by_id[EVT_ANANDOTSAVAM]
    start, end = evt["startDate"].date(), evt["endDate"].date()
    rows.append(
        _booking(
            booking_id="stay_sample_meena_alone",
            event_id=EVT_ANANDOTSAVAM,
            event_name=evt["name"],
            plan="free",
            person=meena["person"],
            members=[],
            guests=[
                _guest(
                    name="Meena Shah",
                    mobile="9876511111",
                    gender="female",
                    age="adult",
                    start=start,
                    end=end,
                    primary=True,
                )
            ],
            created_by="9876511111",
            booked_at=now,
        )
    )

    # 2) Anita alone — paid — shorter stay
    anita = people_by_mobile["9876533333"]
    rows.append(
        _booking(
            booking_id="stay_sample_anita_paid",
            event_id=EVT_ANANDOTSAVAM,
            event_name=evt["name"],
            plan="paid",
            person=anita["person"],
            members=[],
            guests=[
                _guest(
                    name="Anita Reddy",
                    mobile="9876533333",
                    gender="female",
                    age="adult",
                    start=date(2026, 10, 29),
                    end=date(2026, 10, 30),
                    primary=True,
                )
            ],
            created_by="9876511111",
            booked_at=now,
        )
    )

    # 3) Lakshmi + spouse — free — Dussehra
    lakshmi = people_by_mobile["9876501234"]
    dus = events_by_id[EVT_DUSSEHRA]
    d_start, d_end = dus["startDate"].date(), dus["endDate"].date()
    rows.append(
        _booking(
            booking_id="stay_sample_lakshmi_couple",
            event_id=EVT_DUSSEHRA,
            event_name=dus["name"],
            plan="free",
            person=lakshmi["person"],
            members=lakshmi["members"],
            guests=[
                _guest(
                    name="Lakshmi Devi",
                    mobile="9876501234",
                    gender="female",
                    age="adult",
                    start=d_start,
                    end=d_end,
                    primary=True,
                ),
                _guest(
                    name="Venkat Rao",
                    mobile="9876501235",
                    gender="male",
                    age="adult",
                    start=d_start,
                    end=d_end,
                    relation="Spouse",
                ),
            ],
            created_by="9876511111",
            booked_at=now,
        )
    )

    # 4) Ramakrishna family (spouse + child) — free — Dhyana, staggered child dates
    rama = people_by_mobile["9876543210"]
    dhy = events_by_id[EVT_DHYANA]
    y_start, y_end = dhy["startDate"].date(), dhy["endDate"].date()
    rows.append(
        _booking(
            booking_id="stay_sample_rama_family",
            event_id=EVT_DHYANA,
            event_name=dhy["name"],
            plan="free",
            person=rama["person"],
            members=rama["members"],
            guests=[
                _guest(
                    name="Ramakrishna",
                    mobile="9876543210",
                    gender="male",
                    age="adult",
                    start=y_start,
                    end=y_end,
                    primary=True,
                ),
                _guest(
                    name="Sita Devi",
                    mobile="9876543212",
                    gender="female",
                    age="adult",
                    start=y_start,
                    end=y_end,
                    relation="Spouse",
                ),
                _guest(
                    name="Ananya",
                    mobile="",
                    gender="female",
                    age="child",
                    start=date(2026, 12, 24),
                    end=date(2026, 12, 28),
                    relation="Child",
                ),
            ],
            created_by="9876543210",
            booked_at=now,
        )
    )

    # 5) Ravi rural seniors + adult child — free — Anandotsavam
    ravi = people_by_mobile["9876522222"]
    rows.append(
        _booking(
            booking_id="stay_sample_ravi_rural_family",
            event_id=EVT_ANANDOTSAVAM,
            event_name=evt["name"],
            plan="free",
            person=ravi["person"],
            members=ravi["members"],
            guests=[
                _guest(
                    name="Ravi Kumar",
                    mobile="9876522222",
                    gender="male",
                    age="senior",
                    start=start,
                    end=end,
                    primary=True,
                ),
                _guest(
                    name="Padma",
                    mobile="9876522223",
                    gender="female",
                    age="senior",
                    start=start,
                    end=end,
                    relation="Spouse",
                ),
                _guest(
                    name="Karthik",
                    mobile="9876522224",
                    gender="male",
                    age="adult",
                    start=date(2026, 10, 28),
                    end=date(2026, 10, 29),
                    relation="Child",
                ),
            ],
            created_by="9876511111",
            booked_at=now,
        )
    )

    # 6) Suresh + spouse rural — paid — Dussehra
    suresh = people_by_mobile["9876544444"]
    rows.append(
        _booking(
            booking_id="stay_sample_suresh_couple_paid",
            event_id=EVT_DUSSEHRA,
            event_name=dus["name"],
            plan="paid",
            person=suresh["person"],
            members=suresh["members"],
            guests=[
                _guest(
                    name="Suresh Naidu",
                    mobile="9876544444",
                    gender="male",
                    age="adult",
                    start=d_start,
                    end=date(2026, 10, 19),
                    primary=True,
                ),
                _guest(
                    name="Jyothi",
                    mobile="9876544445",
                    gender="female",
                    age="adult",
                    start=d_start,
                    end=date(2026, 10, 19),
                    relation="Spouse",
                ),
            ],
            created_by="9876511111",
            booked_at=now,
        )
    )

    return rows


def seed_bookings(db) -> None:
    if db["events"].count_documents({}) == 0:
        print("No events found — seeding events first.")
        seed_events(db)
    if db["people"].count_documents({}) == 0:
        print("No people found — seeding people first.")
        seed_people(db)

    for row in sample_bookings():
        db["stay_bookings"].replace_one({"_id": row["_id"]}, row, upsert=True)
        family = max(0, len(row["guests"]) - 1)
        place = (row.get("place") or {}).get("kind", "?")
        print(
            f"  {row['_id']}: {row['familyFullName']}  "
            f"{row['plan']}  family=+{family}  {place}  -> {row['eventName']}"
        )
    print(f"Stay interest seeded: {len(sample_bookings())}")


def parse_args():
    p = argparse.ArgumentParser(
        description="Clear and/or seed sample people, events, and stay interest"
    )
    p.add_argument(
        "--uri",
        default="mongodb://localhost:27017/?replicaSet=rs0",
        help="MongoDB connection URI",
    )
    p.add_argument("--database", default="pssm_sangha")
    p.add_argument(
        "--clear",
        action="store_true",
        help="Delete people, events, and stay_bookings (keeps places & centers)",
    )
    p.add_argument("--people", action="store_true", help="Seed sangha registry + roles")
    p.add_argument("--events", action="store_true", help="Seed sample events")
    p.add_argument(
        "--bookings",
        action="store_true",
        help="Seed stay interest (alone / couple / family, rural / urban, free / paid)",
    )
    p.add_argument(
        "--all",
        action="store_true",
        help="Seed people + events + bookings (combine with --clear to reset first)",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    if not (args.clear or args.people or args.events or args.bookings or args.all):
        print(
            "Nothing to do. Examples:\n"
            "  python scripts/seed_sangha_samples.py --clear --all\n"
            "  python scripts/seed_sangha_samples.py --people --events\n"
            "  python scripts/seed_sangha_samples.py --bookings",
            file=sys.stderr,
        )
        return 2

    do_people = args.people or args.all
    do_events = args.events or args.all
    do_bookings = args.bookings or args.all

    try:
        client = connect(args.uri)
        client.admin.command("ping")
        db = client[args.database]

        if args.clear:
            clear_sample_data(db)

        if do_people:
            seed_people(db)
        if do_events:
            seed_events(db)
        if do_bookings:
            seed_bookings(db)

    except PyMongoError as exc:
        print(f"MongoDB error: {exc}", file=sys.stderr)
        print("Is Mongo running? Try: docker compose up -d mongo", file=sys.stderr)
        return 1
    except OperationFailure as exc:
        print(f"MongoDB operation failed: {exc}", file=sys.stderr)
        return 1

    print(
        """
Handy logins:
  9000000001 / PssmA0101     PSSM Admin
  9876543210 / Ramak1508     Event Organizer
  9876511111 / Meena1005     Accommodation Volunteer
  9876501234 / Laksh2203     Pyramid Sevadal

Pick an event in the header, then Stay -> Stay interest
"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
