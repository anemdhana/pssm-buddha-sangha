# Technical
## PSSM Buddha Sangha (pssm-buddha-sangha)

**Project:** pssm-buddha-sangha  
**Version:** 2.8 (Living Document)  
**Last Updated:** 09 October 2026  

Sangha register technical notes and event accommodation (allocation + REST API) in one place.

---

## Table of contents

- [Three modules](#three-modules)
- [Chosen technical stack](#chosen-technical-stack)
- [Production deployment](#production-deployment)
- [Prototype (static UI + browser logic)](#prototype-static-ui-browser-logic)
  - [Pages](#pages)
  - [Browser storage keys](#browser-storage-keys)
  - [Roles](#roles)
  - [Main flows (prototype)](#main-flows-prototype)
  - [Next technical work (accommodation)](#next-technical-work-accommodation)
- [Sangha register](#sangha-register)
  - [2. Recommended Technical Stack](#2-recommended-technical-stack)
  - [3. System Overview](#3-system-overview)
  - [4. Core Entities](#4-core-entities)
  - [5. Sample Data](#5-sample-data)
  - [6. Register Rules](#6-register-rules)
  - [7. Next Steps / Open Items / Decisions](#7-next-steps-open-items-decisions)
  - [8. Project Structure & Documentation Organization](#8-project-structure-documentation-organization)
- [Sangha register — REST API](#sangha-register--rest-api)
  - [Conventions](#conventions)
  - [Auth](#auth)
  - [Join and My Profile](#join-and-my-profile)
  - [PSSM Admin — people and roles](#pssm-admin--people-and-roles)
  - [Events (Event Organizer)](#events-event-organizer)
  - [Endpoint index](#endpoint-index)
- [Part B — Register summary](#part-b-register-summary)
  - [What one row means](#what-one-row-means)
  - [Active events](#active-events)
  - [Dashboard](#dashboard)
  - [How a row is kept](#how-a-row-is-kept)
- [Event accommodation](#event-accommodation)
  - [2. Recommended Technical Stack](#2-recommended-technical-stack-1)
  - [2.1 Microservices + Kafka – Recommendation](#21-microservices-kafka-recommendation)
  - [3. System Overview](#3-system-overview-1)
  - [4. Core Entities (High-Level Data Model)](#4-core-entities-high-level-data-model)
  - [5. Sample Master Data – Hotels & Rooms](#5-sample-master-data-hotels-rooms)
  - [6. Identification & ID Card Process](#6-identification-id-card-process)
  - [7. Room Allotment Logic (High-Level)](#7-room-allotment-logic-high-level)
  - [8. Next Steps / Open Items / Decisions](#8-next-steps-open-items-decisions)
  - [9. Project Structure & Documentation Organization](#9-project-structure-documentation-organization)
- [Accommodation — Allocation summary](#accommodation-allocation-summary)
  - [When allocation runs](#when-allocation-runs)
  - [1. Two gents](#1-two-gents)
  - [2. Two ladies](#2-two-ladies)
  - [3. Couple (one gent and one lady, husband and wife)](#3-couple-one-gent-and-one-lady-husband-and-wife)
  - [4. Other cases](#4-other-cases)
- [Accommodation — REST API](#accommodation-rest-api)
  - [1. Conventions](#1-conventions)
  - [2. Shared shapes](#2-shared-shapes)
  - [3. Auth](#3-auth)
  - [4. Event and booking window](#4-event-and-booking-window)
  - [5. Place autocomplete](#5-place-autocomplete)
  - [6. Hotels](#6-hotels)
  - [7. Rooms](#7-rooms)
  - [8. Visitor booking](#8-visitor-booking)
  - [9. Identity and ID card](#9-identity-and-id-card)
  - [10. Accommodation Admin booking list](#10-accommodation-admin-booking-list)
  - [11. Smart allocation](#11-smart-allocation)
  - [12. Manual changes after confirm](#12-manual-changes-after-confirm)
  - [13. Hotel receptionist](#13-hotel-receptionist)
  - [14. Notifications](#14-notifications)
  - [15. Endpoint index](#15-endpoint-index)

---
## Three modules

| # | Module | What it covers | Typical role |
| --- | --- | --- | --- |
| 1 | **Sangha register** | Masters register: add/edit people, places, dashboard groups | Register Admin / Sangha member |
| 2 | **Supporting events** | Active events (Register Admin can set Active/Inactive anytime), budgets, host-first support, equal share | Register Admin / Sangha member |
| 3 | **Accommodation** | Hotels, rooms, Free/Paid Stay for an event, booking window, smart allotment, receptionist check-in/out | **Accommodation Admin**, Hotel Receptionist, Visitor |

**Role note:** **PSSM Admin** (People & roles on My Space) assigns Event Organizer / Pyramid Sevadal / PMMA Member / Accommodation Volunteer. **Accommodation Volunteer** books Free/Paid stay (including for new visitors, who are added to the sangha register). That is not the same as **Accommodation Admin**, who runs hotels and room allotment for Stay.

## Chosen technical stack

**Decision (final):** one shared stack for all three modules. Build as a **single Spring Boot modular monolith** — not microservices.

| Layer | Choice |
| --- | --- |
| Frontend | **React.js + Vite** |
| UI framework | **UIKit 3** |
| Routing | **React Router** |
| API client | **Axios** or Fetch API |
| Backend | **Java 21 + Spring Boot 3.x** |
| Security | **Spring Security** |
| Authentication | **Session-based** (HTTP session cookie; not JWT) |
| Database | **MongoDB 7** |
| Persistence | **Spring Data MongoDB** |
| Validation | **Jakarta Bean Validation** |
| Schema | **Document indexes (app startup + setup script)** |
| Build | **Maven** (backend) · Vite (frontend) |
| Real-time (accommodation desk) | **Spring WebSocket** (STOMP) for in-app pushes; **WhatsApp** for alerts |
| Deployment | **Docker Compose** |

**Architecture:** modular packages inside one Spring Boot app (register, supporting events, accommodation, notifications, auth). Same MongoDB database; clear module boundaries in code.

## Production deployment

**Target:** one VPS running **Nginx**, **Spring Boot**, and **MongoDB** via **Docker Compose**, with **resource limits** on each service.

| Service | Role |
| --- | --- |
| Nginx | TLS termination, static React build, reverse proxy `/api` (and WebSocket) to Spring Boot |
| Spring Boot | Single API + session auth + business modules |
| MongoDB 7 | Persistent data; indexes ensured on app start |

Compose sets CPU/memory limits so one noisy service cannot starve the others. Dev can run the same three services locally with Compose.

## Prototype (static UI + browser logic)

**Location:** `docs/prototype/`  
**Shared script:** `app-profile.js` · **Shared styles:** `app.css` · **UI kit:** UIkit 3.21.x  

This layer is the look-and-feel and interaction draft for Join / My Space. It is not the React + Spring Boot app. Production will replace `localStorage` with **session auth + MongoDB** while keeping the same flows.

### Pages

| Page | File | Who |
| --- | --- | --- |
| Landing | `index.html` | Guest / signed-in |
| Join | `join.html` | Guest |
| Login | `login.html` | Guest (sample PSSM Admin seed for UI checks) |
| My Profile | `profile.html` | Signed-in |
| Change password | `password.html` | Signed-in |
| People & roles | `admin.html` | PSSM Admin |
| Create event | `events.html` | Event Organizer |
| Stay booking | React `/stay?plan=free\|paid` (+ `visitor.html` prototype) | Signed-in; header event; join-like wizard + per-person stay dates; Accommodation Volunteer can register new visitors |

### Browser storage keys

| Key | Purpose |
| --- | --- |
| `pssm_sangha_people` | Map of mobile → sangha person profile (multi-person) |
| `pssm_sangha_profile` | Last-touched profile (legacy / unsigned prefill) |
| `pssm_sangha_session` | Signed-in mobile, name, roles |
| `pssm_role_assignments` | Mobile → role id list |
| `pssm_events` / Mongo `events` | Events created by organizers (name, start, end, location, expectedBudgetInr, optional meditationHoursPerDay) |

### Roles

| Role id | Label | Who assigns | Unlocks |
| --- | --- | --- | --- |
| `pssm_admin` | PSSM Admin | Bootstrap claim / ops | `admin.html` landing, People & roles |
| `event_organizer` | Event Organizer | PSSM Admin | `events.html` |
| `pyramid_sevadal` | Pyramid Sevadal | PSSM Admin | Later Stay priority |
| `pmma_member` | PMMA Member | PSSM Admin | Later Stay / PMMA flows |
| `accommodation_volunteer` | Accommodation Volunteer | PSSM Admin | Book stay for new visitors (join + booking together) |

Assignable by Admin UI: Event Organizer, Pyramid Sevadal, PMMA Member only. PSSM Admin is preserved when member roles are saved.

### Main flows (prototype)

1. **Join** → upsert person by mobile → show composed password (`≤5` name letters + `DDMM`).  
2. **Login** → verify mobile + password → sync roles → session → home (`admin.html` if PSSM Admin, else `index.html`).  
3. **My Profile** → edit join fields → save person; roles read-only.  
4. **PSSM Admin** → search mobile (1..n results) → collapse search → select person → save roles / remove (UIkit confirm).  
5. **Event Organizer** → create event → list + header event picker.  
6. **Stay** → open Free/Paid; copy join into visitor wizard (edits do not write back to join).

### Next technical work (accommodation)

Next: Accommodation module — wire Stay to events from `pssm_events` (then MongoDB events), booking cutoff, smart allocation, receptionist desk, Spring WebSocket / WhatsApp — see Event accommodation sections below. Prefer people who already have a sangha join record.

## Sangha register

### 2. Recommended Technical Stack

Uses the [Chosen technical stack](#chosen-technical-stack) for the whole project.

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | **React + Vite + UIKit 3** | React Router; Axios/Fetch to the API. |
| Backend | **Java 21 + Spring Boot 3.x** | Modular monolith package for places, members, dashboard, active-events support. |
| Database | **MongoDB 7** + Spring Data MongoDB | Places collection and embedded family members. |
| Authentication | **Spring Security session** + roles **Admin** and **Sangha member** | Both can open the dashboard. Admin keeps the register. |

**Architecture style:** modular monolith modules for places, members (add, edit, view, search), people dashboard, active-events support graph, and sign-in.

The accommodation module in this same Spring Boot app also uses WebSocket and WhatsApp. The sangha register does not. There is no live hotel desk and no notification channel to build for the register alone.

---

### 3. System Overview

Admin or a person in the sangha signs in and opens the support page: a photo circle, and one box per active event in a column ordered by remaining contributions, highest first. The people dashboard is the next page.

- See persons grouped by location, with the count of masters in each place
- See the same persons grouped by pyramid center, with the count of masters in each center
- Admin adds a person, choosing place from the autocomplete list
- Admin edits a person, views one person, and searches

Each person is one row. The row is the statement that this person is part of the sangha and practices meditation as taught by Patriji. On the dashboard that person is counted as a master.

---

### 4. Core Entities

| Entity | Description | Key attributes |
| --- | --- | --- |
| Place | A city or town that can be chosen on a person | Place ID, Name |
| Member | One person on the sangha register | Member ID, Full name, Mobile, Place, Pyramid center or group, Since |

**Place**

| Column | Required | Notes |
| --- | --- | --- |
| id | Yes | System key |
| name | Yes | City or town. Unique. This is the autocomplete list |

**Member**

| Column | Required | Notes |
| --- | --- | --- |
| id | Yes | System key. Admin does not type this. |
| full_name | Yes | Who |
| mobile | Yes | How to reach them. Valid phone format. Shown to Admin. |
| place_id | Yes | City or town. Foreign key to Place. Chosen from autocomplete. Free text is not stored. |
| pyramid_center | Yes | Pyramid center or group they sit with |
| since_year | No | Four-digit year they began, if known. Null when unknown. Not a future year. |
| created_at | Yes | System time the row was saved |
| updated_at | Yes | System time the row was last changed |

`created_at` and `updated_at` are bookkeeping. They are not fields on the form.

---

### 5. Sample Data

These rows are examples for development. They are not a real register.

| Full name | Mobile | Place | Pyramid center or group | Since |
| --- | --- | --- | --- | --- |
| Lakshmi Rao | 9000000001 | Vijayawada | Pyramid Meditation Center, Vijayawada | 2014 |
| Ravi Kumar | 9000000002 | Bengaluru | Indiranagar Pyramid Group | 2019 |
| Meena Shah | 9000000003 | Hyderabad | Pyramid Meditation Center, Hyderabad | |
| Anil Reddy | 9000000004 | Vijayawada | Pyramid Meditation Center, Vijayawada | 2016 |

Places on the list: Vijayawada, Bengaluru, Hyderabad. Meena Shah has no since year. That row is still a complete record.

Grouped by location, the counts are Vijayawada 2, Bengaluru 1, Hyderabad 1. Grouped by pyramid center, Pyramid Meditation Center, Vijayawada is 2, and the other two centers are 1 each.

---

### 6. Register Rules

1. Admin creates and edits every person. A sangha member does not add or edit rows.
2. Admin keeps the place list. A person row stores `place_id`, never a typed city name.
3. Autocomplete filters that list as the user types. The user must select one row. Text that does not match a place is rejected.
4. A save requires full name, mobile, place, and pyramid center or group.
5. Since may be empty.
6. When since is present, store it as a four-digit year that is not after the current year.
7. Reject a mobile value that is not a valid phone format.
8. The dashboard groups members by place. Each group heading is the place name and `COUNT(*)` of members with that `place_id`.
9. The same members can be grouped by `pyramid_center`. Each group heading is the center name and the count of members with that exact name.
10. Search compares the typed text with full name, mobile, place name, pyramid center or group, and since. Matching is case-insensitive. Admin uses search.
11. The dashboard shows full name, place, pyramid center or group, and since. Mobile is on the Admin detail screen.

---

### 7. Next Steps / Open Items / Decisions

| Item | Status / Decision |
| --- | --- |
| Who may open the dashboard | **Decision:** A signed-in Admin or a signed-in person already on the register |
| Who may add and edit | **Decision:** Admin only |
| Place | **Decision:** Chosen from the autocomplete place list. No free-form text |
| Dashboard groups | **Decision:** By location, and by pyramid center. Each group shows the count of masters |
| Fields on a person | **Decision:** Full name, mobile, place, pyramid center or group, since. No other personal fields |
| Since | **Decision:** Optional year. Empty means the year is not known |
| Member self-registration | **Decision:** Not in this version. Admin enters each person. That person can then sign in and see the dashboard |
| Mobile on the dashboard | **Decision:** Shown to Admin on the person detail. Hidden from the sangha member view |
| Active events | **Decision:** Boxes in one column for events marked **Active**. Register Admin can set Active/Inactive at any time, as often as needed. No fixed count of five; no weekly replace-all |
| Who is part of the contribution | **Decision:** 1,44,000 meditators across the globe |
| Remaining | **Decision:** For each event, 1,44,000 minus how many are shown as supported. Boxes are ordered top to bottom, highest remaining first. Inside a box, each place shows how many people from that city or town are not yet supported, highest remaining first |
| Support | **Decision:** People in the city or state where the event happens must support first. An able person there may enter an extra amount. Other locations are allotted only the amount still needed after that |
| Ask someone to contribute | **Decision:** A person who is unable, including in the host city or state, asks another person to contribute for them, and is shown as supported |
| What the graph shows | **Decision:** The person who asked is shown as supported. The name of the person who contributed is shown beside them. One total: how much is supported |
| Person in the circle | **Decision:** The person's photo is shown in the circle. Under it: contribution lines for each **Active** event, then their feedback / comments |
| Database schema (indexes, exact SQL) | TODO when implementation starts |
| API endpoints | **Decision:** REST contract in [Sangha register — REST API](#sangha-register--rest-api). Session cookie auth (no JWT). React mock in `frontend/` matches these paths for later Spring Boot controllers |
| Notifications, photos, ID proof | **Decision:** Out of scope |

---

### 8. Project Structure & Documentation Organization

```text
pssm-buddha-sangha/
├── docs/
│   ├── buddha-sangha/
│   │   ├── Requirements.md
│   │   ├── Technical.md
│   │   ├── UI.md
│   │   └── WORK_SUMMARY.md
│   └── prototype/
├── frontend/                 # React + Vite + UIKit 3
├── backend/                  # Spring Boot 3 (Maven), modular packages
│   └── src/main/java/.../domain/         # Mongo documents
├── docker-compose.yml        # Nginx + Spring Boot + MongoDB
├── README.md
└── .gitignore
```

**Documentation:** `docs/buddha-sangha/{Requirements,Technical,UI,WORK_SUMMARY}.md`.

---

## Sangha register — REST API

Base URL: `/api/v1`  
Format: JSON  
Auth: **Spring Security session cookie** (same-origin / `credentials: 'include'`). No Bearer JWT.

These endpoints back Join → Login → My Space, PSSM Admin People & roles, and Event Organizer create-event. The React app in `frontend/` calls the same paths (mock by default) so Spring Boot controllers can bind 1:1 later.

### Conventions

| Item | Rule |
| --- | --- |
| Success | `{ "data": ... }` |
| List success | `{ "data": [ ... ] }` |
| Error | `{ "error": { "code": "UNAUTHORIZED", "message": "..." } }` |
| Mobile | Digits only in storage and path params |
| Roles | `pssm_admin`, `event_organizer`, `pyramid_sevadal`, `pmma_member`, `accommodation_volunteer` |

| HTTP | When |
| --- | --- |
| 400 | Missing or invalid field |
| 401 | Not signed in, or session expired |
| 403 | Role not allowed |
| 404 | Unknown mobile / resource |
| 409 | Conflict (e.g. cannot remove self) |

### Auth

#### `POST /auth/login`

Request

```json
{ "mobile": "9000000001", "password": "PssmA0101" }
```

Response `200` (session cookie set)

```json
{
  "data": {
    "mobile": "9000000001",
    "name": "Pssm Admin",
    "roles": ["pssm_admin"],
    "home": "/admin"
  }
}
```

`home` is `/admin` when the user has `pssm_admin`, otherwise `/`.

#### `POST /auth/logout`

Response `200`: `{ "data": { "ok": true } }`. Clears the session cookie.

#### `GET /auth/me`

Response `200`

```json
{
  "data": {
    "mobile": "9000000001",
    "name": "Pssm Admin",
    "roles": ["pssm_admin"]
  }
}
```

`401` when not signed in.

#### `POST /auth/password`

Visitor/member, while signed in.

```json
{
  "currentPassword": "PssmA0101",
  "newPassword": "a password they choose",
  "confirmPassword": "a password they choose"
}
```

Response `200`: `{ "data": { "ok": true } }`. New password must be at least 6 characters and must match confirm.

### Join and My Profile

#### `POST /sangha/join`

Create a sangha person by mobile. Returns the temporary composed password (≤5 name letters + DDMM). If the mobile is already registered, responds `409` `MOBILE_TAKEN` (login instead of joining again).

Request body is the join profile (who / place / family fields used by the UI). Minimum required for a successful join: `fullName`, `mobile`, `birthDate`, `birthMonth`, and a place object.

Response `201`

```json
{
  "data": {
    "profile": { "mobile": "9876543210", "fullName": "Ramakrishna", "roles": [] },
    "temporaryPassword": "Ramak1508"
  }
}
```

Does not open a session by itself; the person logs in next.

#### `GET /sangha/me`

Signed-in member. Response `200`: `{ "data": { ...profile } }` including roles. Mobile is always the session mobile.

#### `PUT /sangha/me`

Signed-in member. Body is the full profile fields (same shape as join). Response `200`: `{ "data": { ...profile } }`.

### PSSM Admin — people and roles

#### `GET /sangha/people?mobile=`

PSSM Admin only. Search by mobile digits (partial match allowed).

Response `200`: `{ "data": [ { "mobile", "fullName", "pyramidCenter", "roles": [] } ] }`  
`404` when no matches (optional: empty list with `200` is also acceptable; mock returns `404` with message for UI parity).

#### `PUT /sangha/people/{mobile}/roles`

PSSM Admin only. Body: `{ "roles": ["event_organizer", "pyramid_sevadal"] }` — assignable roles only. Existing `pssm_admin` on that mobile is preserved.

Response `200`: `{ "data": { "mobile", "roles": [] } }`.

#### `DELETE /sangha/people/{mobile}`

PSSM Admin only. Cannot delete the signed-in admin’s own account (`409`).

Response `200`: `{ "data": { "ok": true } }`.

#### `POST /sangha/admin/claim` (prototype / bootstrap)

When no PSSM Admin exists yet, a signed-in member may claim `pssm_admin` once. Response `200`: `{ "data": { "roles": ["pssm_admin"] } }`. `409` if an admin already exists.

### Events (Event Organizer)

#### `GET /events`

Signed-in. Lists events created in the system (header picker + Create event page).

Response `200`

```json
{
  "data": [
    {
      "id": "evt_1",
      "name": "Dhyana Maha Yagam - 5",
      "startDate": "2026-12-21",
      "endDate": "2026-12-31",
      "location": "Pyramid Meditation Center, Hyderabad",
      "expectedBudgetInr": 500000,
      "meditationHoursPerDay": 3,
      "createdBy": "9876543210"
    }
  ]
}
```

#### `POST /events`

Event Organizer only.

```json
{
  "name": "Dhyana Maha Yagam - 5",
  "startDate": "2026-12-21",
  "endDate": "2026-12-31",
  "location": "Pyramid Meditation Center, Hyderabad",
  "expectedBudgetInr": 500000,
  "meditationHoursPerDay": 3
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | Non-empty |
| `startDate` | Yes | ISO date `YYYY-MM-DD` |
| `endDate` | Yes | On or after `startDate` |
| `location` | Yes | One-line free text |
| `expectedBudgetInr` | Yes | Number > 0 (INR) |
| `meditationHoursPerDay` | No | Number ≥ 0 when present |

Response `201`: `{ "data": { ...event } }`.

#### `PUT /events/{id}`

Event Organizer only. Same body as `POST /events`. Response `200`: `{ "data": { ...event } }`. `404` if id unknown.

**Stay link:** Free and Paid accommodation always use the event selected in the header picker (booking cutoff = start − 2 days, allotment, hotels). Header picker subtitle shows dates only (not budget).

### Endpoint index

| Method | Path | Roles |
| --- | --- | --- |
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Signed-in |
| GET | `/auth/me` | Signed-in |
| POST | `/auth/password` | Signed-in |
| POST | `/sangha/join` | Public |
| GET | `/sangha/me` | Signed-in |
| PUT | `/sangha/me` | Signed-in |
| GET | `/sangha/people` | PSSM Admin |
| PUT | `/sangha/people/{mobile}/roles` | PSSM Admin |
| DELETE | `/sangha/people/{mobile}` | PSSM Admin |
| POST | `/sangha/admin/claim` | Signed-in (bootstrap) |
| GET | `/events` | Signed-in |
| POST | `/events` | Event Organizer |
| PUT | `/events/{id}` | Event Organizer |

---

## Part B — Register summary

### What one row means

One row is one person who is part of the PSSM sangha and practices meditation as taught by Patriji. Admin adds the row. The row holds five fields and nothing else.

Patriji calls PSSM a club of Buddhas. At the bodhisattva stage the duty is to teach and to pass on what you received. Every person on this register supports the spiritual events of PSSM.

| Field | Meaning | Required |
| --- | --- | --- |
| Full name | Who | Yes |
| Mobile | How to reach them | Yes |
| Place | City or town, chosen from the place list | Yes |
| Pyramid center or group | Which sangha they sit with | Yes |
| Since | Year they began, if known | No |

An empty since is allowed. The person is still on the register. Place is never typed freely. Admin selects it from the autocomplete list of cities and towns.

---

### Active events

The first page is a circle with the person's photo in it, and one box per **Active** event in a column. Register Admin can mark events Active or Inactive at any time; only Active events appear. **1,44,000** meditators across the globe are part of the contribution for whole-sangha events. Remaining on such a box is 1,44,000 minus how many are shown as supported. The box with the most still needed is at the top. Inside each box, each city or town shows how many people from that place are still to contribute, highest remaining first. Under the photo are that person's contribution details for the active events, and their feedback / comments.

If the event happens in a city or a state, every person there must support first. An able person in that city or state may enter an extra amount, on top of their share, so the budget is met more easily. Other locations are asked only for the amount still left after that host support and those extras. If nothing is left, other locations are not asked.

### Dashboard

Admin or a person in the sangha opens the dashboard.

- **By location.** People are grouped under each city or town. The heading shows how many masters are from that place.
- **By pyramid center.** The same people are grouped under each pyramid center or group. The heading shows how many masters sit with that center.

---

### How a row is kept

1. Admin adds the cities and towns to the place list.
2. Admin adds the person with the four required fields. Place is selected from that list. Since is entered when the year is known.
3. The dashboard shows that person under their place, and again under their pyramid center.
4. Admin opens the row to read the mobile number.
5. Admin edits any of the five fields when something was entered wrong. Place is selected again from the list.

### Notes
- Living technical document. Application code is not implemented yet.
- File: `docs/buddha-sangha/Technical.md`

---

## Event accommodation

### 2. Recommended Technical Stack

Same as [Chosen technical stack](#chosen-technical-stack). Accommodation-specific notes:

| Layer              | Technology                          | Notes |
|--------------------|-------------------------------------|-------|
| Frontend           | **React + Vite + UIKit 3**          | Mobile first, one wizard step per screen. React Router; Axios/Fetch. |
| Camera Capture     | Browser `getUserMedia` API          | Live photo + ID proof capture. |
| Backend            | **Java 21 + Spring Boot 3.x**       | Accommodation packages inside the same modular monolith. |
| Real-time          | **Spring WebSocket** (STOMP)        | Live notifications between Accommodation Admin and Hotel Receptionists. |
| Notifications      | **WhatsApp** (primary for now)      | Alerts to Accommodation Admin / Receptionist / Visitors as needed. |
| Database           | **MongoDB 7** + Spring Data MongoDB | Document model (embedded family/place). |
| Authentication     | **Spring Security session** + RBAC  | Roles: Accommodation Admin, Hotel Receptionist, Visitor, Sangha member, plus **PSSM Admin** and pre-assigned member roles **Event Organizer**, **Pyramid Sevadal**, **PMMA Member** (one or more). PSSM Admin lands on People & roles to search by mobile, assign/remove those roles, and remove people. A family group signs in with mobile number + password. First password is up to 5 letters of the name + date + month (e.g. `Ramak1508`), created at join, and can be changed. After login, the UI shows Stay + Account only; My Profile edits the sangha record through a join-like wizard. Event Organizer may create events (name, dates, location, expected budget INR, optional meditation hours/day); Free and Paid Stay use the selected event. |
| File Storage       | Local disk or Cloud (S3/Cloudinary) | For live photos and ID proof images. |
| Deploy             | **Docker Compose** on one VPS       | Nginx + Spring Boot + MongoDB with resource limits — see [Production deployment](#production-deployment). |

**Architecture Style:** Single Spring Boot **modular monolith** (final choice — not microservices).

---

### 2.1 Microservices + Kafka – Recommendation

**Question:** Can we use microservices with Kafka streaming?

**Answer:** **No for this project.** Final choice is a **single Spring Boot modular monolith**.

**Reasons against Microservices + Kafka:**

- Expected load is moderate (event-based, not continuous high traffic).
- Team size is small; one VPS with Nginx + Spring Boot + MongoDB is enough.
- Microservices and Kafka add hosting, debugging, and maintenance cost without matching benefit.
- Spring WebSocket covers in-app real-time desk notifications; WhatsApp covers outbound alerts.
- Faster delivery and easier debugging with clear packages inside one app.

**Approach:**
1. Build as a **clean Modular Monolith** (packages for Registration, Allotment, Check-in/Check-out, Notifications, Accommodation Admin, etc.).
2. Use Spring WebSocket for real-time desk events.
3. Only if the system later grows to multiple cities / year-round high concurrency, reconsider extracting services — not now.

---

### 3. System Overview

The system manages free and self-booked hotel accommodation for event visitors and their families. Key capabilities include:

- Registration of visitors and family members
- Capture of stay duration and special needs (aged persons, sickness)
- Priority allotment of nearby rooms for special-needs groups
- Standardized check-in / check-out time at **11:00 AM**
- Identity validation using assigned ID cards
- Person-wise check-out
- Real-time bi-directional notifications between Accommodation Admin and Hotel Receptionists
- Single identification per party with live photo and ID proof capture via web camera

---

### 4. Core Entities (High-Level Data Model)

| Entity              | Description                                      | Key Attributes |
|---------------------|--------------------------------------------------|----------------|
| Hotel               | Partner hotels near the event venue              | Hotel ID, Name, Address, **Distance from event place** (entered by Accommodation Admin), Contact, Active, **Reserved** (manual assignment only) |
| Room                | Individual rooms in a hotel                      | Room ID, Hotel ID, Room Number, Capacity (persons), Room Type (AC / Non-AC – **default AC**), Kind (Regular / Dormitory / Hall), **Gender allowed** (Gents only / Ladies only — Dormitory and Hall only), Status |
| Visitor         | Primary visitor                                  | Visitor ID, Name, Mobile, Area (Rural / Urban), Rural: Village, Town, District, State, Country, Urban: City, State, Country, Gender (Gents / Ladies) |
| FamilyMember        | Accompanying persons (including children)        | FamilyMember ID, Visitor ID, Name, Gender (Gents / Ladies), Age Group, Relation |
| Booking / Allotment | Room allocation for a group or individual        | Booking ID, Room ID, Check-in Date, Check-out Date, Status |
| SpecialNeed         | Health / age related flags                       | Aged Person (Y/N), Sickness Details |
| IDCard              | Assigned identification for the entire party     | ID Card Number, Linked to Party, Live Photo, ID Proof Image, Captured By (Person Name) |

---

### 5. Sample Master Data – Hotels & Rooms

#### 5.1 Hotel: Sai Prakash

**Hotel Name:** Sai Prakash  
**Location:** Near event venue (walkable / very short auto distance)  
**Total Rooms:** 6 (Rooms numbered 231 to 236)  
**Room Types Available:** AC and Non-AC

| Room Number | Capacity (Persons) | Room Type Options     | Status (Example) | Notes |
|-------------|--------------------|-----------------------|------------------|-------|
| 231         | 4                  | AC / Non-AC           | Available        |       |
| 232         | 4                  | AC / Non-AC           | Available        |       |
| 233         | 4                  | AC / Non-AC           | Available        |       |
| 234         | 4                  | AC / Non-AC           | Available        |       |
| 235         | 4                  | AC / Non-AC           | Available        |       |
| 236         | 4                  | AC / Non-AC           | Available        |       |

**Notes:**
- Each room can accommodate up to **4 persons**.
- Both AC and Non-AC options are available.
- Rooms will be allotted based on family size, special needs (aged/sickness â†’ priority for nearest rooms), room type preference, and availability.
- When a group or individual checks out at **11:00 AM**, the room becomes immediately available for re-allotment so that a new party can check in at **11:00 AM**.

---

#### 5.2 Hotel: Three Castle Executive

**Hotel Name:** Three Castle Executive  
**Location:** Near event venue (walkable / very short auto distance)  
**Total Rooms:** 6 (Rooms numbered 101 to 106)  
**Room Types Available:** AC and Non-AC

| Room Number | Capacity (Persons) | Room Type Options     | Status (Example) | Notes |
|-------------|--------------------|-----------------------|------------------|-------|
| 101         | 3                  | AC / Non-AC           | Available        |       |
| 102         | 3                  | AC / Non-AC           | Available        |       |
| 103         | 3                  | AC / Non-AC           | Available        |       |
| 104         | 3                  | AC / Non-AC           | Available        |       |
| 105         | 3                  | AC / Non-AC           | Available        |       |
| 106         | 3                  | AC / Non-AC           | Available        |       |

**Notes:**
- Each room can accommodate up to **3 persons**.
- Both AC and Non-AC options are available (same as Sai Prakash).
- Rooms will be allotted based on family size, special needs, room type preference, and availability.
- Check-out at 11:00 AM allows immediate re-allotment for new check-in at 11:00 AM.

---

### 6. Identification & ID Card Process

**Key Rules:**
- Only **one identification** is required per party (visitor + family members).
- Any one person in the party (primary visitor or a family member) can provide the identification.
- The system must support live capture using the device's web camera.

**Capture Requirements:**
1. **Live Photo** of the person providing identification (via web camera).
2. **ID Proof Document** photo (Aadhaar, PAN, Voter ID, Passport, Driving Licence, etc.) also captured via web camera.

**Storage & Linkage:**
- Both images (live photo + ID proof) are stored and permanently linked to:
  - The Party / Group record
  - The single Assigned ID Card issued for the entire party

**Validation at Hotel:**
- Hotel receptionist validates the party using the single assigned ID card (which is backed by the captured live photo and ID proof).

---

### 7. Room Allotment Logic (High-Level)

**When it runs**

- Accommodation booking closes **2 days before the event start date**. After that, visitors cannot create or change a booking.
- A room is not assigned when the visitor submits the request. The request is stored until allocation.
- After the window closes, **Accommodation Admin starts a smart allocation flow**.
- The flow assigns rooms only to parties that asked for free accommodation. Self-booked parties are skipped.
- Hotels marked **Reserved** are skipped. Accommodation Admin assigns those rooms by hand from the review screen.
- Accommodation Admin reviews the result and may override any allotment. Confirmed allotments notify the hotel receptionist.

**Rules applied by that flow**

1. Use family size, gender of each person, place, special needs, room type preference (AC / Non-AC), and whether the visitor is **Pyramid Sevadal** (volunteer), as captured during registration. Ignore hotels marked Reserved. The event location is the city or town Accommodation Admin recorded for the event.
2. **Event location first.** Allot parties whose place matches the event location before any other party. An urban visitor matches on **city**. A rural visitor matches on **town**. Run steps 3 to 11 for that group. Then run steps 3 to 11 again for everyone else, using only beds still free. A party that still has no room is unmatched. Accommodation Admin assigns unmatched parties by hand.
3. If aged persons or sickness is reported â†’ prioritize rooms closest to the event venue.
4. If the visitor is **Pyramid Sevadal** â†’ allot only in nearby hotels (walkable or very short auto distance). Give highest priority to closest rooms.
5. **Exact capacity:** If an empty room, dormitory, or hall has capacity exactly equal to the party size, assign that entire unit to the family. Do not share it. A dormitory or hall is eligible only when every person matches the gender it allows. A dormitory or hall is usually **10 to 50** beds, so this whole-unit match applies there only when the party is that large. A smaller same-gender party takes only the beds it needs, and the remaining beds stay open for more people of that gender. If several units match, apply steps 3, 4, and 7. For one person, prefer a matching dormitory or hall over a regular room of capacity 1.
6. If no exact match exists, match room capacity â‰¥ number of persons requiring accommodation.
7. Prefer requested room type (AC or Non-AC) where available (default = AC).
8. **Husband and wife in a capacity-3 room**, only when step 5 did not assign a unit: the party is exactly one gent and one lady, registered as husband and wife. If they agreed during booking, and two other agreeing couples are also waiting, assign the three closest capacity-3 rooms as follows: all three ladies in one room, all three gents in one room, and leave the third room free. Repeat for each further set of three. A couple who did not agree stays together in one capacity-3 room. If fewer than three couples agreed, each keeps their own capacity-3 room.
9. **Single person (party size = 1)**, only when step 5 did not assign a unit:  
   - **First choice** â†’ Dormitory or Hall that allows that person's gender (**Gents allowed only** or **Ladies allowed only**).  
   - **Last choice** â†’ Regular private/shared room.  
   - A Dormitory or Hall never mixes gents and ladies. A party that includes both stays in a regular room.
10. **Support shared room allotment** when steps 5 and 8 did not assign a whole unit: A room can be shared by multiple families as long as total persons â‰¤ room capacity. In a Dormitory or Hall, every person must match the gender that room allows. After each placement, the remaining beds in that dormitory or hall stay open and allocation continues to fill them with the same gender until capacity is reached.  
   - **First choice**: Families from the **same location** (rural: same town; urban: same city).  
   - Only if no suitable same-location family is available, consider families from different locations.  
   - If the room is **already partly occupied** and everyone in it is gents, fill the remaining beds only with a party that is entirely gents.  
   - If everyone already in it is ladies, fill the remaining beds only with a party that is entirely ladies.  
   - A mixed party is not added to a room that is already all one gender. Same-location preference still applies among the parties that match.
11. Support partial / person-wise occupancy (one room can have members with different check-out dates).

**After guests are in the hotel**

12. On check-out (full, person-wise, or early) at 11:00 AM â†’ free the capacity for immediate re-use.  
13. Early check-out is freely allowed before the scheduled check-out date. Hotel receptionist performs the action and Accommodation Admin is notified automatically.

**Room Key Policy:**  
Visitors must never take room keys with them. Keys must always be deposited with the Hotel Receptionist.

---

### 8. Next Steps / Open Items / Decisions

| Item | Status / Decision |
|------|-------------------|
| Add more hotels and their room inventories | Will be done later |
| Define exact distance/priority ranking rules for â€œnearbyâ€ hotels | **Decision:** Allow Accommodation Admin to add hotel details along with distance details from the event place |
| Clarify how AC / Non-AC is assigned | **Decision:** Defaulted to **AC** |
| Detail technical implementation of web-camera capture | **Decision:** Normal / usual browser implementation only (standard `getUserMedia`, normal image quality & storage) |
| Define notification channels | **Decision:** **WhatsApp** for now |
| Database schema (tables, relationships, indexes) | TODO later via Agile user stories |
| API endpoints | **Decision:** REST contract for the UI is in this document (Part C). Live updates stay on Spring WebSocket |
| Application stack | **Decision:** React + Vite + UIKit 3 · Java 21 + Spring Boot 3 · Spring Security session · MongoDB 7 + Spring Data MongoDB · Maven · Docker Compose (Nginx + app + MongoDB on one VPS). Modular monolith — not microservices |
| User roles and permissions (Accommodation Admin, Hotel Receptionist, Visitor) | TODO later via Agile user stories |
| When booking closes | **Decision:** Booking closes **2 days before** the event start |
| When rooms are allotted | **Decision:** Accommodation Admin runs a **smart allocation** flow after booking closes. Rules in Section 7 |
| Dormitory / Hall gender | **Decision:** Each Dormitory or Hall is **Gents allowed only** or **Ladies allowed only**, usually **10 to 50** beds. Remaining beds stay open and are filled with that same gender until full. Regular rooms have no preset gender limit |
| Couple and a capacity-3 room | **Decision:** Ask husband and wife. Three who agree use the three closest capacity-3 rooms: ladies together, gents together, one room freed. A couple who declines stays together in a capacity-3 room |
| Reserved hotels | **Decision:** A Reserved switch on the hotel list (and on the hotel form) keeps that hotel out of smart allocation. Accommodation Admin assigns it manually |
| Visitor password | **Decision:** Login uses **mobile + password**. Temporary password is up to the first 5 letters of the main person's name, then date and month of birth (two digits each). No event code. Example: `Ramak1508`. The visitor may change it |
| Member roles | **Decision:** PSSM Admin assigns zero or more of **Event Organizer**, **Pyramid Sevadal**, **PMMA Member** to a mobile. Prototype stores people in `localStorage` (`pssm_sangha_people`), assignments in `pssm_role_assignments`, and syncs onto the person at login. PSSM Admin uses `admin.html` to search, assign/remove roles, and remove people (UIkit confirm). Prototype bootstrap: claim PSSM Admin when none exists yet |
| Event create / edit | **Decision:** Event Organizer creates and updates events (name, dates, location, expected budget INR, optional meditation hours/day). Mongo `events` (mock: `pssm_events`). Header picker shows name + dates only; budget stays on Create/Edit and the events list |
| Event location priority | **Decision:** Smart allocation places parties from the event's city or town first. Anyone still without a room is assigned manually |

---

### 9. Project Structure & Documentation Organization

```text
pssm-buddha-sangha/
├── docs/
│   ├── buddha-sangha/
│   └── prototype/
├── frontend/                 # React + Vite + UIKit 3
├── backend/                  # Spring Boot 3 (Maven)
├── docker-compose.yml        # Nginx + Spring Boot + MongoDB
├── README.md
└── .gitignore
```

**Documentation:** `docs/buddha-sangha/{Requirements,Technical,UI}.md`. Static prototype: `docs/prototype/`.

---

## Accommodation — Allocation summary

### When allocation runs

Allocation runs only after booking closes, **2 days before the event**. Accommodation Admin starts it. It covers free-accommodation parties only. Self-booked parties are left out. Hotels marked **Reserved** are left out of this automatic run. Accommodation Admin can still assign those hotels by hand, and can override any other result.

Parties from the **event location** are placed first. An urban visitor matches the event city or town on **city**. A rural visitor matches it on **town**. Everyone else is placed only into beds that are still free. A party that still has no room is left for Accommodation Admin to assign by hand.

For each of those groups, in this order:

1. Use the details already captured: size, gender of each person, aged or sickness, AC or Non-AC, Pyramid Sevadal, and, for a couple, whether they agreed to separate.
2. Aged or sickness moves them toward the **closest** rooms. Pyramid Sevadal stays in **nearby hotels** only.
3. If an **empty** room has capacity **exactly** equal to the party, give them that whole unit. A dormitory or hall is usually **10 to 50** beds and is gents-only or ladies-only. A smaller same-gender party takes only the beds it needs there. The remaining beds stay open and keep being filled with that same gender until the dormitory or hall is full. The whole dormitory or hall goes to one party only when the party is as large as its capacity.
4. Otherwise look for a unit with enough beds. AC is preferred.
5. A **couple** facing a 3-bed room is handled next, if they agreed.
6. A **single person** with no exact bed goes to a matching dormitory or hall first.
7. Otherwise **share**: same place first (rural: same town; urban: same city), and a partly filled all-gents room takes only an all-gents party. An all-ladies room takes only an all-ladies party.

Check-in and check-out stay at **11:00 AM**. Each person keeps their own check-out date. After the local parties and then the others have been tried, anyone still without a room is listed for Accommodation Admin to place by hand. That manual step is the only way those remaining parties get a room.

---

### 1. Two gents

They stay together. They are never split, and they never enter a ladies dormitory or hall.

- An empty **capacity-2** regular room is theirs alone.
- A **gents-only** dormitory or hall (usually 10 to 50 beds) can take them as 2 beds. The remaining beds stay open for more gents until it is full. A ladies dormitory or hall is not used.
- They may also share a regular room with another **all-gents** party, preferably from the same town (rural) or the same city (urban). If a room already has only gents and at least 2 beds free, they can fill those beds.
- Example: two gents from Vijayawada, and a capacity-4 room already holding two gents from Vijayawada. They join that room. Two gents from another city or town join it only if no same-place party fits.

---

### 2. Two ladies

The same path, on the ladies side.

- Exact capacity 2: a regular room for them alone.
- A **ladies-only** dormitory or hall (usually 10 to 50 beds) can take them as 2 beds. The remaining beds stay open for more ladies until it is full.
- They share a regular room only with an **all-ladies** party, same place first, including beds left in a room that is already all ladies.

---

### 3. Couple (one gent and one lady, husband and wife)

They are a mixed party, so a dormitory or hall is not used while they stay together.

- An empty **capacity-2** regular room goes to them as a couple. The separate-room question is not used, because a fitting room exists.
- If the only spare room is **capacity 3**, the answer they gave at booking decides:
  - **Yes**, and two other couples also said yes: the three closest 3-bed rooms are used. Three ladies in one, three gents in one, the third room left free. Six agreeing couples free two rooms, and so on.
  - **No**: they stay together in one 3-bed room. One bed stays empty.
  - Fewer than three couples said yes: nobody is separated. Each couple keeps their own 3-bed room.
- They are not added into a room that is already all gents or all ladies, unless this agreed exchange places the lady in the ladies room and the gent in the gents room.

---

### 4. Other cases

**One gent.** He goes first into a gents-only dormitory or hall and takes one bed. The remaining beds, usually 9 to 49, stay open for more gents until it is full. A regular room is the last choice. A ladies dormitory or hall is never used.

**One lady.** The same, in a ladies-only dormitory or hall. Remaining beds stay open for more ladies.

**A larger all-gents or all-ladies family.** Four gents get an empty capacity-4 regular room as a whole. They may instead take 4 beds in a gents-only dormitory or hall and leave the rest open for more gents. They receive the whole dormitory or hall only when their number equals its capacity, about 10 to 50. They are not split into the couple exchange. Four ladies follow the ladies side.

**A mixed family larger than a couple.** Parents and a child, for example, stay together in a **regular** room. An exact capacity match on a regular room is used first. They do not go into a dormitory or hall, and they are not split. They are not added to a room that is already all gents or all ladies.

**Aged or sickness.** The same gender and capacity rules, but the closest suitable rooms are chosen first.

**Pyramid Sevadal.** The same rules, limited to nearby hotels, closest suitable rooms first.

**Different stay lengths.** People can still share a room. Each person keeps their own check-out date.

**No fit.** That party is listed for Accommodation Admin to place by hand.

---

### Notes
- This is a living document. When an allocation rule changes, update this summary with the requirements and the technical spec.
- File location: `docs/buddha-sangha/Technical.md` (Part B)

---

## Accommodation — REST API

Base URL: `/api/v1`  
Format: JSON, except photo uploads, which are `multipart/form-data`.  
Auth: **Spring Security session cookie** (same-origin / `credentials: 'include'`). No Bearer JWT.  
Live pushes (check-in, check-out, admin changes) stay on **Spring WebSocket**. These endpoints are what the UI calls. WhatsApp is sent by the server after a confirmed action. The UI does not call WhatsApp directly.

---

### 1. Conventions

| Item | Rule |
| --- | --- |
| Times | Check-in and check-out are always `11:00`. The UI does not send a time. |
| Dates | `YYYY-MM-DD` |
| Ids | Strings |
| Lists | `?page=1&pageSize=20`. Response includes `page`, `pageSize`, `total` |
| Success | `{ "data": ... }` |
| List success | `{ "data": [ ... ], "page": 1, "pageSize": 20, "total": 0 }` |
| Error | `{ "error": { "code": "BOOKING_CLOSED", "message": "Booking is closed." } }` |

| HTTP | When |
| --- | --- |
| 400 | Missing or invalid field |
| 401 | Not signed in, or session expired |
| 403 | Role not allowed, or receptionist asking for another hotel |
| 404 | Unknown id |
| 409 | Conflict: duplicate room number, booking closed, allocation before close, reserved hotel used by the automatic run |

Roles: `admin`, `receptionist`, `visitor`.

Accommodation Admin and receptionist sign in with a username. A visitor family group signs in with mobile number and password; the first password is temporary and composed at join. Creating a booking while already signed in continues under that session; creating a booking as a guest may establish a visitor session so the form can continue.

---

### 2. Shared shapes

**Hotel**

```json
{
  "id": "htl_1",
  "name": "Sai Prakash",
  "address": "Near the venue",
  "contact": "9848012345",
  "distanceFromEvent": { "value": 0.4, "unit": "km" },
  "active": true,
  "reserved": false
}
```

**Room**

```json
{
  "id": "rm_231",
  "hotelId": "htl_1",
  "roomNumber": "231",
  "capacity": 4,
  "kind": "regular",
  "genderAllowed": null,
  "roomType": "ac",
  "status": "available",
  "occupied": 0
}
```

`kind`: `regular`, `dormitory`, `hall`.  
`genderAllowed`: `gents` or `ladies` for a dormitory or hall, otherwise `null`.  
`roomType`: `ac` or `non_ac`.  
Dormitory and hall `capacity` is usually 10 to 50.

**Party (summary)**

```json
{
  "id": "pty_1",
  "visitorName": "Rama Rao",
  "mobile": "9848098765",
  "gender": "gents",
  "accommodation": "free",
  "area": "urban",
  "place": { "city": "Vijayawada", "state": "Andhra Pradesh", "country": "India" },
  "pyramidSevadal": false,
  "roomTypePreference": "ac",
  "personCount": 2,
  "specialNeeds": { "aged": false, "sickness": false },
  "status": "waiting",
  "idCardNumber": "PSSM-1042",
  "allotment": null
}
```

`accommodation`: `free` or `self`.  
`status`: `waiting`, `allotted`, `self_booked`, `cancelled`.  
Rural `place`: `{ "village", "town", "district", "state", "country" }`.

---

### 3. Auth

#### `POST /auth/login`  
Accommodation Admin, receptionist, or a visitor family group.

Staff request

```json
{ "username": "reception.saiprakash", "password": "secret" }
```

Visitor request. One login for the whole party (Login to My Space). Uses mobile number and password.

```json
{ "mobile": "9876543210", "password": "Ramak1508" }
```

The temporary password is created at join: up to the first 5 letters of the name (letters only), then birth date and month as two digits. No event code. For name Ramakrishna, 15 August, the password is `Ramak1508`. Login matches mobile on the party record and that password. After the visitor changes it, only the new password is accepted.

Staff response `200` (session cookie set by Spring Security)

```json
{
  "data": {
    "role": "receptionist",
    "hotelId": "htl_1",
    "name": "Sai Prakash desk"
  }
}
```

Visitor response `200` (session cookie set)

```json
{
  "data": {
    "role": "visitor",
    "partyId": "pty_2",
    "name": "Lakshmi",
    "passwordTemporary": true
  }
}
```

Accommodation Admin response omits `hotelId`. `401` when mobile or password does not match. `400` when mobile is missing or invalid. Subsequent API calls rely on the session cookie, not a token field.

#### `POST /auth/password`  
Visitor, while signed in. Replaces the temporary password.

Request

```json
{
  "currentPassword": "Ramak1508",
  "newPassword": "a password they choose"
}
```

Response `200`

```json
{ "data": { "passwordTemporary": false } }
```

`401` when `currentPassword` is wrong.

#### `POST /auth/logout`  
Any logged-in role. Request body empty. Response `204`.

#### `GET /auth/me`  
Any logged-in role.

Response `200`

```json
{
  "data": { "role": "admin", "name": "Event office", "hotelId": null }
}
```

---

### 4. Event and booking window

#### `GET /events/current`  
Visitor, admin, receptionist.

Response `200`

```json
{
  "data": {
    "id": "evt_1",
    "code": "DMY5",
    "name": "Dhyana Maha Yagam",
    "location": { "place": "Vijayawada", "state": "Andhra Pradesh", "country": "India" },
    "startDate": "2026-12-01",
    "endDate": "2026-12-11",
    "bookingClosesOn": "2026-11-29",
    "bookingOpen": true
  }
}
```

`bookingClosesOn` is the start date minus 2 days. The visitor screen uses `bookingOpen` to show the closed page.

#### `PUT /events/current`  
Accommodation Admin. Creates the event when none exists, otherwise replaces it.

Request

```json
{
  "code": "DMY5",
  "name": "Dhyana Maha Yagam",
  "location": { "place": "Vijayawada", "state": "Andhra Pradesh", "country": "India" },
  "startDate": "2026-12-01",
  "endDate": "2026-12-11"
}
```

Response `200` is the same event object. `400` when `endDate` is before `startDate`.

#### `GET /events/current/booking-window`  
Visitor, admin. Lightweight check for the closed page.

Response `200`

```json
{
  "data": {
    "bookingOpen": false,
    "eventName": "Dhyana Maha Yagam",
    "bookingClosesOn": "2026-11-29"
  }
}
```

---

### 5. Place autocomplete

#### `GET /places/suggestions`  
Visitor. No auth required, so the form can suggest before the party exists.

Query

| Name | Required | Values |
| --- | --- | --- |
| area | Yes | `rural` or `urban` |
| q | Yes | Text typed so far, at least 2 characters |
| field | Yes | Rural: `village`. Urban: `city` |

Rural response `200`

```json
{
  "data": [
    {
      "village": "Pamarru",
      "town": "Pamarru",
      "district": "Krishna",
      "state": "Andhra Pradesh",
      "country": "India"
    }
  ]
}
```

Urban response `200`

```json
{
  "data": [
    { "city": "Vijayawada", "state": "Andhra Pradesh", "country": "India" }
  ]
}
```

The UI fills town, district, state, and country from the chosen rural row. Country on a rural form is taken from this payload and is not a typed field. The UI fills state and country from the chosen urban row. The visitor may still correct a suggested value before submit. Empty `data` means no match. The visitor can continue by typing.

---

### 6. Hotels

#### `GET /hotels`  
Accommodation Admin. Receptionist receives only their hotel.

Query: `active=true|false`, `reserved=true|false`, `q` name search.

Response `200`: list of Hotel.

#### `POST /hotels`  
Accommodation Admin.

Request

```json
{
  "name": "Three Castle Executive",
  "address": "Near the venue",
  "contact": "9848000111",
  "distanceFromEvent": { "value": 0.6, "unit": "km" },
  "active": true,
  "reserved": false
}
```

`distanceFromEvent` is required. `reserved` defaults to `false`.

Response `201`: Hotel.

#### `GET /hotels/:hotelId`  
Accommodation Admin. Receptionist only for their hotel.

Response `200`: Hotel.

#### `PATCH /hotels/:hotelId`  
Accommodation Admin. Any subset of the create fields.

Response `200`: Hotel.

#### `PATCH /hotels/:hotelId/reserved`  
Accommodation Admin. The switch on the hotel list.

Request

```json
{ "reserved": true }
```

Response `200`: Hotel. Turning this on removes the hotel from the next smart-allocation run. Rooms already confirmed there stay until Accommodation Admin changes them.

#### `PATCH /hotels/:hotelId/active`  
Accommodation Admin.

Request

```json
{ "active": false }
```

Response `200`: Hotel. An inactive hotel is unavailable for automatic and manual assignment.

---

### 7. Rooms

#### `GET /hotels/:hotelId/rooms`  
Accommodation Admin. Receptionist for their hotel.

Query: `kind=regular|dormitory|hall`, `roomType=ac|non_ac`, `genderAllowed=gents|ladies`, `status=available|occupied`.

Response `200`: list of Room, plus `occupied` beds.

#### `POST /hotels/:hotelId/rooms`  
Accommodation Admin. One room.

Request

```json
{
  "roomNumber": "231",
  "capacity": 4,
  "kind": "regular",
  "roomType": "ac"
}
```

Dormitory or hall request

```json
{
  "roomNumber": "D1",
  "capacity": 30,
  "kind": "dormitory",
  "genderAllowed": "gents",
  "roomType": "ac"
}
```

`genderAllowed` is required for `dormitory` and `hall`, and must be omitted for `regular`. `roomType` defaults to `ac`. Status is `available`.

Response `201`: Room. `409` when `roomNumber` already exists in that hotel.

#### `POST /hotels/:hotelId/rooms/bulk`  
Accommodation Admin. Several rooms in one save.

Request

```json
{
  "rooms": [
    { "roomNumber": "101", "capacity": 3, "kind": "regular", "roomType": "ac" },
    { "roomNumber": "102", "capacity": 3, "kind": "regular", "roomType": "non_ac" }
  ]
}
```

Response `201`

```json
{
  "data": { "created": [ "..." ], "rejected": [ { "roomNumber": "101", "code": "DUPLICATE_ROOM" } ] }
}
```

#### `GET /rooms/:roomId`  
Accommodation Admin. Receptionist for a room in their hotel.

Response `200`: Room, plus current occupants:

```json
{
  "data": {
    "id": "rm_d1",
    "occupied": 2,
    "remaining": 28,
    "occupantsGender": "gents",
    "parties": [ { "id": "pty_9", "visitorName": "Ravi", "personCount": 2 } ]
  }
}
```

#### `PATCH /rooms/:roomId`  
Accommodation Admin. Room number, capacity, kind, genderAllowed, roomType. Status is not set here. It changes through allocation and check-out.

Response `200`: Room. `409` on a duplicate room number.

---

### 8. Visitor booking

Calls in this section use the visitor token, except create. Accommodation Admin may `GET` a booking.

#### `POST /bookings`  
**Authenticated.** Creates a stay booking for the header-selected event. Accommodation Volunteer may set `registerFamily: true` to join a new mobile into the sangha register in the same call.

Request (current React Stay wizard)

```json
{
  "plan": "free",
  "eventId": "evt_…",
  "eventName": "Dhyana Maha Yagam - 5",
  "registerFamily": false,
  "family": {
    "fullName": "Lakshmi",
    "mobile": "9848011111",
    "gender": "female",
    "age": "adult",
    "meditation": "3",
    "birthDate": "22",
    "birthMonth": "03",
    "place": { "kind": "urban", "city": "Hyderabad", "state": "Telangana", "country": "India" },
    "members": [],
    "stayStartDate": "2026-12-21",
    "stayEndDate": "2026-12-25"
  }
}
```

`plan` is `free` or `paid`. Each person (primary + members) carries `stayStartDate` / `stayEndDate` (ISO dates, end ≥ start; within event window when known).  
`registerFamily: true` requires Accommodation Volunteer (or PSSM Admin); creates the person if the mobile is free (`409` `MOBILE_TAKEN` otherwise).  
Self booking does not update the sangha profile.

Response `201`

```json
{
  "data": {
    "booking": {
      "id": "…",
      "status": "registered",
      "bookedAt": "2026-10-12T06:00:00Z",
      "personCount": 1,
      "plan": "free",
      "familyMobile": "9848011111",
      "familyFullName": "Lakshmi",
      "family": {},
      "guests": []
    }
  }
}
```

`bookedAt` is set server-side when the interest is submitted (same instant as `createdAt`). Status is `registered` until a later room-allocation pass assigns hotels (`allotted`, etc.).  
`GET /bookings?eventId=` — Accommodation Volunteer, Event Organizer, or PSSM Admin: list Friends and Masters List (families) for that event, newest first.

Stored fields: `familyMobile`, `familyFullName`, `registeredFamily`, `familyDetail` (Mongo). Response embeds `family` (profile shape) plus `guests`.

Full stepwise visitor booking (family PATCH, couple consent, identity) remains specified below for later allotment work. `409` `BOOKING_CLOSED` after the cutoff (not yet enforced in this pass).

#### `GET /bookings/:bookingId`  
Visitor (own booking), admin.

Response `200`: family, family members, stay rows, special needs, couple consent, id card if issued, allotment if confirmed.

#### `PATCH /bookings/:bookingId`  
Visitor, while the window is open. Body uses `family` (same shape as create). Optional `updateSanghaProfile`. `409` after close.

Response `200`: updated family.
#### `POST /bookings/:bookingId/family-members`  
Visitor.

Request

```json
{ "name": "Arun", "gender": "gents", "relation": "spouse", "ageGroup": "adult" }
```

`relation` and `ageGroup` (`child`, `adult`, `senior`) are optional. `name` and `gender` are required.

`ageGroup` bands: `child` = under 12 years; `adult` = 12–59; `senior` = 60 and above.

Response `201`: the member, and `personCount`.

#### `PATCH /family-members/:memberId`  
Visitor. Same fields. Response `200`.

#### `DELETE /family-members/:memberId`  
Visitor. Response `204`. `personCount` drops. `409` after booking closes.

#### `PUT /bookings/:bookingId/stays`  
Visitor. One row per person, including the primary visitor. Replaces the set.

Request

```json
{
  "stays": [
    { "personId": "pty_2", "days": 11 },
    { "personId": "mem_1", "days": 5 }
  ]
}
```

`days` minimum is 1. The server derives each person's check-in and check-out dates at `11:00` from the event and these days.

Response `200`

```json
{
  "data": {
    "stays": [
      {
        "personId": "pty_2",
        "days": 11,
        "checkInDate": "2026-12-01",
        "checkInTime": "11:00",
        "checkOutDate": "2026-12-12",
        "checkOutTime": "11:00"
      }
    ]
  }
}
```

#### `PUT /bookings/:bookingId/special-needs`  
Visitor.

Request

```json
{
  "aged": true,
  "agedDetails": "Mother is 78",
  "sickness": false,
  "sicknessDetails": null
}
```

Details are optional and only stored when the matching flag is true.

Response `200`: the same object.

#### `GET /bookings/:bookingId/couple-question`  
Visitor. Tells the form whether to show the husband-and-wife question.

Response `200`

```json
{ "data": { "show": true } }
```

`show` is true only when the party is exactly two people, one gent and one lady, and the relation is husband or wife.

#### `PUT /bookings/:bookingId/couple-consent`  
Visitor. Only when `show` is true.

Request

```json
{ "agreeToSeparate": true }
```

Response `200`: `{ "agreeToSeparate": true }`. `409` when the party is not a couple.

#### `GET /bookings/:bookingId/summary`  
Visitor. The â€œrequest receivedâ€ card. No room yet.

Response `200`

```json
{
  "data": {
    "visitorName": "Lakshmi",
    "mobile": "9848011111",
    "personCount": 2,
    "placeLabel": "Pamarru, Krishna",
    "pyramidSevadal": false,
    "specialNeeds": { "aged": true, "sickness": false },
    "roomTypePreference": "ac",
    "checkInTime": "11:00",
    "checkOutTime": "11:00",
    "idCardNumber": "PSSM-1048",
    "status": "waiting",
    "message": "Waiting for room allocation"
  }
}
```

---

### 9. Identity and ID card

One ID covers the whole party.

#### `POST /bookings/:bookingId/identity`  
Visitor. `multipart/form-data`.

| Part | Required |
| --- | --- |
| personId | Yes. Primary visitor id or a family member id |
| idProofType | Yes. `aadhaar`, `pan`, `voter_id`, `passport`, `driving_licence`, `other` |
| livePhoto | Yes. Image file from the camera |
| idProofPhoto | Yes. Image file from the camera |

Response `201`

```json
{
  "data": {
    "personId": "pty_2",
    "idProofType": "aadhaar",
    "livePhotoUrl": "/files/pty_2/live.jpg",
    "idProofPhotoUrl": "/files/pty_2/proof.jpg"
  }
}
```

#### `POST /bookings/:bookingId/id-card`  
Visitor, after identity is stored. Server assigns one card number for the party.

Response `201`

```json
{
  "data": {
    "idCardNumber": "PSSM-1048",
    "partyId": "pty_2",
    "livePhotoUrl": "/files/pty_2/live.jpg",
    "idProofPhotoUrl": "/files/pty_2/proof.jpg"
  }
}
```

`409` when identity photos are missing.

#### `GET /id-cards/:idCardNumber`  
Visitor (own card), receptionist, admin. Digital card, also used before check-in.

Response `200`: card number, party names, room if allotted, special needs, check-in and check-out at `11:00`, photo URLs, and `keyPolicy`: "Room keys stay at reception."

---

### 10. Accommodation Admin booking list

#### `GET /admin/bookings`  
Accommodation Admin.

Query: `status=waiting|allotted|self_booked|cancelled`, `specialNeeds=true`, `sevadal=true`, `accommodation=free|self`, `q` name or mobile.

Response `200`: list of party summaries.

#### `GET /admin/bookings/:bookingId`  
Accommodation Admin. Full party, the same body as `GET /bookings/:bookingId`.

---

### 11. Smart allocation

Automatic allocation never uses a reserved hotel and never includes `self_booked` parties.

#### `GET /admin/allocation/readiness`  
Accommodation Admin. Enables or disables the Run button.

Response `200`

```json
{
  "data": {
    "bookingOpen": false,
    "waitingFreeParties": 120,
    "canRun": true
  }
}
```

`canRun` is false while booking is still open.

#### `POST /admin/allocation/runs`  
Accommodation Admin. Builds a proposal. Does not notify hotels yet.

Response `200`

```json
{
  "data": {
    "runId": "run_1",
    "status": "proposed",
    "assignments": [
      {
        "partyId": "pty_2",
        "visitorName": "Lakshmi",
        "personCount": 2,
        "hotelId": "htl_1",
        "hotelName": "Sai Prakash",
        "roomId": "rm_231",
        "roomNumber": "231",
        "roomType": "ac",
        "shared": false,
        "reason": "exact capacity"
      }
    ],
    "unmatched": [
      { "partyId": "pty_90", "visitorName": "Kiran", "reason": "no bed of the right gender" }
    ]
  }
}
```

`reason` is a short label such as `event location`, `exact capacity`, `closest room`, `same town`, `same city`, `gents dormitory`, `ladies hall`, `beds left in an all-gents room`, `sevadal`, `couple exchange`.

`409` `BOOKING_OPEN` when the window has not closed.

The proposal follows the allocation summary. Parties from the event location are placed first (`location.place` matches an urban city or a rural town). Other parties use only beds still free. `unmatched` is the manual list: Accommodation Admin assigns those parties by hand. Exact capacity, reserved hotels skipped, couple exchange, dormitory gender, and sharing by town or city still apply inside each group.

#### `GET /admin/allocation/runs/:runId`  
Accommodation Admin. The proposal, including any overrides saved so far.

#### `PATCH /admin/allocation/runs/:runId/assignments/:partyId`  
Accommodation Admin. Manual override, including a reserved hotel.

Request

```json
{ "hotelId": "htl_reserved", "roomId": "rm_r1" }
```

Response `200`: the updated assignment row, with `reason`: `admin override`.  
`409` when the hotel is inactive, the room cannot hold the party, or a dormitory or hall does not allow that gender.

#### `DELETE /admin/allocation/runs/:runId/assignments/:partyId`  
Accommodation Admin. Clears an override and puts the party back on the unmatched list, or restores the proposal when one existed.

Response `200`: the row.

#### `POST /admin/allocation/runs/:runId/confirm`  
Accommodation Admin. Saves allotments and notifies each affected hotel receptionist (in-app and WhatsApp).

Response `200`

```json
{
  "data": {
    "runId": "run_1",
    "status": "confirmed",
    "allotted": 118,
    "unmatched": 2,
    "hotelsNotified": [ "htl_1", "htl_2" ]
  }
}
```

#### `GET /admin/allocation/runs/:runId/unmatched`  
Accommodation Admin. Parties still without a room after the proposal or after confirm.

---

### 12. Manual changes after confirm

#### `POST /admin/parties/:partyId/actions`  
Accommodation Admin. Room change, cancel, special instruction, or guest update. Notifies that hotel.

Request, room change

```json
{
  "action": "room_change",
  "hotelId": "htl_reserved",
  "roomId": "rm_r4",
  "note": "Moved to the reserved hotel"
}
```

`action`: `room_change`, `cancel`, `instruction`, `update_guest`.

Cancel request

```json
{ "action": "cancel", "note": "Visitor withdrew" }
```

Instruction request

```json
{ "action": "instruction", "note": "Ground floor if possible" }
```

Guest update request sends the fields that changed (name, mobile, special needs, stay days).

Response `200`

```json
{
  "data": {
    "partyId": "pty_2",
    "action": "room_change",
    "hotelNotified": "htl_reserved",
    "allotment": { "hotelId": "htl_reserved", "roomId": "rm_r4", "roomNumber": "R4" }
  }
}
```

A reserved hotel is allowed here. An inactive hotel is not.

---

### 13. Hotel receptionist

Every call is limited to the receptionist's hotel.

#### `GET /reception/guests`  
Receptionist.

Query: `status=expected|checked_in|partly_checked_out|checked_out`, `date=YYYY-MM-DD`.

Response `200`

```json
{
  "data": [
    {
      "partyId": "pty_2",
      "visitorName": "Lakshmi",
      "idCardNumber": "PSSM-1048",
      "personCount": 2,
      "roomNumber": "231",
      "checkInDate": "2026-12-01",
      "checkInTime": "11:00",
      "checkOutDate": "2026-12-12",
      "checkOutTime": "11:00",
      "specialNeeds": { "aged": true, "sickness": false },
      "status": "expected",
      "keyPolicy": "Room keys stay at reception."
    }
  ]
}
```

#### `GET /reception/guests/:partyId`  
Receptionist. Full party, photos, and room. Used on the check-in panel.

#### `GET /reception/id-cards/:idCardNumber`  
Receptionist. Search step. Does not check the party in.

Response `200`: the same verification panel: card number, live photo, ID proof photo, names, room, special needs, expected time `11:00`, key reminder.  
`404` when the card is not for this hotel.

#### `POST /reception/check-ins`  
Receptionist. Confirm step.

Request

```json
{ "idCardNumber": "PSSM-1048" }
```

Response `200`

```json
{
  "data": {
    "partyId": "pty_2",
    "status": "checked_in",
    "checkedInAt": "2026-12-01T11:05:00+05:30"
  }
}
```

`409` when the card does not match a party for this hotel. Accommodation Admin is notified.

#### `POST /reception/check-outs`  
Receptionist. Whole party, selected people, or an early check-out.

Request

```json
{
  "partyId": "pty_2",
  "scope": "selected",
  "personIds": [ "mem_1" ],
  "early": true
}
```

`scope`: `party` or `selected`. For `party`, omit `personIds`.

Response `200`

```json
{
  "data": {
    "partyId": "pty_2",
    "status": "partly_checked_out",
    "bedsReleased": 1,
    "roomStatus": "available"
  }
}
```

Beds free at once. Accommodation Admin is notified. `roomStatus` becomes `available` when everyone in that room has left. A dormitory keeps `occupied` and `remaining` updated so more people of the same gender can still be placed.

#### `GET /reception/checkout-reminders`  
Receptionist. Parties whose check-out is tomorrow.

Response `200`

```json
{
  "data": [
    {
      "partyId": "pty_2",
      "visitorName": "Lakshmi",
      "roomNumber": "231",
      "checkOutDate": "2026-12-12",
      "checkOutTime": "11:00",
      "informed": false
    }
  ]
}
```

#### `PATCH /reception/checkout-reminders/:partyId`  
Receptionist.

Request

```json
{ "informed": true }
```

Response `200`: the reminder row with `informed: true`.

---

### 14. Notifications

Spring WebSocket delivers these as they happen. The UI also loads history from here.

#### `GET /notifications`  
Accommodation Admin: every hotel. Receptionist: their hotel only.

Query: `type=check_in|check_out|room_change|cancel|instruction|guest_update|allotment`, `page`, `pageSize`.

Response `200`

```json
{
  "data": [
    {
      "id": "ntf_1",
      "type": "check_out",
      "at": "2026-12-12T10:40:00+05:30",
      "hotelId": "htl_1",
      "hotelName": "Sai Prakash",
      "partyId": "pty_2",
      "visitorName": "Lakshmi",
      "summary": "Early check-out for 1 person",
      "early": true
    }
  ]
}
```

#### `GET /notifications/:notificationId`  
Accommodation Admin or the receptionist of that hotel. Full payload of the change.

---

### 15. Endpoint index

| Method | Path | Who |
| --- | --- | --- |
| POST | `/auth/login` | Accommodation Admin, receptionist, visitor |
| POST | `/auth/password` | Visitor |
| POST | `/auth/logout` | Any token |
| GET | `/auth/me` | Any token |
| GET | `/events/current` | Visitor, admin, receptionist |
| PUT | `/events/current` | Accommodation Admin |
| GET | `/events/current/booking-window` | Visitor, admin |
| GET | `/places/suggestions` | Visitor |
| GET | `/hotels` | Accommodation Admin, receptionist |
| POST | `/hotels` | Accommodation Admin |
| GET | `/hotels/:hotelId` | Accommodation Admin, receptionist |
| PATCH | `/hotels/:hotelId` | Accommodation Admin |
| PATCH | `/hotels/:hotelId/reserved` | Accommodation Admin |
| PATCH | `/hotels/:hotelId/active` | Accommodation Admin |
| GET | `/hotels/:hotelId/rooms` | Accommodation Admin, receptionist |
| POST | `/hotels/:hotelId/rooms` | Accommodation Admin |
| POST | `/hotels/:hotelId/rooms/bulk` | Accommodation Admin |
| GET | `/rooms/:roomId` | Accommodation Admin, receptionist |
| PATCH | `/rooms/:roomId` | Accommodation Admin |
| POST | `/bookings` | Visitor |
| GET | `/bookings/:bookingId` | Visitor, admin |
| PATCH | `/bookings/:bookingId` | Visitor |
| POST | `/bookings/:bookingId/family-members` | Visitor |
| PATCH | `/family-members/:memberId` | Visitor |
| DELETE | `/family-members/:memberId` | Visitor |
| PUT | `/bookings/:bookingId/stays` | Visitor |
| PUT | `/bookings/:bookingId/special-needs` | Visitor |
| GET | `/bookings/:bookingId/couple-question` | Visitor |
| PUT | `/bookings/:bookingId/couple-consent` | Visitor |
| GET | `/bookings/:bookingId/summary` | Visitor |
| POST | `/bookings/:bookingId/identity` | Visitor |
| POST | `/bookings/:bookingId/id-card` | Visitor |
| GET | `/id-cards/:idCardNumber` | Visitor, receptionist, admin |
| GET | `/admin/bookings` | Accommodation Admin |
| GET | `/admin/bookings/:bookingId` | Accommodation Admin |
| GET | `/admin/allocation/readiness` | Accommodation Admin |
| POST | `/admin/allocation/runs` | Accommodation Admin |
| GET | `/admin/allocation/runs/:runId` | Accommodation Admin |
| PATCH | `/admin/allocation/runs/:runId/assignments/:partyId` | Accommodation Admin |
| DELETE | `/admin/allocation/runs/:runId/assignments/:partyId` | Accommodation Admin |
| POST | `/admin/allocation/runs/:runId/confirm` | Accommodation Admin |
| GET | `/admin/allocation/runs/:runId/unmatched` | Accommodation Admin |
| POST | `/admin/parties/:partyId/actions` | Accommodation Admin |
| GET | `/reception/guests` | Receptionist |
| GET | `/reception/guests/:partyId` | Receptionist |
| GET | `/reception/id-cards/:idCardNumber` | Receptionist |
| POST | `/reception/check-ins` | Receptionist |
| POST | `/reception/check-outs` | Receptionist |
| GET | `/reception/checkout-reminders` | Receptionist |
| PATCH | `/reception/checkout-reminders/:partyId` | Receptionist |
| GET | `/notifications` | Accommodation Admin, receptionist |
| GET | `/notifications/:notificationId` | Accommodation Admin, receptionist |

---

### Notes
- This is a contract for the UI. It does not implement the server.
- File location: `docs/buddha-sangha/Technical.md` (Part C)

### Notes
- Living technical document.
- File: `docs/buddha-sangha/Technical.md`

### Notes
- Living technical document. Application code is not implemented yet.
- File: `docs/buddha-sangha/Technical.md`
