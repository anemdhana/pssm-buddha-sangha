#!/usr/bin/env python3
"""
First-time local Mongo seed for start.cmd.

If the database has no people yet, runs:
  1) setup_sangha_db.py          — indexes + places/centers
  2) seed_release_v1_staff.py    — Dhana admin + Patriji event
  3) seed_jatheeya_ahimsa_2026.py --all — demo people/hotels/allotments

If people already exist, exits 0 without changing data.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

try:
    from pymongo.errors import PyMongoError
except ImportError:
    print("Install deps first:  pip install -r scripts/requirements-db.txt", file=sys.stderr)
    sys.exit(1)

SCRIPTS = Path(__file__).resolve().parent
ROOT = SCRIPTS.parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from sangha_mongo_common import connect  # noqa: E402

DEFAULT_URI = "mongodb://localhost:27017/?replicaSet=rs0"
DEFAULT_DB = "pssm_sangha"
RELEASE_ADMIN_MOBILE = "9445560075"


def run_script(name: str, extra_args: list[str], uri: str, database: str) -> None:
    cmd = [
        sys.executable,
        str(SCRIPTS / name),
        "--uri",
        uri,
        "--database",
        database,
        *extra_args,
    ]
    print(f"  -> {' '.join(cmd)}")
    completed = subprocess.run(cmd, cwd=str(ROOT))
    if completed.returncode != 0:
        raise SystemExit(completed.returncode)


def parse_args():
    p = argparse.ArgumentParser(description="Ensure first-time local seed is present")
    p.add_argument("--uri", default=DEFAULT_URI)
    p.add_argument("--database", default=DEFAULT_DB)
    p.add_argument(
        "--force",
        action="store_true",
        help="Re-run seeds even when people already exist (destructive clear for release staff seed)",
    )
    p.add_argument(
        "--skip-jatheeya",
        action="store_true",
        help="Only setup + release staff/event (no Jatheeya demo hotels/people)",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    try:
        client = connect(args.uri)
        client.admin.command("ping")
        db = client[args.database]
        people_count = db["people"].count_documents({})
        has_release_admin = (
            db["people"].count_documents({"mobile": RELEASE_ADMIN_MOBILE}) > 0
        )
    except PyMongoError as exc:
        print(f"MongoDB error: {exc}", file=sys.stderr)
        print("Is Mongo running? Try: docker compose up -d mongo", file=sys.stderr)
        return 1

    if people_count > 0 and has_release_admin and not args.force:
        print(
            f"Seed already present ({people_count} people, release admin found). Skipping."
        )
        return 0

    if people_count > 0 and not has_release_admin and not args.force:
        print(
            f"Database has {people_count} people but no release admin "
            f"({RELEASE_ADMIN_MOBILE}). Run with --force to re-seed, or seed staff manually."
        )
        return 0

    print("First-time seed: bootstrapping local MongoDB…")
    run_script("setup_sangha_db.py", [], args.uri, args.database)
    # --keep-places: preserve places/centers from setup. Empty DB clear is a no-op.
    run_script("seed_release_v1_staff.py", ["--keep-places"], args.uri, args.database)

    if not args.skip_jatheeya:
        run_script(
            "seed_jatheeya_ahimsa_2026.py",
            ["--people", "--events", "--hotels", "--bookings", "--allotments"],
            args.uri,
            args.database,
        )

    print(
        """
First-time seed complete.

Logins:
  9445560075 / Dhana1405     PSSM Admin + Event Organizer
  9966362691 / Meena1005     Accommodation Volunteer
"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
