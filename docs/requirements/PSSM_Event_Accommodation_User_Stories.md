# Agile User Stories  
## PSSM Spiritual Event – Accommodation Management System

**Version:** 2.2 (Living Document)  
**Last Updated:** 07 October 2026  
**Related Documents:**  
- PSSM_Event_Accommodation_Requirements.md  
- PSSM_Event_Accommodation_Technical_Spec.md  
- PSSM_Event_Accommodation_Allocation_Summary.md  
- PSSM_Event_Accommodation_API.md  
- PSSM_Event_Accommodation_API.md  

---

### How to use this document
- Stories are ordered from **Basic → Intermediate → Advanced**
- Each story follows the standard format:  
  **As a** [role]  
  **I want** [goal]  
  **So that** [benefit]
- Acceptance Criteria are written in clear, testable points
- You can pick up one user story at a time for development

---

## 1. Basic Stories (Foundation)

### US-01: Admin – Add Hotel
**As an** Admin  
**I want** to add a new hotel with its basic details and distance from the event place  
**So that** the system knows which hotels are available for allotment

**Acceptance Criteria:**
- Admin can enter Hotel Name, Address, Contact, and Distance from event place
- Distance is mandatory
- Hotel is saved and appears in the list of available hotels
- Admin can edit or deactivate a hotel later
- Admin can mark a hotel **Reserved** from the hotel list or the hotel form (US-25)

---

### US-25: Admin – Reserve Hotels for Manual Assignment
**As an** Admin  
**I want** to mark a few hotels as reserved  
**So that** smart allocation leaves them free and I can assign them by hand

**Acceptance Criteria:**
- The hotel list shows a Reserved switch on each hotel. The hotel form has the same switch
- Reserved defaults to No
- Smart allocation does not use rooms in a reserved hotel
- When Admin overrides an allotment or places an unmatched party, reserved hotels appear in the hotel choice and can be selected
- Turning Reserved off returns that hotel to smart allocation for the next run
- An inactive hotel cannot be assigned automatically or manually

---

### US-02: Admin – Add Rooms to Hotel
**As an** Admin  
**I want** to add rooms under a hotel with room number and capacity  
**So that** room inventory is available for allotment

**Acceptance Criteria:**
- Admin selects a hotel and adds multiple rooms
- Each room has: Room Number, Capacity (persons), Room Type (default = AC), and kind of room (Regular, Dormitory, or Hall)
- If the kind is Dormitory or Hall, Admin must set **Gents allowed only** or **Ladies allowed only**, and a large capacity (usually 10 to 50)
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
**I want** to specify how many days each person in my party wishes to stay  
**So that** rooms are allotted for the correct duration

**Acceptance Criteria:**
- Stay duration can be different for each family member
- System calculates the overall check-in and check-out dates based on the longest stay (or individual stays)
- Minimum stay is 1 day

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
- This rule runs inside the Admin smart allocation flow (US-23), after booking has closed
- If special needs are declared, system prefers hotels with shorter distance from event place
- System tries to allot a room with sufficient capacity
- Default room type is AC
- Admin can manually override allotment if required

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
- Real-time updates when Admin makes changes

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
- Admin is notified of every check-out action

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

### US-14: Admin – Receive Real-time Notifications
**As an** Admin  
**I want** to receive real-time notifications of all actions done by Hotel Receptionists  
**So that** I have full visibility

**Acceptance Criteria:**
- Notifications for: Check-in, Check-out (full/person-wise/early), any updates
- Notifications appear in real-time (via Socket.io + WhatsApp)
- Admin can view history of all actions

---

### US-15: Admin – Send Live Updates to Hotel
**As an** Admin  
**I want** to perform actions (room change, cancellation, special instructions) and notify the concerned hotel instantly  
**So that** the receptionist is always up to date

**Acceptance Criteria:**
- Admin actions that affect a specific hotel trigger live notification to that hotel’s receptionist
- Notification contains clear details of the change
- Uses Socket.io (in-app) + WhatsApp

---

### US-16: Visitor – Self Booking of Accommodation (Optional)
**As a** Visitor  
**I want** the option to book accommodation on my own instead of using free allotment  
**So that** I have flexibility

**Acceptance Criteria:**
- Visitor can choose “Self Booking” during registration
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

### US-18: System / Admin – Shared Room Allotment
**As the** System / Admin  
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
- System should suggest possible sharing combinations or allow Admin to manually combine families
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
  - **First choice** → Allot in a Dormitory or Hall that allows that person’s gender
  - **Last choice** → Allot in a regular private or shared room
- A gent is allotted only in a gents-only Dormitory or Hall. A lady is allotted only in a ladies-only Dormitory or Hall
- A dormitory or hall is usually 10 to 50 beds. The person takes one bed. Remaining beds stay open for more people of that same gender until it is full
- System should clearly distinguish room types (Regular Room vs Dormitory/Hall) and the gender allowed in each Dormitory or Hall
- Admin can override if required

---

### US-21: System – Pyramid Sevadal (Volunteer) Nearby Allotment
**As the** System  
**I want** to allot Pyramid Sevadal (volunteers) only in nearby hotels  
**So that** they can quickly reach the event venue when needed

**Acceptance Criteria:**
- During registration, capture whether the visitor is a **Pyramid Sevadal**
- If Yes → restrict allotment to nearby hotels only (walkable or very short auto distance)
- Give highest priority to the closest available suitable rooms
- Admin can override if required

---

### US-22: System – Close Booking 2 Days Before the Event
**As the** System  
**I want** accommodation booking to close 2 days before the event starts  
**So that** Admin has a fixed list of parties before rooms are allotted

**Acceptance Criteria:**
- Booking stays open until the event start date minus 2 days
- After the cutoff, a visitor cannot create a new accommodation booking or change an existing one
- Both free-accommodation requests and self-booking are closed
- The closed state is visible to visitors and to Admin

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
- No means the couple is given one room together, even when that room’s capacity is 3

---

### US-23: Admin – Run Smart Room Allocation
**As an** Admin  
**I want** to start a smart allocation flow after booking has closed  
**So that** waiting parties receive rooms according to the agreed rules

**Acceptance Criteria:**
- Admin can start the flow only after the booking window has closed (US-22)
- The flow allots rooms for parties that requested free accommodation and do not yet have a room
- Self-booked parties are skipped
- Hotels marked Reserved are skipped (US-25). Admin can still place a party into a reserved hotel by choosing it in the review override
- The flow applies, together:
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
  - Each person’s own stay length and check-out date
- Admin can review the proposed allotment and override any party
- After confirmation, the concerned hotel receptionist is notified
- Parties that cannot be fitted are listed for Admin to resolve manually

---

## Suggested Implementation Order

| Priority | User Stories                          | Focus Area                  |
|----------|---------------------------------------|-----------------------------|
| P1       | US-01, US-02, US-03, US-04, US-25     | Foundation & Master Data    |
| P2       | US-05, US-06, US-08, US-09, US-22, US-24 | Registration & booking window |
| P2b      | US-23, US-07, US-18, US-20, US-21     | Admin smart allocation |
| P3       | US-10, US-11, US-12, US-13, US-19     | Hotel Receptionist Operations |
| P4       | US-14, US-15, US-17                   | Real-time & Admin Control |
| P5       | US-16                                 | Optional Self-Booking       |

---

### Notes
- This is a living document. New stories will be added when more scenarios come up.
- Current file location: `/home/workdir/artifacts/PSSM_Event_Accommodation_User_Stories.md`
- Future location (when project starts): `docs/requirements/PSSM_Event_Accommodation_User_Stories.md` or `docs/agile/`
