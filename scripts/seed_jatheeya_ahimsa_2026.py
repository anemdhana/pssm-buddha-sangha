#!/usr/bin/env python3
"""
Seed Jatheeya Ahimsa Dhyana Mahasabhalu 2026 from CSV exports of hotel-rooms.xlsx.

CSV files (committed under scripts/data/jatheeya_ahimsa_2026/):
  rooms.csv      — hotel rooms & bed capacity
  occupants.csv  — assigned parties (name/mobile/size + stay dates)

Usage:
  python scripts/seed_jatheeya_ahimsa_2026.py --export-xlsx \"C:/Users/dhana/Downloads/hotel-rooms.xlsx\"
  python scripts/seed_jatheeya_ahimsa_2026.py --clear --all
  python scripts/seed_jatheeya_ahimsa_2026.py --people --events --bookings --hotels --allotments
"""

from __future__ import annotations

import argparse
import base64
import csv
import hashlib
import html
import re
import sys
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path

try:
    from pymongo.errors import OperationFailure, PyMongoError
except ImportError:
    print("Install deps first:  pip install -r scripts/requirements-db.txt", file=sys.stderr)
    sys.exit(1)

SCRIPTS = Path(__file__).resolve().parent
DATA_DIR = SCRIPTS / "data" / "jatheeya_ahimsa_2026"
ROOMS_CSV = DATA_DIR / "rooms.csv"
OCCUPANTS_CSV = DATA_DIR / "occupants.csv"

if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from sangha_mongo_common import composed_password, connect, upsert_person, utc_now

EVT_ID = "evt_jatheeya_ahimsa_2026"
EVT_NAME = "Jatheeya Ahimsa Dhyana Mahasabhalu 2026"
EVT_START = date(2026, 10, 1)
EVT_END = date(2026, 10, 5)
SEED_SOURCE = "jatheeya_ahimsa_2026"
ID_PREFIX = "ja26"

# Stable staff logins (same password rule as sample seed) so volunteers can open the app.
STAFF_PEOPLE = [
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
            "mobile": "9246470416",
            "fullName": "Chaitanya Krishna",
            "email": "chaitanya@pssm.example",
            "gender": "male",
            "ageGroup": "adult",
            "meditation": "6",
            "profession": "Event Organizer",
            "birthDate": "15",
            "birthMonth": "08",
            "language": "Telugu",
            "pyramidCenter": "Santh Kabir Das Pyramid Centre",
            "sinceYear": "2012",
            "idType": "aadhaar",
            "place": {
                "kind": "urban",
                "city": "Hyderabad",
                "state": "Telangana",
                "country": "India",
            },
            "seedSource": SEED_SOURCE,
        },
        "roles": ["event_organizer"],
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
        "roles": ["accommodation_volunteer", "pmma_member"],
        "members": [],
    },
    {
        "person": {
            "mobile": "7780254680",
            "fullName": "Subhash Reddy",
            "email": "subhash@pssm.example",
            "gender": "male",
            "ageGroup": "adult",
            "meditation": "3",
            "profession": "Accommodation Admin",
            "birthDate": "14",
            "birthMonth": "02",
            "language": "Telugu",
            "pyramidCenter": "Santh Kabir Das Pyramid Centre",
            "sinceYear": "2014",
            "idType": "aadhaar",
            "place": {
                "kind": "urban",
                "city": "Hyderabad",
                "state": "Telangana",
                "country": "India",
            },
            "seedSource": SEED_SOURCE,
        },
        "roles": ["accommodation_admin"],
        "members": [],
    },
]

FEMALE_HINTS = (
    "devi",
    "lakshmi",
    "laxmi",
    "sita",
    "seetha",
    "padma",
    "anjali",
    "jyothi",
    "jyoti",
    "uma",
    "vasavi",
    "sowjanya",
    "meena",
    "meenakshi",
    "anitha",
    "anita",
    "pallavi",
    "sri lakshmi",
    "dhanamma",
    "amma",
)


def _slug(text: str, *, max_len: int = 40) -> str:
    raw = re.sub(r"[^a-z0-9]+", "_", (text or "").strip().lower()).strip("_")
    return (raw or "x")[:max_len]


def _stable_id(*parts: str) -> str:
    digest = hashlib.sha1("|".join(parts).encode("utf-8")).hexdigest()[:10]
    return digest


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


# skin, hair, shirt, accent
_PORTRAIT_PALETTES = (
    ("#d8b49a", "#5a3d2b", "#2f4f4f", "#1b2a6b"),
    ("#c9957a", "#3b2a22", "#4a5d73", "#6b3a2a"),
    ("#e0c2a8", "#6e4a32", "#355c4a", "#1f3a5f"),
    ("#cbb09a", "#2a211c", "#5c4a3a", "#3d2a6b"),
    ("#d2a888", "#7a4e2e", "#25405a", "#8a3a2e"),
    ("#e8cbb4", "#4a3428", "#3a5a48", "#2a4a6b"),
)


def _sample_portrait_data_url(name: str, *, gender: str = "") -> str:
    """Simple illustrated face placeholder (not a real photo)."""
    label = (name or "Guest").strip() or "Guest"
    safe = html.escape(label[:22])
    dig = int(hashlib.sha1(label.encode("utf-8")).hexdigest()[:6], 16)
    skin, hair, shirt, accent = _PORTRAIT_PALETTES[dig % len(_PORTRAIT_PALETTES)]
    is_female = (gender or "").lower() == "female"
    if is_female:
        hair_path = (
            f'<ellipse cx="128" cy="92" rx="78" ry="70" fill="{hair}"/>'
            f'<ellipse cx="128" cy="118" rx="70" ry="58" fill="{skin}"/>'
        )
    else:
        hair_path = (
            f'<ellipse cx="128" cy="78" rx="62" ry="42" fill="{hair}"/>'
            f'<ellipse cx="128" cy="118" rx="58" ry="64" fill="{skin}"/>'
        )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400" viewBox="0 0 320 400">'
        f'<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0%" stop-color="#eef2f8"/><stop offset="100%" stop-color="#d7dee9"/>'
        f'</linearGradient></defs>'
        f'<rect width="320" height="400" fill="url(#bg)"/>'
        f'<rect x="18" y="18" width="284" height="364" rx="16" fill="#fff" stroke="{accent}" stroke-width="3"/>'
        f'<g transform="translate(32,36)">'
        f'{hair_path}'
        f'<circle cx="108" cy="118" r="5" fill="#2a211c"/><circle cx="148" cy="118" r="5" fill="#2a211c"/>'
        f'<path d="M112 148 Q128 160 144 148" fill="none" stroke="#8a5a45" stroke-width="3" stroke-linecap="round"/>'
        f'<ellipse cx="128" cy="250" rx="90" ry="70" fill="{shirt}"/>'
        f'</g>'
        f'<rect x="18" y="330" width="284" height="52" fill="{accent}"/>'
        f'<text x="160" y="362" text-anchor="middle" font-family="Arial,sans-serif" '
        f'font-size="18" font-weight="700" fill="#fff">{safe}</text>'
        f'</svg>'
    )
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode("utf-8")).decode("ascii")


def _sample_id_card_data_url(name: str, *, id_type: str = "aadhaar", mobile: str = "") -> str:
    """Sample ID-card placeholder (not a real government ID)."""
    label = (name or "Guest").strip() or "Guest"
    safe = html.escape(label[:28])
    kind = (id_type or "aadhaar").strip().lower()
    title = {
        "aadhaar": "SAMPLE AADHAAR",
        "passport": "SAMPLE PASSPORT",
        "voter": "SAMPLE VOTER ID",
        "driving": "SAMPLE DL",
    }.get(kind, "SAMPLE ID")
    dig = int(hashlib.sha1((label + mobile).encode("utf-8")).hexdigest()[:8], 16)
    num = f"{dig % 9000 + 1000} {dig // 9000 % 9000 + 1000} {dig // 81000000 % 9000 + 1000}"
    safe_title = html.escape(title)
    safe_num = html.escape(num)
    skin, hair, shirt, accent = _PORTRAIT_PALETTES[dig % len(_PORTRAIT_PALETTES)]
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300">'
        f'<rect width="480" height="300" rx="14" fill="#f7f9fc" stroke="#c5cedc" stroke-width="2"/>'
        f'<rect width="480" height="48" rx="14" fill="{accent}"/>'
        f'<rect y="28" width="480" height="20" fill="{accent}"/>'
        f'<text x="24" y="32" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#fff">{safe_title}</text>'
        f'<text x="456" y="32" text-anchor="end" font-family="Arial,sans-serif" font-size="12" fill="#dce6ff">DEMO ONLY</text>'
        f'<rect x="24" y="72" width="110" height="140" rx="8" fill="#e8eef5" stroke="#b8c4d6"/>'
        f'<ellipse cx="79" cy="118" rx="28" ry="32" fill="{skin}"/>'
        f'<ellipse cx="79" cy="98" rx="30" ry="16" fill="{hair}"/>'
        f'<ellipse cx="79" cy="188" rx="40" ry="28" fill="{shirt}"/>'
        f'<text x="154" y="100" font-family="Arial,sans-serif" font-size="13" fill="#667086">Name</text>'
        f'<text x="154" y="124" font-family="Arial,sans-serif" font-size="20" font-weight="700" fill="#1b2437">{safe}</text>'
        f'<text x="154" y="164" font-family="Arial,sans-serif" font-size="13" fill="#667086">ID No.</text>'
        f'<text x="154" y="188" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#1b2437">{safe_num}</text>'
        f'<text x="154" y="228" font-family="Arial,sans-serif" font-size="12" fill="#889">{html.escape(kind.upper())} · seed sample</text>'
        f'<rect x="24" y="236" width="432" height="40" rx="8" fill="#eef2f8"/>'
        f'<text x="36" y="261" font-family="Arial,sans-serif" font-size="13" fill="#4a5d73">'
        f'Not a real identity document — for UI demo only</text>'
        f'</svg>'
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


def _guess_gender(name: str) -> str:
    lower = (name or "").strip().lower()
    if any(h in lower for h in FEMALE_HINTS):
        return "female"
    tokens = lower.split()
    if tokens and tokens[-1].endswith(("a", "i", "ee")) and tokens[-1] not in {
        "rao",
        "reddy",
        "naidu",
        "krishna",
        "prasad",
        "kumar",
    }:
        return "female"
    return "male"


def _room_kind(capacity: int) -> str:
    if capacity >= 15:
        return "hall"
    if capacity >= 8:
        return "dormitory"
    return "regular"


def _room_type(capacity: int) -> str:
    return "non_ac" if capacity >= 8 else "ac"


def _gender_allowed(kind: str) -> str:
    if kind in {"dormitory", "hall"}:
        return "gents"
    return ""


def read_rooms() -> list[dict]:
    if not ROOMS_CSV.exists():
        raise FileNotFoundError(f"Missing {ROOMS_CSV} — run with --export-xlsx first.")
    rows = []
    with ROOMS_CSV.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            rows.append(
                {
                    "hotel_name": (row.get("hotel_name") or "").strip(),
                    "room_number": (row.get("room_number") or "").strip(),
                    "beds_capacity": int(float(row.get("beds_capacity") or 0)),
                    "beds_available": int(float(row.get("beds_available") or 0)),
                }
            )
    return [r for r in rows if r["hotel_name"] and r["room_number"]]


def read_occupants() -> list[dict]:
    if not OCCUPANTS_CSV.exists():
        raise FileNotFoundError(f"Missing {OCCUPANTS_CSV} — run with --export-xlsx first.")
    rows = []
    with OCCUPANTS_CSV.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            mobile = re.sub(r"\D", "", row.get("mobile") or "")
            if len(mobile) == 9:
                mobile = "0" + mobile
            start = (row.get("stay_start") or "").strip() or EVT_START.isoformat()
            end = (row.get("stay_end") or "").strip() or EVT_END.isoformat()
            city = (row.get("city") or "").strip() or "Hyderabad"
            state = (row.get("state") or "").strip()
            if not state:
                state = "Telangana" if city.lower() == "hyderabad" else "Andhra Pradesh"
            rows.append(
                {
                    "hotel_name": (row.get("hotel_name") or "").strip(),
                    "room_number": (row.get("room_number") or "").strip(),
                    "guest_name": (row.get("guest_name") or "").strip() or "Guest",
                    "mobile": mobile,
                    "party_size": max(1, int(float(row.get("party_size") or 1))),
                    "stay_start": start,
                    "stay_end": end,
                    "stay_label": (row.get("stay_label") or "").strip(),
                    "city": city,
                    "state": state,
                    "profession": (row.get("profession") or "").strip(),
                    "meditation": (row.get("meditation") or "").strip() or "new",
                    "gender": (row.get("gender") or "").strip().lower(),
                }
            )
    # Wait-list parties may omit hotel/room; still need a mobile.
    return [r for r in rows if r["mobile"]]


def export_csv_from_xlsx(xlsx_path: Path) -> None:
    try:
        import openpyxl
    except ImportError:
        print("openpyxl required for --export-xlsx:  pip install openpyxl", file=sys.stderr)
        raise SystemExit(1)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb["Rooms"]
    headers = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
    party_re = re.compile(r"([^/\n]+)/(\d{9,10})\s*\((\d+)\)")

    def parse_range(label: str) -> tuple[str, str, str]:
        m = re.match(
            r"(\d{2})-([A-Za-z]{3})-(\d{2})\s+to\s+(\d{2})-([A-Za-z]{3})-(\d{2})",
            str(label or "").strip(),
        )
        if not m:
            return "", "", str(label or "").strip()

        def one(d: str, mon: str, y: str) -> str:
            return datetime.strptime(f"{d}-{mon}-20{y}", "%d-%b-%Y").date().isoformat()

        return (
            one(m.group(1), m.group(2), m.group(3)),
            one(m.group(4), m.group(5), m.group(6)),
            str(label).strip(),
        )

    def norm_mobile(raw: str) -> str:
        digits = re.sub(r"\D", "", raw or "")
        if len(digits) == 9:
            digits = "0" + digits
        return digits

    room_n = occ_n = 0
    with ROOMS_CSV.open("w", newline="", encoding="utf-8") as rf, OCCUPANTS_CSV.open(
        "w", newline="", encoding="utf-8"
    ) as of:
        rw = csv.DictWriter(
            rf, fieldnames=["hotel_name", "room_number", "beds_capacity", "beds_available"]
        )
        ow = csv.DictWriter(
            of,
            fieldnames=[
                "hotel_name",
                "room_number",
                "guest_name",
                "mobile",
                "party_size",
                "stay_start",
                "stay_end",
                "stay_label",
            ],
        )
        rw.writeheader()
        ow.writeheader()
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row[0]:
                continue
            hotel = str(row[0]).strip()
            room = str(row[1]).strip()
            cap = int(float(row[2] or 0))
            avail = int(float(row[3] or 0))
            rw.writerow(
                {
                    "hotel_name": hotel,
                    "room_number": room,
                    "beds_capacity": cap,
                    "beds_available": avail,
                }
            )
            room_n += 1
            for idx, cell in enumerate(row[4:8]):
                if not cell:
                    continue
                start, end, label = parse_range(headers[4 + idx])
                for m in party_re.finditer(str(cell)):
                    ow.writerow(
                        {
                            "hotel_name": hotel,
                            "room_number": room,
                            "guest_name": m.group(1).strip(),
                            "mobile": norm_mobile(m.group(2)),
                            "party_size": int(m.group(3)),
                            "stay_start": start,
                            "stay_end": end,
                            "stay_label": label,
                        }
                    )
                    occ_n += 1
    print(f"Exported rooms={room_n} -> {ROOMS_CSV}")
    print(f"Exported occupants={occ_n} -> {OCCUPANTS_CSV}")


def hotel_id_for(name: str) -> str:
    return f"htl_{ID_PREFIX}_{_slug(name, max_len=28)}"


def booking_id_for(occ: dict) -> str:
    key = _stable_id(
        occ["mobile"],
        occ["hotel_name"],
        occ["room_number"],
        occ["stay_start"],
        occ["stay_end"],
        str(occ["party_size"]),
        occ["guest_name"],
    )
    return f"stay_{ID_PREFIX}_{key}"


def allotment_id_for(occ: dict) -> str:
    key = _stable_id(
        occ["mobile"],
        occ["hotel_name"],
        occ["room_number"],
        occ["stay_start"],
        occ["stay_end"],
        str(occ["party_size"]),
        occ["guest_name"],
    )
    return f"allot_{ID_PREFIX}_{key}"


def build_hotels() -> list[dict]:
    rooms = read_rooms()
    by_hotel: dict[str, list[dict]] = defaultdict(list)
    for row in rooms:
        by_hotel[row["hotel_name"]].append(row)

    now = utc_now()
    admin = "7780254680"
    hotels = []
    # Spread distances so Hotels filters still have under/1–3/over 3 km buckets.
    for index, (name, room_rows) in enumerate(sorted(by_hotel.items(), key=lambda x: x[0].lower())):
        if index < 7:
            distance = round(0.3 + index * 0.1, 1)
        elif index < 14:
            distance = round(1.2 + (index - 7) * 0.25, 1)
        else:
            distance = round(3.4 + (index - 14) * 0.35, 1)
        room_docs = []
        for room in sorted(room_rows, key=lambda r: r["room_number"]):
            capacity = max(1, int(room["beds_capacity"] or 1))
            kind = _room_kind(capacity)
            room_docs.append(
                {
                    "roomNumber": room["room_number"],
                    "capacity": capacity,
                    "kind": kind,
                    "roomType": _room_type(capacity),
                    "genderAllowed": _gender_allowed(kind),
                    "status": "available",
                }
            )
        hotels.append(
            {
                "_id": hotel_id_for(name),
                "eventId": EVT_ID,
                "name": name,
                "address": f"{name}, near event venue, Hyderabad",
                "contact": "",
                "image": _hotel_image_data_url(name),
                "distanceKm": distance,
                "active": True,
                "reserved": False,
                "rooms": room_docs,
                "createdBy": admin,
                "createdAt": now,
                "updatedAt": now,
                "seedSource": SEED_SOURCE,
            }
        )
    return hotels


def build_people_from_occupants() -> list[dict]:
    occupants = read_occupants()
    by_mobile: dict[str, dict] = {}
    for occ in occupants:
        mobile = occ["mobile"]
        if mobile in by_mobile:
            # Keep the longer/clearer name if duplicates appear.
            if len(occ["guest_name"]) > len(by_mobile[mobile]["person"]["fullName"]):
                by_mobile[mobile]["person"]["fullName"] = occ["guest_name"]
            continue
        gender = occ.get("gender") if occ.get("gender") in {"male", "female"} else _guess_gender(
            occ["guest_name"]
        )
        # Deterministic birth day/month from mobile so passwords stay stable.
        day = f"{(int(mobile[-2:]) % 28) + 1:02d}"
        month = f"{(int(mobile[-4:-2]) % 12) + 1:02d}"
        by_mobile[mobile] = {
            "person": {
                "mobile": mobile,
                "fullName": occ["guest_name"],
                "email": "",
                "altMobile": "",
                "gender": gender,
                "ageGroup": "adult",
                "meditation": occ.get("meditation") or "new",
                "profession": occ.get("profession") or "",
                "birthDate": day,
                "birthMonth": month,
                "language": "Telugu",
                "pyramidCenter": "",
                "sinceYear": "",
                "idType": "aadhaar",
                "livePhoto": _sample_portrait_data_url(occ["guest_name"], gender=gender),
                "idProofPhoto": _sample_id_card_data_url(
                    occ["guest_name"], id_type="aadhaar", mobile=mobile
                ),
                "place": {
                    "kind": "urban",
                    "city": occ.get("city") or "Hyderabad",
                    "state": occ.get("state")
                    or (
                        "Telangana"
                        if str(occ.get("city") or "").lower() == "hyderabad"
                        else "Andhra Pradesh"
                    ),
                    "country": "India",
                },
                "seedSource": SEED_SOURCE,
            },
            "roles": [],
            "members": [],
        }
    return list(by_mobile.values())


_MEMBER_FIRST_M = (
    "Arjun", "Karthik", "Nikhil", "Rohit", "Vamsi", "Abhinav", "Sathish", "Pradeep"
)
_MEMBER_FIRST_F = (
    "Sneha", "Pooja", "Ananya", "Keerthana", "Manasa", "Shreya", "Nandini", "Harika"
)
_MEMBER_RELATIONS = ("spouse", "child", "parent", "sibling", "family")


def _party_members(
    primary_name: str,
    primary_gender: str,
    party_size: int,
    *,
    with_sample_photos: bool = True,
    stay_start: str = "",
    stay_end: str = "",
) -> list[dict]:
    members = []
    surname = (primary_name or "Guest").split()[-1]
    for i in range(2, party_size + 1):
        gender = "female" if (primary_gender == "male" and i % 2 == 0) else (
            "male" if primary_gender == "female" and i % 2 == 0 else primary_gender
        )
        first = _MEMBER_FIRST_F[(i - 2) % len(_MEMBER_FIRST_F)] if gender == "female" else (
            _MEMBER_FIRST_M[(i - 2) % len(_MEMBER_FIRST_M)]
        )
        member_name = f"{first} {surname}"
        age_group = "child" if i == party_size and party_size >= 4 and i % 5 == 0 else (
            "senior" if i == 3 and party_size >= 3 and primary_gender == "male" else "adult"
        )
        relation = _MEMBER_RELATIONS[min(i - 2, len(_MEMBER_RELATIONS) - 1)]
        # ~1 in 5 multi-member parties: last member arrives/leaves on a different window.
        member_start, member_end = stay_start, stay_end
        if (
            with_sample_photos
            and party_size >= 3
            and i == party_size
            and stay_start == "2026-10-01"
            and stay_end == "2026-10-05"
            and (i % 5 == 0)
        ):
            member_start, member_end = "2026-10-03", "2026-10-05"
        members.append(
            {
                "name": member_name,
                "relation": relation,
                "mobile": "",
                "gender": gender,
                "ageGroup": age_group,
                "age": age_group,
                "meditation": "new",
                "profession": "",
                "addrMode": "same",
                "idType": "aadhaar",
                "livePhoto": _sample_portrait_data_url(member_name, gender=gender),
                "idProofPhoto": _sample_id_card_data_url(member_name, id_type="aadhaar"),
                "place": {},
                "stayStartDate": member_start,
                "stayEndDate": member_end,
            }
        )
    return members


def build_bookings() -> list[dict]:
    people = {p["person"]["mobile"]: p for p in build_people_from_occupants()}
    now = utc_now()
    volunteer = "9966362691"
    rows = []
    for occ in read_occupants():
        person_wrap = people.get(occ["mobile"])
        if not person_wrap:
            continue
        person = person_wrap["person"]
        members = _party_members(
            person["fullName"],
            person.get("gender") or "male",
            occ["party_size"],
            with_sample_photos=True,
            stay_start=occ["stay_start"],
            stay_end=occ["stay_end"],
        )
        guests = [
            {
                "name": person["fullName"],
                "relation": "",
                "mobile": person["mobile"],
                "gender": person.get("gender") or "male",
                "age": person.get("ageGroup") or "adult",
                "stayStartDate": occ["stay_start"],
                "stayEndDate": occ["stay_end"],
                "primary": True,
            }
        ]
        for member in members:
            guests.append(
                {
                    "name": member["name"],
                    "relation": member.get("relation") or "family",
                    "mobile": member.get("mobile") or "",
                    "gender": member.get("gender") or "adult",
                    "age": member.get("ageGroup") or member.get("age") or "adult",
                    "stayStartDate": member.get("stayStartDate") or occ["stay_start"],
                    "stayEndDate": member.get("stayEndDate") or occ["stay_end"],
                    "primary": False,
                }
            )
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
            "members": [
                {
                    "name": m.get("name") or "",
                    "relation": m.get("relation") or "",
                    "mobile": m.get("mobile") or "",
                    "gender": m.get("gender") or "",
                    "age": m.get("ageGroup") or m.get("age") or "adult",
                    "meditation": m.get("meditation") or "",
                    "profession": m.get("profession") or "",
                    "addrMode": m.get("addrMode") or "same",
                    "idType": m.get("idType") or "",
                    "livePhoto": m.get("livePhoto") or "",
                    "idProofPhoto": m.get("idProofPhoto") or "",
                    "place": m.get("place") or {},
                    "stayStartDate": m.get("stayStartDate") or occ["stay_start"],
                    "stayEndDate": m.get("stayEndDate") or occ["stay_end"],
                }
                for m in members
            ],
            "roles": [],
            "stayStartDate": occ["stay_start"],
            "stayEndDate": occ["stay_end"],
        }
        rows.append(
            {
                "_id": booking_id_for(occ),
                "eventId": EVT_ID,
                "eventName": EVT_NAME,
                "plan": "free",
                "status": "registered",
                "createdByMobile": volunteer,
                "familyMobile": person["mobile"],
                "familyFullName": person["fullName"],
                "registeredFamily": False,
                "place": person.get("place") or {},
                "hotelName": occ.get("hotel_name") or "",
                "roomNumber": occ.get("room_number") or "",
                "guests": guests,
                "familyDetail": family,
                "createdAt": now,
                "seedSource": SEED_SOURCE,
            }
        )
    return rows


def build_allotments(bookings: list[dict]) -> list[dict]:
    hotels = {h["name"]: h for h in build_hotels()}
    rooms_by_hotel: dict[str, dict[str, dict]] = {}
    for hotel in hotels.values():
        rooms_by_hotel[hotel["name"]] = {
            str(r.get("roomNumber") or ""): r for r in (hotel.get("rooms") or [])
        }

    now = utc_now()
    rows = []
    for booking in bookings:
        hotel_name = booking.get("hotelName") or ""
        room_number = booking.get("roomNumber") or ""
        hotel = hotels.get(hotel_name)
        room = rooms_by_hotel.get(hotel_name, {}).get(str(room_number))
        if not hotel or not room:
            print(f"  skip allotment — missing hotel/room for {booking['_id']}: {hotel_name} #{room_number}")
            continue
        family = booking.get("familyDetail") or {}
        family_photo = family.get("livePhoto") or ""
        family_id = family.get("idProofPhoto") or ""
        member_by_name = {
            str(m.get("name") or "").strip().lower(): m for m in (family.get("members") or [])
        }
        guests = []
        for guest in booking.get("guests") or []:
            if guest.get("primary"):
                live = family_photo
                id_proof = family_id
                stay_start = guest.get("stayStartDate") or family.get("stayStartDate") or ""
                stay_end = guest.get("stayEndDate") or family.get("stayEndDate") or ""
            else:
                member = member_by_name.get(str(guest.get("name") or "").strip().lower()) or {}
                live = member.get("livePhoto") or ""
                id_proof = member.get("idProofPhoto") or ""
                stay_start = guest.get("stayStartDate") or member.get("stayStartDate") or ""
                stay_end = guest.get("stayEndDate") or member.get("stayEndDate") or ""
            guests.append(
                {
                    "name": guest.get("name") or "",
                    "relation": guest.get("relation") or "",
                    "mobile": guest.get("mobile") or "",
                    "gender": guest.get("gender") or "",
                    "age": guest.get("age") or "",
                    "livePhoto": live,
                    "idProofPhoto": id_proof,
                    "stayStartDate": stay_start,
                    "stayEndDate": stay_end,
                    "primary": bool(guest.get("primary")),
                }
            )
        primary = next((g for g in booking.get("guests") or [] if g.get("primary")), None)
        rows.append(
            {
                "_id": allotment_id_for(
                    {
                        "mobile": booking.get("familyMobile") or "",
                        "hotel_name": hotel_name,
                        "room_number": room_number,
                        "stay_start": (primary or {}).get("stayStartDate") or "",
                        "stay_end": (primary or {}).get("stayEndDate") or "",
                        "party_size": len(booking.get("guests") or []),
                        "guest_name": booking.get("familyFullName") or "",
                    }
                ),
                "eventId": EVT_ID,
                "eventName": EVT_NAME,
                "bookingId": booking["_id"],
                "plan": booking.get("plan") or "free",
                "status": "allotted",
                "hotelId": hotel["_id"],
                "hotelName": hotel["name"],
                "roomNumber": room_number,
                "roomType": room.get("roomType") or "ac",
                "roomKind": room.get("kind") or "regular",
                "familyMobile": booking.get("familyMobile") or "",
                "familyFullName": booking.get("familyFullName") or "",
                "place": booking.get("place") or {},
                "guests": guests,
                "checkInDate": (primary or {}).get("stayStartDate") or "",
                "checkOutDate": (primary or {}).get("stayEndDate") or "",
                "createdAt": now,
                "seedSource": SEED_SOURCE,
            }
        )
    return rows


def clear_event_data(db) -> None:
    staff_mobiles = {item["person"]["mobile"] for item in STAFF_PEOPLE}
    deleted_allot = db["stay_allotments"].delete_many({"eventId": EVT_ID})
    deleted_book = db["stay_bookings"].delete_many({"eventId": EVT_ID})
    deleted_hotels = db["hotels"].delete_many(
        {"$or": [{"eventId": EVT_ID}, {"_id": {"$regex": f"^htl_{ID_PREFIX}_"}}]}
    )
    deleted_people = db["people"].delete_many(
        {
            "seedSource": SEED_SOURCE,
            "mobile": {"$nin": list(staff_mobiles)},
        }
    )
    # Keep the event document; --events upserts it. Drop only if explicitly re-seeded alone.
    print(
        f"Cleared event data: allotments={deleted_allot.deleted_count} "
        f"bookings={deleted_book.deleted_count} hotels={deleted_hotels.deleted_count} "
        f"seedPeople={deleted_people.deleted_count} (staff kept)"
    )


def seed_event(db) -> None:
    now = utc_now()
    event = {
        "_id": EVT_ID,
        "name": EVT_NAME,
        "startDate": datetime(EVT_START.year, EVT_START.month, EVT_START.day, tzinfo=timezone.utc),
        "endDate": datetime(EVT_END.year, EVT_END.month, EVT_END.day, tzinfo=timezone.utc),
        "location": "Hyderabad",
        "expectedBudgetInr": 0,
        "meditationHoursPerDay": 6.0,
        "createdBy": "9246470416",
        "createdAt": now,
        "seedSource": SEED_SOURCE,
    }
    db["events"].replace_one({"_id": EVT_ID}, event, upsert=True)
    print(f"Event seeded: {EVT_NAME} ({EVT_START} – {EVT_END})")


def seed_people(db) -> None:
    print("\nSeeding staff + occupant people…")
    staff_mobiles = {item["person"]["mobile"] for item in STAFF_PEOPLE}
    for item in STAFF_PEOPLE:
        p = item["person"]
        plain = composed_password(p["fullName"], p["birthDate"], p["birthMonth"])
        upsert_person(db, p, item["roles"], plain, item.get("members"))
        print(f"  staff {p['mobile']}  {plain:12}  {p['fullName']}  [{','.join(item['roles'])}]")

    occupants = build_people_from_occupants()
    seeded = 0
    for item in occupants:
        p = item["person"]
        if p["mobile"] in staff_mobiles:
            # Keep staff roles; only refresh name/photo if needed via upsert merge.
            continue
        plain = composed_password(p["fullName"], p["birthDate"], p["birthMonth"])
        upsert_person(db, p, item["roles"], plain, item.get("members"))
        seeded += 1
    print(f"Occupant people seeded/updated: {seeded} (unique mobiles from CSV)")


TURNOVER_HOTEL_ID = f"htl_{ID_PREFIX}_turnover_demo"
TURNOVER_HOTEL_NAME = "Turnover Demo Lodge"


def build_turnover_demo_hotel() -> dict:
    """Small hotel for same-day checkout → check-in demos."""
    now = utc_now()
    return {
        "_id": TURNOVER_HOTEL_ID,
        "eventId": EVT_ID,
        "name": TURNOVER_HOTEL_NAME,
        "address": "Near event venue, Hyderabad (same-day turnover demo)",
        "contact": "",
        "image": _hotel_image_data_url(TURNOVER_HOTEL_NAME),
        "distanceKm": 0.2,
        "active": True,
        "reserved": False,
        "rooms": [
            {
                "roomNumber": "101",
                "capacity": 2,
                "kind": "regular",
                "roomType": "ac",
                "genderAllowed": "",
                "status": "available",
            },
            {
                "roomNumber": "102",
                "capacity": 3,
                "kind": "regular",
                "roomType": "ac",
                "genderAllowed": "",
                "status": "available",
            },
            {
                "roomNumber": "103",
                "capacity": 2,
                "kind": "regular",
                "roomType": "non_ac",
                "genderAllowed": "",
                "status": "available",
            },
        ],
        "createdBy": "7780254680",
        "createdAt": now,
        "updatedAt": now,
        "seedSource": SEED_SOURCE,
    }


def build_turnover_demo_people() -> list[dict]:
    """People for allotted early-checkout parties + wait-list late arrivals."""
    specs = [
        ("9000001001", "Early Checkout Duo", "male", "01", "03"),
        ("9000001002", "Full Stay Family", "female", "02", "03"),
        ("9000002001", "Same Day Arrival", "male", "05", "10"),
        ("9000002002", "Mid Event Arrival", "female", "03", "10"),
        ("9000002003", "Day Four Arrival", "male", "04", "10"),
        ("9000002004", "Couple After Checkout", "female", "05", "08"),
    ]
    rows = []
    for mobile, name, gender, day, month in specs:
        rows.append(
            {
                "person": {
                    "mobile": mobile,
                    "fullName": name,
                    "email": "",
                    "altMobile": "",
                    "gender": gender,
                    "ageGroup": "adult",
                    "meditation": "new",
                    "profession": "Turnover demo",
                    "birthDate": day,
                    "birthMonth": month,
                    "language": "Telugu",
                    "pyramidCenter": "",
                    "sinceYear": "",
                    "idType": "aadhaar",
                    "livePhoto": _initials_svg_data_url(name),
                    "idProofPhoto": "",
                    "place": {
                        "kind": "urban",
                        "city": "Hyderabad",
                        "state": "Telangana",
                        "country": "India",
                    },
                    "seedSource": SEED_SOURCE,
                },
                "roles": [],
                "members": [],
            }
        )
    return rows


def _simple_booking(
    *,
    booking_id: str,
    person: dict,
    members: list[dict],
    start: str,
    end: str,
    now: datetime,
) -> dict:
    guests = [
        {
            "name": person["fullName"],
            "relation": "",
            "mobile": person["mobile"],
            "gender": person.get("gender") or "male",
            "age": person.get("ageGroup") or "adult",
            "stayStartDate": start,
            "stayEndDate": end,
            "primary": True,
        }
    ]
    family_members = []
    for member in members:
        guests.append(
            {
                "name": member["name"],
                "relation": member.get("relation") or "family",
                "mobile": member.get("mobile") or "",
                "gender": member.get("gender") or "adult",
                "age": member.get("ageGroup") or "adult",
                "stayStartDate": start,
                "stayEndDate": end,
                "primary": False,
            }
        )
        family_members.append(
            {
                "name": member["name"],
                "relation": member.get("relation") or "family",
                "mobile": member.get("mobile") or "",
                "gender": member.get("gender") or "",
                "age": member.get("ageGroup") or "adult",
                "meditation": "new",
                "profession": "",
                "addrMode": "same",
                "idType": "",
                "livePhoto": member.get("livePhoto") or "",
                "idProofPhoto": "",
                "place": {},
                "stayStartDate": start,
                "stayEndDate": end,
            }
        )
    return {
        "_id": booking_id,
        "eventId": EVT_ID,
        "eventName": EVT_NAME,
        "plan": "free",
        "status": "registered",
        "createdByMobile": "9966362691",
        "familyMobile": person["mobile"],
        "familyFullName": person["fullName"],
        "registeredFamily": False,
        "place": person.get("place") or {},
        "guests": guests,
        "familyDetail": {
            "fullName": person["fullName"],
            "mobile": person["mobile"],
            "email": "",
            "altMobile": "",
            "gender": person.get("gender") or "",
            "age": person.get("ageGroup") or "adult",
            "meditation": person.get("meditation") or "",
            "profession": person.get("profession") or "",
            "birthDate": person.get("birthDate") or "",
            "birthMonth": person.get("birthMonth") or "",
            "language": person.get("language") or "",
            "pyramidCenter": "",
            "sinceYear": "",
            "idType": person.get("idType") or "",
            "livePhoto": person.get("livePhoto") or "",
            "idProofPhoto": "",
            "place": person.get("place") or {},
            "members": family_members,
            "roles": [],
            "stayStartDate": start,
            "stayEndDate": end,
        },
        "createdAt": now,
        "seedSource": SEED_SOURCE,
    }


def build_turnover_demo_bookings_and_allotments() -> tuple[list[dict], list[dict]]:
    """
    Demo cases:
      Room 101: allotted Oct 1–3 (checkout morning Oct 3)
      Room 102: allotted Oct 1–5 (checkout morning Oct 5)
      Wait list: parties starting Oct 3 / Oct 4 / Oct 5 (should reuse freed rooms)
    """
    now = utc_now()
    people = {p["person"]["mobile"]: p["person"] for p in build_turnover_demo_people()}
    bookings: list[dict] = []
    allotments: list[dict] = []

    early = people["9000001001"]
    early_members = [
        {
            "name": "Early Checkout Partner",
            "relation": "spouse",
            "gender": "female",
            "ageGroup": "adult",
            "livePhoto": _initials_svg_data_url("EP"),
        }
    ]
    early_booking = _simple_booking(
        booking_id=f"stay_{ID_PREFIX}_turn_early",
        person=early,
        members=early_members,
        start="2026-10-01",
        end="2026-10-03",
        now=now,
    )
    bookings.append(early_booking)
    allotments.append(
        {
            "_id": f"allot_{ID_PREFIX}_turn_early",
            "eventId": EVT_ID,
            "eventName": EVT_NAME,
            "bookingId": early_booking["_id"],
            "plan": "free",
            "status": "allotted",
            "hotelId": TURNOVER_HOTEL_ID,
            "hotelName": TURNOVER_HOTEL_NAME,
            "roomNumber": "101",
            "roomType": "ac",
            "roomKind": "regular",
            "familyMobile": early["mobile"],
            "familyFullName": early["fullName"],
            "place": early.get("place") or {},
            "guests": [
                {
                    "name": g["name"],
                    "relation": g.get("relation") or "",
                    "mobile": g.get("mobile") or "",
                    "gender": g.get("gender") or "",
                    "age": g.get("age") or "",
                    "livePhoto": early.get("livePhoto") or "" if g.get("primary") else "",
                    "primary": bool(g.get("primary")),
                }
                for g in early_booking["guests"]
            ],
            "checkInDate": "2026-10-01",
            "checkOutDate": "2026-10-03",
            "createdAt": now,
            "seedSource": SEED_SOURCE,
        }
    )

    full = people["9000001002"]
    full_members = [
        {
            "name": "Full Stay Child",
            "relation": "child",
            "gender": "female",
            "ageGroup": "child",
            "livePhoto": _initials_svg_data_url("FC"),
        },
        {
            "name": "Full Stay Elder",
            "relation": "parent",
            "gender": "male",
            "ageGroup": "senior",
            "livePhoto": _initials_svg_data_url("FE"),
        },
    ]
    full_booking = _simple_booking(
        booking_id=f"stay_{ID_PREFIX}_turn_full",
        person=full,
        members=full_members,
        start="2026-10-01",
        end="2026-10-05",
        now=now,
    )
    bookings.append(full_booking)
    allotments.append(
        {
            "_id": f"allot_{ID_PREFIX}_turn_full",
            "eventId": EVT_ID,
            "eventName": EVT_NAME,
            "bookingId": full_booking["_id"],
            "plan": "free",
            "status": "allotted",
            "hotelId": TURNOVER_HOTEL_ID,
            "hotelName": TURNOVER_HOTEL_NAME,
            "roomNumber": "102",
            "roomType": "ac",
            "roomKind": "regular",
            "familyMobile": full["mobile"],
            "familyFullName": full["fullName"],
            "place": full.get("place") or {},
            "guests": [
                {
                    "name": g["name"],
                    "relation": g.get("relation") or "",
                    "mobile": g.get("mobile") or "",
                    "gender": g.get("gender") or "",
                    "age": g.get("age") or "",
                    "livePhoto": full.get("livePhoto") or "" if g.get("primary") else "",
                    "primary": bool(g.get("primary")),
                }
                for g in full_booking["guests"]
            ],
            "checkInDate": "2026-10-01",
            "checkOutDate": "2026-10-05",
            "createdAt": now,
            "seedSource": SEED_SOURCE,
        }
    )

    wait_specs = [
        ("9000002001", f"stay_{ID_PREFIX}_turn_wait_oct5", "2026-10-05", "2026-10-05", 1, []),
        (
            "9000002002",
            f"stay_{ID_PREFIX}_turn_wait_oct3",
            "2026-10-03",
            "2026-10-05",
            2,
            [
                {
                    "name": "Mid Event Partner",
                    "relation": "spouse",
                    "gender": "male",
                    "ageGroup": "adult",
                    "livePhoto": _initials_svg_data_url("MP"),
                }
            ],
        ),
        ("9000002003", f"stay_{ID_PREFIX}_turn_wait_oct4", "2026-10-04", "2026-10-05", 1, []),
        (
            "9000002004",
            f"stay_{ID_PREFIX}_turn_wait_oct5_couple",
            "2026-10-05",
            "2026-10-05",
            2,
            [
                {
                    "name": "Couple Arrival Partner",
                    "relation": "spouse",
                    "gender": "male",
                    "ageGroup": "adult",
                    "livePhoto": _initials_svg_data_url("CP"),
                }
            ],
        ),
    ]
    for mobile, booking_id, start, end, _size, members in wait_specs:
        bookings.append(
            _simple_booking(
                booking_id=booking_id,
                person=people[mobile],
                members=members,
                start=start,
                end=end,
                now=now,
            )
        )

    return bookings, allotments


def seed_hotels(db) -> None:
    rows = build_hotels()
    db["hotels"].delete_many({"$or": [{"eventId": EVT_ID}, {"_id": {"$regex": f"^htl_{ID_PREFIX}_"}}]})
    for row in rows:
        db["hotels"].replace_one({"_id": row["_id"]}, row, upsert=True)
        print(f"  {row['_id']}: {row['name']}  {row['distanceKm']} km  rooms={len(row['rooms'])}")
    print(f"Hotels seeded: {len(rows)}")


def seed_bookings(db) -> None:
    rows = build_bookings()
    db["stay_bookings"].delete_many({"eventId": EVT_ID})
    for row in rows:
        # hotelName/roomNumber only used when building allotments; strip if present
        clean = {k: v for k, v in row.items() if k not in {"hotelName", "roomNumber"}}
        db["stay_bookings"].replace_one({"_id": clean["_id"]}, clean, upsert=True)
    print(f"Stay bookings seeded: {len(rows)}")


def seed_allotments(db) -> None:
    booking_rows = build_bookings()
    # Persist booking docs without helper keys first if missing
    if db["stay_bookings"].count_documents({"eventId": EVT_ID}) == 0:
        seed_bookings(db)
    if db["hotels"].count_documents({"eventId": EVT_ID}) == 0:
        seed_hotels(db)

    allot_rows = build_allotments(booking_rows)
    db["stay_allotments"].delete_many({"eventId": EVT_ID})
    for row in allot_rows:
        db["stay_allotments"].replace_one({"_id": row["_id"]}, row, upsert=True)
    print(f"Stay allotments seeded: {len(allot_rows)}")


def parse_args():
    p = argparse.ArgumentParser(
        description=f"Seed {EVT_NAME} from hotel-rooms CSV exports"
    )
    p.add_argument(
        "--uri",
        default="mongodb://localhost:27017/?replicaSet=rs0",
        help="MongoDB connection URI",
    )
    p.add_argument("--database", default="pssm_sangha")
    p.add_argument(
        "--export-xlsx",
        metavar="PATH",
        help="Rebuild rooms.csv + occupants.csv from the Excel workbook",
    )
    p.add_argument(
        "--clear",
        action="store_true",
        help="Remove this event's hotels/bookings/allotments/event doc (keeps people)",
    )
    p.add_argument("--people", action="store_true", help="Seed staff + occupant people")
    p.add_argument("--events", action="store_true", help="Seed the Jatheeya Ahimsa event")
    p.add_argument("--bookings", action="store_true", help="Seed stay bookings from occupants.csv")
    p.add_argument("--hotels", action="store_true", help="Seed hotels/rooms from rooms.csv")
    p.add_argument(
        "--allotments",
        action="store_true",
        help="Seed room allotments matching occupants.csv",
    )
    p.add_argument(
        "--all",
        action="store_true",
        help="Seed people + event + bookings + hotels + allotments",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    if args.export_xlsx:
        export_csv_from_xlsx(Path(args.export_xlsx))
        if not (
            args.clear
            or args.people
            or args.events
            or args.bookings
            or args.hotels
            or args.allotments
            or args.all
        ):
            return 0

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
            "  python scripts/seed_jatheeya_ahimsa_2026.py --export-xlsx PATH\n"
            "  python scripts/seed_jatheeya_ahimsa_2026.py --clear --all\n"
            "  python scripts/seed_jatheeya_ahimsa_2026.py --all",
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
            clear_event_data(db)

        if do_people:
            seed_people(db)
        if do_events:
            seed_event(db)
        if do_hotels:
            seed_hotels(db)
        if do_bookings:
            seed_bookings(db)
        if do_allotments:
            seed_allotments(db)

    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except PyMongoError as exc:
        print(f"MongoDB error: {exc}", file=sys.stderr)
        print("Is Mongo running? Try: docker compose up -d mongo", file=sys.stderr)
        return 1
    except OperationFailure as exc:
        print(f"MongoDB operation failed: {exc}", file=sys.stderr)
        return 1

    print(
        f"""
Done. Pick event: {EVT_NAME}

Staff logins (password = up to 5 letters of name + DDMM):
  7093405071 / Srini0101     PSSM Admin
  9246470416 / Chait1508     Event Organizer
  9966362691 / Meena1005     Accommodation Volunteer
  7780254680 / Subha1402     Accommodation Admin

CSV source: {DATA_DIR}
"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
