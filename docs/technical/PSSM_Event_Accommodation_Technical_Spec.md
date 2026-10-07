# Technical Specification  
## PSSM Spiritual Event – Accommodation Management System

**Version:** 2.2 (Living Document)  
**Last Updated:** 07 October 2026  
**Related Documents:**  
- PSSM_Event_Accommodation_Requirements.md  
- PSSM_Event_Accommodation_User_Stories.md  
- PSSM_Event_Accommodation_Allocation_Summary.md  
- PSSM_Event_Accommodation_API.md

---

### 1. Purpose of this Document

This Technical Specification describes the system design, data structures, sample master data, technical stack, and technical considerations for the Accommodation Management System used during PSSM spiritual events (e.g., Dhyana Maha Yagam).

It complements the Functional Requirements Specification.

---

### 2. Recommended Technical Stack

| Layer              | Technology                          | Notes |
|--------------------|-------------------------------------|-------|
| Frontend           | HTML5 + **UIKit 3** + Alpine.js    | UIKit for styling (as preferred). Alpine.js for lightweight interactivity. |
| Camera Capture     | Browser `getUserMedia` API          | Live photo + ID proof capture. |
| Backend            | **Node.js + Express.js**            | Main application server. |
| Real-time          | **Socket.io**                       | Live notifications between Admin and Hotel Receptionists. |
| Notifications      | **WhatsApp** (primary for now)      | For alerts to Admin / Receptionist / Visitors as needed. |
| Database           | **MySQL**                           | Structured relational data. |
| Authentication     | JWT + Role-based Access Control     | Roles: Admin, Hotel Receptionist, Visitor. |
| File Storage       | Local storage or Cloud (S3/Cloudinary) | For live photos and ID proof images. |

**Architecture Style:** Modular Monolith (recommended)

---

### 2.1 Microservices + Kafka – Recommendation

**Question:** Can we use microservices with Kafka streaming?

**Answer:** Technically yes, but **not recommended** for this project at present.

**Reasons against Microservices + Kafka right now:**

- Expected load is moderate (event-based, not continuous high traffic).
- Team size is likely small.
- Development and maintenance complexity increases significantly.
- Kafka adds operational overhead (cluster management, monitoring, partitioning, etc.).
- Socket.io already solves the real-time notification needs effectively.
- Faster delivery and easier debugging with a well-structured modular monolith.

**Recommended Approach:**
1. Build as a **clean Modular Monolith** (separate modules for Registration, Allotment, Check-in/Check-out, Notifications, Admin, etc.).
2. Use Socket.io for real-time events.
3. If the system grows significantly in future (multiple cities, year-round usage, very high concurrent users), then consider extracting services and introducing Kafka.

This keeps the system simple, fast to develop, and easy to maintain while still allowing future scalability.

---

### 3. System Overview

The system manages free and self-booked hotel accommodation for event visitors and their families. Key capabilities include:

- Registration of visitors and family members
- Capture of stay duration and special needs (aged persons, sickness)
- Priority allotment of nearby rooms for special-needs groups
- Standardized check-in / check-out time at **11:00 AM**
- Identity validation using assigned ID cards
- Person-wise check-out
- Real-time bi-directional notifications between Admin and Hotel Receptionists
- Single identification per party with live photo and ID proof capture via web camera

---

### 4. Core Entities (High-Level Data Model)

| Entity              | Description                                      | Key Attributes |
|---------------------|--------------------------------------------------|----------------|
| Hotel               | Partner hotels near the event venue              | Hotel ID, Name, Address, **Distance from event place** (entered by Admin), Contact, Active, **Reserved** (manual assignment only) |
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
- Rooms will be allotted based on family size, special needs (aged/sickness → priority for nearest rooms), room type preference, and availability.
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
- The system must support live capture using the device’s web camera.

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
- After the window closes, **Admin starts a smart allocation flow**.
- The flow assigns rooms only to parties that asked for free accommodation. Self-booked parties are skipped.
- Hotels marked **Reserved** are skipped. Admin assigns those rooms by hand from the review screen.
- Admin reviews the result and may override any allotment. Confirmed allotments notify the hotel receptionist.

**Rules applied by that flow**

1. Use family size, gender of each person, special needs, room type preference (AC / Non-AC), and whether the visitor is **Pyramid Sevadal** (volunteer), as captured during registration. Ignore hotels marked Reserved.
2. If aged persons or sickness is reported → prioritize rooms closest to the event venue.
3. If the visitor is **Pyramid Sevadal** → allot only in nearby hotels (walkable or very short auto distance). Give highest priority to closest rooms.
4. **Exact capacity:** If an empty room, dormitory, or hall has capacity exactly equal to the party size, assign that entire unit to the family. Do not share it. A dormitory or hall is eligible only when every person matches the gender it allows. A dormitory or hall is usually **10 to 50** beds, so this whole-unit match applies there only when the party is that large. A smaller same-gender party takes only the beds it needs, and the remaining beds stay open for more people of that gender. If several units match, apply steps 2, 3, and 6. For one person, prefer a matching dormitory or hall over a regular room of capacity 1.
5. If no exact match exists, match room capacity ≥ number of persons requiring accommodation.
6. Prefer requested room type (AC or Non-AC) where available (default = AC).
7. **Husband and wife in a capacity-3 room**, only when step 4 did not assign a unit: the party is exactly one gent and one lady, registered as husband and wife. If they agreed during booking, and two other agreeing couples are also waiting, assign the three closest capacity-3 rooms as follows: all three ladies in one room, all three gents in one room, and leave the third room free. Repeat for each further set of three. A couple who did not agree stays together in one capacity-3 room. If fewer than three couples agreed, each keeps their own capacity-3 room.
8. **Single person (party size = 1)**, only when step 4 did not assign a unit:  
   - **First choice** → Dormitory or Hall that allows that person’s gender (**Gents allowed only** or **Ladies allowed only**).  
   - **Last choice** → Regular private/shared room.  
   - A Dormitory or Hall never mixes gents and ladies. A party that includes both stays in a regular room.
9. **Support shared room allotment** when steps 4 and 7 did not assign a whole unit: A room can be shared by multiple families as long as total persons ≤ room capacity. In a Dormitory or Hall, every person must match the gender that room allows. After each placement, the remaining beds in that dormitory or hall stay open and allocation continues to fill them with the same gender until capacity is reached.  
   - **First choice**: Families from the **same location** (rural: same town; urban: same city).  
   - Only if no suitable same-location family is available, consider families from different locations.  
   - If the room is **already partly occupied** and everyone in it is gents, fill the remaining beds only with a party that is entirely gents.  
   - If everyone already in it is ladies, fill the remaining beds only with a party that is entirely ladies.  
   - A mixed party is not added to a room that is already all one gender. Same-location preference still applies among the parties that match.
10. Support partial / person-wise occupancy (one room can have members with different check-out dates).

**After guests are in the hotel**

11. On check-out (full, person-wise, or early) at 11:00 AM → free the capacity for immediate re-use.  
12. Early check-out is freely allowed before the scheduled check-out date. Hotel receptionist performs the action and Admin is notified automatically.

**Room Key Policy:**  
Visitors must never take room keys with them. Keys must always be deposited with the Hotel Receptionist.

---

### 8. Next Steps / Open Items / Decisions

| Item | Status / Decision |
|------|-------------------|
| Add more hotels and their room inventories | Will be done later |
| Define exact distance/priority ranking rules for “nearby” hotels | **Decision:** Allow Admin to add hotel details along with distance details from the event place |
| Clarify how AC / Non-AC is assigned | **Decision:** Defaulted to **AC** |
| Detail technical implementation of web-camera capture | **Decision:** Normal / usual browser implementation only (standard `getUserMedia`, normal image quality & storage) |
| Define notification channels | **Decision:** **WhatsApp** for now |
| Database schema (tables, relationships, indexes) | TODO later via Agile user stories |
| API endpoints | **Decision:** REST contract for the UI is in `PSSM_Event_Accommodation_API.md`. Live updates stay on Socket.io |
| User roles and permissions (Admin, Hotel Receptionist, Visitor) | TODO later via Agile user stories |
| When booking closes | **Decision:** Booking closes **2 days before** the event start |
| When rooms are allotted | **Decision:** Admin runs a **smart allocation** flow after booking closes. Rules in Section 7 |
| Dormitory / Hall gender | **Decision:** Each Dormitory or Hall is **Gents allowed only** or **Ladies allowed only**, usually **10 to 50** beds. Remaining beds stay open and are filled with that same gender until full. Regular rooms have no preset gender limit |
| Couple and a capacity-3 room | **Decision:** Ask husband and wife. Three who agree use the three closest capacity-3 rooms: ladies together, gents together, one room freed. A couple who declines stays together in a capacity-3 room |
| Reserved hotels | **Decision:** A Reserved switch on the hotel list (and on the hotel form) keeps that hotel out of smart allocation. Admin assigns it manually |

---

### 9. Project Structure & Documentation Organization

The following folder structure will be followed when the real project is created:

```text
pssm-accommodation-system/
│
├── docs/                          ← All documentation
│   ├── requirements/
│   │   ├── PSSM_Event_Accommodation_Requirements.md
│   │   └── PSSM_Event_Accommodation_User_Stories.md
│   ├── technical/
│   │   └── PSSM_Event_Accommodation_Technical_Spec.md
│   ├── decisions/                 ← (optional) Architecture Decision Records
│   └── assets/                    ← Screenshots, sample ID cards, diagrams, etc.
│
├── src/                           ← Application code
│   ├── frontend/                  ← HTML + UIKit 3 + Alpine.js
│   ├── backend/                   ← Node.js + Express + Socket.io
│   └── shared/
│
├── database/                      ← SQL scripts, migrations
│
├── scripts/                       ← Utility scripts
│
├── .env.example
├── package.json
├── README.md
└── .gitignore
```

**Documentation Locations (when project starts):**
- Requirements → `docs/requirements/PSSM_Event_Accommodation_Requirements.md`
- User Stories → `docs/requirements/PSSM_Event_Accommodation_User_Stories.md`
- Technical Spec → `docs/technical/PSSM_Event_Accommodation_Technical_Spec.md`

**Current temporary location:**  
`/home/workdir/artifacts/` (will be moved into the proper structure later)

---

### Notes
- This is a living technical document.  
- Sample data will be expanded as more hotels/rooms are provided.  
- File location: `/home/workdir/artifacts/PSSM_Event_Accommodation_Technical_Spec.md`
