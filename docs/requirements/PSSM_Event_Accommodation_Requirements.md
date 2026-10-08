# Requirements Specification  
## PSSM Spiritual Event – Accommodation Management System

**Version:** 2.10 (Living Document)  
**Last Updated:** 07 October 2026  
**Related Documents:**  
- PSSM_Event_Accommodation_Technical_Spec.md  
- PSSM_Event_Accommodation_User_Stories.md  
- PSSM_Event_Accommodation_Allocation_Summary.md  
- PSSM_Event_Accommodation_API.md  

---

### 1. Introduction / Background

**1.1 Purpose**  
This Requirements Specification defines the functional and non-functional requirements for a system that supports the planning, promotion, registration, and management of large-scale spiritual events organized under the Pyramid Spiritual Societies Movement (PSSM).

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
- The system should suggest or allow Admin to combine compatible families into the same room.

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
- That dormitory or hall must allow the visitor’s gender (FR-24). If none is free, use a regular room.

**FR-21: Pyramid Sevadal (Volunteer) Allotment Priority**  
If the visitor(s) are **Pyramid Sevadal** (volunteers for the event):

- They shall be allotted rooms in **nearby hotels only** (walkable distance or very short auto distance).  
- Priority for the closest available suitable rooms.  
- This ensures Pyramid Sevadal can quickly reach the event venue when required.

**FR-24: Dormitory and Hall — Gents Only or Ladies Only**  
A Dormitory or Hall is never mixed. Capacity is usually large, about **10 to 50** people.

- When Admin adds a Dormitory or Hall, they shall mark it **Gents allowed only** or **Ladies allowed only**, and set its capacity.  
- A smaller party takes only the beds it needs. The remaining beds stay open.  
- Smart allocation keeps filling those remaining beds with more people of the **same gender** until the dormitory or hall is full.  
- A gents-only dormitory or hall waits for more gents. A ladies-only dormitory or hall waits for more ladies.  
- A regular room is not marked gents-only or ladies-only in advance. A mixed party may stay in a regular room.  
- Once any room is partly filled by only one gender, further sharing follows FR-18: remaining beds go only to a party that is entirely that gender.  
- Smart allocation shall place a person in a Dormitory or Hall only when their gender is allowed in that room.  
- Every person sharing that Dormitory or Hall must be the allowed gender.  
- A party that includes both gents and ladies shall not be placed in a Dormitory or Hall.  
- A single gent goes first to a gents-only Dormitory or Hall. A single lady goes first to a ladies-only Dormitory or Hall.  
- The whole dormitory or hall is given to one party only when that party’s size equals its full capacity (FR-25).

**FR-22: Booking Closes 2 Days Before the Event**  
Accommodation booking shall close **2 days before the event start date**.

- Visitors may register and request accommodation only while the booking window is open.  
- After the cutoff, the system shall reject new accommodation bookings and changes to an existing booking.  
- The cutoff is calculated from the event start date (event start minus 2 days).  
- This applies to both free-accommodation requests and self-booking.

**FR-23: Admin Smart Room Allocation**  
Rooms are **not** allotted at the time a visitor submits a booking.

- After booking has closed, the **Admin** starts a smart allocation flow.  
- The flow allots rooms for every party that requested **free** accommodation and is still waiting.  
- Self-booked parties are excluded.  
- Hotels marked **Reserved** (FR-28) are excluded. Their rooms are not used by this automatic flow.  
- Parties from the **event location** are allotted first (FR-30). Other parties are allotted only into beds still free after that.  
- The flow applies the allotment rules already defined: special-needs priority (FR-06), Pyramid Sevadal nearby-only priority (FR-21), room capacity, AC as the default room type, an exact capacity match for the whole family first (FR-25), then single-person dormitory/hall only in a room that allows their gender (FR-20, FR-24), a consented husband-and-wife exchange in the three closest capacity-3 rooms (FR-26), and shared rooms with same-location families first (FR-18). A partly filled room that is already all gents takes only an all-gents party. A partly filled room that is already all ladies takes only an all-ladies party.  
- Stay length already captured for each person is respected, including different check-out dates inside one room.  
- A party that still has no room after this run is **not** forced into a bed. Admin assigns that party by hand.  
- Admin can review the result and override an allotment, including placing a party into a reserved hotel by hand.  
- When allocation for a party is confirmed, the hotel receptionist is notified as in FR-08.

**FR-30: Event Location Has First Priority**  
Smart allocation fills rooms for people from the event’s own place before people from anywhere else.

- Admin records the event location: the city or town, the state, and the country where the event is held.  
- A party matches that location when an urban visitor’s **city**, or a rural visitor’s **town**, is the same as the event’s city or town.  
- The automatic run allots matching parties first, using the other allotment rules.  
- It then allots the remaining parties into beds that are still free, using the same rules.  
- Any party that still cannot be placed is left for the **manual** process. Admin assigns them from the unmatched list.

**FR-28: Reserved Hotels for Manual Assignment**  
Admin may keep a few hotels out of automatic allocation and assign them only by hand.

- On the hotel list, each hotel has a **Reserved** switch. The same switch is on the hotel form.  
- Reserved defaults to **No**.  
- Smart allocation does not place anyone in a reserved hotel.  
- Admin assigns those rooms manually from the allocation review or from a later room change, by choosing the reserved hotel and a room.  
- A hotel that is not active is unavailable for both automatic and manual assignment. Reserved applies only to an active hotel.

**2.2 Visitor Registration & Family Details**

**FR-03: Capture Visitor and Family Member Information**  
When a visitor registers or requests accommodation, the system shall collect the following mandatory information:

- Full Name of the primary visitor  
- Mobile number  
- Place of origin, as rural or urban (FR-27)  
- Gender of the primary visitor — **Gents** or **Ladies**  
- Details of all accompanying family members (including children), including each member’s gender  
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

**FR-29: Family-Group Sign-In**  
Each visitor party signs in as one family group, using the main person’s contact.

- The sign-in name is the main person’s contact number.  
- The first password is temporary: the **latest event code** followed immediately by the **last 5 digits** of that contact.  
- Example: event code `DMY5` and contact `9848012345` give the password `DMY512345`.  
- Admin sets the event code on the event. The latest event’s code is the one used.  
- After sign-in, the visitor may change the password whenever they wish. Once changed, the temporary password no longer works.  
- The same sign-in opens the whole party, not a separate login for each family member.

**FR-04: Stay Duration for Each Person**  
The system shall capture the **number of days** each individual (primary visitor + every family member) wishes to stay.

- Stay duration can be different for different family members.

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
The system shall capture a **live photograph** of the person providing identification using the device’s **web camera**.

**FR-16: ID Proof Capture via Camera**  
The system shall also capture the **ID proof document** (Aadhaar, PAN, Voter ID, Passport, Driving Licence, etc.) by taking a photo through the web camera.

- Both the live photo and the ID proof image shall be stored and linked to the party’s record and the assigned ID card.

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
- **Early check-out is allowed**: A party (or individual member) may check out freely before their originally scheduled check-out date if they wish. The hotel receptionist performs the early check-out, and the Admin is automatically notified of the action.

**2.5 Admin Notifications & Bi-directional Communication**

**FR-12: Real-time Notification to Admin**  
The system shall automatically notify the **Admin** of every action performed by the hotel receptionist, including (but not limited to):

- Check-in validation  
- Check-out (full or person-wise)  
- Any updates related to the guest group  

This ensures complete visibility and audit trail for the event organizers.

**FR-13: Live Notification from Admin to Hotel Receptionist**  
Certain actions performed by the **Admin** shall be notified in real-time (live) to the concerned **hotel receptionist** of the particular hotel.

- The notification must be specific to the hotel affected by the Admin’s action.  
- Examples of such actions may include (but are not limited to): room re-allocation, cancellation, change in guest details, special instructions, or any update that impacts the hotel’s operations or guest list.  
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

The booking is stored as a request. A room is not allotted until Admin runs smart allocation after the booking window closes (FR-22, FR-23). The visitor may instead choose self-booking while the window is still open.

**Scenario 3: Priority Allotment + Hotel Notification**  
After booking has closed, Admin runs smart allocation. When a group has aged persons or reported sickness, that flow prioritizes the nearest available hotel/room, sets the check-in reporting time as 11:00 AM on the check-in date, and notifies the hotel receptionist with the full guest and special-needs information.

**Scenario 4: Check-in Identity Validation**  
On the check-in date, the visitor and family members present themselves at the hotel. The receptionist verifies their identity against the system records by checking the **assigned ID card**. Only after successful validation are they allowed to enter the allotted room.

**Scenario 5: Check-out Reminder & Person-wise / Early Check-out**  
One day before the scheduled departure, the hotel receptionist informs the guest that the next day is the last day of stay and communicates the check-out time of **11:00 AM**.  
On the check-out day (or earlier), the receptionist can perform check-out by 11:00 AM — either for the full group, any individual family member, or as an **early check-out** before the scheduled date if the party wishes. The freed room becomes immediately available so that another party can check in at 11:00 AM. All such actions are notified in real time to the Admin.

**Scenario 6: Admin Action Notified to Hotel**  
When the Admin performs certain actions (e.g., room change, cancellation, special instruction, or guest detail update) that affect a specific hotel, the system immediately sends a live notification to the receptionist of that particular hotel with the relevant details.

**Scenario 7: Single ID Capture per Party**  
During registration or ID card generation, only one person from the party (visitor or any family member) needs to provide identification. The system captures:
- A live photo of the person via web camera
- A photo of their ID proof document via web camera  

These are linked to the entire party’s record and the single assigned ID card.

**Scenario 8: Booking Closes, then Admin Runs Smart Allocation**  
Visitors submit accommodation requests until **2 days before the event**. After that cutoff, booking is closed. Admin then starts the smart allocation flow. The system allots rooms for waiting free-accommodation parties using special-needs priority, Pyramid Sevadal nearby-only priority, capacity, and default AC. If a family’s size exactly equals an empty room, dormitory, or hall, that whole unit is assigned to them. Otherwise a single person of matching gender goes to a dormitory or hall first, and other parties may share a room, with same-location families first. If a room is already partly occupied by only gents, the remaining beds go to an all-gents party. If it is already only ladies, the remaining beds go to an all-ladies party. A gents-only dormitory or hall receives gents only. A ladies-only dormitory or hall receives ladies only. Mixed parties stay in regular rooms. A husband and wife who agree may be separated with two other agreeing couples into one ladies room and one gents room, using the three closest capacity-3 rooms, so one room is freed. A couple who does not agree stays together in a capacity-3 room. Admin reviews the result, overrides where needed, and the affected hotel receptionists are notified.

---

### Notes
- This is a living document. New requirements will be appended and existing ones refined as they are shared.
- Current file location: `/home/workdir/artifacts/PSSM_Event_Accommodation_Requirements.md`
- When the real project starts, this document will be moved to: `docs/requirements/PSSM_Event_Accommodation_Requirements.md`
- Related User Stories document: `PSSM_Event_Accommodation_User_Stories.md`
- Project structure is defined in the Technical Specification (Section 9).
