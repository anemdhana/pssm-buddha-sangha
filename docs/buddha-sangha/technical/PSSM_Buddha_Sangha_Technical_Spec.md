# Technical Specification  
## PSSM Buddha Sangha (`pssm-buddha-sangha`)

**Version:** 1.9 (Living Document)  
**Last Updated:** 08 October 2026  
**Related Documents:**  
- PSSM_Buddha_Sangha_Requirements.md  
- PSSM_Buddha_Sangha_User_Stories.md  
- PSSM_Buddha_Sangha_Register_Summary.md  

---

### 1. Purpose of this Document

This Technical Specification describes the system design, data structure, sample data, technical stack, and technical considerations for the PSSM Buddha Sangha register.

The register records who is part of the PSSM sangha and practices meditation as taught by Patriji. It complements the Requirements Specification.

---

### 2. Recommended Technical Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | HTML5 + **UIKit 3** + Alpine.js | UIKit for styling. Alpine.js for lightweight interactivity. |
| Backend | **Node.js + Express.js** | Main application server. |
| Database | **MySQL** | A places table and a members table. |
| Authentication | JWT + roles **Admin** and **Sangha member** | Both can open the dashboard. Admin keeps the register. |

**Architecture style:** a small modular monolith with a places module, a members module (add, edit, view, search), the people dashboard, this week’s five-event graph, and sign-in.

The event accommodation module in this same project also uses Socket.io and WhatsApp. The sangha register does not. There is no live hotel desk and no notification channel to build for the register alone.

---

### 3. System Overview

Admin or a person in the sangha signs in and opens this week’s page: a photo circle, and five event boxes in a column ordered by remaining contributions, highest first. The people dashboard is the next page.

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
| This week’s events | **Decision:** Five boxes in one column. Admin replaces the five every week |
| Who is part of the contribution | **Decision:** 1,44,000 meditators across the globe |
| Remaining | **Decision:** For each event, 1,44,000 minus how many are shown as supported. Boxes are ordered top to bottom, highest remaining first. Inside a box, each place shows how many people from that city or town are not yet supported, highest remaining first |
| Support | **Decision:** People in the city or state where the event happens must support first. An able person there may enter an extra amount. Other locations are allotted only the amount still needed after that |
| Ask someone to contribute | **Decision:** A person who is unable, including in the host city or state, asks another person to contribute for them, and is shown as supported |
| What the graph shows | **Decision:** The person who asked is shown as supported. The name of the person who contributed is shown beside them. One total: how much is supported |
| Person in the circle | **Decision:** The person’s photo is shown in the circle. Under it: this week’s contribution for the five events, then their feedback / comments for this week |
| Database schema (indexes, exact SQL) | TODO when implementation starts |
| API endpoints | None for now |
| Notifications, photos, ID proof | **Decision:** Out of scope |

---

### 8. Project Structure & Documentation Organization

```text
pssm-buddha-sangha/
│
├── docs/
│   ├── requirements/
│   │   ├── PSSM_Buddha_Sangha_Requirements.md
│   │   └── PSSM_Buddha_Sangha_User_Stories.md
│   ├── technical/
│   │   ├── PSSM_Buddha_Sangha_Technical_Spec.md
│   │   └── PSSM_Buddha_Sangha_Register_Summary.md
│   ├── decisions/
│   └── assets/
│       └── PSSM_Buddha_Sangha_UI_Prototype.md
│
├── src/
│   ├── frontend/
│   ├── backend/
│   └── shared/
│
├── database/
├── scripts/
├── .env.example
├── package.json
├── README.md
└── .gitignore
```

**Documentation locations:**
- Requirements → `docs/requirements/PSSM_Buddha_Sangha_Requirements.md`
- User Stories → `docs/requirements/PSSM_Buddha_Sangha_User_Stories.md`
- Technical Spec → `docs/technical/PSSM_Buddha_Sangha_Technical_Spec.md`
- Register summary → `docs/technical/PSSM_Buddha_Sangha_Register_Summary.md`
- UI prototype → `docs/assets/PSSM_Buddha_Sangha_UI_Prototype.md`

---

### Notes
- This is a living technical document.
- Application code is not implemented yet.
- File location: `docs/technical/PSSM_Buddha_Sangha_Technical_Spec.md`
