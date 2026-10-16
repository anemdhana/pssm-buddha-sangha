# Work summary — resume here

**Updated:** 12 Oct 2026  
**Specs:** `Requirements.md` · `Technical.md` · `UI.md`  
**Prototype (reference):** `docs/prototype/`  
**App:** `frontend/` (React) · `backend/` (Spring Boot)

---

## Stack (final)

React + Vite + UIKit 3 · React Router · Fetch (`credentials: 'include'`)  
Java 21 + Spring Boot 3 · Spring Security **session** · Spring Data MongoDB + MongoDB 7 · Maven  
**Modular monolith** (not microservices)  
**Deploy:** Docker Compose — Nginx + Spring Boot + MongoDB on one VPS (resource limits)

---

## Three modules

| # | Module | Status |
|---|--------|--------|
| 1 | **Sangha register** | React Done pages + Spring REST scaffolded |
| 2 | **Supporting events** | Specced — Active/Inactive graph not built |
| 3 | **Accommodation** | Stay booking wizard live; hotels/allotment still next |

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
| `/stay?plan=free\|paid` | Signed-in Stay booking | `POST /api/v1/bookings` |

Also: `GET /auth/me`, `POST /auth/logout`

**Sample PSSM Admin:** mobile `9000000001` · password `PssmA0101`  
**Accommodation Volunteer sample:** `9876511111` · `Meena1005`  
**Frontend:** `cd frontend && npm run dev` (`VITE_USE_MOCK=true` by default)  
**Backend:** `docker compose up -d mongo` then `cd backend && mvn spring-boot:run`  
**Mongo bootstrap:** `python scripts/setup_sangha_db.py`  
**Demo data:** `python scripts/seed_sangha_samples.py --clear --all`

**Roles**

- **PSSM Admin** — People & roles  
- Assignable: Event Organizer · Pyramid Sevadal · PMMA Member · Accommodation Volunteer  
- **Accommodation Admin** — hotels/allotment (docs only)  

**Stay booking (interest list — no room allocation yet)**

- Header event required (not sangha home)  
- Join-like steps: who → place → family → how long (start/end per person) → review  
- Logged-in with profile: prefills and opens at How long  
- Accommodation Volunteer: Myself / New visitor (new visitor → sangha register + booking)  
- Server records `bookedAt` when submitted; status `registered`  
- `/stay/registrations` — Friends and Masters List (volunteer / organizer / admin); filters include stay date ranges; Edit on a family member opens the family step for that person

---

## Next

1. Hotels master, booking cutoff, smart allotment  
2. Receptionist check-in / check-out  
3. Smoke-test live API (`VITE_USE_MOCK=false`) end-to-end  

---

## Spec pointers

- Stack / deploy / register API: **Technical.md** → Sangha register — REST API  
- Join / My Space: **FR-29j**, **US-26j…26c**  
- Accommodation: Event accommodation section · Accommodation Admin US-01+  
