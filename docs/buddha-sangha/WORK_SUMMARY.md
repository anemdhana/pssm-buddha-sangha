# Work summary — resume here

**Updated:** 09 Oct 2026  
**Specs:** `Requirements.md` · `Technical.md` · `UI.md`  
**Prototype (reference):** `docs/prototype/`  
**App:** `frontend/` (React) · `backend/` (Spring Boot)

---

## Stack (final)

React + Vite + UIKit 3 · React Router · Fetch (`credentials: 'include'`)  
Java 21 + Spring Boot 3 · Spring Security **session** · JPA + MySQL 8 / H2 local · Flyway · Maven  
**Modular monolith** (not microservices)  
**Deploy:** Docker Compose — Nginx + Spring Boot + MySQL on one VPS (resource limits)

---

## Three modules

| # | Module | Status |
|---|--------|--------|
| 1 | **Sangha register** | React Done pages + Spring REST scaffolded |
| 2 | **Supporting events** | Specced — Active/Inactive graph not built |
| 3 | **Accommodation** | Specced — Stay stub only |

---

## Done (UI / React + matching API)

Join → Login → My Space, roles, admin desk, create event.

| Route | Who | Backend |
|------|-----|---------|
| `/` | Home | — |
| `/join` | Guest | `POST /api/v1/sangha/join` |
| `/login` | Guest | `POST /api/v1/auth/login` |
| `/profile` `/password` | Member | `GET`/`PUT /sangha/me`, `POST /auth/password` |
| `/admin` | PSSM Admin | `GET /sangha/people`, `PUT …/roles`, `DELETE …`, `POST …/admin/claim` |
| `/events` | Event Organizer | `GET`/`POST /api/v1/events` |
| `/stay` | Coming soon | not built |

Also: `GET /auth/me`, `POST /auth/logout`

**Sample PSSM Admin:** mobile `9000000001` · password `PssmA0101`  
**Frontend:** `cd frontend && npm run dev` (`VITE_USE_MOCK=true` by default)  
**Backend:** `cd backend && mvn spring-boot:run` (H2 `local` profile)  
**MySQL sample data:** `python scripts/setup_sangha_db.py` (after `docker compose up -d mysql`)

**Roles**

- **PSSM Admin** — People & roles  
- Assignable: Event Organizer · Pyramid Sevadal · PMMA Member  
- **Accommodation Admin** — docs only  

---

## Next

1. Run frontend against live API (`VITE_USE_MOCK=false`) and smoke-test Done flows  
2. **Accommodation module** — Free/Paid Stay, booking window, smart allotment, receptionist  

---

## Spec pointers

- Stack / deploy / register API: **Technical.md** → Sangha register — REST API  
- Join / My Space: **FR-29j**, **US-26j…26c**  
- Accommodation: Event accommodation section · Accommodation Admin US-01+  
