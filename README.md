# PSSM Event Accommodation System

Modular monolith for managing free and self-booked hotel accommodation during PSSM spiritual events (for example, Dhyana Maha Yagam).

## What the system does

Organizers register visitors and their families and capture stay length and special needs. Booking closes two days before the event. Admin then runs smart room allocation. Hotel receptionists check guests in and out. Admin and reception stay in sync through live notifications.

- Booking closes **2 days before** the event. Rooms are allotted afterward, when Admin runs smart allocation. A few hotels can be marked Reserved and assigned only by hand
- Free rooms near the venue, plus an optional self-booking path
- Priority for aged or sick guests, and for Pyramid Sevadal (volunteers), in the closest hotels
- One ID card per party, with a live photo and an ID-proof photo from the web camera
- Standard check-in and check-out at **11:00 AM**, including person-wise and early check-out
- A husband and wife asked to share a 3-bed room may agree to separate into a ladies room and a gents room with two other couples, which frees one room. If they do not agree, they stay together
- If a family’s size exactly matches an empty room, dormitory, or hall, that whole unit is theirs. Otherwise rooms may be shared, preferring families from the same place. A partly filled all-gents room takes only an all-gents party, and an all-ladies room takes only an all-ladies party
- Single visitors go to a dormitory or hall of their gender first. Each dormitory or hall is gents only or ladies only, usually 10 to 50 beds, and the remaining beds stay open for more people of that gender
- Room keys stay with the hotel receptionist

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML5, UIKit 3, Alpine.js |
| Backend | Node.js, Express.js |
| Real-time | Socket.io |
| Notifications | WhatsApp |
| Database | MySQL |
| Auth | JWT with roles: Admin, Hotel Receptionist, Visitor |

Architecture is a modular monolith (registration, allotment, check-in/check-out, notifications, admin). Microservices and Kafka are deferred until the system grows beyond a single event.

## Documentation

| Document | Location |
| --- | --- |
| Requirements (v2.8) | `docs/requirements/PSSM_Event_Accommodation_Requirements.md` |
| User stories (v2.2) | `docs/requirements/PSSM_Event_Accommodation_User_Stories.md` |
| Technical spec (v2.2) | `docs/technical/PSSM_Event_Accommodation_Technical_Spec.md` |
| Allocation summary | `docs/technical/PSSM_Event_Accommodation_Allocation_Summary.md` |
| REST API | `docs/technical/PSSM_Event_Accommodation_API.md` |
| REST API | `docs/technical/PSSM_Event_Accommodation_API.md` |

Suggested build order is in the user stories: foundation and master data first (US-01 to US-04), then registration and allotment, hotel operations, real-time admin control, and optional self-booking last.

## Layout

```text
docs/requirements/   requirements and user stories
docs/technical/      technical specification
docs/decisions/      architecture decision records
docs/assets/         screenshots, sample ID cards, diagrams
src/frontend/        HTML + UIKit 3 + Alpine.js
src/backend/         Node.js + Express + Socket.io
src/shared/          code shared by frontend and backend
database/            SQL scripts and migrations
scripts/             utility scripts
```

Copy `.env.example` to `.env` before running the application. Application code is not implemented yet.
