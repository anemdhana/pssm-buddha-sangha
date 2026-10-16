#!/usr/bin/env python3
"""
Load / clear demo data for development (people, events, stay interest, hotels).

Does not touch places or pyramid_centers master lists — run setup_sangha_db.py for those.

Usage:
  python scripts/seed_sangha_samples.py --clear --all
  python scripts/seed_sangha_samples.py --people
  python scripts/seed_sangha_samples.py --events --bookings
  python scripts/seed_sangha_samples.py --hotels
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

# Mobiles are real centre contact numbers from centres.pssmovement.org (our CSV list).
# Stable portrait indices from randomuser.me (men/women 0–99)
PHOTO_BY_KEY: dict[str, tuple[str, int]] = {
    "7093405071": ("male", 12),  # Srinivasa Rao — PSSM Admin
    "9246470416": ("male", 32),  # Chaitanya Krishna — Event Organizer
    "7396354698": ("female", 44),  # Sita Devi
    "ananya": ("female", 68),
    "9845055103": ("female", 21),  # Sowjanya Lakshmi — Pyramid Sevadal
    "9379060510": ("male", 45),  # Venkat Rao
    "9966362691": ("female", 33),  # Meenakshi Devi — Accommodation Volunteer
    "9959129737": ("male", 75),  # Veeraiah
    "7382463452": ("female", 65),  # Padma
    "9542495504": ("male", 22),  # Karthik
    "9395324465": ("female", 47),  # Anitha Reddy
    "9985762845": ("male", 55),  # Ranga Naidu
    "9246183996": ("female", 28),  # Jyothi
    "9032123366": ("female", 51),  # Vasavi Kumari
    "8667684104": ("female", 19),  # Uma Maheshwari — PMMA
    "7780254680": ("male", 41),  # Subhash Reddy — Accommodation Admin
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


def _hotel_image_data_url(name: str) -> str:
    letters = "".join(ch for ch in (name or "H") if ch.isalpha())[:2].upper() or "H"
    safe = html.escape(letters)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120">'
        f'<rect width="160" height="120" fill="#e8eef5"/>'
        f'<rect x="12" y="18" width="136" height="72" rx="6" fill="#c5d4e4"/>'
        f'<text x="80" y="62" text-anchor="middle" font-family="Arial,sans-serif" '
        f'font-size="28" font-weight="700" fill="#4a5d73">{safe}</text>'
        f'<rect x="0" y="96" width="160" height="24" fill="#d7e2ee"/></svg>'
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
    for name in ("stay_allotments", "stay_bookings", "hotels", "events", "people"):
        result = db[name].delete_many({})
        print(f"Cleared {name}: {result.deleted_count} document(s)")


def sample_people() -> list[dict]:
    """Demo sangha people: centre contact mobiles + roles covering every assignable path."""
    return attach_sample_photos(
        [
            {
                "person": {
                    "mobile": "7093405071",
                    "fullName": "Srinivasa Rao",
                    "email": "srinivasa@pssm.example",
                    "altMobile": "7396429337",
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
                },
                "roles": ["pssm_admin"],
                "members": [],
            },
            {
                "person": {
                    "mobile": "9246470416",
                    "fullName": "Chaitanya Krishna",
                    "email": "chaitanya@pssm.example",
                    "altMobile": "8074831439",
                    "gender": "male",
                    "ageGroup": "adult",
                    "meditation": "5",
                    "profession": "Teacher",
                    "birthDate": "15",
                    "birthMonth": "08",
                    "language": "Telugu",
                    "pyramidCenter": "Himalaya Pyramid Meditation Centre",
                    "sinceYear": "2016",
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
                        "name": "Sita Devi",
                        "relation": "Spouse",
                        "mobile": "7396354698",
                        "gender": "female",
                        "ageGroup": "adult",
                        "meditation": "4",
                        "profession": "Homemaker",
                        "addrMode": "same",
                        "idType": "aadhaar",
                    },
                    {
                        "name": "Ananya",
                        "relation": "Child",
                        "mobile": "",
                        "gender": "female",
                        "ageGroup": "child",
                        "meditation": "new",
                        "profession": "Student",
                        "addrMode": "same",
                        "idType": "",
                    },
                ],
            },
            {
                "person": {
                    "mobile": "9966362691",
                    "fullName": "Meenakshi Devi",
                    "email": "meenakshi@pssm.example",
                    "altMobile": "9010557629",
                    "gender": "female",
                    "ageGroup": "adult",
                    "meditation": "3",
                    "profession": "Accountant",
                    "birthDate": "10",
                    "birthMonth": "05",
                    "language": "Telugu",
                    "pyramidCenter": "Atma Ganga Pyramid Dhyana Kendram",
                    "sinceYear": "2019",
                    "idType": "aadhaar",
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
                    "mobile": "9845055103",
                    "fullName": "Sowjanya Lakshmi",
                    "email": "sowjanya@pssm.example",
                    "altMobile": "",
                    "gender": "female",
                    "ageGroup": "adult",
                    "meditation": "4",
                    "profession": "Nurse",
                    "birthDate": "22",
                    "birthMonth": "03",
                    "language": "Kannada",
                    "pyramidCenter": "Jayanagar Pyramid Care Centre",
                    "sinceYear": "2020",
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
                        "name": "Venkat Rao",
                        "relation": "Spouse",
                        "mobile": "9379060510",
                        "gender": "male",
                        "ageGroup": "adult",
                        "meditation": "2",
                        "profession": "Engineer",
                        "addrMode": "same",
                        "idType": "pan",
                    }
                ],
            },
            {
                "person": {
                    "mobile": "7780254680",
                    "fullName": "Subhash Reddy",
                    "email": "subhash@pssm.example",
                    "altMobile": "",
                    "gender": "male",
                    "ageGroup": "adult",
                    "meditation": "5",
                    "profession": "Volunteer coordinator",
                    "birthDate": "14",
                    "birthMonth": "02",
                    "language": "Telugu",
                    "pyramidCenter": "Brahmarshi Patriji Pyramid Care Centre",
                    "sinceYear": "2015",
                    "idType": "aadhaar",
                    "place": {
                        "kind": "urban",
                        "city": "Guntur",
                        "state": "Andhra Pradesh",
                        "country": "India",
                    },
                },
                "roles": ["accommodation_admin"],
                "members": [],
            },
            {
                "person": {
                    "mobile": "8667684104",
                    "fullName": "Uma Maheshwari",
                    "email": "uma@pssm.example",
                    "altMobile": "",
                    "gender": "female",
                    "ageGroup": "adult",
                    "meditation": "6",
                    "profession": "Counsellor",
                    "birthDate": "08",
                    "birthMonth": "06",
                    "language": "Tamil",
                    "pyramidCenter": "Uma Maheshwari Pyramid Care Centre",
                    "sinceYear": "2014",
                    "idType": "aadhaar",
                    "place": {
                        "kind": "urban",
                        "city": "Chennai",
                        "state": "Tamil Nadu",
                        "country": "India",
                    },
                },
                "roles": ["pmma_member"],
                "members": [],
            },
            {
                "person": {
                    "mobile": "9395324465",
                    "fullName": "Anitha Reddy",
                    "email": "anitha@pssm.example",
                    "altMobile": "",
                    "gender": "female",
                    "ageGroup": "adult",
                    "meditation": "4",
                    "profession": "Doctor",
                    "birthDate": "18",
                    "birthMonth": "07",
                    "language": "Telugu",
                    "pyramidCenter": "Maha Shakthi Pyramid",
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
                    "mobile": "9032123366",
                    "fullName": "Vasavi Kumari",
                    "email": "vasavi@pssm.example",
                    "altMobile": "",
                    "gender": "female",
                    "ageGroup": "adult",
                    "meditation": "3",
                    "profession": "Shopkeeper",
                    "birthDate": "12",
                    "birthMonth": "04",
                    "language": "Telugu",
                    "pyramidCenter": "Sri Vasavi Pyramid Meditation Centre",
                    "sinceYear": "2021",
                    "idType": "voter",
                    "place": {
                        "kind": "urban",
                        "city": "Vijayawada",
                        "state": "Andhra Pradesh",
                        "country": "India",
                    },
                },
                "roles": [],
                "members": [],
            },
            {
                "person": {
                    "mobile": "9959129737",
                    "fullName": "Veeraiah",
                    "email": "veeraiah@pssm.example",
                    "altMobile": "",
                    "gender": "male",
                    "ageGroup": "senior",
                    "meditation": "6",
                    "profession": "Farmer",
                    "birthDate": "05",
                    "birthMonth": "11",
                    "language": "Telugu",
                    "pyramidCenter": "Alivelu Manga Dhyana Kendram",
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
                        "name": "Padma",
                        "relation": "Spouse",
                        "mobile": "7382463452",
                        "gender": "female",
                        "ageGroup": "senior",
                        "meditation": "5",
                        "profession": "Homemaker",
                        "addrMode": "same",
                        "idType": "aadhaar",
                    },
                    {
                        "name": "Karthik",
                        "relation": "Child",
                        "mobile": "9542495504",
                        "gender": "male",
                        "ageGroup": "adult",
                        "meditation": "1",
                        "profession": "Software engineer",
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
                    "mobile": "9985762845",
                    "fullName": "Ranga Naidu",
                    "email": "ranga@pssm.example",
                    "altMobile": "",
                    "gender": "male",
                    "ageGroup": "adult",
                    "meditation": "new",
                    "profession": "Farmer",
                    "birthDate": "03",
                    "birthMonth": "09",
                    "language": "Telugu",
                    "pyramidCenter": "Bala Tripura Sundari Pyramid Meditation Centre",
                    "sinceYear": "2024",
                    "idType": "voter",
                    "place": {
                        "kind": "rural",
                        "village": "Pamarru",
                        "town": "Pamarru",
                        "district": "Ananthapur",
                        "state": "Andhra Pradesh",
                        "country": "India",
                    },
                },
                "roles": [],
                "members": [
                    {
                        "name": "Jyothi",
                        "relation": "Spouse",
                        "mobile": "9246183996",
                        "gender": "female",
                        "ageGroup": "adult",
                        "meditation": "new",
                        "profession": "Teacher",
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
            "location": "Santh Kabir Das Pyramid Centre, Hyderabad",
            "expectedBudgetInr": 500000,
            "meditationHoursPerDay": 3.0,
            "createdBy": "9246470416",
            "createdAt": now,
        },
        {
            "_id": EVT_DUSSEHRA,
            "name": "Dussehra Sangeetha Dhyana Maha Yagnam",
            "startDate": datetime(2026, 10, 17, tzinfo=timezone.utc),
            "endDate": datetime(2026, 10, 20, tzinfo=timezone.utc),
            "location": "Himalaya Pyramid Meditation Centre, Vijayawada",
            "expectedBudgetInr": 250000,
            "meditationHoursPerDay": 2.5,
            "createdBy": "9246470416",
            "createdAt": now,
        },
        {
            "_id": EVT_ANANDOTSAVAM,
            "name": "Dhyana Dussera Anandotsavam - 2026",
            "startDate": datetime(2026, 10, 28, tzinfo=timezone.utc),
            "endDate": datetime(2026, 10, 31, tzinfo=timezone.utc),
            "location": "Santh Kabir Das Pyramid Centre, Hyderabad",
            "expectedBudgetInr": 1000000,
            "meditationHoursPerDay": 6.0,
            "createdBy": "9246470416",
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
        "profession": person.get("profession") or "",
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
                "profession": member.get("profession") or "",
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
    vol = "9966362691"  # Meenakshi — accommodation volunteer books many of these

    # 1) Meenakshi alone — free — full Anandotsavam
    meena = people_by_mobile["9966362691"]
    evt = events_by_id[EVT_ANANDOTSAVAM]
    start, end = evt["startDate"].date(), evt["endDate"].date()
    rows.append(
        _booking(
            booking_id="stay_sample_meenakshi_alone",
            event_id=EVT_ANANDOTSAVAM,
            event_name=evt["name"],
            plan="free",
            person=meena["person"],
            members=[],
            guests=[
                _guest(
                    name="Meenakshi Devi",
                    mobile="9966362691",
                    gender="female",
                    age="adult",
                    start=start,
                    end=end,
                    primary=True,
                )
            ],
            created_by=vol,
            booked_at=now,
        )
    )

    # 2) Anitha alone — paid — shorter stay
    anitha = people_by_mobile["9395324465"]
    rows.append(
        _booking(
            booking_id="stay_sample_anitha_paid",
            event_id=EVT_ANANDOTSAVAM,
            event_name=evt["name"],
            plan="paid",
            person=anitha["person"],
            members=[],
            guests=[
                _guest(
                    name="Anitha Reddy",
                    mobile="9395324465",
                    gender="female",
                    age="adult",
                    start=date(2026, 10, 29),
                    end=date(2026, 10, 30),
                    primary=True,
                )
            ],
            created_by=vol,
            booked_at=now,
        )
    )

    # 3) Sowjanya + spouse — free — Dussehra
    sowjanya = people_by_mobile["9845055103"]
    dus = events_by_id[EVT_DUSSEHRA]
    d_start, d_end = dus["startDate"].date(), dus["endDate"].date()
    rows.append(
        _booking(
            booking_id="stay_sample_sowjanya_couple",
            event_id=EVT_DUSSEHRA,
            event_name=dus["name"],
            plan="free",
            person=sowjanya["person"],
            members=sowjanya["members"],
            guests=[
                _guest(
                    name="Sowjanya Lakshmi",
                    mobile="9845055103",
                    gender="female",
                    age="adult",
                    start=d_start,
                    end=d_end,
                    primary=True,
                ),
                _guest(
                    name="Venkat Rao",
                    mobile="9379060510",
                    gender="male",
                    age="adult",
                    start=d_start,
                    end=d_end,
                    relation="Spouse",
                ),
            ],
            created_by=vol,
            booked_at=now,
        )
    )

    # 4) Chaitanya family (spouse + child) — free — Dhyana, staggered child dates
    chaitanya = people_by_mobile["9246470416"]
    dhy = events_by_id[EVT_DHYANA]
    y_start, y_end = dhy["startDate"].date(), dhy["endDate"].date()
    rows.append(
        _booking(
            booking_id="stay_sample_chaitanya_family",
            event_id=EVT_DHYANA,
            event_name=dhy["name"],
            plan="free",
            person=chaitanya["person"],
            members=chaitanya["members"],
            guests=[
                _guest(
                    name="Chaitanya Krishna",
                    mobile="9246470416",
                    gender="male",
                    age="adult",
                    start=y_start,
                    end=y_end,
                    primary=True,
                ),
                _guest(
                    name="Sita Devi",
                    mobile="7396354698",
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
            created_by="9246470416",
            booked_at=now,
        )
    )

    # 5) Veeraiah rural seniors + adult child — free — Anandotsavam
    veeraiah = people_by_mobile["9959129737"]
    rows.append(
        _booking(
            booking_id="stay_sample_veeraiah_rural_family",
            event_id=EVT_ANANDOTSAVAM,
            event_name=evt["name"],
            plan="free",
            person=veeraiah["person"],
            members=veeraiah["members"],
            guests=[
                _guest(
                    name="Veeraiah",
                    mobile="9959129737",
                    gender="male",
                    age="senior",
                    start=start,
                    end=end,
                    primary=True,
                ),
                _guest(
                    name="Padma",
                    mobile="7382463452",
                    gender="female",
                    age="senior",
                    start=start,
                    end=end,
                    relation="Spouse",
                ),
                _guest(
                    name="Karthik",
                    mobile="9542495504",
                    gender="male",
                    age="adult",
                    start=date(2026, 10, 28),
                    end=date(2026, 10, 29),
                    relation="Child",
                ),
            ],
            created_by=vol,
            booked_at=now,
        )
    )

    # 6) Ranga + spouse rural — paid — Dussehra
    ranga = people_by_mobile["9985762845"]
    rows.append(
        _booking(
            booking_id="stay_sample_ranga_couple_paid",
            event_id=EVT_DUSSEHRA,
            event_name=dus["name"],
            plan="paid",
            person=ranga["person"],
            members=ranga["members"],
            guests=[
                _guest(
                    name="Ranga Naidu",
                    mobile="9985762845",
                    gender="male",
                    age="adult",
                    start=d_start,
                    end=date(2026, 10, 19),
                    primary=True,
                ),
                _guest(
                    name="Jyothi",
                    mobile="9246183996",
                    gender="female",
                    age="adult",
                    start=d_start,
                    end=date(2026, 10, 19),
                    relation="Spouse",
                ),
            ],
            created_by=vol,
            booked_at=now,
        )
    )

    # 7) Vasavi alone — free — Anandotsavam mid-stay
    vasavi = people_by_mobile["9032123366"]
    rows.append(
        _booking(
            booking_id="stay_sample_vasavi_alone",
            event_id=EVT_ANANDOTSAVAM,
            event_name=evt["name"],
            plan="free",
            person=vasavi["person"],
            members=[],
            guests=[
                _guest(
                    name="Vasavi Kumari",
                    mobile="9032123366",
                    gender="female",
                    age="adult",
                    start=date(2026, 10, 28),
                    end=date(2026, 10, 30),
                    primary=True,
                )
            ],
            created_by="7780254680",
            booked_at=now,
        )
    )

    # 8) Uma alone — paid — Dussehra
    uma = people_by_mobile["8667684104"]
    rows.append(
        _booking(
            booking_id="stay_sample_uma_paid",
            event_id=EVT_DUSSEHRA,
            event_name=dus["name"],
            plan="paid",
            person=uma["person"],
            members=[],
            guests=[
                _guest(
                    name="Uma Maheshwari",
                    mobile="8667684104",
                    gender="female",
                    age="adult",
                    start=d_start,
                    end=d_end,
                    primary=True,
                )
            ],
            created_by=vol,
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


def _room(
    room_number: str,
    *,
    capacity: int,
    kind: str = "regular",
    room_type: str = "ac",
    gender_allowed: str = "",
    status: str = "available",
) -> dict:
    return {
        "roomNumber": room_number,
        "capacity": capacity,
        "kind": kind,
        "roomType": room_type,
        "genderAllowed": gender_allowed,
        "status": status,
    }


def sample_hotels() -> list[dict]:
    """
    Partner hotels around Nampally Exhibition Grounds, Hyderabad.
    Distances and mix cover every Hotels & rooms left filter:
    Active/Inactive, Open/Reserved, AC/Non-AC, Regular/Dormitory/Hall,
    Under 1 km / 1–3 km / Over 3 km.
    """
    now = utc_now()
    admin = "7780254680"  # Subhash — Accommodation Admin

    def hotel(
        hotel_id: str,
        name: str,
        address: str,
        contact: str,
        distance_km: float,
        rooms: list,
        *,
        active: bool = True,
        reserved: bool = False,
        event_id: str = EVT_ANANDOTSAVAM,
    ) -> dict:
        return {
            "_id": hotel_id,
            "eventId": event_id,
            "name": name,
            "address": address,
            "contact": contact,
            "image": _hotel_image_data_url(name),
            "distanceKm": distance_km,
            "active": active,
            "reserved": reserved,
            "rooms": rooms,
            "createdBy": admin,
            "createdAt": now,
            "updatedAt": now,
        }

    return [
        hotel(
            "htl_sample_sai_prakash",
            "Hotel Sai Prakash",
            "Public Garden Road, near Nampally Exhibition Grounds, Hyderabad",
            "040-23203131",
            0.4,
            [
                _room("231", capacity=4, kind="regular", room_type="ac"),
                _room("232", capacity=4, kind="regular", room_type="ac"),
                _room("233", capacity=4, kind="regular", room_type="non_ac"),
                _room("234", capacity=4, kind="regular", room_type="non_ac"),
                _room("235", capacity=4, kind="regular", room_type="ac"),
                _room("236", capacity=4, kind="regular", room_type="ac"),
            ],
        ),
        hotel(
            "htl_sample_three_castle",
            "Three Castle Executive",
            "Nampally Station Road, beside Exhibition Grounds, Hyderabad",
            "040-24605678",
            0.6,
            [
                _room("101", capacity=3, kind="regular", room_type="ac"),
                _room("102", capacity=3, kind="regular", room_type="ac"),
                _room("103", capacity=3, kind="regular", room_type="non_ac"),
                _room("104", capacity=3, kind="regular", room_type="non_ac"),
                _room("105", capacity=3, kind="regular", room_type="ac"),
                _room("106", capacity=3, kind="regular", room_type="ac"),
            ],
            reserved=True,
        ),
        hotel(
            "htl_sample_abids_inn",
            "Abids Comfort Inn",
            "Troop Bazaar, Abids, Hyderabad (towards Exhibition Grounds)",
            "040-23204567",
            1.4,
            [
                _room("201", capacity=3, kind="regular", room_type="ac"),
                _room("202", capacity=3, kind="regular", room_type="ac"),
                _room("203", capacity=2, kind="regular", room_type="non_ac"),
                _room(
                    "D-G1",
                    capacity=24,
                    kind="dormitory",
                    room_type="ac",
                    gender_allowed="gents",
                ),
                _room(
                    "D-L1",
                    capacity=20,
                    kind="dormitory",
                    room_type="non_ac",
                    gender_allowed="ladies",
                ),
            ],
            event_id=EVT_DUSSEHRA,
        ),
        hotel(
            "htl_sample_basheerbagh_lodge",
            "Basheerbagh Stay Lodge",
            "Near Assembly, Basheerbagh Road, Hyderabad",
            "040-23207890",
            2.2,
            [
                _room("11", capacity=2, kind="regular", room_type="non_ac"),
                _room("12", capacity=2, kind="regular", room_type="non_ac"),
                _room("13", capacity=3, kind="regular", room_type="ac"),
                _room(
                    "HALL-A",
                    capacity=40,
                    kind="hall",
                    room_type="non_ac",
                    gender_allowed="gents",
                ),
            ],
            active=False,
        ),
        hotel(
            "htl_sample_lakdikapul_residency",
            "Lakdi-ka-pul Residency",
            "Opposite Railway Bridge, Lakdi-ka-pul, Hyderabad",
            "040-23311234",
            2.8,
            [
                _room("501", capacity=4, kind="regular", room_type="ac"),
                _room("502", capacity=4, kind="regular", room_type="ac"),
                _room("503", capacity=3, kind="regular", room_type="non_ac"),
                _room(
                    "HALL-L",
                    capacity=35,
                    kind="hall",
                    room_type="ac",
                    gender_allowed="ladies",
                ),
                _room(
                    "D-G2",
                    capacity=16,
                    kind="dormitory",
                    room_type="ac",
                    gender_allowed="gents",
                ),
            ],
        ),
        hotel(
            "htl_sample_banjara_park",
            "Banjara Park Hotel",
            "Road No. 1, Banjara Hills, Hyderabad",
            "040-23356677",
            4.5,
            [
                _room("701", capacity=2, kind="regular", room_type="ac"),
                _room("702", capacity=2, kind="regular", room_type="ac"),
                _room("703", capacity=3, kind="regular", room_type="ac"),
                _room("704", capacity=3, kind="regular", room_type="non_ac"),
            ],
            reserved=True,
            event_id=EVT_DUSSEHRA,
        ),
        hotel(
            "htl_sample_mehdipatnam_yatra",
            "Mehdipatnam Yatra Nest",
            "Near Sarojini Devi Eye Hospital, Mehdipatnam, Hyderabad",
            "040-23534567",
            5.2,
            [
                _room("A1", capacity=4, kind="regular", room_type="non_ac"),
                _room("A2", capacity=4, kind="regular", room_type="non_ac"),
                _room("A3", capacity=3, kind="regular", room_type="ac"),
                _room(
                    "D-L2",
                    capacity=28,
                    kind="dormitory",
                    room_type="non_ac",
                    gender_allowed="ladies",
                ),
                _room(
                    "HALL-B",
                    capacity=50,
                    kind="hall",
                    room_type="non_ac",
                    gender_allowed="gents",
                ),
            ],
            event_id=EVT_DUSSEHRA,
        ),
        hotel(
            "htl_sample_koti_guest",
            "Koti Guest House (Inactive demo)",
            "Sultan Bazar, Koti, Hyderabad",
            "040-24751212",
            1.8,
            [
                _room("1", capacity=2, kind="regular", room_type="ac"),
                _room("2", capacity=2, kind="regular", room_type="non_ac"),
            ],
            active=False,
            reserved=True,
            event_id=EVT_DUSSEHRA,
        ),
    ]


def seed_hotels(db) -> None:
    rows = sample_hotels()
    # Drop older API-created demos so the list stays the curated Nampally set.
    db["hotels"].delete_many({"_id": {"$regex": "^htl_"}})
    for row in rows:
        db["hotels"].replace_one({"_id": row["_id"]}, row, upsert=True)
        rooms = row.get("rooms") or []
        kinds = sorted({(r.get("kind") or "regular") for r in rooms})
        types = sorted({(r.get("roomType") or "ac") for r in rooms})
        flags = []
        if not row.get("active", True):
            flags.append("inactive")
        if row.get("reserved"):
            flags.append("reserved")
        flag_txt = f"  [{', '.join(flags)}]" if flags else ""
        print(
            f"  {row['_id']}: {row['name']}  {row['distanceKm']} km  "
            f"rooms={len(rooms)}  kinds={','.join(kinds)}  types={','.join(types)}"
            f"{flag_txt}"
        )
    print(f"Hotels seeded: {len(rows)} (near Nampally Exhibition Grounds, Hyderabad)")


def _allotment_guest(guest: dict, person: dict | None = None) -> dict:
    photo = ""
    if person:
        photo = person.get("livePhoto") or ""
    return {
        "name": guest.get("name") or "",
        "relation": guest.get("relation") or "",
        "mobile": guest.get("mobile") or "",
        "gender": guest.get("gender") or "",
        "age": guest.get("age") or "",
        "livePhoto": photo,
        "primary": bool(guest.get("primary")),
    }


def _allotment(
    *,
    allotment_id: str,
    booking: dict,
    hotel_id: str,
    hotel_name: str,
    room_number: str,
    room_type: str,
    room_kind: str,
    status: str,
    people_by_mobile: dict,
) -> dict:
    guests = []
    for guest in booking.get("guests") or []:
        mobile = str(guest.get("mobile") or "").strip()
        person = people_by_mobile.get(mobile, {}).get("person") if mobile else None
        # Primary guest photo from booking family person
        if guest.get("primary") and not person:
            person = people_by_mobile.get(booking.get("familyMobile"), {}).get("person")
        row = _allotment_guest(guest, person)
        if guest.get("primary") and not row["livePhoto"]:
            fam = booking.get("familyDetail") or {}
            row["livePhoto"] = fam.get("livePhoto") or ""
        guests.append(row)

    primary = next((g for g in booking.get("guests") or [] if g.get("primary")), None)
    check_in = (primary or {}).get("stayStartDate") or ""
    check_out = (primary or {}).get("stayEndDate") or ""

    return {
        "_id": allotment_id,
        "eventId": booking["eventId"],
        "eventName": booking["eventName"],
        "bookingId": booking["_id"],
        "plan": booking.get("plan") or "free",
        "status": status,
        "hotelId": hotel_id,
        "hotelName": hotel_name,
        "roomNumber": room_number,
        "roomType": room_type,
        "roomKind": room_kind,
        "familyMobile": booking.get("familyMobile") or "",
        "familyFullName": booking.get("familyFullName") or "",
        "place": booking.get("place") or {},
        "guests": guests,
        "checkInDate": check_in,
        "checkOutDate": check_out,
        "createdAt": utc_now(),
    }


def sample_allotments() -> list[dict]:
    """Assign seeded stay interest parties to Nampally hotels/rooms."""
    people_by_mobile = {item["person"]["mobile"]: item for item in sample_people()}
    bookings = {b["_id"]: b for b in sample_bookings()}

    assignments = [
        # Anandotsavam
        (
            "allot_sample_meenakshi",
            "stay_sample_meenakshi_alone",
            "htl_sample_sai_prakash",
            "Hotel Sai Prakash",
            "231",
            "ac",
            "regular",
            "checked_in",
        ),
        (
            "allot_sample_anitha",
            "stay_sample_anitha_paid",
            "htl_sample_sai_prakash",
            "Hotel Sai Prakash",
            "232",
            "ac",
            "regular",
            "allotted",
        ),
        (
            "allot_sample_veeraiah",
            "stay_sample_veeraiah_rural_family",
            "htl_sample_lakdikapul_residency",
            "Lakdi-ka-pul Residency",
            "501",
            "ac",
            "regular",
            "allotted",
        ),
        (
            "allot_sample_vasavi",
            "stay_sample_vasavi_alone",
            "htl_sample_three_castle",
            "Three Castle Executive",
            "101",
            "ac",
            "regular",
            "allotted",
        ),
        # Dussehra
        (
            "allot_sample_sowjanya",
            "stay_sample_sowjanya_couple",
            "htl_sample_abids_inn",
            "Abids Comfort Inn",
            "201",
            "ac",
            "regular",
            "checked_in",
        ),
        (
            "allot_sample_ranga",
            "stay_sample_ranga_couple_paid",
            "htl_sample_mehdipatnam_yatra",
            "Mehdipatnam Yatra Nest",
            "A1",
            "non_ac",
            "regular",
            "allotted",
        ),
        (
            "allot_sample_uma",
            "stay_sample_uma_paid",
            "htl_sample_abids_inn",
            "Abids Comfort Inn",
            "D-L1",
            "non_ac",
            "dormitory",
            "allotted",
        ),
        # Dhyana
        (
            "allot_sample_chaitanya",
            "stay_sample_chaitanya_family",
            "htl_sample_sai_prakash",
            "Hotel Sai Prakash",
            "235",
            "ac",
            "regular",
            "allotted",
        ),
    ]

    rows = []
    for (
        allotment_id,
        booking_id,
        hotel_id,
        hotel_name,
        room_number,
        room_type,
        room_kind,
        status,
    ) in assignments:
        booking = bookings.get(booking_id)
        if not booking:
            continue
        rows.append(
            _allotment(
                allotment_id=allotment_id,
                booking=booking,
                hotel_id=hotel_id,
                hotel_name=hotel_name,
                room_number=room_number,
                room_type=room_type,
                room_kind=room_kind,
                status=status,
                people_by_mobile=people_by_mobile,
            )
        )
    return rows


def seed_allotments(db) -> None:
    if db["stay_bookings"].count_documents({}) == 0:
        print("No stay bookings — seeding bookings first.")
        seed_bookings(db)
    if db["hotels"].count_documents({}) == 0:
        print("No hotels — seeding hotels first.")
        seed_hotels(db)

    rows = sample_allotments()
    # Wipe sample-event allotments (including test re-allotments) so people are not duplicated.
    sample_event_ids = [EVT_ANANDOTSAVAM, EVT_DUSSEHRA, EVT_DHYANA]
    deleted = db["stay_allotments"].delete_many({"eventId": {"$in": sample_event_ids}})
    print(f"  Cleared {deleted.deleted_count} allotment(s) for sample events.")
    for row in rows:
        db["stay_allotments"].replace_one({"_id": row["_id"]}, row, upsert=True)
        print(
            f"  {row['_id']}: {row['familyFullName']}  "
            f"-> {row['hotelName']} #{row['roomNumber']}  "
            f"{row['roomType']}/{row['roomKind']}  [{row['status']}]  "
            f"({row['eventName']})"
        )
    print(f"Stay allotments seeded: {len(rows)}")


def parse_args():
    p = argparse.ArgumentParser(
        description="Clear and/or seed sample people, events, stay interest, and hotels"
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
        "--hotels",
        action="store_true",
        help="Seed hotels & rooms near Nampally Exhibition Grounds (covers all list filters)",
    )
    p.add_argument(
        "--allotments",
        action="store_true",
        help="Seed who is staying in which hotel/room (from sample bookings)",
    )
    p.add_argument(
        "--all",
        action="store_true",
        help="Seed people + events + bookings + hotels + allotments",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    if not (
        args.clear
        or args.people
        or args.events
        or args.bookings
        or args.hotels
        or args.allotments
        or args.all
    ):
        print(
            "Nothing to do. Examples:\n"
            "  python scripts/seed_sangha_samples.py --clear --all\n"
            "  python scripts/seed_sangha_samples.py --people --events\n"
            "  python scripts/seed_sangha_samples.py --bookings\n"
            "  python scripts/seed_sangha_samples.py --hotels\n"
            "  python scripts/seed_sangha_samples.py --allotments",
            file=sys.stderr,
        )
        return 2

    do_people = args.people or args.all
    do_events = args.events or args.all
    do_bookings = args.bookings or args.all
    do_hotels = args.hotels or args.all
    do_allotments = args.allotments or args.all

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
        if do_hotels:
            seed_hotels(db)
        if do_allotments:
            seed_allotments(db)

    except PyMongoError as exc:
        print(f"MongoDB error: {exc}", file=sys.stderr)
        print("Is Mongo running? Try: docker compose up -d mongo", file=sys.stderr)
        return 1
    except OperationFailure as exc:
        print(f"MongoDB operation failed: {exc}", file=sys.stderr)
        return 1

    print(
        """
Handy logins (centre contact mobiles from centres.pssmovement.org):
  7093405071 / Srini0101     PSSM Admin
  9246470416 / Chait1508     Event Organizer
  9966362691 / Meena1005     Accommodation Volunteer + PMMA
  9845055103 / Sowja2203     Pyramid Sevadal
  7780254680 / Subha1402     Accommodation Admin
  8667684104 / UmaMa0806     PMMA Member

Pick an event in the header, then:
  Stay -> Friends and Masters List
  Stay -> Who is staying where (Accommodation Volunteer)
  Stay -> Hotels & rooms (Accommodation Admin)
"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
