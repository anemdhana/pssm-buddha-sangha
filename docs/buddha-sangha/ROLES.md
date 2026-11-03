# Sangha roles — what each role can do (so far)

Snapshot of permissions enforced in the app today (frontend nav + backend APIs). A person can hold **multiple** roles.

| Role id | Label | Assignable by PSSM Admin |
| --- | --- | --- |
| `pssm_admin` | PSSM Admin | No (bootstrap / claim only) |
| `event_organizer` | Event Organizer | Yes |
| `accommodation_volunteer` | Accommodation Volunteer | Yes |
| `accommodation_admin` | Accommodation Admin | Yes |
| `pyramid_sevadal` | Pyramid Sevadal | Yes |
| `pmma_member` | PMMA Member | Yes |
| `hotel_desk` | Hotel Desk | **No** — attached on hotel record (max 3), not People & roles |
| *(none)* | Signed-in member | — |

---

## Capability matrix

| Capability | Member (any signed-in) | PMMA / Sevadal | Accommodation Volunteer | Accommodation Admin | Event Organizer | PSSM Admin | Hotel Desk |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Join / login / My Profile / change password | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (login + change password) |
| Free / Paid Accommodation (own family) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Book / register **another** visitor while booking | | | ✓ | | ✓ | ✓ | |
| **Stay → Friends and Masters List** (list/edit/remove registrations) | | | ✓ | | ✓ | ✓ | |
| **Stay → Who is staying where** (allotments view) | | | ✓ | ✓ | ✓ | ✓ | |
| **Stay → Hotels & rooms** (add/edit hotels & rooms + Hotel Desk people) | | | | ✓ | | ✓ | |
| **Hotel desk** (dated guest list, check-in / out / did not arrive) | | | | | | | ✓ |
| **Account → Create event** | | | | | ✓ | | |
| **Account → People & roles** (admin people) | | | | | | ✓ | |
| Default home after login | `/` | `/` | `/` | `/` | `/` | `/admin` | Hotel desk (R1) |

Notes:

- **PMMA Member** and **Pyramid Sevadal** currently have **no extra Stay/admin screens** beyond a normal signed-in member. Roles are stored and assignable for future use.
- **Accommodation Admin** sees allotments and hotels, but **not** Friends and Masters List.
- **Event Organizer** can create events and view/manage registrations & allotments, but **not** hotel CRUD.
- Creating an event requires `event_organizer` only (PSSM Admin does **not** get Create event unless also given organizer).
- **Hotel Desk** (`hotel_desk`) is **not in the live app yet**. Spec: attach on hotel (FR-28a / US-01a); login contact + temp password from hotel name + person name + contact; dashboard shows **hotel name**; header is **event name only** with **no top menu**; desk FR-09a–e / UI R1. Earlier docs may have said `hotel_receptionist` — use **Hotel Desk** / `hotel_desk`.

---

## Stay menu (signed-in)

Always shown:

- Free Accommodation → `/stay?plan=free`
- Paid Accommodation → `/stay?plan=paid`

Role-gated:

| Menu item | Who sees it |
| --- | --- |
| Friends and Masters List | `accommodation_volunteer`, `event_organizer`, `pssm_admin` |
| Who is staying where | above **plus** `accommodation_admin` |
| Hotels & rooms | `accommodation_admin`, `pssm_admin` |

**Hotel Desk** has **no Stay / Account / Help menu** — menu-less shell only.

---

## Stay booking behaviour

| Action | Who |
| --- | --- |
| Book free/paid stay for **own** mobile/family | Any signed-in member |
| Book for **someone else** / register new visitor (`registerFamily`) | `accommodation_volunteer`, `event_organizer`, `pssm_admin` |
| Lookup sangha profile by mobile (Stay guest prefill) | Same three roles |
| List / get / update / delete event registrations | Same three roles |
| List room allotments (“who is staying where”) | Volunteer, Accommodation Admin, Organizer, PSSM Admin |
| Manage hotel inventory (list/create/update) + Hotel Desk people | Accommodation Admin, PSSM Admin |
| Hotel desk check-in / check-out / did not arrive | `hotel_desk` (own hotel only) |

---

## Account / sangha admin

| Action | Who |
| --- | --- |
| People & roles (`/admin`) — list people, set assignable roles, remove person | `pssm_admin` |
| Create / manage events (`/events`) | `event_organizer` |
| My Profile, Change password | Any signed-in (incl. Hotel Desk) |

---

## Demo logins (from seed)

### release-v1 (lean staff)

| Mobile | Password | Roles |
| --- | --- | --- |
| `9445560075` | `Dhana1405` | PSSM Admin + Event Organizer |
| `9966362691` | `Meena1005` | Accommodation Volunteer |

### Full sample seed

| Mobile | Password | Roles |
| --- | --- | --- |
| `9445560075` | `Dhana1405` | PSSM Admin + Event Organizer |
| `9246470416` | `Chait1508` | Event Organizer |
| `9966362691` | `Meena1005` | Accommodation Volunteer + PMMA |
| `7780254680` | `Subha1402` | Accommodation Admin |
| `9845055103` | `Sowja2203` | Pyramid Sevadal |
| `8667684104` | `UmaMa0806` | PMMA Member |

Pick an event in the header before using Stay screens.

---

*Generated from current `AppShell`, Stay pages, and backend services (`StayBookingService`, `StayAllotmentService`, `HotelService`, `EventService`, `SanghaService`). Update this file when permissions change. Planned: `hotel_desk` on hotel record (FR-28a / US-01a / US-01b).*
