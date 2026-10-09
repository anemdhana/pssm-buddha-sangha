# Work summary — resume here

**Updated:** 09 Oct 2026  
**Specs:** `Requirements.md` · `Technical.md` · `UI.md`  
**Prototype:** `docs/prototype/`

---

## Three modules

| # | Module | Status |
|---|--------|--------|
| 1 | **Sangha register** | Specced (paper) |
| 2 | **Supporting events** | Specced — **Active/Inactive** anytime by Register Admin (not “five this week”) |
| 3 | **Accommodation** | Specced — next to build; role = **Accommodation Admin** (≠ PSSM Admin) |

---

## Done (UI prototype)

Join → Login → My Space, roles, admin desk, create event.

| Page | Who |
|------|-----|
| `join.html` | Guest — who / place / family / review |
| `login.html` | Guest — mobile + password (`≤5` letters + DDMM) |
| `profile.html` / `password.html` | Member |
| `admin.html` | **PSSM Admin** — search people, assign/remove roles, remove person |
| `events.html` | **Event Organizer** — name, start, end |
| `visitor.html` | Stay shell (prefill copy of join) |

**Sample PSSM Admin:** mobile `9000000001` · password `PssmA0101`  
**Shared logic:** `app-profile.js` (`localStorage`: people, roles, events, session)

**Roles**

- **PSSM Admin** — People & roles only  
- Assignable: Event Organizer · Pyramid Sevadal · PMMA Member  
- **Accommodation Admin** — hotels / allotment (docs only so far)

---

## Next

**Accommodation module** for already-joined people: Free/Paid Stay against an event, booking window, smart allotment, receptionist desk.

---

## Spec pointers

- Join / My Space: **FR-29j**, **US-26j…26c**  
- Active events: **FR-14**, **US-09**, **US-11**  
- Accommodation: Event accommodation section · Accommodation Admin US-01+  
