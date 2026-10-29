#!/usr/bin/env python3
"""
Generate a fresh occupants.csv for Jatheeya Ahimsa 2026 demo seed.

Targets (people counts):
  Hyderabad 100 · Tirupati 70 · Chittoor 50

Writes scripts/data/jatheeya_ahimsa_2026/occupants.csv
"""

from __future__ import annotations

import csv
import hashlib
import random
from collections import defaultdict
from datetime import date
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
DATA_DIR = SCRIPTS / "data" / "jatheeya_ahimsa_2026"
ROOMS_CSV = DATA_DIR / "rooms.csv"
OCCUPANTS_CSV = DATA_DIR / "occupants.csv"

LOCATIONS = (
    {"city": "Hyderabad", "state": "Telangana", "people": 100},
    {"city": "Tirupati", "state": "Andhra Pradesh", "people": 70},
    {"city": "Chittoor", "state": "Andhra Pradesh", "people": 50},
)

STAY_RANGES = (
    ("2026-10-01", "2026-10-05"),
    ("2026-10-01", "2026-10-05"),
    ("2026-10-01", "2026-10-05"),
    ("2026-10-01", "2026-10-03"),
    ("2026-10-01", "2026-10-02"),
    ("2026-10-02", "2026-10-04"),
    ("2026-10-03", "2026-10-05"),
    ("2026-10-04", "2026-10-05"),
    ("2026-10-05", "2026-10-05"),
)

# Prefer sizes that fit regular rooms; include dorm/hall sizes too.
SIZE_WEIGHTS = (
    (1, 22),
    (2, 28),
    (3, 20),
    (4, 16),
    (5, 6),
    (8, 4),
    (12, 2),
    (15, 2),
)

MALE_FIRST = [
    "Ravi", "Srinivas", "Venkat", "Suresh", "Naresh", "Mahesh", "Rajesh", "Kiran",
    "Anil", "Sunil", "Prasad", "Kumar", "Ramesh", "Gopal", "Narasimha", "Harish",
    "Chaitanya", "Sai", "Teja", "Phani", "Lokesh", "Dinesh", "Murali", "Praveen",
    "Ashok", "Balaji", "Chandra", "Dhanunjay", "Eswar", "Ganesh", "Hari", "Jagadeesh",
    "Krishna", "Madhav", "Naveen", "Omkar", "Pavan", "Raghu", "Sandeep", "Tarun",
    "Uday", "Vijay", "Yashwanth", "Abhilash", "Bharath", "Charan", "Deepak", "Gautham",
]
FEMALE_FIRST = [
    "Padma", "Lakshmi", "Sita", "Geetha", "Meena", "Kavitha", "Sunitha", "Anitha",
    "Radha", "Sarala", "Jyothi", "Swathi", "Priya", "Divya", "Sravani", "Bhavani",
    "Anjali", "Deepika", "Harini", "Indira", "Jahnavi", "Keerthi", "Lavanya", "Madhavi",
    "Nirmala", "Poornima", "Ramya", "Shanti", "Tejaswi", "Uma", "Varalakshmi", "Yamini",
    "Aishwarya", "Bharathi", "Chandrika", "Dhanalakshmi", "Gayatri", "Hemalatha",
]
SURNAMES = [
    "Reddy", "Rao", "Naidu", "Sharma", "Sastry", "Murthy", "Prasad", "Kumar",
    "Chowdary", "Varma", "Raju", "Goud", "Yadav", "Shetty", "Acharya", "Nair",
    "Pillai", "Das", "Babu", "Raju", "Devi",
]

PROFESSIONS = [
    "Teacher", "Farmer", "Homemaker", "Engineer", "Accountant", "Shopkeeper",
    "Doctor", "Nurse", "Clerk", "Retired", "Student", "Business", "Driver",
]
MEDITATIONS = ["new", "1", "2", "3", "4", "5", "6"]


def _rng(seed: str = "jatheeya-fresh-2026") -> random.Random:
    return random.Random(int(hashlib.sha1(seed.encode()).hexdigest()[:8], 16))


def _stay_label(start: str, end: str) -> str:
    def fmt(iso: str) -> str:
        y, m, d = iso.split("-")
        mon = date(int(y), int(m), int(d)).strftime("%b")
        return f"{int(d):02d}-{mon}-{y[2:]}"

    return f"{fmt(start)} to {fmt(end)}"


def _party_sizes(target: int, rng: random.Random) -> list[int]:
    sizes: list[int] = []
    remaining = target
    weighted = []
    for size, weight in SIZE_WEIGHTS:
        weighted.extend([size] * weight)
    while remaining > 0:
        if remaining <= 5:
            sizes.append(remaining)
            break
        choices = [s for s in weighted if s <= remaining]
        if not choices:
            sizes.append(remaining)
            break
        # Avoid leaving awkward leftovers like 7 when dorm sizes exist.
        pick = rng.choice(choices)
        if remaining - pick in {7, 9, 11, 13, 14} and remaining - pick > 5:
            alt = [s for s in choices if remaining - s not in {7, 9, 11, 13, 14}]
            if alt:
                pick = rng.choice(alt)
        sizes.append(pick)
        remaining -= pick
    assert sum(sizes) == target, (sum(sizes), target, sizes)
    return sizes


def _unique_mobile(rng: random.Random, used: set[str], salt: str) -> str:
    staff = {"7093405071", "9246470416", "9966362691", "7780254680", "9845055103"}
    for i in range(10_000):
        prefix = rng.choice(["9", "8", "7"])
        dig = hashlib.sha1(f"{salt}:{i}:{rng.random()}".encode()).hexdigest()
        mobile = prefix + "".join(str(int(ch, 16) % 10) for ch in dig[:9])
        if mobile not in used and mobile not in staff and len(mobile) == 10:
            used.add(mobile)
            return mobile
    raise RuntimeError("Could not allocate unique mobile")


def _person_name(rng: random.Random, *, female: bool) -> str:
    first = rng.choice(FEMALE_FIRST if female else MALE_FIRST)
    last = rng.choice(SURNAMES)
    if female and last == "Devi":
        return f"{first} {last}"
    if female and rng.random() < 0.25:
        return f"{first} Devi"
    return f"{first} {last}"


def read_rooms() -> list[dict]:
    rows = []
    with ROOMS_CSV.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            cap = int(float(row.get("beds_capacity") or 0))
            if cap <= 0:
                continue
            rows.append(
                {
                    "hotel_name": (row.get("hotel_name") or "").strip(),
                    "room_number": (row.get("room_number") or "").strip(),
                    "capacity": cap,
                }
            )
    return [r for r in rows if r["hotel_name"] and r["room_number"]]


def assign_rooms(parties: list[dict], rooms: list[dict], rng: random.Random) -> None:
    """Greedy one-party-per-room assignment; leftovers stay wait-listed."""
    by_cap: dict[int, list[dict]] = defaultdict(list)
    for room in rooms:
        by_cap[room["capacity"]].append(dict(room))
    for cap in by_cap:
        rng.shuffle(by_cap[cap])

    # ~70% allotted, rest wait list (and any that cannot fit).
    allot_budget = max(1, int(len(parties) * 0.72))
    allotted = 0
    # Prefer fitting exact/near capacity for larger parties first.
    ordered = sorted(parties, key=lambda p: (-p["party_size"], p["city"], p["mobile"]))
    for party in ordered:
        if allotted >= allot_budget:
            party["hotel_name"] = ""
            party["room_number"] = ""
            continue
        size = party["party_size"]
        # Exact fit first, then next larger free room.
        candidates = []
        for cap in sorted(by_cap.keys()):
            if cap >= size and by_cap[cap]:
                candidates.append(cap)
        if not candidates:
            party["hotel_name"] = ""
            party["room_number"] = ""
            continue
        cap = candidates[0]
        room = by_cap[cap].pop()
        party["hotel_name"] = room["hotel_name"]
        party["room_number"] = room["room_number"]
        allotted += 1


def build_parties() -> list[dict]:
    rng = _rng()
    used_mobiles: set[str] = set()
    parties: list[dict] = []
    for loc in LOCATIONS:
        sizes = _party_sizes(loc["people"], rng)
        for idx, size in enumerate(sizes):
            female_primary = rng.random() < 0.42
            name = _person_name(rng, female=female_primary)
            mobile = _unique_mobile(rng, used_mobiles, f"{loc['city']}:{idx}:{name}")
            stay = STAY_RANGES[rng.randrange(len(STAY_RANGES))]
            parties.append(
                {
                    "hotel_name": "",
                    "room_number": "",
                    "guest_name": name,
                    "mobile": mobile,
                    "party_size": size,
                    "stay_start": stay[0],
                    "stay_end": stay[1],
                    "stay_label": _stay_label(stay[0], stay[1]),
                    "city": loc["city"],
                    "state": loc["state"],
                    "gender": "female" if female_primary else "male",
                    "profession": rng.choice(PROFESSIONS),
                    "meditation": rng.choice(MEDITATIONS),
                }
            )
    assign_rooms(parties, read_rooms(), rng)
    # Stable CSV order: allotted hotels first, then wait list; within by city.
    parties.sort(
        key=lambda p: (
            0 if p["hotel_name"] else 1,
            p["hotel_name"],
            p["room_number"],
            p["city"],
            p["guest_name"],
        )
    )
    return parties


def write_occupants(parties: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    fields = [
        "hotel_name",
        "room_number",
        "guest_name",
        "mobile",
        "party_size",
        "stay_start",
        "stay_end",
        "stay_label",
        "city",
        "state",
        "profession",
        "meditation",
        "gender",
    ]
    with OCCUPANTS_CSV.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for p in parties:
            writer.writerow({k: p.get(k, "") for k in fields})


def main() -> int:
    if not ROOMS_CSV.exists():
        print(f"Missing {ROOMS_CSV}")
        return 1
    parties = build_parties()
    write_occupants(parties)
    by_city: dict[str, int] = defaultdict(int)
    allotted = wait = 0
    for p in parties:
        by_city[p["city"]] += p["party_size"]
        if p["hotel_name"]:
            allotted += 1
        else:
            wait += 1
    print(f"Wrote {OCCUPANTS_CSV}")
    print(f"Parties: {len(parties)}  allotted={allotted}  wait={wait}")
    for city, count in by_city.items():
        print(f"  {city}: {count} people")
    print(f"Total people: {sum(by_city.values())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
