# PSSM Buddha Sangha

Package name: **`pssm-buddha-sangha`**.

A club of Buddhas under the Pyramid Spiritual Societies Movement (PSSM). People join the sangha with their details and family, support spiritual events, and can book event accommodation without typing those details again.

## Three modules

1. **Sangha register** — masters list, places, dashboard groups  
2. **Supporting events** — active events (Register Admin sets Active/Inactive anytime) and budget support  
3. **Accommodation** — hotels, Free/Paid Stay, allotment, receptionist desk (**Accommodation Admin**)

**PSSM Admin** (People & roles) assigns Event Organizer / Pyramid Sevadal / PMMA Member. That role is separate from **Accommodation Admin**.

## What the system does

### Built (UI prototype in `docs/prototype/`)

- **Join the sangha** — who / place / optional family / review; optional photos; temporary password from name + birth
- **Login to My Space** — mobile + password; Stay + Account chrome after login
- **My Profile / Change password** — edit join record; change password
- **Roles** — PSSM Admin assigns Event Organizer, Pyramid Sevadal, PMMA Member
- **PSSM Admin desk** — People & roles: search (1..n), assign/remove roles, remove person
- **Create event** — Event Organizer sets name, start, end for later Stay

### Next

- **Accommodation module** (Accommodation Admin) for already joined sangha people — Free / Paid Stay against an event, booking window, smart room allocation, receptionist check-in/out. Prefill from a **copy** of the join record; Stay edits do not change the join.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML5, UIKit 3, Alpine.js |
| Backend | Node.js, Express.js |
| Real-time | Socket.io (accommodation desk) |
| Notifications | WhatsApp (accommodation) |
| Database | MySQL |
| Auth | JWT with roles: Register Admin, PSSM Admin (People & roles), Event Organizer, Pyramid Sevadal, PMMA Member, Sangha member, **Accommodation Admin**, Hotel Receptionist, Visitor |

Architecture is a modular monolith (sangha register, event support, accommodation registration and allotment, check-in/check-out, notifications, admin). Microservices and Kafka are deferred until the system grows beyond a single event.

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

## Layout

```text
docs/buddha-sangha/   Requirements, Technical, UI
docs/prototype/       static look-and-feel pages
docs/decisions/       architecture decision records
docs/assets/          screenshots and diagrams
src/frontend/         HTML + UIKit 3 + Alpine.js
src/backend/          Node.js + Express + Socket.io
src/shared/           code shared by frontend and backend
database/             SQL scripts and migrations
scripts/              utility scripts
```

Copy `.env.example` to `.env` before running the application. Application code is not implemented yet.
