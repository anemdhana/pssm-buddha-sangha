#!/usr/bin/env python3
"""
Clean people.mobile values in MongoDB:
  1) Strip leading country code 91 from 12-digit numbers (91XXXXXXXXXX -> XXXXXXXXXX)
  2) If that would collide with an existing mobile, assign an unused 90000000XX instead
  3) If multiple docs share the same normalized mobile, keep the oldest and reassign the rest

Usage:
  python scripts/cleanup_duplicate_mobiles.py
  python scripts/cleanup_duplicate_mobiles.py --dry-run
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError
except ImportError:
    print("Install deps first:  pip install -r scripts/requirements-db.txt", file=sys.stderr)
    sys.exit(1)


def normalize_mobile(value: str) -> str:
    digits = "".join(ch for ch in str(value or "") if ch.isdigit())
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    return digits


def next_free_mobile(used: set[str], start: int = 9000000010) -> str:
    n = start
    while True:
        candidate = str(n)
        if candidate not in used:
            return candidate
        n += 1


def main() -> int:
    p = argparse.ArgumentParser(description="Normalize / reassign colliding people.mobile values")
    p.add_argument("--uri", default="mongodb://localhost:27017/?replicaSet=rs0")
    p.add_argument("--database", default="pssm_sangha")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    try:
        client = MongoClient(args.uri, serverSelectionTimeoutMS=8000)
        db = client[args.database]
        people = db["people"]
        rows = list(people.find({}, {"mobile": 1, "fullName": 1, "createdAt": 1}).sort(
            [("createdAt", 1), ("_id", 1)]
        ))
    except PyMongoError as exc:
        print(f"MongoDB error: {exc}", file=sys.stderr)
        return 1

    planned: dict = {r["_id"]: r["mobile"] for r in rows}
    changes: list[tuple] = []

    claimed = set(planned.values()) | {normalize_mobile(v) for v in planned.values()}
    for row in rows:
        raw = row["mobile"]
        norm = normalize_mobile(raw)
        if norm == raw:
            continue
        others = claimed - {raw, normalize_mobile(raw)}
        if norm not in others:
            planned[row["_id"]] = norm
            claimed.discard(raw)
            claimed.add(norm)
            changes.append((row["_id"], row.get("fullName"), raw, norm, "normalize"))
        else:
            free = next_free_mobile(claimed)
            planned[row["_id"]] = free
            claimed.discard(raw)
            claimed.add(free)
            changes.append((row["_id"], row.get("fullName"), raw, free, "normalize-collision"))

    by_mobile: dict[str, list] = {}
    for row in rows:
        mobile = planned[row["_id"]]
        by_mobile.setdefault(mobile, []).append(row)

    for mobile, group in by_mobile.items():
        if len(group) < 2:
            continue
        keep = group[0]
        for row in group[1:]:
            used = set(planned.values())
            free = next_free_mobile(used)
            old = planned[row["_id"]]
            planned[row["_id"]] = free
            changes.append((row["_id"], row.get("fullName"), old, free, f"duplicate-of-{keep['_id']}"))

    if not changes:
        print("No mobile cleanups needed.")
        return 0

    print(f"{'DRY-RUN ' if args.dry_run else ''}{len(changes)} update(s):")
    for doc_id, name, old, new, reason in changes:
        print(f"  {doc_id}  {name or '':20}  {old} -> {new}  ({reason})")

    if args.dry_run:
        return 0

    for doc_id, _name, _old, new, _reason in changes:
        people.update_one({"_id": doc_id}, {"$set": {"mobile": new, "updatedAt": datetime.utcnow()}})
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
