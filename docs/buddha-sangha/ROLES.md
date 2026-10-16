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
| *(none)* | Signed-in member | — |

---

## Capability matrix

| Capability | Member (any signed-in) | PMMA / Sevadal | Accommodation Volunteer | Accommodation Admin | Event Organizer | PSSM Admin |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| Join / login / My Profile / change password | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Free / Paid Accommodation (own family) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Book / register **another** visitor while booking | | | ✓ | | ✓ | ✓ |
| **Stay → Friends and Masters List** (list/edit/remove registrations) | | | ✓ | | ✓ | ✓ |
| **Stay → Who is staying where** (allotments view) | | | ✓ | ✓ | ✓ | ✓ |
| **Stay → Hotels & rooms** (add/edit hotels & rooms) | | | | ✓ | | ✓ |
| **Account → Create event** | | | | | ✓ | |
| **Account → People & roles** (admin people) | | | | | | ✓ |
| Default home after login | `/` | `/` | `/` | `/` | `/` | `/admin` |

Notes:

- **PMMA Member** and **Pyramid Sevadal** currently have **no extra Stay/admin screens** beyond a normal signed-in member. Roles are stored and assignable for future use.
- **Accommodation Admin** sees allotments and hotels, but **not** Friends and Masters List.
- **Event Organizer** can create events and view/manage registrations & allotments, but **not** hotel CRUD.
- Creating an event requires `event_organizer` only (PSSM Admin does **not** get Create event unless also given organizer).

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

---

## Stay booking behaviour

| Action | Who |
| --- | --- |
| Book free/paid stay for **own** mobile/family | Any signed-in member |
| Book for **someone else** / register new visitor (`registerFamily`) | `accommodation_volunteer`, `event_organizer`, `pssm_admin` |
| Lookup sangha profile by mobile (Stay guest prefill) | Same three roles |
| List / get / update / delete event registrations | Same three roles |
| List room allotments (“who is staying where”) | Volunteer, Accommodation Admin, Organizer, PSSM Admin |
| Manage hotel inventory (list/create/update) | Accommodation Admin, PSSM Admin |

---

## Account / sangha admin

| Action | Who |
| --- | --- |
| People & roles (`/admin`) — list people, set assignable roles, remove person | `pssm_admin` |
| Create / manage events (`/events`) | `event_organizer` |
| My Profile, Change password | Any signed-in |

---

## Demo logins (from seed)

| Mobile | Password | Roles |
| --- | --- | --- |
| `7093405071` | `Srini0101` | PSSM Admin |
| `9246470416` | `Chait1508` | Event Organizer |
| `9966362691` | `Meena1005` | Accommodation Volunteer + PMMA |
| `7780254680` | `Subha1402` | Accommodation Admin |
| `9845055103` | `Sowja2203` | Pyramid Sevadal |
| `8667684104` | `UmaMa0806` | PMMA Member |

Pick an event in the header before using Stay screens.

---

*Generated from current `AppShell`, Stay pages, and backend services (`StayBookingService`, `StayAllotmentService`, `HotelService`, `EventService`, `SanghaService`). Update this file when permissions change.*
