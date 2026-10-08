# Allocation Summary  
## PSSM Spiritual Event – Accommodation Management System

**Version:** 1.4 (Living Document)  
**Last Updated:** 07 October 2026  
**Related Documents:**  
- PSSM_Event_Accommodation_Requirements.md  
- PSSM_Event_Accommodation_User_Stories.md  
- PSSM_Event_Accommodation_Technical_Spec.md  

This is a reading guide for how smart allocation works so far. The rules themselves live in the requirements (FR-18, FR-20, FR-21, FR-23, FR-24, FR-25, FR-26, FR-30) and in Technical Specification section 7.

---

### When allocation runs

Allocation runs only after booking closes, **2 days before the event**. Admin starts it. It covers free-accommodation parties only. Self-booked parties are left out. Hotels marked **Reserved** are left out of this automatic run. Admin can still assign those hotels by hand, and can override any other result.

Parties from the **event location** are placed first. An urban visitor matches the event city or town on **city**. A rural visitor matches it on **town**. Everyone else is placed only into beds that are still free. A party that still has no room is left for Admin to assign by hand.

For each of those groups, in this order:

1. Use the details already captured: size, gender of each person, aged or sickness, AC or Non-AC, Pyramid Sevadal, and, for a couple, whether they agreed to separate.
2. Aged or sickness moves them toward the **closest** rooms. Pyramid Sevadal stays in **nearby hotels** only.
3. If an **empty** room has capacity **exactly** equal to the party, give them that whole unit. A dormitory or hall is usually **10 to 50** beds and is gents-only or ladies-only. A smaller same-gender party takes only the beds it needs there. The remaining beds stay open and keep being filled with that same gender until the dormitory or hall is full. The whole dormitory or hall goes to one party only when the party is as large as its capacity.
4. Otherwise look for a unit with enough beds. AC is preferred.
5. A **couple** facing a 3-bed room is handled next, if they agreed.
6. A **single person** with no exact bed goes to a matching dormitory or hall first.
7. Otherwise **share**: same place first (rural: same town; urban: same city), and a partly filled all-gents room takes only an all-gents party. An all-ladies room takes only an all-ladies party.

Check-in and check-out stay at **11:00 AM**. Each person keeps their own check-out date. After the local parties and then the others have been tried, anyone still without a room is listed for Admin to place by hand. That manual step is the only way those remaining parties get a room.

---

### 1. Two gents

They stay together. They are never split, and they never enter a ladies dormitory or hall.

- An empty **capacity-2** regular room is theirs alone.
- A **gents-only** dormitory or hall (usually 10 to 50 beds) can take them as 2 beds. The remaining beds stay open for more gents until it is full. A ladies dormitory or hall is not used.
- They may also share a regular room with another **all-gents** party, preferably from the same town (rural) or the same city (urban). If a room already has only gents and at least 2 beds free, they can fill those beds.
- Example: two gents from Vijayawada, and a capacity-4 room already holding two gents from Vijayawada. They join that room. Two gents from another city or town join it only if no same-place party fits.

---

### 2. Two ladies

The same path, on the ladies side.

- Exact capacity 2: a regular room for them alone.
- A **ladies-only** dormitory or hall (usually 10 to 50 beds) can take them as 2 beds. The remaining beds stay open for more ladies until it is full.
- They share a regular room only with an **all-ladies** party, same place first, including beds left in a room that is already all ladies.

---

### 3. Couple (one gent and one lady, husband and wife)

They are a mixed party, so a dormitory or hall is not used while they stay together.

- An empty **capacity-2** regular room goes to them as a couple. The separate-room question is not used, because a fitting room exists.
- If the only spare room is **capacity 3**, the answer they gave at booking decides:
  - **Yes**, and two other couples also said yes: the three closest 3-bed rooms are used. Three ladies in one, three gents in one, the third room left free. Six agreeing couples free two rooms, and so on.
  - **No**: they stay together in one 3-bed room. One bed stays empty.
  - Fewer than three couples said yes: nobody is separated. Each couple keeps their own 3-bed room.
- They are not added into a room that is already all gents or all ladies, unless this agreed exchange places the lady in the ladies room and the gent in the gents room.

---

### 4. Other cases

**One gent.** He goes first into a gents-only dormitory or hall and takes one bed. The remaining beds, usually 9 to 49, stay open for more gents until it is full. A regular room is the last choice. A ladies dormitory or hall is never used.

**One lady.** The same, in a ladies-only dormitory or hall. Remaining beds stay open for more ladies.

**A larger all-gents or all-ladies family.** Four gents get an empty capacity-4 regular room as a whole. They may instead take 4 beds in a gents-only dormitory or hall and leave the rest open for more gents. They receive the whole dormitory or hall only when their number equals its capacity, about 10 to 50. They are not split into the couple exchange. Four ladies follow the ladies side.

**A mixed family larger than a couple.** Parents and a child, for example, stay together in a **regular** room. An exact capacity match on a regular room is used first. They do not go into a dormitory or hall, and they are not split. They are not added to a room that is already all gents or all ladies.

**Aged or sickness.** The same gender and capacity rules, but the closest suitable rooms are chosen first.

**Pyramid Sevadal.** The same rules, limited to nearby hotels, closest suitable rooms first.

**Different stay lengths.** People can still share a room. Each person keeps their own check-out date.

**No fit.** That party is listed for Admin to place by hand.

---

### Notes
- This is a living document. When an allocation rule changes, update this summary with the requirements and the technical spec.
- File location: `docs/technical/PSSM_Event_Accommodation_Allocation_Summary.md`
