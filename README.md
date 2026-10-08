# PSSM Buddha Sangha

Package name: **`pssm-buddha-sangha`**.

A club of Buddhas under the Pyramid Spiritual Societies Movement (PSSM). People join the sangha with their details and family, support spiritual events, and can book event accommodation without typing those details again.

## What the system does

- **Join the sangha** — visitor and family details, place, and meditation background
- **Login to My Space** — password from the first five letters of the name plus date and month of birth (prototype uses event code `DMY5` in front)
- **Event accommodation** — free or paid stay for events such as Dhyana Maha Yagam; details can be prefilled from the sangha join record (a copy; edits for stay do not change the join)

Accommodation also covers organizer workflows when built out: booking closes two days before the event, Admin runs smart room allocation, hotel reception check-in and check-out, and live sync for Admin and reception.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML5, UIKit 3, Alpine.js |
| Backend | Node.js, Express.js |
| Real-time | Socket.io (accommodation desk) |
| Notifications | WhatsApp (accommodation) |
| Database | MySQL |
| Auth | JWT with roles: Admin, Sangha member, Hotel Receptionist, Visitor |

Architecture is a modular monolith (sangha register, event support, accommodation registration and allotment, check-in/check-out, notifications, admin). Microservices and Kafka are deferred until the system grows beyond a single event.

## Documentation

### Buddha Sangha

| Document | Location |
| --- | --- |
| Overview | `docs/buddha-sangha/README.md` |
| Requirements | `docs/buddha-sangha/requirements/PSSM_Buddha_Sangha_Requirements.md` |
| User stories | `docs/buddha-sangha/requirements/PSSM_Buddha_Sangha_User_Stories.md` |
| Technical spec | `docs/buddha-sangha/technical/PSSM_Buddha_Sangha_Technical_Spec.md` |
| Register summary | `docs/buddha-sangha/technical/PSSM_Buddha_Sangha_Register_Summary.md` |
| UI prototype notes | `docs/buddha-sangha/assets/PSSM_Buddha_Sangha_UI_Prototype.md` |

### Event accommodation (module)

| Document | Location |
| --- | --- |
| Requirements | `docs/requirements/PSSM_Event_Accommodation_Requirements.md` |
| User stories | `docs/requirements/PSSM_Event_Accommodation_User_Stories.md` |
| Technical spec | `docs/technical/PSSM_Event_Accommodation_Technical_Spec.md` |
| Allocation summary | `docs/technical/PSSM_Event_Accommodation_Allocation_Summary.md` |
| REST API | `docs/technical/PSSM_Event_Accommodation_API.md` |
| UI prototype notes | `docs/assets/PSSM_Event_Accommodation_UI_Prototype.md` |
| UIkit guide | `docs/assets/PSSM_Event_Accommodation_UIKit_Guide.md` |

## Prototype

Static look-and-feel pages (not application code):

| Page | Path |
| --- | --- |
| Landing | `docs/prototype/index.html` |
| Join | `docs/prototype/join.html` |
| Login | `docs/prototype/login.html` |
| Accommodation | `docs/prototype/visitor.html` |

Open `docs/prototype/index.html` in a browser.

## Layout

```text
docs/buddha-sangha/   sangha requirements, technical notes, UI notes
docs/requirements/    event accommodation requirements and user stories
docs/technical/       event accommodation technical docs and API
docs/decisions/       architecture decision records
docs/assets/          screenshots, diagrams, UIkit guide
docs/prototype/       static look-and-feel pages
src/frontend/         HTML + UIKit 3 + Alpine.js
src/backend/          Node.js + Express + Socket.io
src/shared/           code shared by frontend and backend
database/             SQL scripts and migrations
scripts/              utility scripts
```

Copy `.env.example` to `.env` before running the application. Application code is not implemented yet.
