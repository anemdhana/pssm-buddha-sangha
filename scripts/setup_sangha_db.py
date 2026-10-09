#!/usr/bin/env python3
"""
Create MySQL database + sangha register tables, then import sample rows
so you can browse Join / Login / Admin / Events in the UI against Spring Boot.

Defaults match docker-compose.yml:
  host=localhost port=3306 root=root/root db=pssm_sangha user=pssm/pssm

Usage:
  pip install -r scripts/requirements-db.txt
  docker compose up -d mysql
  python scripts/setup_sangha_db.py

Then start backend with MySQL profile and React with VITE_USE_MOCK=false:
  cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=mysql
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

try:
    import bcrypt
    import pymysql
except ImportError:
    print("Install deps first:  pip install -r scripts/requirements-db.txt", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_SQL = ROOT / "backend" / "src" / "main" / "resources" / "db" / "migration" / "V1__sangha_register.sql"


def composed_password(full_name: str, birth_date: str, birth_month: str) -> str:
    letters = re.sub(r"[^A-Za-z]", "", full_name or "")[:5]
    if not letters or not birth_date or not birth_month:
        return ""
    return f"{letters}{str(birth_date).zfill(2)[:2]}{str(birth_month).zfill(2)[:2]}"


def bcrypt_hash(plain: str) -> str:
    # Spring BCryptPasswordEncoder accepts $2b$ (treated like $2a$)
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


def connect_root(args):
    return pymysql.connect(
        host=args.host,
        port=args.port,
        user=args.root_user,
        password=args.root_password,
        charset="utf8mb4",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )


def connect_app(args):
    return pymysql.connect(
        host=args.host,
        port=args.port,
        user=args.user,
        password=args.password,
        database=args.database,
        charset="utf8mb4",
        autocommit=False,
        cursorclass=pymysql.cursors.DictCursor,
    )


def ensure_database(args) -> None:
    with connect_root(args) as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{args.database}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
            try:
                cur.execute(
                    "CREATE USER IF NOT EXISTS %s@'%%' IDENTIFIED BY %s",
                    (args.user, args.password),
                )
            except pymysql.err.OperationalError:
                try:
                    cur.execute(
                        "CREATE USER %s@'%%' IDENTIFIED BY %s",
                        (args.user, args.password),
                    )
                except pymysql.err.OperationalError as exc:
                    # 1396 user exists
                    if not (exc.args and exc.args[0] == 1396):
                        raise
            try:
                cur.execute(
                    "ALTER USER %s@'%%' IDENTIFIED BY %s",
                    (args.user, args.password),
                )
            except pymysql.err.OperationalError:
                pass
            cur.execute(
                f"GRANT ALL PRIVILEGES ON `{args.database}`.* TO %s@'%%'",
                (args.user,),
            )
            cur.execute("FLUSH PRIVILEGES")
    print(f"Database ready: {args.database}")


def apply_schema(args) -> None:
    cleaned = []
    for line in SCHEMA_SQL.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("--"):
            continue
        cleaned.append(line)
    statements = [s.strip() for s in "\n".join(cleaned).split(";") if s.strip()]

    with connect_app(args) as conn:
        with conn.cursor() as cur:
            for stmt in statements:
                upper = stmt.upper()
                if upper.startswith("CREATE TABLE"):
                    stmt = stmt.replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ", 1)
                try:
                    cur.execute(stmt)
                except pymysql.err.OperationalError as exc:
                    # 1050 table exists, 1061 duplicate index
                    if exc.args and exc.args[0] in (1050, 1061):
                        continue
                    raise
            # Mark Flyway V1 applied so Spring Boot mysql profile does not re-run it
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS flyway_schema_history (
                    installed_rank INT NOT NULL,
                    version VARCHAR(50),
                    description VARCHAR(200) NOT NULL,
                    type VARCHAR(20) NOT NULL,
                    script VARCHAR(1000) NOT NULL,
                    checksum INT,
                    installed_by VARCHAR(100) NOT NULL,
                    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    execution_time INT NOT NULL,
                    success TINYINT(1) NOT NULL,
                    PRIMARY KEY (installed_rank)
                )
                """
            )
            cur.execute("SELECT COUNT(*) AS c FROM flyway_schema_history WHERE version = '1'")
            if cur.fetchone()["c"] == 0:
                cur.execute(
                    """
                    INSERT INTO flyway_schema_history
                    (installed_rank, version, description, type, script, checksum,
                     installed_by, execution_time, success)
                    VALUES (1, '1', 'sangha register', 'SQL', 'V1__sangha_register.sql',
                            NULL, %s, 0, 1)
                    """,
                    (args.user,),
                )
        conn.commit()
    print(f"Schema applied from {SCHEMA_SQL.relative_to(ROOT)}")


PERSON_COLS = [
    "full_name",
    "email",
    "alt_mobile",
    "gender",
    "age_group",
    "meditation",
    "birth_date",
    "birth_month",
    "language",
    "pyramid_center",
    "since_year",
    "id_type",
    "password_hash",
    "live_photo",
    "id_proof_photo",
    "place_kind",
    "place_village",
    "place_town",
    "place_district",
    "place_city",
    "place_state",
    "place_country",
    "updated_at",
]


def person_fields(person: dict, password_plain: str, now: datetime) -> dict:
    return {
        "full_name": person["full_name"],
        "email": person.get("email"),
        "alt_mobile": person.get("alt_mobile"),
        "gender": person.get("gender"),
        "age_group": person.get("age_group", "adult"),
        "meditation": person.get("meditation", "5"),
        "birth_date": person["birth_date"],
        "birth_month": person["birth_month"],
        "language": person.get("language", "English"),
        "pyramid_center": person.get("pyramid_center"),
        "since_year": person.get("since_year"),
        "id_type": person.get("id_type"),
        "password_hash": bcrypt_hash(password_plain),
        "live_photo": person.get("live_photo"),
        "id_proof_photo": person.get("id_proof_photo"),
        "place_kind": person.get("place_kind", "urban"),
        "place_village": person.get("place_village"),
        "place_town": person.get("place_town"),
        "place_district": person.get("place_district"),
        "place_city": person.get("place_city"),
        "place_state": person.get("place_state"),
        "place_country": person.get("place_country", "India"),
        "updated_at": now,
    }


def replace_family(cur, person_id: int, members: list[dict] | None) -> None:
    cur.execute("DELETE FROM sangha_family_member WHERE person_id = %s", (person_id,))
    if not members:
        return
    for order, m in enumerate(members):
        place = m.get("place") or {}
        cur.execute(
            """
            INSERT INTO sangha_family_member
            (person_id, sort_order, name, relation_label, mobile, gender, age_group, meditation,
             addr_mode, id_type, live_photo, id_proof_photo,
             place_kind, place_village, place_town, place_district,
             place_city, place_state, place_country)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                person_id,
                order,
                m.get("name"),
                m.get("relation"),
                m.get("mobile"),
                m.get("gender"),
                m.get("age", m.get("age_group", "adult")),
                m.get("meditation"),
                m.get("addr_mode", "same"),
                m.get("id_type"),
                m.get("live_photo"),
                m.get("id_proof_photo"),
                place.get("kind"),
                place.get("village"),
                place.get("town"),
                place.get("district"),
                place.get("city"),
                place.get("state"),
                place.get("country"),
            ),
        )


def upsert_person(cur, person: dict, roles: list[str], password_plain: str, members: list[dict] | None) -> int:
    mobile = person["mobile"]
    cur.execute("SELECT id FROM sangha_person WHERE mobile = %s", (mobile,))
    row = cur.fetchone()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    fields = person_fields(person, password_plain, now)

    if row:
        person_id = row["id"]
        sets = ", ".join(f"{k} = %s" for k in PERSON_COLS)
        cur.execute(
            f"UPDATE sangha_person SET {sets} WHERE id = %s",
            (*[fields[k] for k in PERSON_COLS], person_id),
        )
        cur.execute("DELETE FROM sangha_person_role WHERE person_id = %s", (person_id,))
    else:
        insert_cols = [
            "mobile",
            "full_name",
            "email",
            "alt_mobile",
            "gender",
            "age_group",
            "meditation",
            "birth_date",
            "birth_month",
            "language",
            "pyramid_center",
            "since_year",
            "id_type",
            "password_hash",
            "live_photo",
            "id_proof_photo",
            "place_kind",
            "place_village",
            "place_town",
            "place_district",
            "place_city",
            "place_state",
            "place_country",
            "created_at",
            "updated_at",
        ]
        placeholders = ", ".join(["%s"] * len(insert_cols))
        cur.execute(
            f"INSERT INTO sangha_person ({', '.join(insert_cols)}) VALUES ({placeholders})",
            (
                mobile,
                fields["full_name"],
                fields["email"],
                fields["alt_mobile"],
                fields["gender"],
                fields["age_group"],
                fields["meditation"],
                fields["birth_date"],
                fields["birth_month"],
                fields["language"],
                fields["pyramid_center"],
                fields["since_year"],
                fields["id_type"],
                fields["password_hash"],
                fields["live_photo"],
                fields["id_proof_photo"],
                fields["place_kind"],
                fields["place_village"],
                fields["place_town"],
                fields["place_district"],
                fields["place_city"],
                fields["place_state"],
                fields["place_country"],
                now,
                now,
            ),
        )
        person_id = cur.lastrowid

    for role in roles:
        cur.execute(
            "INSERT INTO sangha_person_role (person_id, role_id) VALUES (%s, %s)",
            (person_id, role),
        )
    replace_family(cur, person_id, members)
    return person_id


def import_sample_data(args) -> None:
    samples = [
        {
            "person": {
                "mobile": "9000000001",
                "full_name": "Pssm Admin",
                "email": "admin@pssm.example",
                "alt_mobile": "9000000002",
                "gender": "male",
                "age_group": "adult",
                "meditation": "6",
                "birth_date": "01",
                "birth_month": "01",
                "language": "English",
                "pyramid_center": "Pyramid Meditation Center, Hyderabad",
                "since_year": "2010",
                "id_type": "aadhaar",
                "place_kind": "urban",
                "place_city": "Hyderabad",
                "place_state": "Telangana",
                "place_country": "India",
            },
            "roles": ["pssm_admin"],
            "members": [],
        },
        {
            "person": {
                "mobile": "9876543210",
                "full_name": "Ramakrishna",
                "email": "rama@pssm.example",
                "alt_mobile": "9876543211",
                "gender": "male",
                "age_group": "adult",
                "meditation": "5",
                "birth_date": "15",
                "birth_month": "08",
                "language": "Telugu",
                "pyramid_center": "Pyramid Meditation Center, Vijayawada",
                "since_year": "2019",
                "id_type": "aadhaar",
                "place_kind": "urban",
                "place_city": "Vijayawada",
                "place_state": "Andhra Pradesh",
                "place_country": "India",
            },
            "roles": ["event_organizer"],
            "members": [
                {
                    "name": "Sita Devi",
                    "relation": "Spouse",
                    "mobile": "9876543212",
                    "gender": "female",
                    "age": "adult",
                    "meditation": "4",
                    "addr_mode": "same",
                    "id_type": "aadhaar",
                },
                {
                    "name": "Ananya",
                    "relation": "Child",
                    "mobile": "",
                    "gender": "female",
                    "age": "child",
                    "meditation": "new",
                    "addr_mode": "same",
                    "id_type": "",
                },
            ],
        },
        {
            "person": {
                "mobile": "9876501234",
                "full_name": "Lakshmi Devi",
                "email": "lakshmi@pssm.example",
                "alt_mobile": "",
                "gender": "female",
                "age_group": "adult",
                "meditation": "3",
                "birth_date": "22",
                "birth_month": "03",
                "language": "Telugu",
                "pyramid_center": "Indiranagar Pyramid Group",
                "since_year": "2021",
                "id_type": "voter",
                "place_kind": "urban",
                "place_city": "Bengaluru",
                "place_state": "Karnataka",
                "place_country": "India",
            },
            "roles": ["pyramid_sevadal"],
            "members": [
                {
                    "name": "Venkat Rao",
                    "relation": "Spouse",
                    "mobile": "9876501235",
                    "gender": "male",
                    "age": "adult",
                    "meditation": "2",
                    "addr_mode": "same",
                    "id_type": "pan",
                }
            ],
        },
        {
            "person": {
                "mobile": "9876511111",
                "full_name": "Meena Shah",
                "email": "meena@pssm.example",
                "alt_mobile": "9876511112",
                "gender": "female",
                "age_group": "adult",
                "meditation": "2",
                "birth_date": "10",
                "birth_month": "05",
                "language": "Hindi",
                "pyramid_center": "Pyramid Meditation Center, Hyderabad",
                "since_year": "2020",
                "id_type": "passport",
                "place_kind": "urban",
                "place_city": "Hyderabad",
                "place_state": "Telangana",
                "place_country": "India",
            },
            "roles": ["pmma_member"],
            "members": [],
        },
        {
            "person": {
                "mobile": "9876522222",
                "full_name": "Ravi Kumar",
                "email": "ravi@pssm.example",
                "alt_mobile": "",
                "gender": "male",
                "age_group": "senior",
                "meditation": "6",
                "birth_date": "05",
                "birth_month": "11",
                "language": "Telugu",
                "pyramid_center": "Village Pyramid Group, Kadthal",
                "since_year": "2012",
                "id_type": "aadhaar",
                "place_kind": "rural",
                "place_village": "Kadthal",
                "place_town": "Amangal",
                "place_district": "Ranga Reddy",
                "place_city": "",
                "place_state": "Telangana",
                "place_country": "India",
            },
            "roles": [],
            "members": [
                {
                    "name": "Padma",
                    "relation": "Spouse",
                    "mobile": "9876522223",
                    "gender": "female",
                    "age": "senior",
                    "meditation": "5",
                    "addr_mode": "same",
                    "id_type": "aadhaar",
                },
                {
                    "name": "Karthik",
                    "relation": "Child",
                    "mobile": "9876522224",
                    "gender": "male",
                    "age": "adult",
                    "meditation": "1",
                    "addr_mode": "new",
                    "id_type": "driving",
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

    with connect_app(args) as conn:
        with conn.cursor() as cur:
            print("\nSample logins (password = ≤5 letters of name + DDMM):")
            for item in samples:
                p = item["person"]
                plain = composed_password(p["full_name"], p["birth_date"], p["birth_month"])
                upsert_person(cur, p, item["roles"], plain, item.get("members"))
                roles = ",".join(item["roles"]) or "(none)"
                fam = len(item.get("members") or [])
                print(
                    f"  {p['mobile']}  {plain:12}  {p['full_name']}"
                    f"  [{roles}]  family={fam}  place={p.get('place_kind')}"
                )

            cur.execute("DELETE FROM sangha_event WHERE id IN (%s, %s)", ("evt_sample_dhyana", "evt_sample_dussehra"))
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            cur.executemany(
                """
                INSERT INTO sangha_event
                (id, name, start_date, end_date, created_by_mobile, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                [
                    (
                        "evt_sample_dhyana",
                        "Dhyana Maha Yagam - 5",
                        date(2026, 12, 21),
                        date(2026, 12, 31),
                        "9876543210",
                        now,
                    ),
                    (
                        "evt_sample_dussehra",
                        "Dussehra Sangeetha Dhyana Maha Yagnam",
                        date(2026, 10, 17),
                        date(2026, 10, 20),
                        "9876543210",
                        now,
                    ),
                ],
            )
            print("\nSample events: Dhyana Maha Yagam - 5, Dussehra Sangeetha Dhyana Maha Yagnam")
        conn.commit()
    print("\nSample data imported (people + family + events).")


def parse_args():
    p = argparse.ArgumentParser(description="Create sangha MySQL DB, tables, and sample data")
    p.add_argument("--host", default="localhost")
    p.add_argument("--port", type=int, default=3306)
    p.add_argument("--root-user", default="root")
    p.add_argument("--root-password", default="root")
    p.add_argument("--database", default="pssm_sangha")
    p.add_argument("--user", default="pssm")
    p.add_argument("--password", default="pssm")
    p.add_argument("--skip-create-db", action="store_true", help="Assume DB/user already exist")
    p.add_argument("--data-only", action="store_true", help="Skip schema; only upsert sample rows")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    if not SCHEMA_SQL.exists():
        print(f"Missing schema file: {SCHEMA_SQL}", file=sys.stderr)
        return 1
    try:
        if not args.skip_create_db and not args.data_only:
            ensure_database(args)
        if not args.data_only:
            apply_schema(args)
        import_sample_data(args)
    except pymysql.err.OperationalError as exc:
        print(f"MySQL error: {exc}", file=sys.stderr)
        print("Is MySQL running? Try: docker compose up -d mysql", file=sys.stderr)
        return 1

    print(
        """
Next:
  1. cd backend
     mvn spring-boot:run -Dspring-boot.run.profiles=mysql
  2. In frontend/.env set VITE_USE_MOCK=false
  3. cd frontend && npm run dev
  4. Login as 9000000001 / PssmA0101  (PSSM Admin)
     or 9876543210 / Ramak1508        (Event Organizer)
"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
