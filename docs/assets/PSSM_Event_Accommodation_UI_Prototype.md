# UI Prototype  
## PSSM Buddha Sangha — Event Accommodation & Shared Screens

**Project:** `pssm-buddha-sangha`  
**Version:** 1.7 (Living Document)  
**Last Updated:** 08 October 2026  
**Related Documents:**  
- PSSM_Event_Accommodation_Requirements.md  
- PSSM_Event_Accommodation_User_Stories.md  
- PSSM_Event_Accommodation_Technical_Spec.md  
- PSSM_Event_Accommodation_API.md  
- PSSM_Event_Accommodation_UIKit_Guide.md  
- `docs/buddha-sangha/assets/PSSM_Buddha_Sangha_UI_Prototype.md`

**UI kit:** [UIkit 3](https://getuikit.com/docs/introduction)

---

### 1. Purpose of this Document

This document holds the paper-and-pen UI sketches and the UIkit components chosen for each screen. Section 5 is how each page should look. Section 6 lists the fields to draw for Visitor, Admin, and Hotel Receptionist.

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
| 1 | `docs/prototype/index.html` | PSSM Buddha Sangha landing | Visitor | cards, grid | Draft |
| 2 | `docs/prototype/join.html` | Join PSSM Buddha Sangha | Visitor | switcher, progress, form, grid, subnav, modal | Draft |
| 3 | `docs/prototype/login.html` | Login to My Space | Visitor | form, grid | Draft |
| 4 | `docs/prototype/visitor.html` | Accommodation wizard | Visitor | switcher, progress, form, grid, subnav, modal, description list | Draft |

---

### 4. Screens

A static look-and-feel page is at `docs/prototype/index.html`. Open that file in a browser. It is not the working app, and it does not live in `src/frontend/`.

The landing is **PSSM Buddha Sangha**: Join, Login to My Space, and Free / Paid Accommodation. The header keeps Patriji and the PSSM logo, with an event picker and Stay / Sangha / Account menus.

Login is `docs/prototype/login.html`. The password is the event code, the first 5 letters of the name, then the date and month of birth. Example: `DMY5`, Ramakrishna, 15 August gives `DMY5Ramak1508`.

Join is `docs/prototype/join.html` (who, place, family). Accommodation is `docs/prototype/visitor.html`, opened from Stay as Free or Paid. When a sangha join exists, visitor and family fields are prefilled from a copy of that profile. UIkit pieces in use: form, switcher, progress, grid, subnav pills, modal, and a description list.

Paper screenshots will be added here when they are shared.

Screens still to expect from the product rules:

- Visitor booking, with a closed state once the event is **2 days** away
- Admin action to **run smart allocation** after booking has closed, then review or override the result before hotels are notified

---

### 5. How each page should look

The UI is **mobile first**, **minimal**, and collected as a **wizard**. The same pages must stay readable on a phone. A wide screen uses the same steps. It does not add a second, denser layout.

- One step on the screen. A phone should not need to scroll through a long form.
- One short title, the fields for that step, and one primary button.
- A single line shows progress, such as “Step 2 of 6”. Do not explain the whole process on the page.
- Labels sit above the fields. Buttons are full width.
- Help text is one short line, or it is omitted.
- Lists (hotels, guests, allocation review) show a few columns. Extra detail opens on the next step, not on the same screen.
- UIkit pieces for this: `uk-container` with a narrow width, `uk-form-stacked`, `uk-width-1-1` controls, `uk-button-primary uk-width-1-1`, and `uk-card-small`.

Visitor booking is the wizard opened from Register for Accommodation. There is no sign-in inside it. The steps are accommodation, who is coming, place, family, days, the couple question when it applies, ID photos, and the summary. Back returns to the previous step. Next stores that step.

Admin and receptionist follow the same rule. Hotel entry, room entry, allocation review, check-in, and check-out are separate steps, not one crowded page.

Paper sketches can be phone-sized. When the screenshots arrive, each image is one wizard step.

### 6. Fields to draw (paper and pen)

Draw **one page per screen** below. Put a star on required fields. Leave a clear primary button at the bottom of each form. Fixed times are always **11:00 AM**. The visitor does not type those times.

A booking request does not assign a room. Booking closes **2 days before the event start**. Admin runs smart allocation after that.

Suggested drawing order: Visitor V0, then V1–V6, then Admin A1–A6, then Receptionist R1–R4.

Each heading below is one phone screen. If a heading lists more than a few fields, draw the extra group on the next screen. Place is its own step. Family members are their own step. Login is its own page, opened from the landing page.

#### Visitor

**Landing**

Two buttons, before any form.

| Action | Opens |
| --- | --- |
| Register for Accommodation | The visitor wizard |
| Login to My space | The login page |

**Login to My space**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Name | Yes | Text | The first 5 letters are used in the password |
| Date | Yes | Number | Day of birth, 1–31, and valid for the month. No year |
| Month | Yes | Number | 1–12 |

The password is the event code + the first 5 letters of the name + date + month. Date and month are two digits. Example: code `DMY5`, name Ramakrishna, 15 August gives `DMY5Ramak1508`.

The visitor fills the wizard while booking is open. After the cutoff, a signed-in visitor can still open their party. A new booking is not accepted. Draw V6 for someone who is not continuing an existing party.

**V1 — Accommodation**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Accommodation choice | Yes | Two choices: Free Accommodation / Paid Accommodation | Both continue through the same steps |

**V2 — Who is coming?**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Full name | Yes | Text | Primary visitor. The first 5 letters are used at login |
| Mobile number | Yes | Phone | |
| Gender | Yes | Male / Female | Needed so a dormitory or hall of the matching gender can be used |
| How long into meditation? | Yes | One row, no wrap: I am very new here, 1 year, 2 years, 3 years, 4 years, 5 years, > 5 years | |
| Date of birth | Yes | Two number boxes: date and month | No year. Digits only. The date must be valid for that month |

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
| Age group | No | Child / Adult / Senior | On the data model. Useful for children and seniors |
| Address | Yes | Two buttons | **Same as my address** is the default. **Different address** opens a popup with the same place fields as the visitor’s place step |

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
- Note: rooms are allotted after booking closes, when Admin runs allocation
- How to sign in again: Login to My space. The password is the event code, the first 5 letters of the name, then date and month

**V6 — Booking closed**

Draw this as the same entry page once the event is 2 days away. No form. Message: booking is closed. Show the event name and the close date.

#### Admin

**A1 — Event**

Needed so the system knows when booking closes.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Event code | Yes | Short text | Example: `DMY5`. Latest code is the start of each family’s first password |
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
| Why | Short text | Example: event location, exact capacity, closest room, same city, gents dormitory, ladies hall, beds left in an all-gents room, Sevadal |
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
- File location: `docs/assets/PSSM_Event_Accommodation_UI_Prototype.md`
- Screenshot folder: `docs/assets/screenshots/`
