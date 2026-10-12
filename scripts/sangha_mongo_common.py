#!/usr/bin/env python3
"""Shared Mongo helpers for sangha setup / sample seed scripts."""

from __future__ import annotations

import re
from datetime import datetime, timezone

import bcrypt
from pymongo import MongoClient


def composed_password(full_name: str, birth_date: str, birth_month: str) -> str:
    letters = re.sub(r"[^A-Za-z]", "", full_name or "")[:5]
    if not letters or not birth_date or not birth_month:
        return ""
    return f"{letters}{str(birth_date).zfill(2)[:2]}{str(birth_month).zfill(2)[:2]}"


def bcrypt_hash(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


def connect(uri: str) -> MongoClient:
    return MongoClient(uri, serverSelectionTimeoutMS=8000)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def upsert_person(db, person: dict, roles: list[str], plain: str, members: list[dict] | None) -> None:
    now = utc_now()
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
        db["people"].insert_one(doc)
