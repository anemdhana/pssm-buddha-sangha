# UI Prototype  
## PSSM Buddha Sangha

**Project:** `pssm-buddha-sangha`  
**Version:** 1.9 (Living Document)  
**Last Updated:** 08 October 2026  
**Related Documents:**  
- PSSM_Buddha_Sangha_Requirements.md  
- PSSM_Buddha_Sangha_User_Stories.md  
- PSSM_Buddha_Sangha_Technical_Spec.md  
- Shared static pages: `docs/prototype/` (landing, join, login, accommodation)

**UI kit:** [UIkit 3](https://getuikit.com/docs/introduction)

---

### 1. Purpose of this Document

This document holds the paper-and-pen UI sketches and the UIkit components chosen for each screen. Section 5 lists the fields to draw.

Screenshots go in `docs/assets/screenshots/`. Each sketch is embedded below, then mapped to UIkit markup before any HTML is written in `src/frontend/`.

---

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
| | | | | | Waiting for sketches |

---

### 4. Screens

_No sketches yet. Drop images into `screenshots/` and they will be attached here._

Screens to expect:

- This week’s five events, drawn first: one circle, then five boxes top to bottom by remaining contributions
- Sign-in for Admin and for a person in the sangha
- Place list (Admin)
- Sangha dashboard, grouped by location and by pyramid center
- Add or edit a person, with place chosen from autocomplete
- Person detail (Admin)
- Support, or ask another person to contribute
- Admin chooses the five events for the week

---

### 5. Fields to draw (paper and pen)

Draw **one page per screen** below. Put a star on required fields. Leave a clear primary button at the bottom of each form.

The form has only these fields: full name, mobile, place, pyramid center or group, and since. Since has no star. Place is a selection, not a typed town.

Suggested drawing order: **A6 first**, then A7, A8, then A1, A5, A2, A3, A4.

**A6 — PSSM sangha and this week’s five events**

Draw this page first. A circle on the left holds the person’s photo. To the right, five boxes in one column, top to bottom.

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

Inside each event box, under that number, list **each place**. A place’s remaining is how many people from that city or town are not yet shown as supported for this event. Order those places **top to bottom, highest remaining first, lowest last**. A place where everyone has contributed shows remaining 0 and sits at the bottom of that list.

Stack the five boxes from **highest remaining at the top** to **lowest remaining at the bottom**. When two events have the same remaining number, keep the order Admin entered them. After each new contribution, the numbers change and a box can move down the column.

The circle shows the person’s photo, cropped round, with their name under it. A small label by the circle still says **PSSM sangha**. On first open, the photo is the signed-in person. Touching a name in any box puts that person’s photo in the circle. Under the photo, write: **An equal share of each event’s budget. Everyone is part of the global cause.**

Under the photo, still inside the middle of the page, draw two blocks for **this person, this week**.

**Contribution this week.** One line for each of the five events:

| Line | Draw as | What to write |
| --- | --- | --- |
| Event name | The box’s name | One of this week’s five |
| What they did | Supported / Not yet | Supported means this person counts as supported. If they asked someone else, still write Supported, and write who contributed |
| Who contributed | Name, only when someone else gave | The person they asked. Blank when they contributed themselves |
| Amount | The equal share, or blank | That event’s budget divided by 1,44,000. Blank only on Not yet |

**Feedback / comments.** Under the five lines, draw the person’s own words for this week. If they have not written any, leave the box empty. The words are theirs.

Write the week at the top of the page, for example “This week”, next to **1,44,000 meditators**. Each box is one event to support this week. There are five, and only five. Next week the five names change, the remaining numbers start again from 1,44,000, and the contribution lines and comments are for the new week.

The large line on a whole-sangha box is **Remaining** people. A small-budget box is different: it names one place and shows a **remaining amount**. That amount starts at what Admin requested from that place and falls to **zero**.

| Block | Draw as | What to write |
| --- | --- | --- |
| Remaining | The large number | 1,44,000 minus how many are shown as supported for this event. Highest remaining box is on top |
| Budget | The event’s budget | Set by Admin for this event. Each event has its own budget |
| Equal share | The allotted share | What one able person contributes. Whole sangha: event budget ÷ 1,44,000. One location: that location’s amount ÷ able persons there |
| Location amount | Allotted amount, then remaining | Smart allotment sets it from persons and how many are able. On a small-budget event the remaining falls as people there voluntarily support, and stops at zero |
| By location | Place name and a remaining number, one row each | People from that city or town who are not yet supported for this event. Highest remaining place first |
| Supported | Name, the equal share, and who contributed | The person is shown as supported. If they contributed themselves, no extra name. If they asked someone else, write that person’s name next to them |

Also write how much is supported: the equal shares added up, including a share given by a person who was asked. When everyone has contributed, that total is the event budget.

A person in the sangha and Admin both see this page.

Buttons, under the graph:

- Support
- Ask someone to contribute

Support opens A7 for the signed-in person. Ask someone to contribute opens A7 so they can choose who to ask. Pointing at a box opens A7 for that event.

**UIkit.** The photo is an image with `uk-border-circle`. The five events are a vertical `uk-grid` of one column, each event a `uk-card`. Remaining is `uk-heading-small` on the card. The location rows are a `uk-list` inside the card, ordered from highest remaining to lowest. The cards are ordered in the markup from highest remaining to lowest. The five contribution lines under the photo are a `uk-list`. Feedback / comments is a `uk-card` under that list. How much is supported is a `uk-label`. The name of the person who contributed, when it is someone else, is `uk-text-meta` beside the supported name. The two actions are `uk-button uk-button-primary` and `uk-button uk-button-default`.

**A7 — Support an equal share**

One event, already chosen from a box on A6. The share is shown and is not typed. An able person in the host city or state may type an extra amount.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Event | Yes | Read-only | The box they touched |
| Who | Yes | Read-only | The signed-in person |
| Ask whom | Only when asking | Choice of one person in the sangha | Shown when they cannot contribute and ask someone else |
| Amount | Yes | Read-only | The share smart allotment gave this person. Host city or state only |
| Extra amount | No | Amount they type | Shown to an able person in the host city or state. Added on top of the share. Can be large. It reduces what is still needed |
| Feedback / comments | No | A few lines of text | The person’s own words for this week. Shown under their photo on A6 |

Two buttons. **Support** on a host city or state contributes that person’s share. **Extra amount** is saved with it when they entered one. **Ask someone to contribute** is how a person who is unable in the host city or state still meets the rule that they must support. Other locations see Support only after the host people have supported and an amount is still needed.

**A8 — This week’s five events**

Admin only. This is how the five boxes change every week.

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Week | Yes | The week label | Shown above the circle on A6 |
| Event 1 to Event 5 | Yes | Five rows | Exactly five. Each row is one box |
| Happening in | Yes | Cities, or one state | People in these cities, or in all cities of this state, must support first |
| Kind | Yes | Whole sangha / One location | Whole sangha follows host-first allotment. One location asks only that place |
| Budget | Yes, for whole sangha | Amount | Divided equally across 1,44,000 |
| Place | Yes, for one location | Autocomplete | The city or town asked to cover the amount |
| Amount for that place | Yes, for one location | Amount | Starts as the remaining amount on the box. Voluntary support from people in that place reduces it to zero |

Button: Save this week. Then draw **Allot amounts**. It opens A9.

**A9 — Smart allotment**

Admin only. One event, already saved. Draw two groups.

**First — where the event happens.** These rows are marked “Must support”. People here support before anyone else.

**Then — other locations.** Draw these rows only for the amount still needed after the host shares and any extra amounts. If nothing is still needed, write “Other locations are not asked” and draw no amount on them.

| Column | What to write |
| --- | --- |
| Place | City or town, and its state |
| Host | Yes if the event happens in this city or this state. Otherwise no |
| Persons | How many people in the sangha have this place |
| Able to support | How many of them are able. The rest are unable |
| Allotted amount | Host: event budget × (able persons here ÷ 1,44,000). Other locations: the same formula using only the amount still needed, and only after the host group has supported |
| Share | Allotted amount ÷ able persons in this place |
| Override | An optional amount Admin can write in place of the allotted amount |

A location with no one able shows allotted amount 0 and no share. Button: Use these amounts. The boxes then show each location’s amount. Admin may still override before that button.

#### Admin and sangha member

**A1 — Sign in**

| Field | Required | Draw as | Notes |
| --- | --- | --- | --- |
| Name | Yes | Text | Admin, or a person already on the register |
| Password | Yes | Password | |

Button: Sign in. After success, draw a path to this week’s graph (A6). From A6, a text link opens the people dashboard (A2).

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

**By location.** One block per city or town. The heading is the place name and the count of masters, for example “Vijayawada — 2 masters”. Under it, list the people from that place.

**By pyramid center.** One block per center. The heading is the center name and the count, for example “Indiranagar Pyramid Group — 1 master”. Under it, list the people who sit with that center.

Columns inside a group:

- Full name
- Place
- Pyramid center or group
- Since

Since is blank when the year is unknown. A sangha member does not see mobile numbers.

Admin also has a search box above the groups. It matches name, mobile, place, center, or since. Draw a control to clear the search. Groups stay in place and show only the matching people.

Button, Admin only: Add a person. Each row opens that person’s detail (A4) for Admin.

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
- File location: `docs/assets/PSSM_Buddha_Sangha_UI_Prototype.md`
- Screenshot folder: `docs/assets/screenshots/`
