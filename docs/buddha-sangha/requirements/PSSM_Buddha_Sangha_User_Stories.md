# Agile User Stories  
## PSSM Buddha Sangha (`pssm-buddha-sangha`)

**Version:** 1.9 (Living Document)  
**Last Updated:** 06 October 2026  
**Related Documents:**  
- PSSM_Buddha_Sangha_Requirements.md  
- PSSM_Buddha_Sangha_Technical_Spec.md  
- PSSM_Buddha_Sangha_Register_Summary.md  

---

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
- Admin signs in with the Admin role and can add, edit, and open a person’s mobile
- A person who is already on the register signs in with the Sangha member role and opens the dashboard
- A successful sign-in opens the dashboard
- Without a valid sign-in, the dashboard, add, edit, and detail screens stay closed
- The session uses JWT

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
- A saved person appears on the dashboard in that place’s group
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

### US-09: Sangha – See This Week’s Five Events
**As an** Admin or a person in the sangha  
**I want** to see the five events as boxes, top to bottom  
**So that** we see where the most contributions are still needed

**Acceptance Criteria:**
- The first screen shows the person’s photo in a circle, and five event boxes in one column
- **1,44,000** meditators across the globe are the contribution
- Remaining on a box is 1,44,000 minus how many are shown as supported for that event
- The top box has the highest remaining number. The bottom box has the lowest
- Inside each box, each city or town shows how many people from that place are not yet supported
- Those places are ordered top to bottom, highest remaining first
- Each box shows the event budget and the equal share, budget divided by 1,44,000
- Each box shows who is supported and that equal share
- When another person contributed, their name is shown beside the person who is supported
- Next week the five boxes are a new set of events, each starting at remaining 1,44,000

---

### US-10: Sangha Member – Support a Small Amount
**As a** person in the sangha  
**I want** to support an event with my equal share of its budget  
**So that** I am part of the global cause

**Acceptance Criteria:**
- The amount is that event’s budget divided by 1,44,000, shown and not typed
- Supporting myself records my name under Supported, with that share
- If I cannot contribute, I ask another person to contribute for me
- When they contribute, I am shown as supported, and their name is shown beside mine
- The total of shares moves toward that event’s budget

---

### US-11: Admin – Set This Week’s Five Events
**As an** Admin  
**I want** to name the five events for this week and set a budget for each  
**So that** each person’s share is an equal part of that event’s budget

**Acceptance Criteria:**
- Admin enters exactly five event names, and a budget for each
- Each person’s share for an event comes from smart allotment (US-14)
- Saving replaces the five boxes on the page
- Each whole-sangha box starts the week at remaining 1,44,000 people
- The amount an able person supports is the allotted share

---

### US-14: Admin – Smart Allotment by Location
**As an** Admin  
**I want** each location’s amount to be allotted from the event budget  
**So that** the ask follows how many people are there and how many can support

**Acceptance Criteria:**
- Admin can run allotment after the event budget is saved
- Each location row shows persons, how many are able to support, the allotted amount, and the share
- For a whole-sangha event, allotted amount = event budget × (able persons in that location ÷ 1,44,000)
- An able person’s share is the event budget ÷ 1,44,000
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
**As an** Admin or a person in the sangha  
**I want** to see a person’s photo in the circle, their contribution this week, and their comments  
**So that** the graph shows who they are and what they did this week

**Acceptance Criteria:**
- The photo is shown inside the circle, with the name under it
- Opening the page shows the signed-in person’s photo
- Choosing a name on an event rectangle replaces the photo with that person
- Under the photo, five lines show this week’s contribution: supported or not yet, that event’s equal share, and who contributed when it was someone else
- Under those lines, the person’s feedback / comments for this week are shown
- An empty comment box means they have not written any
- A person can write that comment when they support (US-10)
- The photo can be saved on the person record and is optional

---

## Suggested Implementation Order

| Priority | User Stories        | Focus Area              |
|----------|---------------------|-------------------------|
| P1       | US-01, US-06        | Sign-in and place list  |
| P2       | US-02, US-03, US-04, US-05 | Register: add, edit, view, search |
| P3       | US-07, US-08        | Dashboard groups and counts |
| P4       | US-09, US-10, US-11, US-14, US-15, US-13, US-12 | Host city or state first, extra amount, then other locations |

---

### Notes
- This is a living document. New stories will be added when more scenarios come up.
- User Stories → `docs/requirements/PSSM_Buddha_Sangha_User_Stories.md`
