# Requirements Specification  
## PSSM Buddha Sangha

**Version:** 1.9 (Living Document)  
**Last Updated:** 06 October 2026  
**Related Documents:**  
- PSSM_Buddha_Sangha_Technical_Spec.md  
- PSSM_Buddha_Sangha_User_Stories.md  
- PSSM_Buddha_Sangha_Register_Summary.md  

---

### 1. Introduction / Background

**1.1 Purpose**  
This Requirements Specification defines the functional and non-functional requirements for a minimal register of people who are part of the PSSM sangha and practice meditation as taught by Patriji.

**1.2 Register Context**  
Pyramid Spiritual Societies Movement (PSSM) is a sangha of people who practice meditation as taught by Patriji. Organizers need a simple list of who those people are, how to reach them, where they live, and which pyramid center or group they sit with.

**1.3 Sangha context**  
From Patriji, “PSSM - a Club of Buddhas” (Pearls of Wisdom): PSSM is a club of Buddhas. A happy life becomes a duty. At the bodhisattva stage you teach, irrespective of whether others are ready, and the 100% principle applies. What you received, you gift to every person. You were the receiver. Your destiny is this bodhisattva world.

Every person in the PSSM sangha supports the spiritual events of PSSM. That is how this gift is shared.

The system stores one record per person. A person on the register is part of this sangha and practices that meditation. No other personal details are collected.

The only fields on a record are:

| Field | Meaning |
| --- | --- |
| Full name | Who |
| Mobile | How to reach them |
| Place | City or town, chosen from the place list |
| Pyramid center or group | Which sangha they sit with |
| Since | Year they began, if known |

---

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
The system shall record the person’s full name so the register shows who they are.

**FR-03: Mobile**  
The system shall record a mobile number so organizers can reach the person.

- The mobile number shall be checked for a valid phone format before the record is saved.

**FR-04: Place**  
The system shall record the person’s place as a city or town chosen from the place list.

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

**2.4 This Week’s Five Events**

**FR-14: Five Events This Week**  
The first screen shall be a graph of the sangha and the events to support this week.

- A circle shows the person’s photo.  
- The person’s name sits under the photo. A small label still says PSSM sangha.  
- Five boxes stand in one column, top to bottom.  
- Each box is one event.  
- The column is ordered by remaining contributions needed, highest at the top and lowest at the bottom.  
- There are five events for the week, and Admin replaces those five every week.  
- **1,44,000** meditators across the globe are the people who are part of the contribution. Remaining for an event is 1,44,000 minus how many are shown as supported for that event.

**FR-18: Photo, This Week’s Contribution, and Comments**  
The circle and the blocks under it shall show one person.

- The photo is cropped to the circle. On first open it is the signed-in person. Choosing a name in a box shows that person’s photo.  
- Under the photo, contribution details for this week: one line for each of the five events, saying supported or not yet, that event’s equal share, and, when they asked someone else, the name of the person who contributed.  
- Under those lines, feedback / comments written by that person for this week. The box is empty when they have not written any.  
- Comments belong to the week. Next week starts a new comment.

**FR-15: An Equal Share of Each Event’s Budget**  
When an event asks the whole sangha, every person among **1,44,000** meditators across the globe shall be part of the contribution.

- Admin sets a budget for each such event. The budgets can differ.  
- One person’s share is the amount smart allotment gives an able person in their location (FR-20).  
- The person does not type the share.

**FR-20: Smart Allotment of Each Location’s Amount**  
The amount asked of each location shall be allotted from the event budget by the number of persons there and how many of them are able to support.

- A person is able to support unless they are marked unable for this event.  
- For a whole-sangha event, a location’s amount is the event budget × (able persons in that location ÷ 1,44,000).  
- More able persons in a location means a larger amount for that location. Persons who are unable do not add to it.  
- An able person’s share is that location amount ÷ the able persons in the location. That share is the event budget ÷ 1,44,000.  
- The part of the budget for meditators not yet on the register stays unallotted.  
- For a small-budget event asked of one location, that location’s amount is the event budget. The suggested share is that amount ÷ the able persons in that location. Volunteers may pay until the remaining amount is zero. Not every person there has to support.  
- A location with no able person is shown to Admin with no share to collect.  
- Admin reviews the allotment and may override a location amount before the boxes use it.  
- Host city and state are allotted first. Other locations are allotted only the amount still left after that (FR-21).

**FR-21: Host City or State First, Then Other Locations**  
When an event happens in a city or a state, the people there support first. Other locations are asked only for what is still needed.

- Each place on the list has a state, so a city belongs to a state.  
- Admin marks where the event happens: one or more cities, or a state.  
- Every person whose city is marked, or whose city is in the marked state, must support. A person who is unable still must be covered by someone they ask.  
- An able person in that city or state may enter an extra amount, on top of their share. The extra can be large. It counts toward the budget.  
- Amount still needed = event budget − host shares already given − extra amounts.  
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
- The amount is that event’s equal share.  
- When the asked person contributes, the person who asked is shown as supported.  
- The screen also shows the name of the person who contributed.

**FR-17: The Graph Shows the Support**  
Each box shall show the remaining contributions needed for that event, then who is already supported.

- Remaining = 1,44,000 minus the number shown as supported.  
- Boxes are listed top to bottom, highest remaining first, lowest remaining last.  
- Inside each box, each place shows its own remaining: people from that city or town who are not yet shown as supported for this event.  
- Those places are listed top to bottom, highest remaining first, lowest last.  
- Who is supported, and that event’s equal share.  
- When someone else contributed, that person’s name beside the one who is shown as supported.  
- How much is supported: the equal shares added up. When all 1,44,000 have contributed, this equals the event budget.  
- Admin and a person in the sangha both see this list.

---

### 3. Non-Functional Requirements

**NFR-01: Minimal Interface**  
The interface shall stay limited to sign-in, this week’s five-event graph, support, the place list, the people dashboard, add or edit, and person detail.

**NFR-02: Same Stack as the Accommodation System**  
The application shall use HTML5, UIKit 3, and Alpine.js on the frontend, Node.js and Express.js on the backend, MySQL for data, and JWT for sign-in. Roles are Admin and Sangha member.

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

**Scenario 8: This week’s five events**  
Admin or a person in the sangha opens the page. The circle shows a person’s photo. Five boxes stand in a column. The top box is the event with the most contributions still needed. Inside that box, Vijayawada may sit above Bengaluru because more people there are still to contribute. The bottom box is the event with the fewest still needed. Each event remaining number is 1,44,000 minus how many are shown as supported.

**Scenario 9: Unable to contribute**  
Meena cannot contribute for one event. She asks Ravi to contribute for her. When Ravi contributes Meena’s equal share, Meena is shown as supported, with Ravi’s name beside hers. That event’s remaining number drops by one, and its box may move down the column.

**Scenario 10: Next week**  
Admin enters five new events. A whole-sangha event again divides its budget by 1,44,000. A location request again starts at its requested amount. Last week’s five are no longer the current page.

**Scenario 11: A small budget for one location**  
A small event asks only Vijayawada. Smart allotment sets Vijayawada’s amount from that budget and from how many people there are able to support. Not everyone in the sangha is asked, and not everyone in Vijayawada has to support. Ravi, who is able and in Vijayawada, voluntarily supports. The remaining amount on that box goes down. When the remaining amount reaches zero, that request is finished.

**Scenario 12: Smart allotment across locations**  
An event budget is 1,44,000. The event happens in Vijayawada. Vijayawada has 40 persons, 30 of them able to support. Those 30 must support. One of them enters an extra amount. If the host shares and that extra already meet the budget, Bengaluru is not asked. If an amount is still short after Vijayawada has supported, that shortfall is allotted to the other locations.

**Scenario 13: Extra amount in the host city**  
The event is in Andhra Pradesh. Every person in the cities of that state must support their share. A person in Vijayawada who can give more enters an extra amount. The amount still needed falls by that extra. Other states are asked only if something remains after the host state has supported.

---

### Notes
- This is a living document. New requirements will be appended and existing ones refined as they are shared.
- Requirements → `docs/requirements/PSSM_Buddha_Sangha_Requirements.md`
- Related User Stories document: `PSSM_Buddha_Sangha_User_Stories.md`
- Project structure is defined in the Technical Specification (Section 8).
