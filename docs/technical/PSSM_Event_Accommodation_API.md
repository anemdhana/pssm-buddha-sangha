# REST API  
## PSSM Spiritual Event – Accommodation Management System

**Version:** 1.2 (Living Document)  
**Last Updated:** 07 October 2026  
**Related Documents:**  
- PSSM_Event_Accommodation_Requirements.md  
- PSSM_Event_Accommodation_User_Stories.md  
- PSSM_Event_Accommodation_Technical_Spec.md  
- PSSM_Event_Accommodation_Allocation_Summary.md  
- PSSM_Event_Accommodation_UI_Prototype.md  

Base URL: `/api/v1`  
Format: JSON, except photo uploads, which are `multipart/form-data`.  
Auth: `Authorization: Bearer <token>`  
Live pushes (check-in, check-out, admin changes) stay on Socket.io. These endpoints are what the UI calls. WhatsApp is sent by the server after a confirmed action. The UI does not call WhatsApp directly.

---

### 1. Conventions

| Item | Rule |
| --- | --- |
| Times | Check-in and check-out are always `11:00`. The UI does not send a time. |
| Dates | `YYYY-MM-DD` |
| Ids | Strings |
| Lists | `?page=1&pageSize=20`. Response includes `page`, `pageSize`, `total` |
| Success | `{ "data": ... }` |
| List success | `{ "data": [ ... ], "page": 1, "pageSize": 20, "total": 0 }` |
| Error | `{ "error": { "code": "BOOKING_CLOSED", "message": "Booking is closed." } }` |

| HTTP | When |
| --- | --- |
| 400 | Missing or invalid field |
| 401 | Missing or expired token |
| 403 | Role not allowed, or receptionist asking for another hotel |
| 404 | Unknown id |
| 409 | Conflict: duplicate room number, booking closed, allocation before close, reserved hotel used by the automatic run |

Roles: `admin`, `receptionist`, `visitor`.

Admin and receptionist sign in with a username. A visitor family group signs in with the main contact and a password. The first password is temporary. Creating a booking also returns a visitor token so the form can continue in that visit.

---

### 2. Shared shapes

**Hotel**

```json
{
  "id": "htl_1",
  "name": "Sai Prakash",
  "address": "Near the venue",
  "contact": "9848012345",
  "distanceFromEvent": { "value": 0.4, "unit": "km" },
  "active": true,
  "reserved": false
}
```

**Room**

```json
{
  "id": "rm_231",
  "hotelId": "htl_1",
  "roomNumber": "231",
  "capacity": 4,
  "kind": "regular",
  "genderAllowed": null,
  "roomType": "ac",
  "status": "available",
  "occupied": 0
}
```

`kind`: `regular`, `dormitory`, `hall`.  
`genderAllowed`: `gents` or `ladies` for a dormitory or hall, otherwise `null`.  
`roomType`: `ac` or `non_ac`.  
Dormitory and hall `capacity` is usually 10 to 50.

**Party (summary)**

```json
{
  "id": "pty_1",
  "visitorName": "Rama Rao",
  "mobile": "9848098765",
  "gender": "gents",
  "accommodation": "free",
  "area": "urban",
  "place": { "city": "Vijayawada", "state": "Andhra Pradesh", "country": "India" },
  "pyramidSevadal": false,
  "roomTypePreference": "ac",
  "personCount": 2,
  "specialNeeds": { "aged": false, "sickness": false },
  "status": "waiting",
  "idCardNumber": "PSSM-1042",
  "allotment": null
}
```

`accommodation`: `free` or `self`.  
`status`: `waiting`, `allotted`, `self_booked`, `cancelled`.  
Rural `place`: `{ "village", "town", "district", "state", "country" }`.

---

### 3. Auth

#### `POST /auth/login`  
Admin, receptionist, or a visitor family group.

Staff request

```json
{ "username": "reception.saiprakash", "password": "secret" }
```

Visitor request. One login for the whole party. `contact` is the main person’s number.

```json
{ "contact": "9848012345", "password": "DMY512345" }
```

The temporary password is the latest event `code` plus the last 5 digits of `contact`, with no separator. For event code `DMY5` and contact `9848012345`, the password is `DMY512345`. After the visitor changes it, only the new password is accepted.

Staff response `200`

```json
{
  "data": {
    "token": "jwt",
    "role": "receptionist",
    "hotelId": "htl_1",
    "name": "Sai Prakash desk"
  }
}
```

Visitor response `200`

```json
{
  "data": {
    "token": "jwt",
    "role": "visitor",
    "partyId": "pty_2",
    "name": "Lakshmi",
    "passwordTemporary": true
  }
}
```

Admin response omits `hotelId`. `401` when the contact or password does not match. `400` when the contact has fewer than 5 digits.

#### `POST /auth/password`  
Visitor, while signed in. Replaces the temporary password.

Request

```json
{
  "currentPassword": "DMY512345",
  "newPassword": "a password they choose"
}
```

Response `200`

```json
{ "data": { "passwordTemporary": false } }
```

`401` when `currentPassword` is wrong.

#### `POST /auth/logout`  
Any logged-in role. Request body empty. Response `204`.

#### `GET /auth/me`  
Any logged-in role.

Response `200`

```json
{
  "data": { "role": "admin", "name": "Event office", "hotelId": null }
}
```

---

### 4. Event and booking window

#### `GET /events/current`  
Visitor, admin, receptionist.

Response `200`

```json
{
  "data": {
    "id": "evt_1",
    "code": "DMY5",
    "name": "Dhyana Maha Yagam",
    "location": { "place": "Vijayawada", "state": "Andhra Pradesh", "country": "India" },
    "startDate": "2026-12-01",
    "endDate": "2026-12-11",
    "bookingClosesOn": "2026-11-29",
    "bookingOpen": true
  }
}
```

`bookingClosesOn` is the start date minus 2 days. The visitor screen uses `bookingOpen` to show the closed page.

#### `PUT /events/current`  
Admin. Creates the event when none exists, otherwise replaces it.

Request

```json
{
  "code": "DMY5",
  "name": "Dhyana Maha Yagam",
  "location": { "place": "Vijayawada", "state": "Andhra Pradesh", "country": "India" },
  "startDate": "2026-12-01",
  "endDate": "2026-12-11"
}
```

Response `200` is the same event object. `400` when `endDate` is before `startDate`.

#### `GET /events/current/booking-window`  
Visitor, admin. Lightweight check for the closed page.

Response `200`

```json
{
  "data": {
    "bookingOpen": false,
    "eventName": "Dhyana Maha Yagam",
    "bookingClosesOn": "2026-11-29"
  }
}
```

---

### 5. Place autocomplete

#### `GET /places/suggestions`  
Visitor. No auth required, so the form can suggest before the party exists.

Query

| Name | Required | Values |
| --- | --- | --- |
| area | Yes | `rural` or `urban` |
| q | Yes | Text typed so far, at least 2 characters |
| field | Yes | Rural: `village`. Urban: `city` |

Rural response `200`

```json
{
  "data": [
    {
      "village": "Pamarru",
      "town": "Pamarru",
      "district": "Krishna",
      "state": "Andhra Pradesh",
      "country": "India"
    }
  ]
}
```

Urban response `200`

```json
{
  "data": [
    { "city": "Vijayawada", "state": "Andhra Pradesh", "country": "India" }
  ]
}
```

The UI fills town, district, state, and country from the chosen rural row. Country on a rural form is taken from this payload and is not a typed field. The UI fills state and country from the chosen urban row. The visitor may still correct a suggested value before submit. Empty `data` means no match. The visitor can continue by typing.

---

### 6. Hotels

#### `GET /hotels`  
Admin. Receptionist receives only their hotel.

Query: `active=true|false`, `reserved=true|false`, `q` name search.

Response `200`: list of Hotel.

#### `POST /hotels`  
Admin.

Request

```json
{
  "name": "Three Castle Executive",
  "address": "Near the venue",
  "contact": "9848000111",
  "distanceFromEvent": { "value": 0.6, "unit": "km" },
  "active": true,
  "reserved": false
}
```

`distanceFromEvent` is required. `reserved` defaults to `false`.

Response `201`: Hotel.

#### `GET /hotels/:hotelId`  
Admin. Receptionist only for their hotel.

Response `200`: Hotel.

#### `PATCH /hotels/:hotelId`  
Admin. Any subset of the create fields.

Response `200`: Hotel.

#### `PATCH /hotels/:hotelId/reserved`  
Admin. The switch on the hotel list.

Request

```json
{ "reserved": true }
```

Response `200`: Hotel. Turning this on removes the hotel from the next smart-allocation run. Rooms already confirmed there stay until Admin changes them.

#### `PATCH /hotels/:hotelId/active`  
Admin.

Request

```json
{ "active": false }
```

Response `200`: Hotel. An inactive hotel is unavailable for automatic and manual assignment.

---

### 7. Rooms

#### `GET /hotels/:hotelId/rooms`  
Admin. Receptionist for their hotel.

Query: `kind=regular|dormitory|hall`, `roomType=ac|non_ac`, `genderAllowed=gents|ladies`, `status=available|occupied`.

Response `200`: list of Room, plus `occupied` beds.

#### `POST /hotels/:hotelId/rooms`  
Admin. One room.

Request

```json
{
  "roomNumber": "231",
  "capacity": 4,
  "kind": "regular",
  "roomType": "ac"
}
```

Dormitory or hall request

```json
{
  "roomNumber": "D1",
  "capacity": 30,
  "kind": "dormitory",
  "genderAllowed": "gents",
  "roomType": "ac"
}
```

`genderAllowed` is required for `dormitory` and `hall`, and must be omitted for `regular`. `roomType` defaults to `ac`. Status is `available`.

Response `201`: Room. `409` when `roomNumber` already exists in that hotel.

#### `POST /hotels/:hotelId/rooms/bulk`  
Admin. Several rooms in one save.

Request

```json
{
  "rooms": [
    { "roomNumber": "101", "capacity": 3, "kind": "regular", "roomType": "ac" },
    { "roomNumber": "102", "capacity": 3, "kind": "regular", "roomType": "non_ac" }
  ]
}
```

Response `201`

```json
{
  "data": { "created": [ "..." ], "rejected": [ { "roomNumber": "101", "code": "DUPLICATE_ROOM" } ] }
}
```

#### `GET /rooms/:roomId`  
Admin. Receptionist for a room in their hotel.

Response `200`: Room, plus current occupants:

```json
{
  "data": {
    "id": "rm_d1",
    "occupied": 2,
    "remaining": 28,
    "occupantsGender": "gents",
    "parties": [ { "id": "pty_9", "visitorName": "Ravi", "personCount": 2 } ]
  }
}
```

#### `PATCH /rooms/:roomId`  
Admin. Room number, capacity, kind, genderAllowed, roomType. Status is not set here. It changes through allocation and check-out.

Response `200`: Room. `409` on a duplicate room number.

---

### 8. Visitor booking

Calls in this section use the visitor token, except create. Admin may `GET` a booking.

#### `POST /bookings`  
Public while the window is open. Starts V1 and V2.

Request

```json
{
  "accommodation": "free",
  "visitorName": "Lakshmi",
  "mobile": "9848011111",
  "gender": "ladies",
  "area": "rural",
  "place": {
    "village": "Pamarru",
    "town": "Pamarru",
    "district": "Krishna",
    "state": "Andhra Pradesh",
    "country": "India"
  },
  "pyramidSevadal": false,
  "roomTypePreference": "ac"
}
```

Urban `place` is `{ "city", "state", "country" }`.  
`roomTypePreference` is required when `accommodation` is `free`, and omitted when it is `self`.  
`mobile` must be a valid phone number.

Response `201`

```json
{
  "data": {
    "booking": { "id": "pty_2", "status": "waiting", "personCount": 1 },
    "token": "visitor-jwt"
  }
}
```

`self` is stored as `self_booked` and is skipped by allocation. `409` `BOOKING_CLOSED` after the cutoff.

#### `GET /bookings/:bookingId`  
Visitor (own booking), admin.

Response `200`: party, family members, stay rows, special needs, couple consent, id card if issued, allotment if confirmed.

#### `PATCH /bookings/:bookingId`  
Visitor, while the window is open. Same fields as create. `409` after close.

Response `200`: updated party.

#### `POST /bookings/:bookingId/family-members`  
Visitor.

Request

```json
{ "name": "Arun", "gender": "gents", "relation": "spouse", "ageGroup": "adult" }
```

`relation` and `ageGroup` (`child`, `adult`, `senior`) are optional. `name` and `gender` are required.

Response `201`: the member, and `personCount`.

#### `PATCH /family-members/:memberId`  
Visitor. Same fields. Response `200`.

#### `DELETE /family-members/:memberId`  
Visitor. Response `204`. `personCount` drops. `409` after booking closes.

#### `PUT /bookings/:bookingId/stays`  
Visitor. One row per person, including the primary visitor. Replaces the set.

Request

```json
{
  "stays": [
    { "personId": "pty_2", "days": 11 },
    { "personId": "mem_1", "days": 5 }
  ]
}
```

`days` minimum is 1. The server derives each person’s check-in and check-out dates at `11:00` from the event and these days.

Response `200`

```json
{
  "data": {
    "stays": [
      {
        "personId": "pty_2",
        "days": 11,
        "checkInDate": "2026-12-01",
        "checkInTime": "11:00",
        "checkOutDate": "2026-12-12",
        "checkOutTime": "11:00"
      }
    ]
  }
}
```

#### `PUT /bookings/:bookingId/special-needs`  
Visitor.

Request

```json
{
  "aged": true,
  "agedDetails": "Mother is 78",
  "sickness": false,
  "sicknessDetails": null
}
```

Details are optional and only stored when the matching flag is true.

Response `200`: the same object.

#### `GET /bookings/:bookingId/couple-question`  
Visitor. Tells the form whether to show the husband-and-wife question.

Response `200`

```json
{ "data": { "show": true } }
```

`show` is true only when the party is exactly two people, one gent and one lady, and the relation is husband or wife.

#### `PUT /bookings/:bookingId/couple-consent`  
Visitor. Only when `show` is true.

Request

```json
{ "agreeToSeparate": true }
```

Response `200`: `{ "agreeToSeparate": true }`. `409` when the party is not a couple.

#### `GET /bookings/:bookingId/summary`  
Visitor. The “request received” card. No room yet.

Response `200`

```json
{
  "data": {
    "visitorName": "Lakshmi",
    "mobile": "9848011111",
    "personCount": 2,
    "placeLabel": "Pamarru, Krishna",
    "pyramidSevadal": false,
    "specialNeeds": { "aged": true, "sickness": false },
    "roomTypePreference": "ac",
    "checkInTime": "11:00",
    "checkOutTime": "11:00",
    "idCardNumber": "PSSM-1048",
    "status": "waiting",
    "message": "Waiting for room allocation"
  }
}
```

---

### 9. Identity and ID card

One ID covers the whole party.

#### `POST /bookings/:bookingId/identity`  
Visitor. `multipart/form-data`.

| Part | Required |
| --- | --- |
| personId | Yes. Primary visitor id or a family member id |
| idProofType | Yes. `aadhaar`, `pan`, `voter_id`, `passport`, `driving_licence`, `other` |
| livePhoto | Yes. Image file from the camera |
| idProofPhoto | Yes. Image file from the camera |

Response `201`

```json
{
  "data": {
    "personId": "pty_2",
    "idProofType": "aadhaar",
    "livePhotoUrl": "/files/pty_2/live.jpg",
    "idProofPhotoUrl": "/files/pty_2/proof.jpg"
  }
}
```

#### `POST /bookings/:bookingId/id-card`  
Visitor, after identity is stored. Server assigns one card number for the party.

Response `201`

```json
{
  "data": {
    "idCardNumber": "PSSM-1048",
    "partyId": "pty_2",
    "livePhotoUrl": "/files/pty_2/live.jpg",
    "idProofPhotoUrl": "/files/pty_2/proof.jpg"
  }
}
```

`409` when identity photos are missing.

#### `GET /id-cards/:idCardNumber`  
Visitor (own card), receptionist, admin. Digital card, also used before check-in.

Response `200`: card number, party names, room if allotted, special needs, check-in and check-out at `11:00`, photo URLs, and `keyPolicy`: "Room keys stay at reception."

---

### 10. Admin booking list

#### `GET /admin/bookings`  
Admin.

Query: `status=waiting|allotted|self_booked|cancelled`, `specialNeeds=true`, `sevadal=true`, `accommodation=free|self`, `q` name or mobile.

Response `200`: list of party summaries.

#### `GET /admin/bookings/:bookingId`  
Admin. Full party, the same body as `GET /bookings/:bookingId`.

---

### 11. Smart allocation

Automatic allocation never uses a reserved hotel and never includes `self_booked` parties.

#### `GET /admin/allocation/readiness`  
Admin. Enables or disables the Run button.

Response `200`

```json
{
  "data": {
    "bookingOpen": false,
    "waitingFreeParties": 120,
    "canRun": true
  }
}
```

`canRun` is false while booking is still open.

#### `POST /admin/allocation/runs`  
Admin. Builds a proposal. Does not notify hotels yet.

Response `200`

```json
{
  "data": {
    "runId": "run_1",
    "status": "proposed",
    "assignments": [
      {
        "partyId": "pty_2",
        "visitorName": "Lakshmi",
        "personCount": 2,
        "hotelId": "htl_1",
        "hotelName": "Sai Prakash",
        "roomId": "rm_231",
        "roomNumber": "231",
        "roomType": "ac",
        "shared": false,
        "reason": "exact capacity"
      }
    ],
    "unmatched": [
      { "partyId": "pty_90", "visitorName": "Kiran", "reason": "no bed of the right gender" }
    ]
  }
}
```

`reason` is a short label such as `event location`, `exact capacity`, `closest room`, `same town`, `same city`, `gents dormitory`, `ladies hall`, `beds left in an all-gents room`, `sevadal`, `couple exchange`.

`409` `BOOKING_OPEN` when the window has not closed.

The proposal follows the allocation summary. Parties from the event location are placed first (`location.place` matches an urban city or a rural town). Other parties use only beds still free. `unmatched` is the manual list: Admin assigns those parties by hand. Exact capacity, reserved hotels skipped, couple exchange, dormitory gender, and sharing by town or city still apply inside each group.

#### `GET /admin/allocation/runs/:runId`  
Admin. The proposal, including any overrides saved so far.

#### `PATCH /admin/allocation/runs/:runId/assignments/:partyId`  
Admin. Manual override, including a reserved hotel.

Request

```json
{ "hotelId": "htl_reserved", "roomId": "rm_r1" }
```

Response `200`: the updated assignment row, with `reason`: `admin override`.  
`409` when the hotel is inactive, the room cannot hold the party, or a dormitory or hall does not allow that gender.

#### `DELETE /admin/allocation/runs/:runId/assignments/:partyId`  
Admin. Clears an override and puts the party back on the unmatched list, or restores the proposal when one existed.

Response `200`: the row.

#### `POST /admin/allocation/runs/:runId/confirm`  
Admin. Saves allotments and notifies each affected hotel receptionist (in-app and WhatsApp).

Response `200`

```json
{
  "data": {
    "runId": "run_1",
    "status": "confirmed",
    "allotted": 118,
    "unmatched": 2,
    "hotelsNotified": [ "htl_1", "htl_2" ]
  }
}
```

#### `GET /admin/allocation/runs/:runId/unmatched`  
Admin. Parties still without a room after the proposal or after confirm.

---

### 12. Manual changes after confirm

#### `POST /admin/parties/:partyId/actions`  
Admin. Room change, cancel, special instruction, or guest update. Notifies that hotel.

Request, room change

```json
{
  "action": "room_change",
  "hotelId": "htl_reserved",
  "roomId": "rm_r4",
  "note": "Moved to the reserved hotel"
}
```

`action`: `room_change`, `cancel`, `instruction`, `update_guest`.

Cancel request

```json
{ "action": "cancel", "note": "Visitor withdrew" }
```

Instruction request

```json
{ "action": "instruction", "note": "Ground floor if possible" }
```

Guest update request sends the fields that changed (name, mobile, special needs, stay days).

Response `200`

```json
{
  "data": {
    "partyId": "pty_2",
    "action": "room_change",
    "hotelNotified": "htl_reserved",
    "allotment": { "hotelId": "htl_reserved", "roomId": "rm_r4", "roomNumber": "R4" }
  }
}
```

A reserved hotel is allowed here. An inactive hotel is not.

---

### 13. Hotel receptionist

Every call is limited to the receptionist’s hotel.

#### `GET /reception/guests`  
Receptionist.

Query: `status=expected|checked_in|partly_checked_out|checked_out`, `date=YYYY-MM-DD`.

Response `200`

```json
{
  "data": [
    {
      "partyId": "pty_2",
      "visitorName": "Lakshmi",
      "idCardNumber": "PSSM-1048",
      "personCount": 2,
      "roomNumber": "231",
      "checkInDate": "2026-12-01",
      "checkInTime": "11:00",
      "checkOutDate": "2026-12-12",
      "checkOutTime": "11:00",
      "specialNeeds": { "aged": true, "sickness": false },
      "status": "expected",
      "keyPolicy": "Room keys stay at reception."
    }
  ]
}
```

#### `GET /reception/guests/:partyId`  
Receptionist. Full party, photos, and room. Used on the check-in panel.

#### `GET /reception/id-cards/:idCardNumber`  
Receptionist. Search step. Does not check the party in.

Response `200`: the same verification panel: card number, live photo, ID proof photo, names, room, special needs, expected time `11:00`, key reminder.  
`404` when the card is not for this hotel.

#### `POST /reception/check-ins`  
Receptionist. Confirm step.

Request

```json
{ "idCardNumber": "PSSM-1048" }
```

Response `200`

```json
{
  "data": {
    "partyId": "pty_2",
    "status": "checked_in",
    "checkedInAt": "2026-12-01T11:05:00+05:30"
  }
}
```

`409` when the card does not match a party for this hotel. Admin is notified.

#### `POST /reception/check-outs`  
Receptionist. Whole party, selected people, or an early check-out.

Request

```json
{
  "partyId": "pty_2",
  "scope": "selected",
  "personIds": [ "mem_1" ],
  "early": true
}
```

`scope`: `party` or `selected`. For `party`, omit `personIds`.

Response `200`

```json
{
  "data": {
    "partyId": "pty_2",
    "status": "partly_checked_out",
    "bedsReleased": 1,
    "roomStatus": "available"
  }
}
```

Beds free at once. Admin is notified. `roomStatus` becomes `available` when everyone in that room has left. A dormitory keeps `occupied` and `remaining` updated so more people of the same gender can still be placed.

#### `GET /reception/checkout-reminders`  
Receptionist. Parties whose check-out is tomorrow.

Response `200`

```json
{
  "data": [
    {
      "partyId": "pty_2",
      "visitorName": "Lakshmi",
      "roomNumber": "231",
      "checkOutDate": "2026-12-12",
      "checkOutTime": "11:00",
      "informed": false
    }
  ]
}
```

#### `PATCH /reception/checkout-reminders/:partyId`  
Receptionist.

Request

```json
{ "informed": true }
```

Response `200`: the reminder row with `informed: true`.

---

### 14. Notifications

Socket.io delivers these as they happen. The UI also loads history from here.

#### `GET /notifications`  
Admin: every hotel. Receptionist: their hotel only.

Query: `type=check_in|check_out|room_change|cancel|instruction|guest_update|allotment`, `page`, `pageSize`.

Response `200`

```json
{
  "data": [
    {
      "id": "ntf_1",
      "type": "check_out",
      "at": "2026-12-12T10:40:00+05:30",
      "hotelId": "htl_1",
      "hotelName": "Sai Prakash",
      "partyId": "pty_2",
      "visitorName": "Lakshmi",
      "summary": "Early check-out for 1 person",
      "early": true
    }
  ]
}
```

#### `GET /notifications/:notificationId`  
Admin or the receptionist of that hotel. Full payload of the change.

---

### 15. Endpoint index

| Method | Path | Who |
| --- | --- | --- |
| POST | `/auth/login` | Admin, receptionist, visitor |
| POST | `/auth/password` | Visitor |
| POST | `/auth/logout` | Any token |
| GET | `/auth/me` | Any token |
| GET | `/events/current` | Visitor, admin, receptionist |
| PUT | `/events/current` | Admin |
| GET | `/events/current/booking-window` | Visitor, admin |
| GET | `/places/suggestions` | Visitor |
| GET | `/hotels` | Admin, receptionist |
| POST | `/hotels` | Admin |
| GET | `/hotels/:hotelId` | Admin, receptionist |
| PATCH | `/hotels/:hotelId` | Admin |
| PATCH | `/hotels/:hotelId/reserved` | Admin |
| PATCH | `/hotels/:hotelId/active` | Admin |
| GET | `/hotels/:hotelId/rooms` | Admin, receptionist |
| POST | `/hotels/:hotelId/rooms` | Admin |
| POST | `/hotels/:hotelId/rooms/bulk` | Admin |
| GET | `/rooms/:roomId` | Admin, receptionist |
| PATCH | `/rooms/:roomId` | Admin |
| POST | `/bookings` | Visitor |
| GET | `/bookings/:bookingId` | Visitor, admin |
| PATCH | `/bookings/:bookingId` | Visitor |
| POST | `/bookings/:bookingId/family-members` | Visitor |
| PATCH | `/family-members/:memberId` | Visitor |
| DELETE | `/family-members/:memberId` | Visitor |
| PUT | `/bookings/:bookingId/stays` | Visitor |
| PUT | `/bookings/:bookingId/special-needs` | Visitor |
| GET | `/bookings/:bookingId/couple-question` | Visitor |
| PUT | `/bookings/:bookingId/couple-consent` | Visitor |
| GET | `/bookings/:bookingId/summary` | Visitor |
| POST | `/bookings/:bookingId/identity` | Visitor |
| POST | `/bookings/:bookingId/id-card` | Visitor |
| GET | `/id-cards/:idCardNumber` | Visitor, receptionist, admin |
| GET | `/admin/bookings` | Admin |
| GET | `/admin/bookings/:bookingId` | Admin |
| GET | `/admin/allocation/readiness` | Admin |
| POST | `/admin/allocation/runs` | Admin |
| GET | `/admin/allocation/runs/:runId` | Admin |
| PATCH | `/admin/allocation/runs/:runId/assignments/:partyId` | Admin |
| DELETE | `/admin/allocation/runs/:runId/assignments/:partyId` | Admin |
| POST | `/admin/allocation/runs/:runId/confirm` | Admin |
| GET | `/admin/allocation/runs/:runId/unmatched` | Admin |
| POST | `/admin/parties/:partyId/actions` | Admin |
| GET | `/reception/guests` | Receptionist |
| GET | `/reception/guests/:partyId` | Receptionist |
| GET | `/reception/id-cards/:idCardNumber` | Receptionist |
| POST | `/reception/check-ins` | Receptionist |
| POST | `/reception/check-outs` | Receptionist |
| GET | `/reception/checkout-reminders` | Receptionist |
| PATCH | `/reception/checkout-reminders/:partyId` | Receptionist |
| GET | `/notifications` | Admin, receptionist |
| GET | `/notifications/:notificationId` | Admin, receptionist |

---

### Notes
- This is a contract for the UI. It does not implement the server.
- File location: `docs/technical/PSSM_Event_Accommodation_API.md`
