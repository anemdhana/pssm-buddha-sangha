# Requirements
## PSSM Buddha Sangha (pssm-buddha-sangha)

**Project:** pssm-buddha-sangha  
**Version:** 2.11 (Living Document)  
**Last Updated:** 09 October 2026  

Sangha register and event accommodation requirements and user stories in one place. Static UI: `docs/prototype/`.

---

## Table of contents

- [Three modules](#three-modules)
- [Delivery status (prototype)](#delivery-status-prototype)
  - [Done in UI prototype (`docs/prototype/`)](#done-in-ui-prototype-docsprototype)
  - [Next module](#next-module)
- [Sangha register](#sangha-register)
  - [2. Functional Requirements](#2-functional-requirements)
  - [3. Non-Functional Requirements](#3-non-functional-requirements)
  - [4. Scenarios (High-Level)](#4-scenarios-high-level)
- [Part B — User stories](#part-b-user-stories)
- [1. Basic Stories (Foundation)](#1-basic-stories-foundation)
  - [US-01: Admin or Sangha Member – Sign In](#us-01-admin-or-sangha-member-sign-in)
  - [US-06: Admin – Keep the Place List](#us-06-admin-keep-the-place-list)
  - [US-02: Admin – Add a Person](#us-02-admin-add-a-person)
- [2. Intermediate Stories (Find and Correct)](#2-intermediate-stories-find-and-correct)
  - [US-03: Admin – Edit a Person](#us-03-admin-edit-a-person)
  - [US-04: Admin – View a Person](#us-04-admin-view-a-person)
  - [US-05: Admin – Search the Register](#us-05-admin-search-the-register)
  - [US-07: Sangha – Dashboard Grouped by Location](#us-07-sangha-dashboard-grouped-by-location)
  - [US-08: Sangha – Dashboard Grouped by Pyramid Center](#us-08-sangha-dashboard-grouped-by-pyramid-center)
  - [US-09: Sangha – See Active Events](#us-09-sangha-see-active-events)
  - [US-10: Sangha Member – Support a Small Amount](#us-10-sangha-member-support-a-small-amount)
  - [US-11: Register Admin – Manage Active Events](#us-11-register-admin-manage-active-events)
  - [US-14: Admin – Smart Allotment by Location](#us-14-admin-smart-allotment-by-location)
  - [US-15: Host City or State – Support First, Extra Amount, Then Others](#us-15-host-city-or-state-support-first-extra-amount-then-others)
  - [US-13: Location – Voluntarily Cover a Small Budget](#us-13-location-voluntarily-cover-a-small-budget)
  - [US-12: Sangha – Photo, Contribution, and Comments](#us-12-sangha-photo-contribution-and-comments)
- [Event accommodation](#event-accommodation)
  - [1. Introduction / Background](#1-introduction-background)
  - [2. Functional Requirements](#2-functional-requirements-1)
  - [3. Scenarios (High-Level)](#3-scenarios-high-level)
- [Accommodation — User stories](#accommodation-user-stories)
- [1. Basic Stories (Foundation)](#1-basic-stories-foundation-1)
  - [US-01: Accommodation Admin – Add Hotel](#us-01-accommodation-admin-add-hotel)
  - [US-25: Accommodation Admin – Reserve Hotels for Manual Assignment](#us-25-accommodation-admin-reserve-hotels-for-manual-assignment)
  - [US-02: Accommodation Admin – Add Rooms to Hotel](#us-02-accommodation-admin-add-rooms-to-hotel)
  - [US-03: Visitor – Register Basic Details](#us-03-visitor-register-basic-details)
  - [US-04: Visitor – Add Family Members](#us-04-visitor-add-family-members)
- [2. Intermediate Stories (Core Functionality)](#2-intermediate-stories-core-functionality)
  - [US-05: Visitor – Capture Stay Duration](#us-05-visitor-capture-stay-duration)
  - [US-06: Visitor – Declare Special Needs](#us-06-visitor-declare-special-needs)
  - [US-07: System – Priority Room Allotment](#us-07-system-priority-room-allotment)
  - [US-08: Visitor – Single ID Capture per Party](#us-08-visitor-single-id-capture-per-party)
  - [US-09: System – Generate & Assign ID Card](#us-09-system-generate-assign-id-card)
- [3. Advanced Stories (Operations & Real-time)](#3-advanced-stories-operations-real-time)
  - [US-10: Hotel Receptionist – View Allotted Guests](#us-10-hotel-receptionist-view-allotted-guests)
  - [US-11: Hotel Receptionist – Validate Identity at Check-in](#us-11-hotel-receptionist-validate-identity-at-check-in)
  - [US-12: Hotel Receptionist – Perform Check-out](#us-12-hotel-receptionist-perform-check-out)
  - [US-13: Hotel Receptionist – Advance Check-out Reminder](#us-13-hotel-receptionist-advance-check-out-reminder)
  - [US-14: Accommodation Admin – Receive Real-time Notifications](#us-14-accommodation-admin-receive-real-time-notifications)
  - [US-15: Accommodation Admin – Send Live Updates to Hotel](#us-15-accommodation-admin-send-live-updates-to-hotel)
  - [US-16: Visitor – Self Booking of Accommodation (Optional)](#us-16-visitor-self-booking-of-accommodation-optional)
  - [US-17: System – Synchronized 11:00 AM Check-in / Check-out](#us-17-system-synchronized-1100-am-check-in-check-out)
  - [US-18: System / Accommodation Admin – Shared Room Allotment](#us-18-system-accommodation-admin-shared-room-allotment)
  - [US-19: Hotel Receptionist – Enforce Room Key Policy](#us-19-hotel-receptionist-enforce-room-key-policy)
  - [US-20: System – Single Person Allotment Priority](#us-20-system-single-person-allotment-priority)
  - [US-21: System – Pyramid Sevadal (Volunteer) Nearby Allotment](#us-21-system-pyramid-sevadal-volunteer-nearby-allotment)
  - [US-22: System – Close Booking 2 Days Before the Event](#us-22-system-close-booking-2-days-before-the-event)
  - [US-24: Visitor – Couple Consent to Separate Rooms](#us-24-visitor-couple-consent-to-separate-rooms)
  - [US-26j: Visitor – Join PSSM Buddha Sangha](#us-26j-visitor-join-pssm-buddha-sangha)
  - [US-26: Visitor – Sign In and Change Password](#us-26-visitor-sign-in-and-change-password)
  - [US-26a: Visitor – My Profile](#us-26a-visitor-my-profile)
  - [US-26b: Visitor – Roles from PSSM Admin](#us-26b-visitor-roles-from-pssm-admin)
  - [US-26b1: PSSM Admin – People and Roles](#us-26b1-pssm-admin-people-and-roles)
  - [US-26c: Event Organizer – Create Event](#us-26c-event-organizer-create-event)
  - [US-23: Accommodation Admin – Run Smart Room Allocation](#us-23-accommodation-admin-run-smart-room-allocation)
- [Suggested Implementation Order](#suggested-implementation-order)

---
## Three modules

| # | Module | What it covers | Typical role |
| --- | --- | --- | --- |
| 1 | **Sangha register** | Masters register: add/edit people, places, dashboard groups | Register Admin / Sangha member |
| 2 | **Supporting events** | Active events (Register Admin can set Active/Inactive anytime), budgets, host-first support, equal share | Register Admin / Sangha member |
| 3 | **Accommodation** | Hotels, rooms, Free/Paid Stay for an event, booking window, smart allotment, receptionist check-in/out | **Accommodation Admin**, Hotel Receptionist, Visitor |

**Role note:** **PSSM Admin** (People & roles on My Space) assigns Event Organizer / Pyramid Sevadal / PMMA Member / **Accommodation Volunteer**. Accommodation Volunteer books Free/Paid stay for an event (including new visitors, who are added to the sangha register together with the booking). That is not the same as **Accommodation Admin**, who runs hotels and room allotment for Stay.

## Delivery status (prototype)

### Done in UI prototype (`docs/prototype/`)

Self-serve **Join → Login → My Space**, roles, PSSM Admin desk, and Event Organizer create-event are drafted as static HTML + `app-profile.js` (browser `localStorage`). Specs below track that behaviour for later build-out.

| Area | Spec | Prototype pages | Status |
| --- | --- | --- | --- |
| Join sangha (who / place / family / review) | FR-29j, US-26j | `join.html` | Prototype done |
| Login + change password | FR-29, US-26 | `login.html`, `password.html` | Prototype done |
| My Profile | FR-29a, US-26a | `profile.html` | Prototype done |
| Pre-assigned roles | FR-29b, US-26b | roles on profile; assign on admin | Prototype done |
| PSSM Admin People & roles | FR-29b1, US-26b1 | `admin.html` | Prototype done |
| Event Organizer create event | FR-29c, US-26c | `events.html` | Prototype done |
| Landing + chrome | — | `index.html`, shared header | Prototype done |
| Stay booking (event + per-person dates) | FR-03, US-03/04/05, FR-29d | React `/stay`, `visitor.html` | Done (wizard); allotment later |
| Accommodation Volunteer | FR-29d, US-26d | Admin roles + Stay | Done |

### Next module

**Event accommodation allotment** for people who already joined the sangha: Free / Paid Stay against an event (created by Event Organizer), booking window, smart room allocation, receptionist check-in/out — see Accommodation module (Accommodation Admin) FRs and US-01 onward. Join data is the source for prefill; Stay edits must not rewrite the sangha join record.

## Sangha register

### 2. Functional Requirements

**2.1 The Person Record**

**FR-01: One Record per Person**  
The system shall store one record for each person on the sangha register.

- Admin creates the record.  
- The record contains only full name, mobile, place, pyramid center or group, and since.  
- Full name, mobile, place, and pyramid center or group are required.  
- Since is optional. It is the year the person began, when that year is known.  
- If since is entered, it shall be a four-digit year and shall not be a future year.

**FR-02: Full Name**  
The system shall record the person's full name so the register shows who they are.

**FR-03: Mobile**  
The system shall record a mobile number so organizers can reach the person.

- The mobile number shall be checked for a valid phone format before the record is saved.

**FR-04: Place**  
The system shall record the person's place as a city or town chosen from the place list.

- Admin keeps the list of cities and towns.  
- On the person form, place is an autocomplete. Typing narrows the list. The user selects one place.  
- Free-form text is not a place. A value that is not on the list shall not be saved.

**FR-05: Pyramid Center or Group**  
The system shall record the pyramid center or group the person sits with.

- This is the sangha group, entered as text (the center or group name).

**FR-06: Since**  
The system shall allow a year for when the person began.

- The field may be left empty.  
- An empty since means the year is not known. The rest of the record is still valid.

**2.2 Finding and Correcting a Person**

**FR-07: Sangha Dashboard**  
A signed-in Admin or a signed-in person in the sangha shall see the register as a dashboard.

- The dashboard lists the persons in the sangha.  
- Each row shows full name, place, pyramid center or group, and since.  
- An empty since is shown as blank.  
- The people on the register are the masters. The dashboard shows how many masters are in each group.

**FR-08: Group by Location**  
The dashboard shall group persons by place.

- Each place is one group.  
- The group heading shows the city or town and the number of masters from that place.  
- The persons from that place are listed under the heading.

**FR-09: Group by Pyramid Center**  
The dashboard shall also group persons by pyramid center or group.

- Each pyramid center or group is one group.  
- The group heading shows the center name and the number of masters who sit with it.  
- The persons who sit with that center are listed under the heading.  
- The same spelling of a center name forms one group.

**FR-10: Search**  
Admin shall search the register by any of the stored fields.

- Search matches full name, mobile, place, pyramid center or group, and since.  
- The list shows only the rows that match.

**FR-11: View One Person**  
Admin shall open one record and see the same five fields, including mobile.

**FR-12: Edit a Record**  
Admin shall correct any of the five fields on an existing record.

- The same required and optional rules as FR-01 apply on save.  
- Place must still be a selection from the place list.  
- Mobile format is checked again on save.

**2.3 Access**

**FR-13: Who May Open the Dashboard**  
A signed-in Admin, or a signed-in person who is already on the register, shall open the dashboard.

- The register is not a public directory.  
- A sangha member sees the grouped lists and the counts.  
- Add, edit, the place list, search, and mobile numbers stay with Admin.

**2.4 Active Events (support graph)**

**FR-14: Active Events**  
The first screen shall be a graph of the sangha and the **active** events to support.

- A circle shows the person's photo.  
- The person's name sits under the photo. A small label still says PSSM sangha.  
- One box stands for each **active** event, in one column, top to bottom.  
- The column is ordered by remaining contributions needed, highest at the top and lowest at the bottom.  
- Register Admin maintains the event list and can mark any event **Active** or **Inactive** at any time, as often as needed.  
- Only **Active** events appear on the graph. An Inactive event is hidden from support until Register Admin activates it again.  
- There is no fixed count of five, and no weekly reset of the event set.  
- **1,44,000** meditators across the globe are the people who are part of the contribution for a whole-sangha event. Remaining for such an event is 1,44,000 minus how many are shown as supported for that event.

**FR-18: Photo, Contribution for Active Events, and Comments**  
The circle and the blocks under it shall show one person.

- The photo is cropped to the circle. On first open it is the signed-in person. Choosing a name in a box shows that person's photo.  
- Under the photo, contribution details for each **active** event: supported or not yet, that event's equal share, and, when they asked someone else, the name of the person who contributed.  
- Under those lines, feedback / comments written by that person for the current active set. The box is empty when they have not written any.  
- When Register Admin changes which events are Active, the contribution lines follow the new active set.

**FR-15: An Equal Share of Each Event's Budget**  
When an event asks the whole sangha, every person among **1,44,000** meditators across the globe shall be part of the contribution.

- Register Admin sets a budget for each such event. The budgets can differ.  
- One person's share is the amount smart allotment gives an able person in their location (FR-20).  
- The person does not type the share.

**FR-20: Smart Allotment of Each Location's Amount**  
The amount asked of each location shall be allotted from the event budget by the number of persons there and how many of them are able to support.

- A person is able to support unless they are marked unable for this event.  
- For a whole-sangha event, a location's amount is the event budget × (able persons in that location Ã· 1,44,000).  
- More able persons in a location means a larger amount for that location. Persons who are unable do not add to it.  
- An able person's share is that location amount Ã· the able persons in the location. That share is the event budget Ã· 1,44,000.  
- The part of the budget for meditators not yet on the register stays unallotted.  
- For a small-budget event asked of one location, that location's amount is the event budget. The suggested share is that amount Ã· the able persons in that location. Volunteers may pay until the remaining amount is zero. Not every person there has to support.  
- A location with no able person is shown to Admin with no share to collect.  
- Admin reviews the allotment and may override a location amount before the boxes use it.  
- Host city and state are allotted first. Other locations are allotted only the amount still left after that (FR-21).

**FR-21: Host City or State First, Then Other Locations**  
When an event happens in a city or a state, the people there support first. Other locations are asked only for what is still needed.

- Each place on the list has a state, so a city belongs to a state.  
- Admin marks where the event happens: one or more cities, or a state.  
- Every person whose city is marked, or whose city is in the marked state, must support. A person who is unable still must be covered by someone they ask.  
- An able person in that city or state may enter an extra amount, on top of their share. The extra can be large. It counts toward the budget.  
- Amount still needed = event budget âˆ’ host shares already given âˆ’ extra amounts.  
- While the host city or state still has people who have not supported, other locations are not asked.  
- When those people have supported, if the amount still needed is zero, other locations are not asked.  
- If an amount is still needed, that remainder is allotted across the other locations by the same smart allotment, using only the remainder as the budget.

**FR-19: A Small Budget Asked of One Location**  
Sometimes not everyone needs to support. A small-budget event shall ask one location for an amount.

- Admin names the event and the place. Smart allotment sets the amount (FR-20).  
- People outside that place are not asked.  
- Not every person in that place has to support.  
- Any person in that location who is able to support may voluntarily support.  
- Each voluntary support reduces the remaining amount.  
- The remaining amount is shown on the box and falls until it is **zero**.  
- At zero, no further support is taken for that request.

**FR-16: Ask Someone to Contribute**  
A person who is unable to contribute shall ask another person in the sangha to contribute for them.

- The person who cannot contribute chooses whom to ask.  
- The amount is that event's equal share.  
- When the asked person contributes, the person who asked is shown as supported.  
- The screen also shows the name of the person who contributed.

**FR-17: The Graph Shows the Support**  
Each box shall show the remaining contributions needed for that event, then who is already supported.

- Remaining = 1,44,000 minus the number shown as supported.  
- Boxes are listed top to bottom, highest remaining first, lowest remaining last.  
- Inside each box, each place shows its own remaining: people from that city or town who are not yet shown as supported for this event.  
- Those places are listed top to bottom, highest remaining first, lowest last.  
- Who is supported, and that event's equal share.  
- When someone else contributed, that person's name beside the one who is shown as supported.  
- How much is supported: the equal shares added up. When all 1,44,000 have contributed, this equals the event budget.  
- Admin and a person in the sangha both see this list.

---

### 3. Non-Functional Requirements

**NFR-01: Minimal Interface**  
The interface shall stay limited to sign-in, the active-events support graph, support, the place list, the people dashboard, add or edit, and person detail.

**NFR-02: Shared Stack with Event Accommodation**  
The application shall use the same stack as the rest of **pssm-buddha-sangha**: React + Vite + UIKit 3 on the frontend, Java 21 + Spring Boot 3 (modular monolith) on the backend, Spring Security session-based sign-in, MongoDB 7 with Spring Data MongoDB, and Docker Compose for deployment (Nginx + Spring Boot + MongoDB on one VPS). Roles for the register are Admin and Sangha member.

---

### 4. Scenarios (High-Level)

**Scenario 1: Admin adds a person**  
Admin signs in and enters full name, mobile, and pyramid center or group. Place is chosen from the autocomplete list of cities and towns. The year they began is known, so Admin enters since. The person appears on the dashboard.

**Scenario 2: The year is not known**  
Admin adds a person and leaves since empty. The record is saved. The dashboard shows a blank since for that person.

**Scenario 3: How many masters in each place**  
Admin or a person in the sangha opens the dashboard grouped by location. Vijayawada shows its masters and the count. Bengaluru shows its own count.

**Scenario 4: How many masters in each pyramid center**  
The same dashboard is grouped by pyramid center. Each center shows its masters and the count.

**Scenario 5: A place that is not on the list**  
Admin types a town that is not on the place list. Autocomplete offers no match. The record cannot be saved until a listed city or town is selected.

**Scenario 6: How to reach someone**  
Admin opens a person from the dashboard and reads the mobile number.

**Scenario 7: Correct a mobile number**  
Admin opens a person, changes the mobile number, and saves. The dashboard shows the person in the same place group.

**Scenario 8: Active events**  
Register Admin or a person in the sangha opens the page. The circle shows a person's photo. One box stands for each Active event. The top box is the event with the most contributions still needed. Inside that box, Vijayawada may sit above Bengaluru because more people there are still to contribute. The bottom box is the event with the fewest still needed. For a whole-sangha event, remaining is 1,44,000 minus how many are shown as supported.

**Scenario 9: Unable to contribute**  
Meena cannot contribute for one event. She asks Ravi to contribute for her. When Ravi contributes Meena's equal share, Meena is shown as supported, with Ravi's name beside hers. That event's remaining number drops by one, and its box may move down the column.

**Scenario 10: Activate or deactivate an event**  
Register Admin marks an event Inactive; its box leaves the graph at once. Later Register Admin marks it Active again; the box returns. A newly added Active whole-sangha event divides its budget by 1,44,000. There is no weekly replace-all of a fixed set of five.

**Scenario 11: A small budget for one location**  
A small event asks only Vijayawada. Smart allotment sets Vijayawada's amount from that budget and from how many people there are able to support. Not everyone in the sangha is asked, and not everyone in Vijayawada has to support. Ravi, who is able and in Vijayawada, voluntarily supports. The remaining amount on that box goes down. When the remaining amount reaches zero, that request is finished.

**Scenario 12: Smart allotment across locations**  
An event budget is 1,44,000. The event happens in Vijayawada. Vijayawada has 40 persons, 30 of them able to support. Those 30 must support. One of them enters an extra amount. If the host shares and that extra already meet the budget, Bengaluru is not asked. If an amount is still short after Vijayawada has supported, that shortfall is allotted to the other locations.

**Scenario 13: Extra amount in the host city**  
The event is in Andhra Pradesh. Every person in the cities of that state must support their share. A person in Vijayawada who can give more enters an extra amount. The amount still needed falls by that extra. Other states are asked only if something remains after the host state has supported.

---

---

## Part B — User stories

### How to use this document
- Stories are ordered from **Basic → Intermediate**
- Each story follows the standard format:  
  **As a** [role]  
  **I want** [goal]  
  **So that** [benefit]
- Acceptance Criteria are written in clear, testable points
- You can pick up one user story at a time for development

---

## 1. Basic Stories (Foundation)

### US-01: Admin or Sangha Member – Sign In
**As an** Admin or a person in the sangha  
**I want** to sign in  
**So that** the dashboard is open to the sangha and closed to everyone else

**Acceptance Criteria:**
- Admin signs in with the Admin role and can add, edit, and open a person's mobile
- A person who is already on the register signs in with the Sangha member role and opens the dashboard
- A successful sign-in opens the dashboard
- Without a valid sign-in, the dashboard, add, edit, and detail screens stay closed
- The session uses Spring Security session cookies (not JWT)

---

### US-06: Admin – Keep the Place List
**As an** Admin  
**I want** to keep the list of cities and towns  
**So that** place on a person is always one of those places

**Acceptance Criteria:**
- Admin can add a city or town, and the state it belongs to
- The same city name is not added twice in one state
- Admin can edit a place name
- A place used by a person remains available to select

---

### US-02: Admin – Add a Person
**As an** Admin  
**I want** to add a person with the five register fields  
**So that** the dashboard includes who they are and how to reach them

**Acceptance Criteria:**
- Admin can enter full name, mobile, place, pyramid center or group, and since
- Full name, mobile, place, and pyramid center or group are required
- Place is chosen from the autocomplete list of cities and towns
- Typed text that is not on the place list cannot be saved
- Since is optional and, when entered, is a four-digit year that is not in the future
- Mobile is rejected when the format is not a valid phone number
- A saved person appears on the dashboard in that place's group
- The record stores no fields beyond these five

---

## 2. Intermediate Stories (Find and Correct)

### US-03: Admin – Edit a Person
**As an** Admin  
**I want** to change any of the five fields on a person  
**So that** a wrong name, number, place, center, or year can be corrected

**Acceptance Criteria:**
- Admin opens an existing person and sees the current values
- Admin can change full name, mobile, place, pyramid center or group, and since
- Place is chosen again from the autocomplete list
- The same required, optional, year, and mobile rules as US-02 apply on save
- The dashboard shows the saved values in the matching place group and center group

---

### US-04: Admin – View a Person
**As an** Admin  
**I want** to open one person  
**So that** I can read who they are, how to reach them, their place, their center, and the year they began

**Acceptance Criteria:**
- The detail screen shows full name, mobile, place, pyramid center or group, and since
- A missing since is shown as blank
- Admin can go from this screen to edit

---

### US-05: Admin – Search the Register
**As an** Admin  
**I want** to search the register  
**So that** I can find people by name, mobile, place, center, or year

**Acceptance Criteria:**
- Admin can search by full name, mobile, place, pyramid center or group, or since
- The dashboard narrows to matching rows, still inside their groups
- Clearing the search shows the full register again

---

### US-07: Sangha – Dashboard Grouped by Location
**As an** Admin or a person in the sangha  
**I want** to see persons grouped by location, with a count  
**So that** we know how many masters are from each city or town

**Acceptance Criteria:**
- The dashboard groups people by place
- Each group heading shows the city or town and the number of masters from that place
- The persons from that place are listed under the heading
- Full name, place, pyramid center or group, and since are shown
- A missing since is blank
- A sangha member does not see mobile numbers

---

### US-08: Sangha – Dashboard Grouped by Pyramid Center
**As an** Admin or a person in the sangha  
**I want** to see the same persons grouped by pyramid center  
**So that** we know how many masters sit with each center

**Acceptance Criteria:**
- The dashboard can be switched to group by pyramid center or group
- Each group heading shows the center name and the number of masters who sit with it
- The persons who sit with that center are listed under the heading
- Centers match by the saved name

---

### US-09: Sangha – See Active Events
**As a** Register Admin or a person in the sangha  
**I want** to see the active events as boxes, top to bottom  
**So that** we see where the most contributions are still needed

**Acceptance Criteria:**
- The first screen shows the person's photo in a circle, and one box per **Active** event in one column
- Inactive events do not appear on the graph
- **1,44,000** meditators across the globe are the contribution base for whole-sangha events
- Remaining on a whole-sangha box is 1,44,000 minus how many are shown as supported for that event
- The top box has the highest remaining number. The bottom box has the lowest
- Inside each box, each city or town shows how many people from that place are not yet supported
- Those places are ordered top to bottom, highest remaining first
- Each whole-sangha box shows the event budget and the equal share, budget divided by 1,44,000
- Each box shows who is supported and that equal share
- When another person contributed, their name is shown beside the person who is supported
- When Register Admin activates or deactivates events, the graph updates without waiting for a weekly cycle

---

### US-10: Sangha Member – Support a Small Amount
**As a** person in the sangha  
**I want** to support an event with my equal share of its budget  
**So that** I am part of the global cause

**Acceptance Criteria:**
- The amount is that event's budget divided by 1,44,000, shown and not typed
- Supporting myself records my name under Supported, with that share
- If I cannot contribute, I ask another person to contribute for me
- When they contribute, I am shown as supported, and their name is shown beside mine
- The total of shares moves toward that event's budget

---

### US-11: Register Admin – Manage Active Events
**As a** Register Admin  
**I want** to create events, set budgets, and mark events Active or Inactive at any time  
**So that** the support graph always shows the current active set

**Acceptance Criteria:**
- Register Admin can add or edit an event name and budget (and host place when needed)
- Register Admin can set each event to **Active** or **Inactive** at any time, as often as needed
- There is no fixed count of five events and no weekly replace-all step
- Only Active events appear as boxes on the support graph
- Each person's share for an Active event comes from smart allotment (US-14)
- A newly Active whole-sangha event uses remaining based on 1,44,000 minus who is already shown as supported
- The amount an able person supports is the allotted share

---

### US-14: Admin – Smart Allotment by Location
**As an** Admin  
**I want** each location's amount to be allotted from the event budget  
**So that** the ask follows how many people are there and how many can support

**Acceptance Criteria:**
- Admin can run allotment after the event budget is saved
- Each location row shows persons, how many are able to support, the allotted amount, and the share
- For a whole-sangha event, allotted amount = event budget × (able persons in that location Ã· 1,44,000)
- An able person's share is the event budget Ã· 1,44,000
- A location with no able person has no share to collect
- Admin can override a location amount, then confirm
- The event boxes use the confirmed amounts
- Host cities or the host state are allotted first
- Other locations receive an amount only for what remains after the host people have supported and any extra amounts are counted

---

### US-15: Host City or State – Support First, Extra Amount, Then Others
**As a** person in the city or state where the event happens  
**I want** our places to support first, and to add an extra amount if I can  
**So that** the budget is met here before other locations are asked

**Acceptance Criteria:**
- The event records the cities, or the state, where it happens
- Every person in those cities or that state must support their share
- A person who is unable there asks someone to contribute for them, and is still shown as supported
- An able person there can enter an extra amount on top of the share
- The extra can be larger than the share and reduces the amount still needed
- Other locations are not asked until the host people have supported
- If the budget is already met, other locations are not asked
- If an amount remains, only that remainder is allotted to the other locations

---

### US-13: Location – Voluntarily Cover a Small Budget
**As a** person in a place that was asked  
**I want** to voluntarily support a small-budget event for my location  
**So that** the amount still needed there goes down to zero

**Acceptance Criteria:**
- The event names one place. Smart allotment sets the amount from the budget and from how many people there are able to support
- People in other places are not asked
- Not every person in that place has to support
- A person whose place matches can support voluntarily
- Each support reduces the remaining amount on the box
- The remaining amount stops at zero, and then no further support is taken

---

### US-12: Sangha – Photo, Contribution, and Comments
**As a** Register Admin or a person in the sangha  
**I want** to see a person's photo in the circle, their contribution for active events, and their comments  
**So that** the graph shows who they are and how they are supporting

**Acceptance Criteria:**
- The photo is shown inside the circle, with the name under it
- Opening the page shows the signed-in person's photo
- Choosing a name on an event rectangle replaces the photo with that person
- Under the photo, one line per **Active** event shows contribution: supported or not yet, that event's equal share, and who contributed when it was someone else
- Under those lines, the person's feedback / comments are shown
- An empty comment box means they have not written any
- A person can write that comment when they support (US-10)
- The photo can be saved on the person record and is optional

---

### Notes
- Living document for the Buddha Sangha register module (Part A above).
- File: `docs/buddha-sangha/Requirements.md`

---

## Event accommodation

### 1. Introduction / Background

**1.1 Purpose**  
This Requirements Specification defines the functional and non-functional requirements for the **event accommodation module** of **PSSM Buddha Sangha** (`pssm-buddha-sangha`). It supports planning, promotion, registration, and management of large-scale spiritual events organized under the Pyramid Spiritual Societies Movement (PSSM).

**1.2 Event Context**  
PSSM conducts multi-day spiritual events every year. One of the major events is **Dhyana Maha Yagam**, which is held for a fixed duration (for example, Dhyana Maha Yagam-5 is conducted for **11 consecutive days**).

These events attract visitors from across India and many other countries. Typical activities and experiences offered during the event include:

- Group music meditation sessions  
- Self-knowledge / spiritual science sessions  
- Live cultural dance performances  
- Wholesome and tasty vegetarian food  
- Other related spiritual and cultural programs  

The system must support the complete lifecycle of such multi-day spiritual events so that organizers can manage them efficiently and visitors can easily discover, register, and experience the event.

---

### 2. Functional Requirements

**2.1 Accommodation Management**

**FR-01: Free Accommodation for Visitors**  
The system shall support the provision of **free hotel room accommodation** to registered visitors of the event.

- Accommodation shall be arranged in hotels located **near the event venue**.  
- Preferred locations should be within **walkable distance** from the event place.  
- In cases where walkable distance is not possible, the hotels should be accessible by a **very short auto/rickshaw ride**.  
- The system must allow organizers to allocate, track, and manage free hotel rooms for visitors based on availability, registration status, and other defined criteria.

**FR-02: Self-Booking of Accommodation by Visitors**  
Visitors shall have the option to **book accommodation on their own**.

- The system must allow visitors to independently search, select, and book hotel rooms (or other types of accommodation) according to their preference.  
- Self-booking may be used as an alternative to the free accommodation provided by the organizers.  
- The system should support (or integrate with) booking workflows so that visitors can complete the reservation process themselves.

**FR-06: Priority Allocation for Special Needs**  
If the registration indicates the presence of **aged/elderly persons** or any **sickness/medical condition** in the group, the smart allocation flow (FR-23) shall:

- Prioritize and allot a hotel and room that is **closest / nearest** to the event venue (preferably walkable distance).  
- Ensure that such special-needs groups receive the most convenient accommodation available.

**FR-07: Standard Check-in and Check-out Time**  
- The standard **check-in / reporting time** for all visitors shall be **11:00 AM** on the designated check-in date.  
- The standard **check-out time** shall also be **11:00 AM** on the designated check-out date.  
- This synchronized timing ensures that a room vacated at 11:00 AM can be immediately prepared and made available for another party to check in at 11:00 AM on the same day.  
- The system shall clearly communicate both the check-in and check-out times to the visitor during the booking/allocation process.

**FR-25: Exact Capacity — Whole Unit for the Family**  
If the party size is exactly the capacity of an empty room, dormitory, or hall, smart allocation shall assign that **entire** unit to the family.

- The family stays together. That unit is not shared with another party.  
- A dormitory or hall is used only when every person in the family is the gender that unit allows (FR-24). A mixed family is assigned an exact-capacity **regular room** only.  
- If several empty units have that exact capacity, choose among them with the other rules: closest for special needs, nearby hotels for Pyramid Sevadal, and AC as the default. For a single person, a matching dormitory or hall of capacity 1 is chosen before a regular room of capacity 1.  
- Sharing (FR-18) and placing a single person into a larger dormitory or hall (FR-20) apply only when no empty exact-capacity unit is available.  
- A dormitory or hall of about 10 to 50 beds is an exact whole-unit match only when the party is that large. A smaller same-gender party occupies only its own beds there, and the rest stay open for more people of that gender (FR-24).

**FR-26: Couple in a Capacity-3 Room — Ask Before Separating**  
A husband and wife are two people, one gent and one lady. If no room of capacity 2 is free, they would otherwise take a room of capacity 3 and leave one bed empty.

- During booking, ask that couple: may the system place the lady with other ladies and the gent with other gents, so a room can be freed?  
- If **three** couples answer **Yes**, smart allocation uses the **three closest** capacity-3 rooms: all three ladies in one room, all three gents in one room, and the third room stays free.  
- Further agreeing couples are handled in further sets of three. Each full set frees one room.  
- If a couple answers **No**, they stay together in one room even though its capacity is 3.  
- If fewer than three couples agree, no exchange is made. Each of those couples also keeps their own capacity-3 room.  
- This exchange is only for a husband and wife. A larger family, or a party that is already all one gender, is not split this way.

**FR-18: Shared Room Allotment**  
The system shall support sharing of a single room by multiple families when capacity allows. Sharing is used when no empty room, dormitory, or hall has capacity exactly equal to the party size (FR-25).

- Example: A room with capacity 4 can be allotted to two families of 2 persons each.  
- When considering room sharing, the system shall **prioritize families from the same location** as the **first choice**. For a rural visitor that location is the **town**. For an urban visitor it is the **city**.  
- Same-location families are preferred so that they can adjust comfortably together.  
- Only if no suitable same-location family is available should the system consider families from different locations.  
- If a room is **already partly occupied**, and everyone already in it is gents, smart allocation shall fill the remaining beds only with a party that is **entirely gents**.  
- If everyone already in it is ladies, the remaining beds go only to a party that is **entirely ladies**.  
- A party that includes both gents and ladies is not added to a room that is already all gents or all ladies.  
- Among parties that match that gender, same location is still the first choice.  
- The system should suggest or allow Accommodation Admin to combine compatible families into the same room.

**FR-19: Room Key Policy**  
Visitors shall **never take room keys with them**.

- Room keys must always be deposited / left with the Hotel Receptionist.  
- This rule applies at all times (when going out, during the day, etc.).  
- The system and hotel processes shall enforce / remind guests of this policy.

**FR-20: Single Person Allotment Priority**  
When a **single person** (party size = 1) requests accommodation, and no empty unit has capacity exactly 1 (FR-25):

- **First choice**: Allot in Dormitory or Hall-type rooms.  
- **Last choice**: Allot in a regular private/shared room.  
- The system shall prefer dormitory/hall accommodation for single visitors to optimize regular room usage for families.
- That dormitory or hall must allow the visitor's gender (FR-24). If none is free, use a regular room.

**FR-21: Pyramid Sevadal (Volunteer) Allotment Priority**  
If the visitor(s) are **Pyramid Sevadal** (volunteers for the event):

- They shall be allotted rooms in **nearby hotels only** (walkable distance or very short auto distance).  
- Priority for the closest available suitable rooms.  
- This ensures Pyramid Sevadal can quickly reach the event venue when required.

**FR-24: Dormitory and Hall — Gents Only or Ladies Only**  
A Dormitory or Hall is never mixed. Capacity is usually large, about **10 to 50** people.

- When Accommodation Admin adds a Dormitory or Hall, they shall mark it **Gents allowed only** or **Ladies allowed only**, and set its capacity.  
- A smaller party takes only the beds it needs. The remaining beds stay open.  
- Smart allocation keeps filling those remaining beds with more people of the **same gender** until the dormitory or hall is full.  
- A gents-only dormitory or hall waits for more gents. A ladies-only dormitory or hall waits for more ladies.  
- A regular room is not marked gents-only or ladies-only in advance. A mixed party may stay in a regular room.  
- Once any room is partly filled by only one gender, further sharing follows FR-18: remaining beds go only to a party that is entirely that gender.  
- Smart allocation shall place a person in a Dormitory or Hall only when their gender is allowed in that room.  
- Every person sharing that Dormitory or Hall must be the allowed gender.  
- A party that includes both gents and ladies shall not be placed in a Dormitory or Hall.  
- A single gent goes first to a gents-only Dormitory or Hall. A single lady goes first to a ladies-only Dormitory or Hall.  
- The whole dormitory or hall is given to one party only when that party's size equals its full capacity (FR-25).

**FR-22: Booking Closes 2 Days Before the Event**  
Accommodation booking shall close **2 days before the event start date**.

- Visitors may register and request accommodation only while the booking window is open.  
- After the cutoff, the system shall reject new accommodation bookings and changes to an existing booking.  
- The cutoff is calculated from the event start date (event start minus 2 days).  
- This applies to both free-accommodation requests and self-booking.

**FR-23: Accommodation Admin Smart Room Allocation**  
Rooms are **not** allotted at the time a visitor submits a booking.

- After booking has closed, the **Accommodation Admin** starts a smart allocation flow.  
- The flow allots rooms for every party that requested **free** accommodation and is still waiting.  
- Self-booked parties are excluded.  
- Hotels marked **Reserved** (FR-28) are excluded. Their rooms are not used by this automatic flow.  
- Parties from the **event location** are allotted first (FR-30). Other parties are allotted only into beds still free after that.  
- The flow applies the allotment rules already defined: special-needs priority (FR-06), Pyramid Sevadal nearby-only priority (FR-21), room capacity, AC as the default room type, an exact capacity match for the whole family first (FR-25), then single-person dormitory/hall only in a room that allows their gender (FR-20, FR-24), a consented husband-and-wife exchange in the three closest capacity-3 rooms (FR-26), and shared rooms with same-location families first (FR-18). A partly filled room that is already all gents takes only an all-gents party. A partly filled room that is already all ladies takes only an all-ladies party.  
- Stay length already captured for each person is respected, including different check-out dates inside one room.  
- A party that still has no room after this run is **not** forced into a bed. Accommodation Admin assigns that party by hand.  
- Accommodation Admin can review the result and override an allotment, including placing a party into a reserved hotel by hand.  
- When allocation for a party is confirmed, the hotel receptionist is notified as in FR-08.

**FR-30: Event Location Has First Priority**  
Smart allocation fills rooms for people from the event's own place before people from anywhere else.

- Accommodation Admin records the event location: the city or town, the state, and the country where the event is held.  
- A party matches that location when an urban visitor's **city**, or a rural visitor's **town**, is the same as the event's city or town.  
- The automatic run allots matching parties first, using the other allotment rules.  
- It then allots the remaining parties into beds that are still free, using the same rules.  
- Any party that still cannot be placed is left for the **manual** process. Accommodation Admin assigns them from the unmatched list.

**FR-28: Reserved Hotels for Manual Assignment**  
Accommodation Admin may keep a few hotels out of automatic allocation and assign them only by hand.

- On the hotel list, each hotel has a **Reserved** switch. The same switch is on the hotel form.  
- Reserved defaults to **No**.  
- Smart allocation does not place anyone in a reserved hotel.  
- Accommodation Admin assigns those rooms manually from the allocation review or from a later room change, by choosing the reserved hotel and a room.  
- A hotel that is not active is unavailable for both automatic and manual assignment. Reserved applies only to an active hotel.

**2.2 Visitor Registration & Family Details**

**FR-03: Capture Visitor and Family Member Information**  
When a visitor registers or requests accommodation, the system shall collect the following mandatory information:

- Full Name of the primary visitor  
- Mobile number  
- Place of origin, as rural or urban (FR-27)  
- Gender of the primary visitor — **Gents** or **Ladies**  
- Details of all accompanying family members (including children), including each member's gender  
- Whether the visitor / party is **Pyramid Sevadal** (volunteer) – Yes / No

**FR-27: Rural or Urban Place of Origin, with Autocomplete**  
The visitor shall say whether they come from a **rural** or an **urban** place. Fields appear for that choice only. Suggestions appear as the visitor types, so the form can be finished quickly.

**Rural**

| Field | How it is filled |
| --- | --- |
| Village | Visitor types it. Suggestions appear while typing. |
| Town | System tries to fill this from the village. Visitor can correct it. |
| District | System tries to fill this from the village or town. Visitor can correct it. |
| State | System tries to fill this from the place already chosen. Visitor can correct it. |
| Country | System fills this. The visitor does not type it. |

**Urban**

| Field | How it is filled |
| --- | --- |
| City | Visitor types it. Suggestions appear while typing. |
| State | System tries to fill this from the city. Visitor can correct it. |
| Country | System tries to fill this from the city or state. Visitor can correct it. |

- Choosing a suggestion fills the later fields in that row.  
- If a suggestion is wrong, the visitor can change town, district, state, or country before submitting.  
- Same-location room sharing uses the rural **town** or the urban **city**.

**FR-29j: Join PSSM Buddha Sangha (self-serve)**  
A person shall join the sangha through a multi-step wizard. The join record is the lasting sangha profile used later for Stay prefills and for Login to My Space.

**Steps:** Who → Place → Family → Review → Done.

**Who (details)**  
- Identity: full name, mobile (required); email and alt. mobile optional.  
- Profile: gender, age group (Child / Adult / Senior), how long into meditation.  
- Birth · login key: date and month of birth (day and month as two digits). These feed the first password (FR-29). Preferred language optional.  
- Sangha links: pyramid center / group and since year (optional).  
- Photo & ID: optional passport-size live photo and ID proof (advised, not required); ID type optional.

**Place**  
- Rural or Urban (same field shape as FR-27). Suggestions may fill later place fields.

**Family**  
- Optional accompanying members. Each member: name, gender, relation, age group, optional mobile, optional address, optional photo & ID.  
- Family UI uses collapsible person cards.

**Review & Done**  
- Review summarises who / place / family. Finish stores the sangha profile.  
- Done shows welcome and the temporary password, with a path to Login to My Space.

- Join does not assign Event Organizer / Pyramid Sevadal / PMMA Member; PSSM Admin assigns those later (FR-29b).  
- Prototype stores people by mobile in the browser; production will use the server register.

**FR-29: Family-Group Sign-In (Login to My Space)**  
Each visitor party signs in as one family group with the main person's **mobile number** and **password**.

- Sign-in asks for **mobile number** and **password**.  
- The first password is temporary and is created at join: up to the **first 5 letters** of the name (letters only), then **date** and **month** of birth as two digits each. No event code.  
- Example: name Ramakrishna, 15 August → `Ramak1508`. Date 31 and month 8 end with `3108`.  
- After sign-in, the visitor may change the password whenever they wish. Once changed, the temporary password no longer works.  
- The same sign-in opens the whole party, not a separate login for each family member.  
- A visitor who already joined **PSSM Buddha Sangha** can book Free or Paid accommodation with who / place / family prefilled from a **copy** of the join record; edits for the stay do not change the sangha join.

**FR-29a: My Profile after Login**  
After Login to My Space, the signed-in person sees **Stay** and **Account** menus only (Sangha join/login menus are hidden).

- Account includes **My Profile**, **Change my password**, and **Logout**.  
- When the person has the **PSSM Admin** role, Account also includes **People & roles**, and login lands on that desk.  
- When the person has the **Event Organizer** role, Account also includes **Create event**.  
- My Profile opens a wizard with the same step shape as join (details, place, family, review), using profile-oriented titles.  
- My Profile shows roles assigned by PSSM Admin (read-only for the member).  
- The person can view and update the details entered at join, including optional photos and family.  
- Saving writes back to the sangha join record. Accommodation booking still uses a **copy** of that record when opened later.

**FR-29b: Pre-assigned Roles**  
PSSM Admin assigns one or more roles to a joined person (by mobile). Roles are available at login.

- Allowed roles: **Event Organizer**, **Pyramid Sevadal**, **PMMA Member**.  
- A person may hold one role, several roles, or none.  
- Login loads the assigned roles into the session. The member does not self-assign production roles.  
- Roles gate features (for example Event Organizer may create events). Pyramid Sevadal and PMMA Member are used later in accommodation and related flows.

**FR-29b1: PSSM Admin Desk**  
A joined person with the **PSSM Admin** role lands on a different home after login: People & roles.

- PSSM Admin joins and logs in the same way as any other person (join wizard + mobile/password).  
- Accommodation Admin can search people by mobile number (partial match allowed).  
- Search may return **one or many** people; Accommodation Admin selects a person from the results list.  
- After results appear, the search segment **collapses** to a compact summary; Accommodation Admin can expand it to change the query.  
- Accommodation Admin can assign or remove Event Organizer, Pyramid Sevadal, and PMMA Member for the selected person.  
- Accommodation Admin can remove a person from the sangha after a confirmation dialog (UIkit style); the removed person can no longer login.  
- Accommodation Admin cannot remove their own signed-in account.  
- Action buttons on the person card (Save roles / Remove person) are equal width and aligned on the card.

**FR-29c: Event Organizer Creates Events**  
A signed-in person with the **Event Organizer** role can create spiritual events that the sangha uses for **support** and for **Free / Paid Stay**.

**Required fields**

| Field | Rule |
| --- | --- |
| Event name | Non-empty text |
| Start date | Calendar date |
| End date | On or after start date |
| Location | Single free-text line (city, venue, or as-spoken place — e.g. `Santh Kabir Das Pyramid Centre, Hyderabad`) |
| Expected budget | Positive amount in **INR** |

**Optional fields**

| Field | Rule |
| --- | --- |
| Meditation hours per day | Number ≥ 0 (e.g. `3` or `3.5`). For planning and communication; not used for room allotment |

**Behaviour**

- Only Event Organizer may open Create event and save. Others see a gate message (PSSM Admin assigns the role).  
- The organizer can list events and **edit** an existing event (same fields as create).  
- Saved events appear in the **header event picker**.  
- **Free accommodation** and **Paid (self) accommodation** always run against the **currently selected event** (dates, location, booking cutoff = start − 2 days, allotment, hotels). Stay is not offered without an event selected.  
- Expected budget is stored for later **supporting-events** allotment (equal share / host-first). Register Admin may still mark Active/Inactive and review allotment as already specified.  
- A person without Event Organizer cannot create events.

**FR-29d: Accommodation Volunteer Books Stay**  
A signed-in person with the **Accommodation Volunteer** role can book **Free** or **Paid** accommodation for the event selected in the header.

- Volunteer may book for **themselves** (profile prefill) or for a **new visitor**.  
- New visitor: all entered people details are saved to the **sangha register** and the **stay booking** together (`registerFamily`).  
- Stay booking for an existing member does **not** rewrite their sangha join profile.  
- Wizard steps match join look: who → place → family → how long → review. When the booker already has a sangha profile, people details are prefilled and the flow opens at **how long**.  
- Each submission stores **bookedAt** (when interest was recorded). Status is **registered**; **room allocation is a later step** — this pass only collects who plans to attend.

**FR-04: Stay Duration for Each Person**  
The system shall capture **stay start and end dates** for each individual (primary visitor + every family member).

- Stay dates can be different for different family members.  
- Check-in and check-out are at **11:00 AM**.  
- Dates default from the selected event window when available.

**FR-05: Special Needs & Health Information**  
The system shall ask and record the following additional information:

- Whether there are any **aged / elderly persons** in the group  
- Whether any person in the group has any **sickness / medical condition**

This information will help organizers make suitable accommodation and support arrangements.

**2.3 Identification & ID Card**

**FR-14: Single Identification per Party**  
Only **one identification** is required per party (the entire group of visitor + family members).

- The identification can be provided by the primary visitor **or any one family member**.  
- No need to collect separate ID for every individual in the group.

**FR-15: Live Photo Capture**  
The system shall capture a **live photograph** of the person providing identification using the device's **web camera**.

**FR-16: ID Proof Capture via Camera**  
The system shall also capture the **ID proof document** (Aadhaar, PAN, Voter ID, Passport, Driving Licence, etc.) by taking a photo through the web camera.

- Both the live photo and the ID proof image shall be stored and linked to the party's record and the assigned ID card.

**2.4 Hotel Notification, Check-in & Check-out**

**FR-08: Notification to Hotel Receptionist**  
Once accommodation is allotted, the system shall automatically notify the concerned **hotel receptionist** with the complete information of the guest group, including:

- Primary visitor and all family member details  
- Stay duration for each person  
- Presence of aged persons (if any)  
- Any reported sickness / medical conditions  
- Check-in date and the standard reporting time (11:00 AM)  
- Check-out date and the standard check-out time (11:00 AM)

**FR-09: Identity Validation at Check-in**  
The hotel receptionist shall validate that the person(s) arriving are the correct registered visitor and their accompanying family members before allowing entry into the allotted room.

- Validation shall be performed using the **assigned ID card** issued to the visitor/group.  
- Only after successful validation of the ID card shall the receptionist permit the guest(s) to occupy the room.

**FR-10: Advance Check-out Reminder**  
The hotel receptionist shall inform the visitor **in advance** when the next day is their last day of stay.

- The system shall support (or prompt) the receptionist to notify the guest about the upcoming check-out.  
- The notification must clearly mention the **check-out time of 11:00 AM**.

**FR-11: Check-out Process**  
The hotel receptionist shall be able to perform the **check-out action** in the system.

- Check-out must be completed by **11:00 AM** so that the room can be made ready for the next guest.  
- Upon successful check-out, the room shall immediately become available for re-allotment to other visitors.  
- The system must support **person-wise check-out**, allowing any individual family member to check out independently without affecting the stay of the remaining members.  
- **Early check-out is allowed**: A party (or individual member) may check out freely before their originally scheduled check-out date if they wish. The hotel receptionist performs the early check-out, and the Accommodation Admin is automatically notified of the action.

**2.5 Accommodation Admin Notifications & Bi-directional Communication**

**FR-12: Real-time Notification to Accommodation Admin**  
The system shall automatically notify the **Accommodation Admin** of every action performed by the hotel receptionist, including (but not limited to):

- Check-in validation  
- Check-out (full or person-wise)  
- Any updates related to the guest group  

This ensures complete visibility and audit trail for the event organizers.

**FR-13: Live Notification from Accommodation Admin to Hotel Receptionist**  
Certain actions performed by the **Accommodation Admin** shall be notified in real-time (live) to the concerned **hotel receptionist** of the particular hotel.

- The notification must be specific to the hotel affected by the Accommodation Admin's action.  
- Examples of such actions may include (but are not limited to): room re-allocation, cancellation, change in guest details, special instructions, or any update that impacts the hotel's operations or guest list.  
- The system shall ensure that the hotel receptionist receives timely and accurate live information so they can act accordingly.

---

### 3. Scenarios (High-Level)

**Scenario 1: Visitor books accommodation independently**  
A registered visitor chooses not to use the free accommodation provided by the organizers and instead books a hotel room (or other accommodation) on their own through the system (or an integrated booking facility).

**Scenario 2: Family Registration with Stay & Health Details**  
A visitor arrives with family members (including children). The system guides the visitor to enter:

1. Personal details (Name, Mobile, Rural or Urban place with autocomplete)  
2. Details of all accompanying family members  
3. Number of days each person wishes to stay  
4. Information about any elderly persons and any existing sickness/medical conditions  

The booking is stored as a request. A room is not allotted until Accommodation Admin runs smart allocation after the booking window closes (FR-22, FR-23). The visitor may instead choose self-booking while the window is still open.

**Scenario 3: Priority Allotment + Hotel Notification**  
After booking has closed, Accommodation Admin runs smart allocation. When a group has aged persons or reported sickness, that flow prioritizes the nearest available hotel/room, sets the check-in reporting time as 11:00 AM on the check-in date, and notifies the hotel receptionist with the full guest and special-needs information.

**Scenario 4: Check-in Identity Validation**  
On the check-in date, the visitor and family members present themselves at the hotel. The receptionist verifies their identity against the system records by checking the **assigned ID card**. Only after successful validation are they allowed to enter the allotted room.

**Scenario 5: Check-out Reminder & Person-wise / Early Check-out**  
One day before the scheduled departure, the hotel receptionist informs the guest that the next day is the last day of stay and communicates the check-out time of **11:00 AM**.  
On the check-out day (or earlier), the receptionist can perform check-out by 11:00 AM — either for the full group, any individual family member, or as an **early check-out** before the scheduled date if the party wishes. The freed room becomes immediately available so that another party can check in at 11:00 AM. All such actions are notified in real time to the Accommodation Admin.

**Scenario 6: Accommodation Admin Action Notified to Hotel**  
When the Accommodation Admin performs certain actions (e.g., room change, cancellation, special instruction, or guest detail update) that affect a specific hotel, the system immediately sends a live notification to the receptionist of that particular hotel with the relevant details.

**Scenario 7: Single ID Capture per Party**  
During registration or ID card generation, only one person from the party (visitor or any family member) needs to provide identification. The system captures:
- A live photo of the person via web camera
- A photo of their ID proof document via web camera  

These are linked to the entire party's record and the single assigned ID card.

**Scenario 8: Booking Closes, then Accommodation Admin Runs Smart Allocation**  
Visitors submit accommodation requests until **2 days before the event**. After that cutoff, booking is closed. Accommodation Admin then starts the smart allocation flow. The system allots rooms for waiting free-accommodation parties using special-needs priority, Pyramid Sevadal nearby-only priority, capacity, and default AC. If a family's size exactly equals an empty room, dormitory, or hall, that whole unit is assigned to them. Otherwise a single person of matching gender goes to a dormitory or hall first, and other parties may share a room, with same-location families first. If a room is already partly occupied by only gents, the remaining beds go to an all-gents party. If it is already only ladies, the remaining beds go to an all-ladies party. A gents-only dormitory or hall receives gents only. A ladies-only dormitory or hall receives ladies only. Mixed parties stay in regular rooms. A husband and wife who agree may be separated with two other agreeing couples into one ladies room and one gents room, using the three closest capacity-3 rooms, so one room is freed. A couple who does not agree stays together in a capacity-3 room. Accommodation Admin reviews the result, overrides where needed, and the affected hotel receptionists are notified.

---

---

## Accommodation — User stories

### How to use this document
- Stories are ordered from **Basic ΓåÆ Intermediate ΓåÆ Advanced**
- Each story follows the standard format:  
  **As a** [role]  
  **I want** [goal]  
  **So that** [benefit]
- Acceptance Criteria are written in clear, testable points
- You can pick up one user story at a time for development

---

## 1. Basic Stories (Foundation)

### US-01: Accommodation Admin – Add Hotel
**As an** Accommodation Admin  
**I want** to add a new hotel with its basic details and distance from the event place  
**So that** the system knows which hotels are available for allotment

**Acceptance Criteria:**
- Accommodation Admin can enter Hotel Name, Address, Contact, and Distance from event place
- Distance is mandatory
- Hotel is saved and appears in the list of available hotels
- Accommodation Admin can edit or deactivate a hotel later
- Accommodation Admin can mark a hotel **Reserved** from the hotel list or the hotel form (US-25)

---

### US-25: Accommodation Admin – Reserve Hotels for Manual Assignment
**As an** Accommodation Admin  
**I want** to mark a few hotels as reserved  
**So that** smart allocation leaves them free and I can assign them by hand

**Acceptance Criteria:**
- The hotel list shows a Reserved switch on each hotel. The hotel form has the same switch
- Reserved defaults to No
- Smart allocation does not use rooms in a reserved hotel
- When Accommodation Admin overrides an allotment or places an unmatched party, reserved hotels appear in the hotel choice and can be selected
- Turning Reserved off returns that hotel to smart allocation for the next run
- An inactive hotel cannot be assigned automatically or manually

---

### US-02: Accommodation Admin – Add Rooms to Hotel
**As an** Accommodation Admin  
**I want** to add rooms under a hotel with room number and capacity  
**So that** room inventory is available for allotment

**Acceptance Criteria:**
- Accommodation Admin selects a hotel and adds multiple rooms
- Each room has: Room Number, Capacity (persons), Room Type (default = AC), and kind of room (Regular, Dormitory, or Hall)
- If the kind is Dormitory or Hall, Accommodation Admin must set **Gents allowed only** or **Ladies allowed only**, and a large capacity (usually 10 to 50)
- A regular room has no gender limit
- System prevents duplicate room numbers within the same hotel
- Rooms are marked as Available by default

---

### US-03: Visitor – Register Basic Details
**As a** Visitor  
**I want** to register my basic details  
**So that** I can request accommodation

**Acceptance Criteria:**
- Visitor can enter: Full Name, Mobile Number, Gender (Gents or Ladies), and whether they come from a Rural or Urban place
- Rural asks for Village, and tries to fill Town, District, and State. Country is filled by the system
- Urban asks for City, and tries to fill State and Country
- As the visitor types a village or city, matching suggestions appear. Choosing one fills the later place fields so entry is quick
- The visitor can correct a suggested town, district, state, or country
- Mobile number is validated for correct format
- Registration creates a unique Visitor record
- The party can later sign in with the main contact and mobile number and the temporary password (US-26)

---

### US-04: Visitor – Add Family Members
**As a** Visitor  
**I want** to add details of family members accompanying me  
**So that** accommodation can be arranged for the entire party

**Acceptance Criteria:**
- Visitor can add multiple family members (including children)
- For each member: Name, Gender (Gents or Ladies), and relation (optional)
- System shows total number of persons in the party

---

## 2. Intermediate Stories (Core Functionality)

### US-05: Visitor – Capture Stay Duration
**As a** Visitor  
**I want** to choose stay start and end dates for each person in my party  
**So that** rooms are allotted for the correct duration

**Acceptance Criteria:**
- Stay dates can be different for each family member
- Each person has a start date and end date (end ≥ start); check-in/out shown at 11:00 AM
- Dates default from the selected event window and must fall within it when the event has dates
- Minimum stay is 1 day (same calendar day allowed as overnight to next check-out)

---

### US-06: Visitor – Declare Special Needs
**As a** Visitor  
**I want** to declare if there are aged persons or anyone with sickness in my party  
**So that** we can get priority for nearby rooms

**Acceptance Criteria:**
- Simple Yes/No questions for:
  - Any aged/elderly persons?
  - Any person with sickness/medical condition?
- If Yes, optional free-text field for details
- This information is stored against the party

---

### US-07: System – Priority Room Allotment
**As the** System  
**I want** to prioritize nearby rooms for parties with aged persons or sickness  
**So that** special-needs groups get convenient accommodation

**Acceptance Criteria:**
- This rule runs inside the Accommodation Admin smart allocation flow (US-23), after booking has closed
- If special needs are declared, system prefers hotels with shorter distance from event place
- System tries to allot a room with sufficient capacity
- Default room type is AC
- Accommodation Admin can manually override allotment if required

---

### US-08: Visitor – Single ID Capture per Party
**As a** Visitor  
**I want** to provide only one identification for the entire party  
**So that** the process remains simple and fast

**Acceptance Criteria:**
- Only one person (Visitor or any family member) needs to provide ID
- System captures:
  - Live photo via web camera
  - Photo of ID proof document via web camera
- Both images are stored and linked to the party
- A single ID Card is generated for the entire party

---

### US-09: System – Generate & Assign ID Card
**As the** System  
**I want** to generate a unique ID Card for each party  
**So that** hotel receptionists can validate the guests

**Acceptance Criteria:**
- ID Card contains Party ID / unique number
- Linked to the live photo and ID proof
- Can be shown digitally or printed
- Used later for check-in validation

---

## 3. Advanced Stories (Operations & Real-time)

### US-10: Hotel Receptionist – View Allotted Guests
**As a** Hotel Receptionist  
**I want** to see the list of parties allotted to my hotel  
**So that** I know who is expected to check in

**Acceptance Criteria:**
- Receptionist can see: Party details, number of persons, check-in date, special needs, assigned rooms
- Information is filtered only for their hotel
- Real-time updates when Accommodation Admin makes changes

---

### US-11: Hotel Receptionist – Validate Identity at Check-in
**As a** Hotel Receptionist  
**I want** to validate the arriving party using the assigned ID Card  
**So that** only the correct guests enter the room

**Acceptance Criteria:**
- Receptionist can search or scan the ID Card
- System shows party details + live photo for verification
- Only after successful validation can check-in be completed
- Check-in time is recorded (standard expected time: 11:00 AM)

---

### US-12: Hotel Receptionist – Perform Check-out
**As a** Hotel Receptionist  
**I want** to check out a party or individual family members  
**So that** rooms become free for re-allotment

**Acceptance Criteria:**
- Support full party check-out
- Support person-wise check-out
- Support early check-out (before scheduled date)
- Check-out time standard is 11:00 AM
- After check-out, room capacity is immediately released
- Accommodation Admin is notified of every check-out action

---

### US-13: Hotel Receptionist – Advance Check-out Reminder
**As a** Hotel Receptionist  
**I want** to be reminded (and inform the guest) one day before check-out  
**So that** guests are aware of the 11:00 AM check-out time

**Acceptance Criteria:**
- System shows upcoming check-outs for the next day
- Receptionist can mark that the guest has been informed
- Check-out time (11:00 AM) is clearly communicated

---

### US-14: Accommodation Admin – Receive Real-time Notifications
**As an** Accommodation Admin  
**I want** to receive real-time notifications of all actions done by Hotel Receptionists  
**So that** I have full visibility

**Acceptance Criteria:**
- Notifications for: Check-in, Check-out (full/person-wise/early), any updates
- Notifications appear in real-time (via Spring WebSocket + WhatsApp)
- Accommodation Admin can view history of all actions

---

### US-15: Accommodation Admin – Send Live Updates to Hotel
**As an** Accommodation Admin  
**I want** to perform actions (room change, cancellation, special instructions) and notify the concerned hotel instantly  
**So that** the receptionist is always up to date

**Acceptance Criteria:**
- Accommodation Admin actions that affect a specific hotel trigger live notification to that hotel's receptionist
- Notification contains clear details of the change
- Uses Spring WebSocket (in-app) + WhatsApp

---

### US-16: Visitor – Self Booking of Accommodation (Optional)
**As a** Visitor  
**I want** the option to book accommodation on my own instead of using free allotment  
**So that** I have flexibility

**Acceptance Criteria:**
- Visitor can choose ΓÇ£Self BookingΓÇ¥ during registration
- System allows selecting hotel/room type (or redirects to external booking if needed)
- Free allotment flow is skipped for self-booked parties

---

### US-17: System – Synchronized 11:00 AM Check-in / Check-out
**As the** System  
**I want** both check-in and check-out to be standardized at 11:00 AM  
**So that** a room vacated at 11:00 AM can be given to a new party at 11:00 AM on the same day

**Acceptance Criteria:**
- Default check-in time = 11:00 AM
- Default check-out time = 11:00 AM
- Room status becomes Available immediately after check-out
- System supports same-day turnover of rooms

---

### US-18: System / Accommodation Admin – Shared Room Allotment
**As the** System / Accommodation Admin  
**I want** to allot multiple compatible families into the same room when capacity allows  
**So that** room utilization is maximized

**Acceptance Criteria:**
- A room of capacity 4 can be shared by two families of 2 persons each (or other valid combinations)
- When suggesting or performing room sharing, the system shall treat families from the **same location** as the **first choice**: same **town** for rural visitors, same **city** for urban visitors
- Only if no suitable same-location family is available should families from different locations be considered
- If a room is already partly occupied and everyone in it is gents, add only a party that is entirely gents, within the beds still free
- If everyone already in it is ladies, add only a party that is entirely ladies, within the beds still free
- A mixed party is not added to a room that is already all one gender
- Among gender-matching parties, same location remains the first choice
- System should suggest possible sharing combinations or allow Accommodation Admin to manually combine families
- Total persons in the room must never exceed room capacity
- Each family still retains its own stay duration and check-out tracking

---

### US-19: Hotel Receptionist – Enforce Room Key Policy
**As a** Hotel Receptionist  
**I want** to ensure that visitors never take room keys with them  
**So that** keys are always available at the reception desk

**Acceptance Criteria:**
- Guests must deposit room keys with the receptionist whenever they leave the hotel
- Receptionist can remind / enforce this policy during check-in and daily interactions
- System may display a clear note/reminder about the key policy on the ID card or check-in screen

---

### US-20: System – Single Person Allotment Priority
**As the** System  
**I want** to prioritize Dormitory / Hall-type rooms for single visitors  
**So that** regular rooms are conserved for families

**Acceptance Criteria:**
- This applies when no empty room, dormitory, or hall has capacity exactly 1 (FR-25)
- When party size = 1 (single person):
  - **First choice** ΓåÆ Allot in a Dormitory or Hall that allows that person's gender
  - **Last choice** ΓåÆ Allot in a regular private or shared room
- A gent is allotted only in a gents-only Dormitory or Hall. A lady is allotted only in a ladies-only Dormitory or Hall
- A dormitory or hall is usually 10 to 50 beds. The person takes one bed. Remaining beds stay open for more people of that same gender until it is full
- System should clearly distinguish room types (Regular Room vs Dormitory/Hall) and the gender allowed in each Dormitory or Hall
- Accommodation Admin can override if required

---

### US-21: System – Pyramid Sevadal (Volunteer) Nearby Allotment
**As the** System  
**I want** to allot Pyramid Sevadal (volunteers) only in nearby hotels  
**So that** they can quickly reach the event venue when needed

**Acceptance Criteria:**
- During registration, capture whether the visitor is a **Pyramid Sevadal**
- If Yes ΓåÆ restrict allotment to nearby hotels only (walkable or very short auto distance)
- Give highest priority to the closest available suitable rooms
- Accommodation Admin can override if required

---

### US-22: System – Close Booking 2 Days Before the Event
**As the** System  
**I want** accommodation booking to close 2 days before the event starts  
**So that** Accommodation Admin has a fixed list of parties before rooms are allotted

**Acceptance Criteria:**
- Booking stays open until the event start date minus 2 days
- After the cutoff, a visitor cannot create a new accommodation booking or change an existing one
- Both free-accommodation requests and self-booking are closed
- The closed state is visible to visitors and to Accommodation Admin

---

### US-24: Visitor – Couple Consent to Separate Rooms
**As a** Visitor travelling as husband and wife  
**I want** to say whether we may be placed in separate gents and ladies rooms  
**So that** a capacity-3 room can be freed when we agree, and we stay together when we do not

**Acceptance Criteria:**
- The question is shown when the party is exactly two people, one gent and one lady, registered as husband and wife
- The question explains that three such couples can fill one ladies room and one gents room in the closest capacity-3 rooms, freeing the third room
- Answer is Yes or No, and it is stored with the booking
- Yes allows smart allocation to separate them only as part of a full set of three agreeing couples
- No means the couple is given one room together, even when that room's capacity is 3

---

### US-26j: Visitor – Join PSSM Buddha Sangha
**As a** person new to the sangha  
**I want** to join with my details, place, and optional family  
**So that** I have a sangha profile and can login, and later book Stay without retyping

**Acceptance Criteria:**
- Wizard steps: Who → Place → Family → Review → Done
- Who captures identity, profile, birth (login key), optional sangha links, optional photo & ID
- Place is Rural or Urban with the FR-27 field shape
- Family is optional; members use collapsible cards; optional photo & ID per member
- Finish stores the sangha profile and shows the temporary password
- Done offers Login to My Space
- Roles are not self-assigned at join

### US-26: Visitor – Sign In and Change Password
**As a** Visitor  
**I want** to sign in for my family group with my mobile number and password  
**So that** I can return to My Space or our booking, and set my own password when I wish

**Acceptance Criteria:**
- One sign-in covers the whole party. Sign-in uses the main person's mobile number and password
- The first password is created at join: up to the first 5 letters of the name, then date and month as two digits. No event code
- Example: name Ramakrishna, 15 August produce `Ramak1508`
- The join and login pages state this password rule
- After sign-in, the visitor can change the password
- After a change, only the new password works
- A wrong mobile number or password is rejected

### US-26a: Visitor – My Profile
**As a** signed-in Visitor  
**I want** to open My Profile and update the details I entered when joining  
**So that** my sangha record stays current without joining again

**Acceptance Criteria:**
- After login, only Stay and Account appear in the main menu
- Account offers My Profile, Change my password, and Logout
- When PSSM Admin is assigned, Account also offers People & roles and login lands there
- When Event Organizer is assigned, Account also offers Create event
- My Profile shows the join fields in a wizard (details, place, family, review) with profile titles
- My Profile shows roles assigned by PSSM Admin
- The person can add or change family and optional photos
- Save updates the sangha profile used for later accommodation prefills

### US-26b: Visitor – Roles from PSSM Admin
**As a** joined person  
**I want** PSSM Admin to assign me one or more roles (Event Organizer, Pyramid Sevadal, PMMA Member)  
**So that** the right features open when I login

**Acceptance Criteria:**
- Roles are pre-assigned by PSSM Admin, not chosen by the member at join
- One person may hold zero, one, or several of the three roles
- At login, assigned roles are available on the session and shown on My Profile
- Event Organizer unlocks Create event; other roles are reserved for later Stay / Sevadal / PMMA behaviour

### US-26b1: PSSM Admin – People and Roles
**As a** PSSM Admin  
**I want** a dedicated landing after login where I can find people by mobile, assign or remove roles, and remove people  
**So that** I can manage sangha access without using the member My Profile flow

**Acceptance Criteria:**
- PSSM Admin joins and logs in like any other member
- After login, Admin lands on People & roles (not the member home)
- Search by mobile can return one or many matches; Admin picks a person from the list
- After a successful search, the search segment collapses; Change re-opens it
- Admin can assign or remove Event Organizer, Pyramid Sevadal, and PMMA Member
- Remove asks for confirmation (UIkit style); after remove, that person cannot login
- Admin cannot remove their own account while signed in
- Save roles and Remove person are equal-sized and aligned on the person card

### US-26c: Event Organizer – Create Event
**As an** Event Organizer  
**I want** to create an event with name, dates, location, expected budget (INR), and optional daily meditation hours  
**So that** members can support that event and book Free or Paid Stay against it

**Acceptance Criteria:**
- Only a signed-in person with Event Organizer can open Create event and save
- Required: event name, start date, end date (end ≥ start), location (one line), expected budget (INR, > 0)
- Optional: meditation hours per day (≥ 0)
- After save, the event appears in the organizer’s list and in the header event picker
- Choosing that event in the picker is what Free Stay and Paid Stay use (booking window, allotment, receptionist flows)
- Non-organizers cannot save; UI points them to PSSM Admin → People & roles
- Edit loads the event into the same form; Update saves changes; Cancel returns to create mode

### US-26d: Accommodation Volunteer – Book Stay for New Visitors
**As an** Accommodation Volunteer  
**I want** to book Free or Paid accommodation for a new visitor  
**So that** their details enter the sangha register and the stay booking in one flow

**Acceptance Criteria:**
- PSSM Admin can assign `accommodation_volunteer`
- Volunteer can choose Myself (prefill from their profile) or New visitor (empty join-like form)
- New visitor submit creates the sangha person (if mobile is free) and the stay booking together
- Stay edits for an existing member do not rewrite their sangha join profile
- Booking requires an event selected in the header (not the sangha home item)
- Steps match join look: who → place → family → how long → review; logged-in members with a profile open at how long with people prefilled

### US-23: Accommodation Admin – Run Smart Room Allocation
**As an** Accommodation Admin  
**I want** to start a smart allocation flow after booking has closed  
**So that** waiting parties receive rooms according to the agreed rules

**Acceptance Criteria:**
- Accommodation Admin can start the flow only after the booking window has closed (US-22)
- The flow allots rooms for parties that requested free accommodation and do not yet have a room
- Self-booked parties are skipped
- Hotels marked Reserved are skipped (US-25). Accommodation Admin can still place a party into a reserved hotel by choosing it in the review override
- The flow applies, together:
  - First, parties whose place matches the event location (urban city, or rural town). Then other parties, only into beds still free (FR-30)
  - A party that still has no room is left unmatched for Accommodation Admin to assign by hand
  - Special-needs priority for the closest rooms (US-07)
  - Pyramid Sevadal restricted to nearby hotels (US-21)
  - If party size exactly equals the capacity of an empty room, dormitory, or hall, assign that entire unit to the family and do not share it (FR-25). A dormitory or hall is used only when the whole family matches its gender
  - Capacity must be enough for the party, including shared occupancy, when no exact match exists
  - Default room type is AC
  - Single person, when no capacity-1 unit exists: dormitory or hall of the matching gender first, regular room last (US-20, FR-24)
  - A Dormitory or Hall marked gents-only receives gents only. Ladies-only receives ladies only. Typical capacity is 10 to 50. Remaining beds stay open and are filled with more people of that same gender until the unit is full
  - A party with both gents and ladies stays in a regular room, except a husband and wife who agreed to FR-26
  - Husband and wife, room capacity 3: if three couples agreed, put the three ladies in one of the closest capacity-3 rooms and the three gents in another, and leave the third room free (FR-26). A couple who did not agree keeps one capacity-3 room together
  - Shared rooms: same-location families first, other locations only if needed (US-18)
  - A partly filled all-gents room receives only an all-gents party. A partly filled all-ladies room receives only an all-ladies party
  - Each person's own stay length and check-out date
- Accommodation Admin can review the proposed allotment and override any party
- After confirmation, the concerned hotel receptionist is notified
- Parties that cannot be fitted are listed for Accommodation Admin to resolve manually

---


---

## Suggested Implementation Order

| Priority | User Stories | Focus Area | Track |
|----------|--------------|------------|-------|
| P0 (prototype done) | US-26j, US-26, US-26a, US-26b, US-26b1, US-26c | Join, login, profile, roles, admin desk, create event | Sangha My Space — UI prototype in `docs/prototype/` |
| P1 | US-01, US-02, US-25 | Hotels & rooms master data | Accommodation module (next) |
| P2 | US-03, US-04, US-05, US-06, US-08, US-09, US-22, US-24 | Stay registration & booking window for joined people | Accommodation module (next) |
| P2b | US-23, US-07, US-18, US-20, US-21 | Accommodation Admin smart allocation | Accommodation module |
| P3 | US-10, US-11, US-12, US-13, US-19 | Hotel Receptionist operations | Accommodation module |
| P4 | US-14, US-15, US-17 | Real-time & Accommodation Admin control | Accommodation module |
| P5 | US-16 | Optional self-booking | Accommodation module |

---

### Notes
- Living document for PSSM Buddha Sangha (register + accommodation + My Space).
- Join / login / roles / admin / create-event UI prototype is tracked under FR-29j and US-26*; next build focus is the Accommodation module (Accommodation Admin) for joined people.
- File: `docs/buddha-sangha/Requirements.md`
