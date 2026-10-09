# PSSM Buddha Sangha

Package name: **`pssm-buddha-sangha`**.

A club of Buddhas under the Pyramid Spiritual Societies Movement (PSSM). People join the sangha with their details and family, support spiritual events, and can book event accommodation without typing those details again.

## Three modules

1. **Sangha register** — masters list, places, dashboard groups  
2. **Supporting events** — active events (Register Admin sets Active/Inactive anytime) and budget support  
3. **Accommodation** — hotels, Free/Paid Stay, allotment, receptionist desk (**Accommodation Admin**)

**PSSM Admin** (People & roles) assigns Event Organizer / Pyramid Sevadal / PMMA Member. That role is separate from **Accommodation Admin**.

## What the system does

### Built (React app in `frontend/`)

Sangha register Join → My Space migrated from the static prototype (mock API, session-shaped for Spring Security later):

- **Join the sangha** — who / place / family / review; temporary password from name + birth
- **Login to My Space** — mobile + password
- **My Profile / Change password**
- **PSSM Admin desk** — People & roles
- **Create event** — Event Organizer
- Stay links show a **Coming soon** stub (accommodation next)

### Reference prototype

Static HTML under `docs/prototype/` remains for look-and-feel reference.

### Built (Spring Boot in `backend/`)

Register REST for the Done pages only (`/auth/*`, `/sangha/*`, `/events`) — session cookie auth, Flyway, seed admin.

### Next

- Point React at live API (`VITE_USE_MOCK=false`) and harden CSRF/CORS for production
- **Accommodation module** — Free / Paid Stay, allotment, receptionist desk

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React.js + Vite, UIKit 3, React Router, Axios/Fetch |
| Backend | Java 21 + Spring Boot 3.x (Maven) |
| Security | Spring Security, **session-based** auth (not JWT) |
| ORM / DB | Spring Data JPA + Hibernate, MySQL 8, Flyway |
| Validation | Jakarta Bean Validation |
| Real-time | Spring WebSocket (accommodation desk) |
| Notifications | WhatsApp (accommodation) |
| Deploy | Docker Compose — Nginx + Spring Boot + MySQL on one VPS (resource limits) |

**Architecture:** single Spring Boot **modular monolith** (register, event support, accommodation, check-in/out, notifications, admin). Not microservices.

## Documentation

Three specs under `docs/buddha-sangha/` (register + accommodation in each):

| Document | Path |
| --- | --- |
| Requirements | [`docs/buddha-sangha/Requirements.md`](docs/buddha-sangha/Requirements.md) |
| Technical | [`docs/buddha-sangha/Technical.md`](docs/buddha-sangha/Technical.md) |
| UI | [`docs/buddha-sangha/UI.md`](docs/buddha-sangha/UI.md) |

## Prototype

Static look-and-feel pages (not application code):

| Page | Path |
| --- | --- |
| Landing | `docs/prototype/index.html` |
| Join | `docs/prototype/join.html` |
| Login | `docs/prototype/login.html` |
| Profile | `docs/prototype/profile.html` |
| Change password | `docs/prototype/password.html` |
| Create event | `docs/prototype/events.html` (Event Organizer) |
| People & roles | `docs/prototype/admin.html` (PSSM Admin) |
| Accommodation | `docs/prototype/visitor.html` |

Open `docs/prototype/index.html` in a browser. Join stores a sangha profile in the browser (`localStorage`). Login loads roles pre-assigned by PSSM Admin (Event Organizer, Pyramid Sevadal, PMMA Member). PSSM Admin lands on People & roles to search by mobile, assign/remove roles, and remove people. An Event Organizer can create events (name, start, end) for later Stay. Accommodation opens a **copy** of that profile; edits there do not change the sangha join record.

## Run the React app

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — mock API is on by default (`VITE_USE_MOCK=true`). Sample PSSM Admin: mobile `9000000001`, password `PssmA0101`.

```bash
npm test
npm run build
```

## Run the Spring Boot API

```bash
cd backend
mvn spring-boot:run
```

Default profile `local` uses in-memory H2 (no Docker required). Sample admin: `9000000001` / `PssmA0101`.

Optional MySQL (create DB + tables + sample UI data):

```bash
docker compose up -d mysql
pip install -r scripts/requirements-db.txt
python scripts/setup_sangha_db.py
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

Sample logins printed by the script (admin `9000000001` / `PssmA0101`).

Wire React to the live API:

```bash
# frontend/.env
VITE_USE_MOCK=false
```

Vite already proxies `/api` → `http://localhost:8080`.

## Layout

```text
docs/buddha-sangha/   Requirements, Technical, UI, WORK_SUMMARY
docs/prototype/       static look-and-feel reference (UIKit)
frontend/             React + Vite + UIKit 3 (Done register pages)
backend/              Spring Boot 3 + Maven (register REST)
docker-compose.yml    MySQL 8 (optional; local profile uses H2)
```
