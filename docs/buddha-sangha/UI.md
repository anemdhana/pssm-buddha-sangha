# UI
## PSSM Buddha Sangha (pssm-buddha-sangha)

**Project:** pssm-buddha-sangha  
**Version:** 1.8 (Living Document)  
**Last Updated:** 09 October 2026  

Visitor screens live in `docs/prototype/`. This document covers sangha Admin/dashboard paper notes, accommodation fields, and the UIkit working guide.

---

## Table of contents

- [Three modules](#three-modules)
- [Prototype track status](#prototype-track-status)
- [Sangha register](#sangha-register)
  - [2. How to add a screenshot](#2-how-to-add-a-screenshot)
  - [3. Screen log](#3-screen-log)
  - [4. Screens](#4-screens)
  - [5. Fields to draw (paper and pen)](#5-fields-to-draw-paper-and-pen)
  - [6. Section template](#6-section-template)
- [Event accommodation](#event-accommodation)
  - [2. How to add a screenshot](#2-how-to-add-a-screenshot-1)
  - [3. Screen log](#3-screen-log-1)
  - [4. Screens](#4-screens-1)
  - [5. How each page should look](#5-how-each-page-should-look)
  - [6. Fields to draw (paper and pen)](#6-fields-to-draw-paper-and-pen)
  - [7. Section template](#7-section-template)
- [Accommodation — UIkit working guide](#accommodation-uikit-working-guide)
- [1. How every page is built](#1-how-every-page-is-built)
- [2. Getting started](#2-getting-started)
- [3. Components already in the prototype](#3-components-already-in-the-prototype)
- [4. What to reach for next](#4-what-to-reach-for-next)
- [5. Leave these alone](#5-leave-these-alone)
- [6. Choices that keep coming up](#6-choices-that-keep-coming-up)
- [7. Details that are easy to get wrong](#7-details-that-are-easy-to-get-wrong)
- [8. File map](#8-file-map)

---
## Three modules

| # | Module | What it covers | Typical role |
| --- | --- | --- | --- |
| 1 | **Sangha register** | Masters register: add/edit people, places, dashboard groups | Register Admin / Sangha member |
| 2 | **Supporting events** | Active events (Register Admin can set Active/Inactive anytime), budgets, host-first support, equal share | Register Admin / Sangha member |
| 3 | **Accommodation** | Hotels, rooms, Free/Paid Stay for an event, booking window, smart allotment, receptionist check-in/out | **Accommodation Admin**, Hotel Receptionist, Visitor |

**Role note:** **PSSM Admin** (People & roles on My Space) assigns Event Organizer / Pyramid Sevadal / PMMA Member / Accommodation Volunteer. Accommodation Volunteer books stay (including new visitors). That is not the same as **Accommodation Admin**, who runs hotels and room allotment.

## Prototype track status

| Track | Status | Notes |
| --- | --- | --- |
| Join + Login + My Profile + password | **Done (UI prototype)** | Compact `x-group` forms; wizard switcher |
| Roles + PSSM Admin People & roles | **Done (UI prototype)** | Collapse search after results; 1..n matches; equal action buttons |
| Event Organizer create event | **Done (UI prototype)** | Feeds header event picker |
| Accommodation module (Accommodation Admin) | **Next** | Hotels, Stay, allotment for joined people |


## Sangha register

### 2. How to add a screenshot

1. Save the image in `docs/assets/screenshots/`.
2. Name it `NN-short-name.png` (or `.jpg`), for example `02-sangha-list.png`.
3. Add a section under **Screens** using the template at the end of this file.
4. Embed it with a relative path:

```markdown
![Sangha list](screenshots/02-sangha-list.png)
```

---

### 3. Screen log

| # | File | Screen | Roles | UIkit pieces | Status |
|---|------|--------|-------|--------------|--------|
| 1 | `docs/prototype/index.html` | Sangha landing | Visitor | cards, grid, navbar | Prototype done |
| 2 | `docs/prototype/join.html` | Join PSSM Buddha Sangha | Visitor | switcher, progress, form, grid, subnav, modal | Prototype done |
| 3 | `docs/prototype/login.html` | Login to My Space | Visitor | form (mobile + password), compact groups | Prototype done |
| 3a | `docs/prototype/profile.html` | My Profile | Visitor (signed in) | switcher wizard like join; roles display | Prototype done |
| 3b | `docs/prototype/password.html` | Change my password | Visitor (signed in) | compact x-group form | Prototype done |
| 3c | `docs/prototype/events.html` | Create event | Event Organizer | name, dates, location, budget INR, optional meditation hrs; list | Spec updated — app form mirrors this |
| 3d | `docs/prototype/admin.html` | People & roles | PSSM Admin | search mobile, roles, remove | Prototype done |
| 4 | `docs/prototype/visitor.html` | Accommodation (prefill from join) | Visitor | same as accommodation UI notes | Draft |
| | | Admin / sangha dashboard screens below | Admin, Sangha member | | Waiting for sketches |

Shared static pages live under `docs/prototype/`. Accommodation field detail is in the Event accommodation section below.

---

### 4. Screens

Visitor join and stay flows are already drafted in the prototype. Drop Admin / sangha-dashboard sketches into `screenshots/` and they will be attached here.

Screens still to expect (Admin / member):

- Active events, drawn first: one circle, then one box per Active event, top to bottom by remaining contributions
- Sign-in for Admin and for a person in the sangha
- Place list (Admin)
- Sangha dashboard, grouped by location and by pyramid center
- Add or edit a person, with place chosen from autocomplete
- Person detail (Admin)
- Support, or ask another person to contribute
- Register Admin creates events and marks them Active or Inactive at any time

---

### 5. Fields to draw (paper and pen)

Draw **one page per screen** below. Put a star on required fields. Leave a clear primary button at the bottom of each form.

The form has only these fields: full name, mobile, place, pyramid center or group, and since. Since has no star. Place is a selection, not a typed town.

Suggested drawing order: **A6 first**, then A7, A8, then A1, A5, A2, A3, A4.

**A6 — PSSM sangha and active events**

Draw this page first. A circle on the left holds the person's photo. To the right, one box per **Active** event in one column, top to bottom.

```text
  ( photo )          +----------------------------------+
  name               | Event with most still needed     |
  PSSM sangha        | Remaining  1,43,800               |
                     | Vijayawada          remaining 40 |
                     | Bengaluru           remaining 12 |
                     | Hyderabad           remaining  3 |
                     +----------------------------------+
                     +----------------------------------+
                     | Next event                       |
                     | Remaining  1,20,000               |
                     | locations, highest first         |
                     +----------------------------------+
                     +----------------------------------+
                     | Event closest to everyone        |
                     | Remaining  smallest              |
                     | locations, highest first         |
                     +----------------------------------+
```

**1,44,000 meditators** across the globe are part of the contribution. Write that figure once at the top of the page. For each event, remaining contributions needed = **1,44,000 minus how many people are shown as supported** for that event.

Inside each event box, under that number, list **each place**. A place's remaining is how many people from that city or town are not yet shown as supported for this event. Order those places **top to bottom, highest remaining first, lowest last**. A place where everyone has contributed shows remaining 0 and sits at the bottom of that list.

Stack the active-event boxes from **highest remaining at the top** to **lowest remaining at the bottom**. When two events have the same remaining number, keep the order Register Admin entered them. After each new contribution, the numbers change and a box can move down the column.

The circle shows the person's photo, cropped round, with their name under it. A small label by the circle still says **PSSM sangha**. On first open, the photo is the signed-in person. Touching a name in any box puts that person's photo in the circle. Under the photo, write: **An equal share of each event's budget. Everyone is part of the global cause.**

Under the photo, still inside the middle of the page, draw two blocks for **this person, active events**.

**Contribution for active events.** One line for each Active event:

| Line | Draw as | What to write |
| --- | --- | --- |
| Event name | The box's name | One of the Active events |
| What they did | Supported / Not yet | Supported means this person counts as supported. If they asked someone else, still write Supported, and write who contributed |
| Who contributed | Name, only when someone else gave | The person they asked. Blank when they contributed themselves |
| Amount | The equal share, or blank | That event's budget divided by 1,44,000. Blank only on Not yet |

**Feedback / comments.** Under the contribution lines, draw the person's own words. If they have not written any, leave the box empty. The words are theirs.

Write **Active events** at the top of the page, next to **1,44,000 meditators**. Each box is one Active event. Register Admin can activate or deactivate events at any time; Inactive events are not shown. Contribution lines and comments follow the current Active set.

The large line on a whole-sangha box is **Remaining** people. A small-budget box is different: it names one place and shows a **remaining amount**. That amount starts at what Admin requested from that place and falls to **zero**.

| Block | Draw as | What to write |
| --- | --- | --- |
| Remaining | The large number | 1,44,000 minus how many are shown as supported for this event. Highest remaining box is on top |
| Budget | The event's budget | Set by Admin for this event. Each event has its own budget |
| Equal share | The allotted share | What one able person contributes. Whole sangha: event budget Ã· 1,44,000. One location: that location's amount Ã· able persons there |
| Location amount | Allotted amount, then remaining | Smart allotment sets it from persons and how many are able. On a small-budget event the remaining falls as people there voluntarily support, and stops at zero |
| By location | Place name and a remaining number, one row each | People from that city or town who are not yet supported for this event. Highest remaining place first |
| Supported | Name, the equal share, and who contributed | The person is shown as supported. If they contributed themselves, no extra name. If they asked someone else, write that person's name next to them |

Also write how much is supported: the equal shares added up, including a share given by a person who was asked. When everyone has contributed, that total is the event budget.

A person in the sangha and Admin both see this page.

Buttons, under the graph:

- Support
- Ask someone to contribute

Support opens A7 for the signed-in person. Ask someone to contribute opens A7 so they can choose who to ask. Pointing at a box opens A7 for that event.

**UIkit.** The photo is an image with `uk-border-circle`. Active events are a vertical `uk-grid` of one column, each event a `uk-card`. Remaining is `uk-heading-small` on the card. The location rows are a `uk-list` inside the card, ordered from highest remaining to lowest. The cards are ordered in the markup from highest remaining to lowest. The contribution lines under the photo (one per Active event) are a `uk-list`. Feedback / comments is a `uk-card` under that list. How much is supported is a `uk-label`. The name of the person who contributed, when it is someone else, is `uk-text-meta` beside the supported name. The two actions are `uk-button uk-button-primary` and `uk-button uk-button-default`.

**A7 — Support an equal share**

One event, already chosen from a box on A6. The share is shown and is not typed. An able person in the host city or state may type an extra amount.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Event | Yes | Read-only | The box they touched |
| Who | Yes | Read-only | The signed-in person |
| Ask whom | Only when asking | Choice of one person in the sangha | Shown when they cannot contribute and ask someone else |
| Amount | Yes | Read-only | The share smart allotment gave this person. Host city or state only |
| Extra amount | No | Amount they type | Shown to an able person in the host city or state. Added on top of the share. Can be large. It reduces what is still needed |
| Feedback / comments | No | A few lines of text | The person's own words. Shown under their photo on A6 |

Two buttons. **Support** on a host city or state contributes that person's share. **Extra amount** is saved with it when they entered one. **Ask someone to contribute** is how a person who is unable in the host city or state still meets the rule that they must support. Other locations see Support only after the host people have supported and an amount is still needed.

**A8 — Manage active events**

Register Admin only. Create or edit events and set each to Active or Inactive at any time.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Event name | Yes | Text | One row per event; any number of events |
| Status | Yes | Active / Inactive | Register Admin can change this at any time. Only Active events appear on A6 |
| Happening in | Yes | Cities, or one state | People in these cities, or in all cities of this state, must support first |
| Kind | Yes | Whole sangha / One location | Whole sangha follows host-first allotment. One location asks only that place |
| Budget | Yes, for whole sangha | Amount | Divided equally across 1,44,000 |
| Place | Yes, for one location | Autocomplete | The city or town asked to cover the amount |
| Amount for that place | Yes, for one location | Amount | Starts as the remaining amount on the box. Voluntary support from people in that place reduces it to zero |

Button: Save. Then draw **Allot amounts**. It opens A9.

**A9 — Smart allotment**

Admin only. One event, already saved. Draw two groups.

**First — where the event happens.** These rows are marked â€œMust supportâ€. People here support before anyone else.

**Then — other locations.** Draw these rows only for the amount still needed after the host shares and any extra amounts. If nothing is still needed, write â€œOther locations are not askedâ€ and draw no amount on them.

| Column | What to write |
| --- | --- |
| Place | City or town, and its state |
| Host | Yes if the event happens in this city or this state. Otherwise no |
| Persons | How many people in the sangha have this place |
| Able to support | How many of them are able. The rest are unable |
| Allotted amount | Host: event budget Ã— (able persons here Ã· 1,44,000). Other locations: the same formula using only the amount still needed, and only after the host group has supported |
| Share | Allotted amount Ã· able persons in this place |
| Override | An optional amount Admin can write in place of the allotted amount |

A location with no one able shows allotted amount 0 and no share. Button: Use these amounts. The boxes then show each location's amount. Admin may still override before that button.

#### Admin and sangha member

**A1 — Sign in**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Name | Yes | Text | Admin, or a person already on the register |
| Password | Yes | Password | |

Button: Sign in. After success, draw a path to the active-events graph (A6). From A6, a text link opens the people dashboard (A2).

**A5 — Place list**

Admin only. A short list of cities and towns, plus one add row.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| City or town | Yes | Text | Saved into the autocomplete list. The same name is not added twice in one state |
| State | Yes | Text | The state this city or town belongs to. Used when an event happens in a state |

Button: Add place. Each saved place can be edited. This list is what A3 searches.

**A2 — People dashboard**

A second page, opened from A6. Admin and a person in the sangha can open it. Two ways to group. Draw a switch:

- By location
- By pyramid center

**By location.** One block per city or town. The heading is the place name and the count of masters, for example â€œVijayawada — 2 mastersâ€. Under it, list the people from that place.

**By pyramid center.** One block per center. The heading is the center name and the count, for example â€œIndiranagar Pyramid Group — 1 masterâ€. Under it, list the people who sit with that center.

Columns inside a group:

- Full name
- Place
- Pyramid center or group
- Since

Since is blank when the year is unknown. A sangha member does not see mobile numbers.

Admin also has a search box above the groups. It matches name, mobile, place, center, or since. Draw a control to clear the search. Groups stay in place and show only the matching people.

Button, Admin only: Add a person. Each row opens that person's detail (A4) for Admin.

**A3 — Add or edit a person**

The same form for a new person and for a correction. On edit, show the current values. Admin only.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Full name | Yes | Text | Who |
| Photo | No | A circle | The face shown in the circle on A6. Draw a round frame. Empty if no photo yet |
| Mobile | Yes | Phone | How to reach them. Show a warning space when the format is invalid |
| Place | Yes | Autocomplete | City or town. Typing narrows the place list. The user selects one. Free-form text is not saved. Show a warning when nothing matches |
| Pyramid center or group | Yes | Text | Which sangha they sit with |
| Since | No | Year, four digits | Year they began, if known. Leave empty when unknown |

Button: Save. After save, return to the dashboard, with the person under the selected place.

**A4 — Person detail**

Admin only. No new typing. Draw a circle with the photo first, then the five fields as read-only:

- Photo, in a circle
- Full name
- Mobile
- Place
- Pyramid center or group
- Since (blank when unknown)

Button: Edit. It opens A3 with these values filled in. Place shows the selected city or town, ready to change from the same autocomplete.

---

### 6. Section template

Copy this block for each new sketch.

```markdown
### Screen NN — Title

![Title](screenshots/NN-short-name.png)

**What the sketch shows**
- 

**UIkit components**
- Layout:
- Navigation:
- Content:
- Forms / actions:
- Status / feedback:

**Notes**
- 
```

---

### Notes
- This is a living document. New sketches are appended as they are shared.
- File location: `docs/buddha-sangha/UI.md`
- Screenshot folder: `docs/assets/screenshots/`

---

## Event accommodation

### 2. How to add a screenshot

1. Save the image in `docs/assets/screenshots/`.
2. Name it `NN-short-name.png` (or `.jpg`), for example `01-visitor-registration.png`.
3. Add a section under **Screens** using the template at the end of this file.
4. Embed it with a relative path:

```markdown
![Visitor registration](screenshots/01-visitor-registration.png)
```

---

### 3. Screen log

| # | File | Screen | Roles | UIkit pieces | Status |
|---|------|--------|-------|--------------|--------|
| 1 | `docs/prototype/index.html` | PSSM Buddha Sangha landing | Visitor | cards, grid | Draft |
| 2 | `docs/prototype/join.html` | Join PSSM Buddha Sangha | Visitor | switcher, progress, form, grid, subnav, modal | Prototype done |
| 3 | `docs/prototype/login.html` | Login to My Space | Visitor | form (mobile + password), compact groups | Prototype done |
| 3a | `docs/prototype/profile.html` | My Profile | Visitor (signed in) | switcher wizard like join; roles display | Prototype done |
| 3b | `docs/prototype/password.html` | Change my password | Visitor (signed in) | compact x-group form | Prototype done |
| 3c | `docs/prototype/events.html` | Create event | Event Organizer | name, dates, location, budget INR, optional meditation hrs; list | Spec updated — app form mirrors this |
| 3d | `docs/prototype/admin.html` | People & roles | PSSM Admin | search mobile, roles, remove | Prototype done |
| 4 | `docs/prototype/visitor.html` | Accommodation wizard | Visitor | switcher, progress, form, grid, subnav, modal, description list | Draft |

---

### 4. Screens

A static look-and-feel page is at `docs/prototype/index.html`. Open that file in a browser. It is not the working app, and it does not live in `frontend/`.

The landing is **PSSM Buddha Sangha**: Join, Login to My Space, and Free / Paid Accommodation. The header keeps Patriji and the PSSM logo, with an event picker and Stay / Sangha / Account menus.

Login is `docs/prototype/login.html`. The person signs in with **mobile number** and **password**. The first password is created at join: up to the first 5 letters of the name, then the date and month of birth. Example: Ramakrishna, 15 August → `Ramak1508`.

Join is `docs/prototype/join.html` (who → place → family → review → done). Optional passport-size live photo and ID proof sit on who and on each family member (advised, not required). Family members use collapsible person cards. Accommodation in the React app is `/stay?plan=free|paid` (prototype `visitor.html`): who → place → family → how long (start/end per person) → review. When a sangha join exists, people details are prefilled and the wizard opens at how long. Accommodation Volunteers get Myself / New visitor. Stay uses the header-selected event. UIkit pieces in use: form, progress, grid, tab, chips, and camera capture.

Paper screenshots will be added here when they are shared.

Screens still to expect from the product rules:

- Visitor booking, with a closed state once the event is **2 days** away
- Accommodation Admin action to **run smart allocation** after booking has closed, then review or override the result before hotels are notified

---

### 5. How each page should look

The UI is **mobile first**, **minimal**, and collected as a **wizard**. The same pages must stay readable on a phone. A wide screen uses the same steps. It does not add a second, denser layout.

- One step on the screen. A phone should not need to scroll through a long form.
- One short title, the fields for that step, and one primary button.
- A single line shows progress, such as â€œStep 2 of 6â€. Do not explain the whole process on the page.
- Labels sit above the fields. Buttons are full width.
- Help text is one short line, or it is omitted.
- Lists (hotels, guests, allocation review) show a few columns. Extra detail opens on the next step, not on the same screen.
- UIkit pieces for this: `uk-container` with a narrow width, `uk-form-stacked`, `uk-width-1-1` controls, `uk-button-primary uk-width-1-1`, and `uk-card-small`.

Visitor booking is the wizard opened from **Stay â†’ Free Accommodation** or **Paid Accommodation** (or the matching cards on the landing page). There is no plan step inside the wizard; the plan comes from the menu. There is no sign-in inside the wizard. The steps are who is coming, place, family, days, the couple question when it applies, ID photos, and the summary. If the visitor already joined the sangha, who / place / family are prefilled from a copy of that join. Back returns to the previous step. Next stores that step.

Accommodation Admin and receptionist follow the same rule. Hotel entry, room entry, allocation review, check-in, and check-out are separate steps, not one crowded page.

Paper sketches can be phone-sized. When the screenshots arrive, each image is one wizard step.

### 6. Fields to draw (paper and pen)

Draw **one page per screen** below. Put a star on required fields. Leave a clear primary button at the bottom of each form. Fixed times are always **11:00 AM**. The visitor does not type those times.

A booking request does not assign a room. Booking closes **2 days before the event start**. Accommodation Admin runs smart allocation after that.

Suggested drawing order: Visitor V0, then V1–V6, then Accommodation Admin A1–A6, then Receptionist R1–R4.

Each heading below is one phone screen. If a heading lists more than a few fields, draw the extra group on the next screen. Place is its own step. Family members are their own step. Login is its own page, opened from the landing page.

#### Visitor

**Landing (`index.html`)**

Sangha home before any form. Cards and header menus:

| Action | Opens |
| --- | --- |
| Join PSSM Buddha Sangha | `join.html` (who → place → family → review → done) |
| Login to My Space | The login page |
| Free Accommodation | `visitor.html?plan=free` |
| Paid Accommodation | `visitor.html?plan=paid` |

Header menus: **Stay** (Free / Paid), **Sangha** (Join / Login to My Space), **Account**.

**Login to My Space**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Mobile number | Yes | Phone | Same mobile as on join |
| Password | Yes | Password | The password given at join (or later changed) |

The first password is created at join: up to the first 5 letters of the name + date + month. Date and month are two digits. No event code. Example: Ramakrishna, 15 August → `Ramak1508`. Login does not rebuild the password from name and birth fields; the person types the password they were given.


**After login (signed-in chrome)**

- Main menus: **Stay** and **Account** only. Sangha (Join / Login) is hidden.
- Account: **My Profile**, **Change my password**, Logout.
- With **Event Organizer**: Account also shows **Create event** -> `events.html`.
- Home may show a My Profile card instead of Join / Login.

**Roles**

- PSSM Admin joins and logs in like any member, then lands on People & roles (`admin.html`).
- PSSM Admin pre-assigns one or more of Event Organizer, Pyramid Sevadal, PMMA Member.
- My Profile shows assigned roles (read-only).
- Event Organizer opens Create event (name, dates, location, expected budget INR, optional meditation hours/day). Saved events feed the header event picker; Free and Paid Stay use the selected event.

**My Profile (`profile.html`)**

Same wizard shape as join, different titles:

| Step | Title (example) | Notes |
| --- | --- | --- |
| Details | Your details | Prefills join identity / profile / birth / photos |
| Place | Your place | Prefills rural or urban |
| Family | Your family | Collapsible cards; add/update members |
| Review | Review your profile | Save profile writes the sangha record |

Requires a signed-in session. Guests are sent to login.

**Change my password (`password.html`)**

Compact form like join step 1 / login: current password, new password, confirm. Save stores the new password on the sangha profile.

**People & roles (`admin.html`)**

PSSM Admin landing after login. Compact join-step-1 style:

- Search by mobile; results may be **one or many** selectable rows.
- After results, search **collapses** to a summary bar with **Change** to expand again.
- Selected person card: role chips, assign checkboxes (Event Organizer / Pyramid Sevadal / PMMA Member), equal **Save roles** / **Remove person** buttons.
- Remove uses UIkit confirm. Prototype sample admin on login (`9000000001` / `PssmA0101`); claim-admin remains if none exists.

**Create event (`events.html` / `/events`)**

Signed-in Event Organizer only. Form fields, in order:

1. Event name (required)  
2. Start date · End date (required; end on or after start)  
3. Location — one line (required; city / venue / center)  
4. Expected budget — INR (required, > 0)  
5. Meditation hours per day (optional)  
6. Save → list of events  

Helper under the form: *Free and Paid Stay use the event selected in the header.* Non-organizers see a short gate message pointing to PSSM Admin People & roles. Each listed event has **Edit**, which fills the form for update. Header event picker shows name and dates only (not budget).


**Join PSSM Buddha Sangha (`join.html`)**

Steps: Who → Place → Family → Review → Done.

| Step | Notes |
| --- | --- |
| Who | Identity, profile, birth (login key), sangha links. Optional passport-size live photo + ID (advised) |
| Place | Rural / Urban via `uk-tab`. Suggestions fill later fields |
| Family | Optional. Collapsible person cards; collapsed title shows name and relation. Optional photo + ID per member |
| Review | Short summary, then Finish |
| Done | Welcome + one primary action: Login to My Space |

The visitor fills the accommodation wizard while booking is open. After the cutoff, a signed-in visitor can still open their party. A new booking is not accepted. Draw V6 for someone who is not continuing an existing party.

**V1 — Who is coming?**

Plan is already chosen from Stay / landing. Do not redraw Free / Paid here.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Full name | Yes | Text | Primary visitor. Used to build the first password |
| Mobile number | Yes | Phone | Used at Login to My Space |
| Gender | Yes | Male / Female | Needed so a dormitory or hall of the matching gender can be used |
| How long into meditation? | Yes | One row, no wrap: I am very new here, 1 year, 2 years, 3 years, 4 years, 5 years, > 5 years | |
| Date of birth | Yes | Two number boxes: date and month | No year. Digits only. Used in the first password |

**Place** — its own step. Rural or Urban. Each box should show a suggestion list while typing.

**If Rural**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Village | Yes | Text with suggestions | Visitor types this first |
| Town | Yes | Text, filled from the village | Visitor can correct it |
| District | Yes | Text, filled from the village or town | Visitor can correct it |
| State | Yes | Text, filled from the place chosen | Visitor can correct it |
| Country | Yes | Filled in, not typed | System sets this |

**If Urban** — draw these instead of the rural fields.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| City | Yes | Text with suggestions | Visitor types this first |
| State | Yes | Text, filled from the city | Visitor can correct it |
| Country | Yes | Text, filled from the city or state | Visitor can correct it |

Same-location sharing later uses the rural **town** or the urban **city**.

**Family members** — a repeating block. Include children. Show a running total of persons (visitor + family).

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Name | Yes | Text | |
| Gender | Yes | Male / Female | Same choice as the visitor. A mixed party stays in a regular room |
| How long into meditation? | Yes | Same choices as the visitor | One row, or a second line if the row is tight |
| Relation | No | Text | Example: spouse, child, parent |
| Mobile | No | Phone | Optional |
| Age group | No | Child / Adult / Senior | **Child** under 12 · **Adult** 12–59 · **Senior** 60+. Optional; helps allotment and care |
| Address | Yes | Two buttons | **Same as my address** is the default. **Different address** opens a popup with the same place fields as the visitor's place step |

Button: Add another family member.

**V3 — How long?**

One stay row per person already entered (visitor and each family member).

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Days of stay | Yes | Number, minimum 1 | Can differ per person |
| Separate rooms? | Yes, only for a husband and wife | Yes / No | Show only when the party is exactly two people, one male and one female. Yes means three such couples can fill one ladies room and one gents room in the closest 3-bed rooms, freeing the third. No means this couple stays together in one room even if it has 3 beds |

Check-in and check-out dates are calculated from these days. Show them as read-only, with time **11:00 AM**.

**V4 — One ID for the whole party**

Only one person provides ID. Draw a picker, then two camera boxes.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Who is providing ID | Yes | Choice: visitor or one family member | One ID covers the party |
| Live photo | Yes | Camera button + photo box | Web camera, face of that person |
| ID proof type | Yes | Choice: Aadhaar, PAN, Voter ID, Passport, Driving Licence, Other | |
| ID proof photo | Yes | Camera button + photo box | Photo of the document, not a file upload |

**V5 — Request received**

No new typing. Draw a summary card the visitor can keep:

- Free Accommodation or Paid Accommodation
- Party name, mobile, gender, meditation, and date and month of birth
- Number of persons
- Rural or urban place (village and town, or city)
- Family, including meditation and whether the address is the same or their own
- Stay dates at 11:00 AM
- ID card number (one card for the party)
- Status: **Waiting for room allocation**
- Note: rooms are allotted after booking closes, when Accommodation Admin runs allocation
- How to sign in again: Login to My Space with mobile number and password (first password is up to 5 letters of the name, then date and month)

**V6 — Booking closed**

Draw this as the same entry page once the event is 2 days away. No form. Message: booking is closed. Show the event name and the close date.

#### Admin

**A1 — Event**

Needed so the system knows when booking closes.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Event code | Yes | Short text | Example: `DMY5`. Identifies the event; not part of the visitor password |
| Event name | Yes | Text | Example: Dhyana Maha Yagam |
| Event place | Yes | Text | City or town where the event is held. Parties from this place are allotted first |
| State | Yes | Text | |
| Country | Yes | Text | |
| Start date | Yes | Date | |
| End date | Yes | Date | Example span: 11 days |
| Booking closes on | — | Read-only date | Start date minus 2 days |

**A2 — Add or edit a hotel**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Hotel name | Yes | Text | |
| Address | Yes | Text | |
| Contact | Yes | Phone or text | |
| Distance from event place | Yes | Number + unit | Accommodation Admin enters this. Shorter distance is allotted first |
| Active | Yes | Yes / No | No hides the hotel from automatic and manual assignment |
| Reserved | Yes | Switch, default off | On means smart allocation skips this hotel. Accommodation Admin assigns it by hand |

Draw the hotel list as the place Accommodation Admin sets this. One row per hotel: name, distance, Active, and a **Reserved** switch, plus Edit. A separate settings page is unnecessary. The same switch is on this form so it can be set when the hotel is added. On the allocation review, those hotels appear only in the manual override list, labeled Reserved. The automatic proposal never uses them.

**A3 — Add rooms**

Draw the hotel name at the top, then a repeating room row.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Hotel | Yes | Chosen hotel | |
| Room number | Yes | Text | Unique inside that hotel. Examples: 231, 101 |
| Capacity (persons) | Yes | Number | Regular rooms: Sai Prakash sample is 4, Three Castle sample is 3. Dormitory or hall: usually **10 to 50** |
| Kind of room | Yes | Regular room / Dormitory / Hall | Single visitors go to Dormitory or Hall first. Remaining dormitory or hall beds stay open for more people of the same gender |
| Who may stay | Yes, for Dormitory or Hall | Gents allowed only / Ladies allowed only | Hide this for a regular room. A dormitory or hall is never mixed. Leftover beds wait for that same gender |
| AC or Non-AC | Yes | AC / Non-AC | Default **AC** |
| Status | — | Read-only: Available | Set by the system when the room is saved |

Button: Add another room. Show a warning space for â€œthis room number already existsâ€.

**A4 — Bookings waiting**

A list, not a long form. Columns to draw:

- Visitor name, mobile, rural town or urban city
- Persons, days, Sevadal yes/no
- Aged or sickness yes/no
- Free accommodation or self booking
- Status: Waiting / Allotted / Self booked

Filter chips: All, Waiting, Special needs, Sevadal, Self booked.

**A5 — Run smart allocation**

Draw a single primary button: **Run smart allocation**. It is available only after booking has closed.

Then a review table. One row per free-accommodation party:

| Column | Draw as | Notes |
| --- | --- | --- |
| Party | Text | Name, persons, origin, flags |
| Proposed hotel | Text | |
| Proposed room | Text | Room number, AC/Non-AC, shared or not |
| Why | Short text | Example: event location, exact capacity, closest room, same city, gents dormitory, ladies hall, beds left in an all-gents room, Sevadal |
| Override hotel | Dropdown | Optional. Includes reserved hotels, each labeled Reserved |
| Override room | Dropdown | Optional. Rooms of the hotel chosen above, including a reserved hotel |
| Unmatched | A separate list | Parties that did not fit, for Accommodation Admin to place by hand |

Buttons: Confirm allocation, Save overrides. After confirm, hotels are notified.

**A6 — Change a confirmed allotment**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Party | Yes | Search or pick from list | |
| Action | Yes | Room change / Cancel stay / Special instruction / Update guest details | |
| New hotel | When changing room | Dropdown | Includes reserved hotels, labeled Reserved |
| New room | When changing room | Dropdown | |
| Instruction or updated detail | When needed | Text | |
| Hotel to notify | — | Read-only | The hotel affected by this change |

Also draw a notification list: check-in, check-out (full, one person, or early), and other receptionist updates. Each row shows time, hotel, party, and what happened.

#### Hotel Receptionist

The receptionist sees only their own hotel.

**R1 — Guests for this hotel**

List columns:

- Party name and ID card number
- Persons
- Room number
- Check-in date, 11:00 AM
- Check-out date, 11:00 AM
- Special needs
- Status: Expected / Checked in / Partly checked out / Checked out

A fixed note on the page: guests never take the room key. The key stays at reception.

**R2 — Check in**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| ID card number | Yes | Search box | Search or scan |

After a match, draw a verification panel (not more typing):

- ID card number
- Live photo
- ID proof photo
- Names of visitor and family
- Room number
- Special needs
- Check-in time, expected **11:00 AM**
- Key reminder

Button: Confirm check-in. It stays disabled until the ID card matches.

**R3 — Check out**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Party | Yes | Pick from today's guests | |
| Who is leaving | Yes | Whole party, or a tick per person | Person-wise check-out |
| Early check-out | No | Tick | Allowed before the planned date |

Show planned check-out date and **11:00 AM**. Button: Confirm check-out. Accommodation Admin is notified. Freed beds become available the same morning.

**R4 — Tell them tomorrow is the last day**

A list of parties whose check-out is tomorrow. Each row shows name, room, and **11:00 AM**.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Guest has been informed | Yes | Tick per party | Receptionist marks this after telling them |

---

### 7. Section template

Copy this block for each new sketch.

```markdown
### Screen NN — Title

![Title](screenshots/NN-short-name.png)

**What the sketch shows**
- 

**UIkit components**
- Layout:
- Navigation:
- Content:
- Forms / actions:
- Status / feedback:

**Notes**
- 
```

---

### Notes
- This is a living document. New sketches are appended as they are shared.
- File location: `docs/buddha-sangha/UI.md`
- Screenshot folder: `docs/assets/screenshots/`

---

## Accommodation — UIkit working guide

## 1. How every page is built

The [introduction](https://getuikit.com/docs/introduction) asks for three files: the CSS, the JavaScript, and the icon library. Pages that only show buttons and inputs can load the CSS. Pages that use icons, the switcher, a modal, a grid, or a sticky block also load the JavaScript. Icons need `uikit-icons.min.js`.

Shared look lives in `docs/prototype/app.css`. It keeps the header at 72 pixels, the ink and gold colours, the phone column and the laptop layout, and a few control sizes. New screens link that file. They do not copy the header CSS into the page.

Every visitor, admin, and receptionist screen follows the same shape:

- One job on the screen. A phone should see the title, the fields for that step, and one primary button.
- Below 960 pixels the column stays narrow (`app-column`, about 440 pixels) and the primary button is full width. From 960 pixels up, the same pages use a laptop layout: a wider column, paired fields, and a button that sizes to its label.
- Labels sit above the fields (`uk-form-stacked`).
- On a phone the primary button is full width (`uk-button uk-button-primary uk-width-1-1`).
- Help text is one short line, or it is left out.
- Back sits beside the step line in the body above the form card, not in the header and not under Continue.

---

## 2. Getting started

These are the items under **Getting started** in the documentation menu. Use the row. Skip the rest until the real app needs it.

| Page | Use it for | Leave it until later |
| --- | --- | --- |
| [Introduction](https://getuikit.com/docs/introduction) | The three files to include, and the rule that pages are normal HTML plus `uk-` classes | |
| [Installation](https://getuikit.com/docs/installation) | CDN links for the prototype. Same version number on every page | Install UIKit in the React + Vite app when `frontend/` starts |
| Less, Sass | | A compiled theme. Colour changes stay in `app.css` for now |
| [JavaScript](https://getuikit.com/docs/javascript) | Components that need behaviour: `uk-switcher`, `uk-modal`, `uk-grid`, `uk-icon`. Call `UIkit.switcher(...)` or `UIkit.modal(...)` when the page must open a step or a popup from code | |
| Webpack | | Bundling the real app. The prototype stays as plain HTML files |
| Custom icons | | Only after the built-in icon set has no suitable icon |
| [Avoiding conflicts](https://getuikit.com/docs/avoiding-conflicts) | Keep our classes (`.app-header`, `.choice`, `.step-actions`) separate from `uk-` classes. Do not restyle `button` or `input` without the `uk-` class | |
| [Accessibility](https://getuikit.com/docs/accessibility) | A real `<label>` for every field, `type="button"` on buttons that must not submit, and text plus colour for status. The progress bar has an accessible name | |
| RTL support | | This app is English, left to right |
| Migration | | We are on UIkit 3. Do not copy UIkit 2 class names |

JavaScript detail that matters: UIkit starts components that are in the HTML when the page loads. Markup added later (a new family member, a new day row) needs the component attribute in the new markup. If a grid or icon in that new markup does not appear, call `UIkit.update(element)` on the new piece.

---

## 3. Components already in the prototype

| Component | Where | When to use it | What to use | Detail |
| --- | --- | --- | --- | --- |
| [Section](https://getuikit.com/docs/section), [Container](https://getuikit.com/docs/container), [Padding](https://getuikit.com/docs/padding) | Landing, wizard, login | The page background and the column under the header | `uk-section uk-section-small`, `uk-container`, `app-column` | Phone: about 440 pixels. Laptop (960 pixels and up): about 1040, or `app-narrow` (560) for login |
| [Card](https://getuikit.com/docs/card) | Landing actions, each wizard step, login | A white sheet of one task, or a tappable row on the home screen | `uk-card uk-card-default uk-card-small uk-card-body`. Home rows add `uk-card-hover` and `uk-link-reset` | One card per step. Do not nest a card inside a card. A family member uses `uk-background-muted`, not a second card |
| [Button](https://getuikit.com/docs/button) | Continue, choices, home rows | The one action that moves forward, or a choice the person taps | `uk-button-primary` for Continue, Review, Login, and the selected plan. `uk-button-default` for the other plan and for Add. `uk-button-text` for a quiet back link | One primary button on a step. `type="button"` unless the control really submits a form |
| [Icon](https://getuikit.com/docs/icon) | Home rows, back, selected plan | A small cue beside a label. Not decoration on every field | `uk-icon="icon: plus"`, `sign-in`, `chevron-right`, `chevron-left`, `check` | Needs the icon script. `ratio: 0.9` when the icon sits inside a button |
| [Flex](https://getuikit.com/docs/flex), [Width](https://getuikit.com/docs/width), [Grid](https://getuikit.com/docs/grid) | Home rows, date and month, state and country, photos, day steppers | Two short fields side by side, or an icon plus a label plus a chevron | `uk-grid-small uk-child-width-1-2` with the `uk-grid` attribute. Home actions add `uk-child-width-1-2@m`. `uk-flex uk-flex-middle` for a row of icon and text | Needs the JavaScript for `uk-grid`. On a phone, two columns only when both values are short. From 960 pixels, `desk-fields` pairs name with mobile, village with town, and the two ID lists |
| [Form](https://getuikit.com/docs/form) | Login, who is coming, place, family, ID | Anything the person types or picks from a long list | `uk-form-stacked`, `uk-form-label`, `uk-input`, `uk-select`, `uk-form-small` | `app.css` makes `uk-form-small` 42 pixels tall and 16 pixels in type so a phone does not zoom in. Date of birth is two text fields with `inputmode="numeric"`, not `type="date"`, because a date picker asks for a year and this app does not |
| [Subnav](https://getuikit.com/docs/subnav) | Gender, rural or urban, meditation, yes or no | Two to about eight choices the person can see at once | `uk-subnav uk-subnav-pill`, plus `choice` for a two-way control | Faster than a dropdown. The selected item is `uk-active`. Meditation on the visitor step is one row (`med-choice` inside `med-fit`). On a family member, `can-wrap` may use a second line |
| [Switcher](https://getuikit.com/docs/switcher) | The visitor wizard | One step visible at a time, with no tab strip | A hidden `uk-switcher` nav connected to `ul.uk-switcher`. `swiping: false` | The first step has `uk-active`, or the CSS hides every step. The nav stays `uk-hidden`. The visible â€œStep 2 of 7â€ line is our own text. Do not show the switcher tabs. Swiping is off so a sideways touch does not skip a step while someone is filling a field |
| [Progress](https://getuikit.com/docs/progress) | Wizard | How far through the steps, in one glance | `<progress class="uk-progress">` and a step line in the body | The step line and a 3-pixel progress bar sit above the form card. They read â€œStep 2 of 7 Â· Who is coming?â€. Update `value`, `max`, and that line when the route changes (the couple step appears only for one male and one female) |
| [Modal](https://getuikit.com/docs/modal) | Family address | A side task that uses the same fields as another step, then returns | `uk-modal` with `uk-modal-dialog uk-modal-body` | Address is a popup. It is not a wizard step. Open it from Different address. Cancel returns to Same as my address if nothing was saved |
| [Placeholder](https://getuikit.com/docs/placeholder) | ID photos | An empty photo box with one button | `uk-placeholder uk-text-center` | The button says Take photo. This is the camera box, not a file picker |
| [Description list](https://getuikit.com/docs/description-list), [Label](https://getuikit.com/docs/label) | Summary | Read-only receipt | `uk-description-list uk-description-list-divider`. Status is `uk-label` | No new typing on that step |
| [Heading](https://getuikit.com/docs/heading), [Text](https://getuikit.com/docs/text) | Titles and hints | The step title and the one-line hint | `uk-h4` for the step title. `uk-text-meta` for a hint. `uk-text-bold` for a home-row title | Do not add a second paragraph of instructions |
| [Visibility](https://getuikit.com/docs/visibility) | Back button on step 1, rural or urban fields, switcher nav | Hide a block until a choice is made | The `hidden` attribute for fields. `uk-hidden` for the wizard tab list. `uk-invisible` to reserve the back-button width so the step title stays centred | `hidden` removes the fields. `uk-invisible` keeps the space |
| [Margin](https://getuikit.com/docs/margin) | Space between fields | Tight stacks | `uk-margin-small` between fields. `uk-margin-remove-top` on the step title | Avoid `uk-margin-large`. The page should feel like an app, not an article |
| [Background](https://getuikit.com/docs/background), [Box shadow](https://getuikit.com/docs/inverse) | Page and step card | Separate the sheet from the page | Page background is `--paper` in `app.css`. The step card uses `uk-box-shadow-medium`. Family blocks use `uk-background-muted` | The header stays white with the gold line. Do not put a coloured band behind the form |

The header stays a custom `.app-header` at 72 pixels. Inside it, use a slim [Navbar](https://getuikit.com/docs/navbar) for the three top links (`Stay`, `Account`, `Help`) with `uk-navbar="mode: click"` and `uk-navbar-dropdown`. Do not replace the whole bar with `uk-navbar-container`. On a phone, hide that row and use one menu button with [Dropdown](https://getuikit.com/docs/dropdown). Use the [Sticky](https://getuikit.com/docs/sticky) component later only if some other block, such as a filter row on a long admin list, must stick while the rest scrolls.

---

## 4. What to reach for next

These screens are specified in the UI prototype and are not built yet. Pick from this table before adding a new pattern.

| Screen | Reach for | Do not reach for |
| --- | --- | --- |
| Landing | Card rows with an icon and a chevron, as on `index.html` (Join, Login, Free / Paid) | A tab bar, or inventing a second visual system outside UIkit |
| Login | Compact `x-group` form: mobile + password | Building the password on the login page from name/date/month |
| My Profile | Same switcher wizard as join; profile titles; Save | A separate denser settings page |
| Visitor wizard | Switcher, progress, subnav pills, form, modal for address | Visible tabs, accordion sections, or more than one step on the page |
| Accommodation Admin event and hotel form | The same stacked form as the visitor. A reserved hotel is a [subnav](https://getuikit.com/docs/subnav) pill or two buttons, not a separate settings page | A settings area with many switches on one screen |
| Hotel list, bookings waiting, guest list, checkout reminders | [Table](https://getuikit.com/docs/table): `uk-table uk-table-small uk-table-divider uk-table-responsive` | A table with every column. Extra detail opens on the next step. On a phone, `uk-table-responsive` scrolls sideways rather than crushing the columns |
| Filter chips (All, Waiting, Sevadal, Self booked) | Subnav pills in one row | A sidebar of filters |
| Run allocation, review overrides | One primary button, then a table. Override hotel and room are `uk-select` | Editing the proposal inside a modal for every row |
| Unmatched parties | The same table, or a second card under it, with a short empty state | A blank page. Use [Placeholder](https://getuikit.com/docs/placeholder) when the list is empty: â€œNo parties are waiting.â€ |
| Status (Waiting, Allotted, Expected, Checked in) | [Label](https://getuikit.com/docs/label) | Colour alone |
| Counts (persons, rooms left) | [Badge](https://getuikit.com/docs/badge) next to a title, when a count helps. Skip it when the title already says â€œ3 personsâ€ | |
| Save succeeded, check-in confirmed | [Notification](https://getuikit.com/docs/notification): one short toast, then it goes away | A new page that only says Saved |
| Something is wrong with what they typed | One line under the field, as birth date does now. Use [Alert](https://getuikit.com/docs/alert) `uk-alert-danger` only when the whole step cannot continue and a line under one field is not enough | A modal for a validation message |
| Receptionist finds a guest | [Search](https://getuikit.com/docs/search) `uk-search uk-search-default`, full width, then the result card | A long filter form |
| ID photos on check-in | The same placeholder boxes. [Lightbox](https://getuikit.com/docs/lightbox) only if they need a larger view of a photo already taken | The [Upload](https://getuikit.com/docs/upload) drop zone. Identity photos are from the camera, not a file |
| Printable party card | [Print](https://getuikit.com/docs/print) so the on-screen buttons hide when the card is printed | A separate design tool |
| Accommodation Admin menu on a phone, once there are several tasks | [Off-canvas](https://getuikit.com/docs/offcanvas) with [Nav](https://getuikit.com/docs/nav) | A permanent side menu that squeezes the form |
| A block that must stay visible on a long list | [Sticky](https://getuikit.com/docs/sticky) | Sticking the whole form |

---

## 5. Leave these alone

They are in the same Documentation menu. They do not help this app.

| Component | Why it stays unused |
| --- | --- |
| Accordion | Hides fields. A wizard step is short enough to show its fields |
| Tab | Peer panels on one page. We already use a hidden switcher so the person sees one step |
| Dropnav, Drop, Dropbar | Prefer navbar dropdowns in the header, or pills and selects in forms. Dropbar takes too much vertical space |
| Slideshow, Slider, Lightbox (except a larger ID photo), Parallax, Cover, Video | Marketing layout. This is a form |
| Countdown, Totop, Marker, Leader, Comment, Article, Divider as decoration | Not part of booking, allocation, or the front desk |
| Sortable | Staff do not drag rows to allocate. Allocation is a button, then a table |
| Upload | The visitor does not drop a file for the ID |
| Icon nav, Thumb nav, Dot nav | Picture galleries and carousels |
| Tooltip | Extra text on hover. Phones have no hover. Put the one line of help under the field or leave it out |

---

## 6. Choices that keep coming up

**Two or three options** (Male / Female, Rural / Urban, Yes / No, Free / Paid). Subnav pills. Show every option. Do not use a select.

**More than a few options** (ID proof type, override hotel, override room). `uk-select`. A row of pills will wrap into a tall block.

**A number they change by one** (days of stay). A minus button, the number, and a plus button, in a three-column grid. Minimum 1.

**A date we own** (day and month of birth, with no year). Two numeric text fields. Check the month is 1–12 and the day is valid for that month. February allows 29.

**A date the calendar owns** (event start, event end, booking closes). `type="date"` on `uk-input` is acceptable there, because a year is required. Booking closes is read-only: start date minus 2 days. The visitor never types check-in or check-out. Those are shown as 11:00 AM.

**Yes that reveals one more field.** Keep the pills. Show the extra input only after Yes. Do not open a modal for one line of text.

**The same fields again for one person** (family member, hotel room row). A repeated muted block and a full-width Add button. Remove is `uk-button-text`.

**A task that borrows another step's fields** (family address uses the place step). Modal. Default the choice to the visitor's address. The second button opens the popup.

**A list.** Table, few columns, label for status. The row's next step holds the detail.

**Empty, loading, failed.** Placeholder for empty. [Spinner](https://getuikit.com/docs/spinner) inside the button or under the title while a save runs, in the real app. Alert or a line under the field when it fails. The prototype does not call the server, so it does not need a spinner yet.

---

## 7. Details that are easy to get wrong

- Load `uikit.min.js` before any script that calls `UIkit.switcher` or `UIkit.modal`. Load `uikit-icons.min.js` after it when the page uses `uk-icon`.
- The switcher's content CSS hides every item that is not `uk-active`. Put `uk-active` on the first nav item and the first panel so the first step is visible before the script runs.
- `uk-switcher` with `swiping: false` on a form. Leave swiping on only for a gallery.
- `uk-grid` is both a class and an attribute. The attribute is what sets the gaps. Dynamic rows need the attribute too.
- Do not put a form inside a form. The place step's rural block and urban block are separate forms. The modal is outside the wizard form.
- Primary colour in `app.css` is ink `#1b2a6b`, not the default UIkit blue. New buttons pick up that colour if they use `uk-button-primary`.
- The header is 72 pixels, with no vertical padding. Do not add a second toolbar or a larger logo. Patriji and the PSSM logo sit on the left (`object-fit: cover` / `contain`). The event picker and Stay / Sangha / Account menus sit in the same bar. Soft Patriji background on the page body is in `app.css` (`body::before`); do not put a second full-bleed photo in the header.
- Status is a word in a label, not only a colour. Waiting, Allotted, and Checked in must stay readable in grey.
- Icons are optional. A field does not need an icon to look finished.
- React holds step state in the real app; UIkit still draws the controls. Do not rebuild pills, modals, or the grid in custom CSS when a UIkit component already fits.
- Shared sangha profile helpers live in `docs/prototype/app-profile.js`. Accommodation prefills from a copy; it must not write back to the sangha join record.

---

## 8. File map

| File | Role |
| --- | --- |
| `docs/prototype/app.css` | Header, colours, Patriji body background, narrow column, button and field shape |
| `docs/prototype/app-profile.js` | Sangha profile in `localStorage`, event picker helper, composed password |
| `docs/prototype/index.html` | PSSM Buddha Sangha landing (Join, Login, Free / Paid) |
| `docs/prototype/join.html` | Join sangha wizard |
| `docs/prototype/login.html` | Login to My Space |
| `docs/prototype/visitor.html` | Accommodation wizard (`?plan=free` or `?plan=paid`) |
| `docs/buddha-sangha/UI.md` | Accommodation fields and steps |
| `docs/buddha-sangha/` | Sangha register specs and UI notes |
| `frontend/` | Real React + Vite + UIKit 3 app, later. Same look as the prototype; session API to Spring Boot |

When a new prototype page is added, copy the header from `index.html`, link `app.css` and the UIkit 3.21.13 files, and choose components from section 4 of this guide.
