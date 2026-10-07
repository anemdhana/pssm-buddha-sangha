# UI Prototype  
## PSSM Spiritual Event – Accommodation Management System

**Version:** 1.0 (Living Document)  
**Last Updated:** 07 October 2026  
**Related Documents:**  
- PSSM_Event_Accommodation_Requirements.md  
- PSSM_Event_Accommodation_User_Stories.md  
- PSSM_Event_Accommodation_Technical_Spec.md  
- PSSM_Event_Accommodation_API.md  

**UI kit:** [UIkit 3](https://getuikit.com/docs/introduction)

---

### 1. Purpose of this Document

This document holds the paper-and-pen UI sketches and the UIkit components chosen for each screen. Section 5 lists the fields to draw for Visitor, Admin, and Hotel Receptionist.

Screenshots go in `docs/assets/screenshots/`. Each sketch is embedded below, then mapped to UIkit markup before any HTML is written in `src/frontend/`.

---

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
| | | | | | Waiting for sketches |

---

### 4. Screens

_No sketches yet. Drop images into `screenshots/` and they will be attached here._

Screens still to expect from the product rules:

- Visitor booking, with a closed state once the event is **2 days** away
- Admin action to **run smart allocation** after booking has closed, then review or override the result before hotels are notified

---

### 5. Fields to draw (paper and pen)

Draw **one page per screen** below. Put a star on required fields. Leave a clear primary button at the bottom of each form. Fixed times are always **11:00 AM**. The visitor does not type those times.

A booking request does not assign a room. Booking closes **2 days before the event start**. Admin runs smart allocation after that.

Suggested drawing order: Visitor V1–V6, then Admin A1–A6, then Receptionist R1–R4.

#### Visitor

The visitor fills these while booking is open. After the cutoff, draw only V6.

**V1 — How will you stay?**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Accommodation choice | Yes | Two choices: Free accommodation / Self booking | Self booking skips room allotment |

If they choose self booking, the rest of the visit can be a short confirmation: “You will arrange your own stay.” No hotel search is defined yet.

**V2 — Who is coming?**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Full name | Yes | Text | Primary visitor |
| Mobile number | Yes | Phone | Validated format |
| Gender | Yes | Gents / Ladies | Needed so a dormitory or hall of the matching gender can be used |
| Coming from | Yes | Rural / Urban | Shows only the fields for that choice |
| Pyramid Sevadal | Yes | Yes / No | Yes means nearby hotels only |
| Room type preference | Yes, for free stay | AC / Non-AC | Default **AC**. Hide this if they chose self booking |

**If Rural** — draw these under Coming from. Each box should show a suggestion list while typing.

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
| Gender | Yes | Gents / Ladies | Same choice as the visitor. A mixed party stays in a regular room |
| Relation | No | Text | Example: spouse, child, parent |
| Age group | No | Child / Adult / Senior | On the data model. Useful for children and seniors |

Button: Add another family member.

**V3 — How long, and any special needs?**

One stay row per person already entered (visitor and each family member).

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Days of stay | Yes | Number, minimum 1 | Can differ per person |
| Any aged / elderly person in the party? | Yes | Yes / No | Yes gets the closest rooms |
| Aged-person details | No | Short text | Shown only if Yes |
| Any sickness / medical condition? | Yes | Yes / No | Yes gets the closest rooms |
| Sickness details | No | Short text | Shown only if Yes |
| Separate gents and ladies rooms? | Yes, only for a husband and wife | Yes / No | Show only when the party is exactly two people, one gent and one lady. Yes means three such couples can fill one ladies room and one gents room in the closest 3-bed rooms, freeing the third. No means this couple stays together in one room even if it has 3 beds |

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

- Party name and mobile
- Number of persons
- Rural or urban place (village and town, or city)
- Sevadal, special needs, room-type preference
- Stay dates at 11:00 AM
- ID card number (one card for the party)
- Status: **Waiting for room allocation**
- Note: rooms are allotted after booking closes, when Admin runs allocation

**V6 — Booking closed**

Draw this as the same entry page once the event is 2 days away. No form. Message: booking is closed. Show the event name and the close date.

#### Admin

**A1 — Event**

Needed so the system knows when booking closes.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Event name | Yes | Text | Example: Dhyana Maha Yagam |
| Start date | Yes | Date | |
| End date | Yes | Date | Example span: 11 days |
| Booking closes on | — | Read-only date | Start date minus 2 days |

**A2 — Add or edit a hotel**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Hotel name | Yes | Text | |
| Address | Yes | Text | |
| Contact | Yes | Phone or text | |
| Distance from event place | Yes | Number + unit | Admin enters this. Shorter distance is allotted first |
| Active | Yes | Yes / No | No hides the hotel from automatic and manual assignment |
| Reserved | Yes | Switch, default off | On means smart allocation skips this hotel. Admin assigns it by hand |

Draw the hotel list as the place Admin sets this. One row per hotel: name, distance, Active, and a **Reserved** switch, plus Edit. A separate settings page is unnecessary. The same switch is on this form so it can be set when the hotel is added. On the allocation review, those hotels appear only in the manual override list, labeled Reserved. The automatic proposal never uses them.

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

Button: Add another room. Show a warning space for “this room number already exists”.

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
| Why | Short text | Example: exact capacity, closest room, same city, gents dormitory, ladies hall, beds left in an all-gents room, Sevadal |
| Override hotel | Dropdown | Optional. Includes reserved hotels, each labeled Reserved |
| Override room | Dropdown | Optional. Rooms of the hotel chosen above, including a reserved hotel |
| Unmatched | A separate list | Parties that did not fit, for Admin to place by hand |

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
| Party | Yes | Pick from today’s guests | |
| Who is leaving | Yes | Whole party, or a tick per person | Person-wise check-out |
| Early check-out | No | Tick | Allowed before the planned date |

Show planned check-out date and **11:00 AM**. Button: Confirm check-out. Admin is notified. Freed beds become available the same morning.

**R4 — Tell them tomorrow is the last day**

A list of parties whose check-out is tomorrow. Each row shows name, room, and **11:00 AM**.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Guest has been informed | Yes | Tick per party | Receptionist marks this after telling them |

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
- File location: `docs/assets/PSSM_Event_Accommodation_UI_Prototype.md`
- Screenshot folder: `docs/assets/screenshots/`
