package com.pssm.sangha.service;

import com.mongodb.client.result.UpdateResult;
import com.pssm.sangha.common.ApiException;
import com.pssm.sangha.domain.Hotel;
import com.pssm.sangha.domain.Person;
import com.pssm.sangha.domain.SanghaRole;
import com.pssm.sangha.domain.StayAllotment;
import com.pssm.sangha.domain.StayAllotment.AllotmentGuest;
import com.pssm.sangha.repo.HotelRepository;
import com.pssm.sangha.repo.StayAllotmentRepository;
import com.pssm.sangha.web.dto.ReceptionDtos.PersonActionRequest;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReceptionService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
    private static final LocalTime SECOND_CHANCE_END = LocalTime.of(15, 0);

    private final AuthService authService;
    private final HotelRepository hotelRepository;
    private final StayAllotmentRepository stayAllotmentRepository;
    private final MongoTemplate mongoTemplate;

    public ReceptionService(AuthService authService,
                            HotelRepository hotelRepository,
                            StayAllotmentRepository stayAllotmentRepository,
                            MongoTemplate mongoTemplate) {
        this.authService = authService;
        this.hotelRepository = hotelRepository;
        this.stayAllotmentRepository = stayAllotmentRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> deskContext() {
        Person actor = requireHotelDesk();
        Hotel hotel = requireBoundHotel(actor);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("hotelId", hotel.getId());
        data.put("hotelName", hotel.getName());
        data.put("eventId", hotel.getEventId());
        data.put("name", actor.getFullName());
        data.put("mobile", actor.getMobile());
        return data;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listGuests(String dateRaw,
                                                String statusRaw,
                                                Boolean checkingOutOnDate,
                                                String roomNumberRaw,
                                                String qRaw) {
        Person actor = requireHotelDesk();
        Hotel hotel = requireBoundHotel(actor);
        String date = (dateRaw == null || dateRaw.isBlank())
                ? LocalDate.now(ZONE).toString()
                : dateRaw.trim();
        String roomFilter = roomNumberRaw == null ? "" : roomNumberRaw.trim().toLowerCase(Locale.ROOT);
        String nameFilter = qRaw == null ? "" : qRaw.trim().toLowerCase(Locale.ROOT);
        String statusFilter = statusRaw == null ? "" : statusRaw.trim().toLowerCase(Locale.ROOT);
        boolean onlyCheckingOut = Boolean.TRUE.equals(checkingOutOnDate);

        List<StayAllotment> allotments = stayAllotmentRepository
                .findByEventIdAndHotelIdOrderByRoomNumberAsc(hotel.getEventId(), hotel.getId());
        List<Map<String, Object>> rows = new ArrayList<>();
        for (StayAllotment allotment : allotments) {
            if (allotment == null || allotment.getGuests() == null) {
                continue;
            }
            boolean dirty = false;
            List<AllotmentGuest> guests = allotment.getGuests();
            for (int i = 0; i < guests.size(); i++) {
                AllotmentGuest guest = guests.get(i);
                if (guest == null) {
                    continue;
                }
                if (ensureGuestDefaults(allotment, guest, i)) {
                    dirty = true;
                }
                String start = guestStayStart(guest, allotment);
                String end = guestStayEnd(guest, allotment);
                if (!dateCoversStay(date, start, end)) {
                    continue;
                }
                String personStatus = normalizePersonStatus(guest.getPersonStatus());
                if (!statusFilter.isBlank() && !statusFilter.equals(personStatus)) {
                    continue;
                }
                boolean checkingOut = date.equals(end);
                if (onlyCheckingOut && !checkingOut) {
                    continue;
                }
                String room = allotment.getRoomNumber() == null ? "" : allotment.getRoomNumber();
                if (!roomFilter.isBlank() && !room.toLowerCase(Locale.ROOT).contains(roomFilter)) {
                    continue;
                }
                String name = guest.getName() == null ? "" : guest.getName();
                if (!nameFilter.isBlank() && !name.toLowerCase(Locale.ROOT).contains(nameFilter)) {
                    continue;
                }
                rows.add(guestRow(allotment, guest, personStatus, checkingOut, hotel));
            }
            if (dirty) {
                stayAllotmentRepository.save(allotment);
            }
        }
        return rows;
    }

    @Transactional
    public Map<String, Object> checkIn(PersonActionRequest body) {
        return updateStatusAtomic(body, "checked_in", "allotted");
    }

    @Transactional
    public Map<String, Object> checkOut(PersonActionRequest body) {
        return updateStatusAtomic(body, "checked_out", "checked_in");
    }

    @Transactional
    public Map<String, Object> didNotArrive(PersonActionRequest body) {
        if (LocalTime.now(ZONE).isBefore(SECOND_CHANCE_END)) {
            throw new ApiException(HttpStatus.CONFLICT, "TOO_EARLY",
                    "Did not arrive can be marked after 3:00 PM (second chance until then).");
        }
        return updateStatusAtomic(body, "did_not_arrive", "allotted");
    }

    /**
     * Atomic CAS on guest personStatus so two desks cannot both transition from the same state.
     */
    private Map<String, Object> updateStatusAtomic(PersonActionRequest body,
                                                   String nextStatus,
                                                   String expectedStatus) {
        Person actor = requireHotelDesk();
        Hotel hotel = requireBoundHotel(actor);
        GuestRef ref = resolveGuest(body);

        StayAllotment allotment = stayAllotmentRepository.findById(ref.allotmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Allotment not found."));
        if (!hotel.getId().equals(allotment.getHotelId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Not your hotel.");
        }
        AllotmentGuest guest = findGuest(allotment, ref.guestKey);
        if (ensureGuestDefaults(allotment, guest, -1)) {
            stayAllotmentRepository.save(allotment);
        }

        if ("did_not_arrive".equals(nextStatus)) {
            String start = guestStayStart(guest, allotment);
            String today = LocalDate.now(ZONE).toString();
            if (!today.equals(start)) {
                throw new ApiException(HttpStatus.CONFLICT, "CONFLICT",
                        "Did not arrive applies on the person's check-in date.");
            }
        }

        Criteria expectedMatch = expectedStatusCriteria(expectedStatus);
        Query query = new Query(new Criteria().andOperator(
                Criteria.where("_id").is(ref.allotmentId),
                Criteria.where("hotelId").is(hotel.getId()),
                Criteria.where("guests").elemMatch(new Criteria().andOperator(
                        Criteria.where("guestKey").is(ref.guestKey),
                        expectedMatch
                ))
        ));
        Update update = new Update().set("guests.$.personStatus", nextStatus);
        UpdateResult result = mongoTemplate.updateFirst(query, update, StayAllotment.class);
        if (result.getMatchedCount() == 0) {
            StayAllotment latest = stayAllotmentRepository.findById(ref.allotmentId).orElse(null);
            String current = "missing";
            if (latest != null) {
                try {
                    current = normalizePersonStatus(findGuest(latest, ref.guestKey).getPersonStatus());
                } catch (ApiException ignored) {
                    current = "missing";
                }
            }
            throw new ApiException(HttpStatus.CONFLICT, "CONFLICT",
                    conflictMessage(nextStatus, current));
        }

        StayAllotment refreshed = stayAllotmentRepository.findById(ref.allotmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Allotment not found."));
        syncPartyStatus(refreshed);
        stayAllotmentRepository.save(refreshed);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("personId", personId(ref.allotmentId, ref.guestKey));
        data.put("allotmentId", ref.allotmentId);
        data.put("guestKey", ref.guestKey);
        data.put("personStatus", nextStatus);
        return data;
    }

    private static Criteria expectedStatusCriteria(String expectedStatus) {
        if ("allotted".equals(expectedStatus)) {
            // Legacy rows may omit personStatus; treat blank/missing as allotted.
            return new Criteria().orOperator(
                    Criteria.where("personStatus").is("allotted"),
                    Criteria.where("personStatus").exists(false),
                    Criteria.where("personStatus").is(""),
                    Criteria.where("personStatus").is(null)
            );
        }
        return Criteria.where("personStatus").is(expectedStatus);
    }

    private static String conflictMessage(String nextStatus, String current) {
        if ("checked_in".equals(nextStatus)) {
            return "Only an allotted person can be marked checked-in (current: " + current + ").";
        }
        if ("checked_out".equals(nextStatus)) {
            return "Only a checked-in person can be marked checked-out (current: " + current + ").";
        }
        if ("did_not_arrive".equals(nextStatus)) {
            return "Only an allotted person can be marked did not arrive (current: " + current + ").";
        }
        return "Status was changed by someone else (current: " + current + ").";
    }

    private void syncPartyStatus(StayAllotment allotment) {
        List<AllotmentGuest> guests = allotment.getGuests() == null ? List.of() : allotment.getGuests();
        int checkedIn = 0;
        int checkedOut = 0;
        int allotted = 0;
        int didNot = 0;
        for (AllotmentGuest guest : guests) {
            if (guest == null) {
                continue;
            }
            String status = normalizePersonStatus(guest.getPersonStatus());
            switch (status) {
                case "checked_in" -> checkedIn++;
                case "checked_out" -> checkedOut++;
                case "did_not_arrive" -> didNot++;
                default -> allotted++;
            }
        }
        int total = checkedIn + checkedOut + allotted + didNot;
        if (total == 0) {
            return;
        }
        if (checkedOut == total) {
            allotment.setStatus("checked_out");
        } else if (checkedIn > 0 && checkedOut > 0) {
            allotment.setStatus("partly_checked_out");
        } else if (checkedIn == total) {
            allotment.setStatus("checked_in");
        } else if (checkedIn > 0) {
            allotment.setStatus("checked_in");
        } else if (didNot == total) {
            allotment.setStatus("did_not_arrive");
        } else {
            allotment.setStatus("allotted");
        }
    }

    private Map<String, Object> guestRow(StayAllotment allotment,
                                         AllotmentGuest guest,
                                         String personStatus,
                                         boolean checkingOutOnDate,
                                         Hotel hotel) {
        Map<String, Object> row = new LinkedHashMap<>();
        String guestKey = guest.getGuestKey();
        row.put("personId", personId(allotment.getId(), guestKey));
        row.put("allotmentId", allotment.getId());
        row.put("guestKey", guestKey);
        row.put("bookingId", allotment.getBookingId());
        row.put("name", guest.getName());
        row.put("mobile", guest.getMobile());
        row.put("roomNumber", allotment.getRoomNumber());
        row.put("hotelId", hotel.getId());
        row.put("hotelName", hotel.getName());
        row.put("checkInDate", guestStayStart(guest, allotment));
        row.put("checkInTime", "11:00");
        row.put("checkOutDate", guestStayEnd(guest, allotment));
        row.put("checkOutTime", "11:00");
        row.put("personStatus", personStatus);
        row.put("checkingOutOnDate", checkingOutOnDate);
        row.put("livePhoto", guest.getLivePhoto() == null ? "" : guest.getLivePhoto());
        row.put("idProofPhoto", guest.getIdProofPhoto() == null ? "" : guest.getIdProofPhoto());
        row.put("primary", guest.isPrimary());
        row.put("keyPolicy", "Room keys stay at reception.");
        return row;
    }

    private boolean ensureGuestDefaults(StayAllotment allotment, AllotmentGuest guest, int index) {
        boolean changed = false;
        if (guest.getGuestKey() == null || guest.getGuestKey().isBlank()) {
            String key = allotment.getId() + ":g" + (index >= 0 ? index : Math.abs(guest.hashCode()));
            guest.setGuestKey(key);
            changed = true;
        }
        if (guest.getPersonStatus() == null || guest.getPersonStatus().isBlank()) {
            guest.setPersonStatus("allotted");
            changed = true;
        }
        return changed;
    }

    private AllotmentGuest findGuest(StayAllotment allotment, String guestKey) {
        List<AllotmentGuest> guests = allotment.getGuests() == null ? List.of() : allotment.getGuests();
        for (int i = 0; i < guests.size(); i++) {
            AllotmentGuest guest = guests.get(i);
            if (guest == null) {
                continue;
            }
            ensureGuestDefaults(allotment, guest, i);
            if (guestKey.equals(guest.getGuestKey())) {
                return guest;
            }
        }
        throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Person not found in allotment.");
    }

    private GuestRef resolveGuest(PersonActionRequest body) {
        if (body == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Person id is required.");
        }
        String allotmentId = body.allotmentId == null ? "" : body.allotmentId.trim();
        String guestKey = body.guestKey == null ? "" : body.guestKey.trim();
        String personId = body.personId == null ? "" : body.personId.trim();
        if ((allotmentId.isBlank() || guestKey.isBlank()) && !personId.isBlank()) {
            int sep = personId.indexOf("::");
            if (sep > 0) {
                allotmentId = personId.substring(0, sep);
                guestKey = personId.substring(sep + 2);
            }
        }
        if (allotmentId.isBlank() || guestKey.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "personId (or allotmentId + guestKey) is required.");
        }
        return new GuestRef(allotmentId, guestKey);
    }

    private static String personId(String allotmentId, String guestKey) {
        return allotmentId + "::" + guestKey;
    }

    private static String guestStayStart(AllotmentGuest guest, StayAllotment allotment) {
        String start = guest.getStayStartDate() == null ? "" : guest.getStayStartDate().trim();
        if (!start.isBlank()) {
            return start;
        }
        return allotment.getCheckInDate() == null ? "" : allotment.getCheckInDate().trim();
    }

    private static String guestStayEnd(AllotmentGuest guest, StayAllotment allotment) {
        String end = guest.getStayEndDate() == null ? "" : guest.getStayEndDate().trim();
        if (!end.isBlank()) {
            return end;
        }
        return allotment.getCheckOutDate() == null ? "" : allotment.getCheckOutDate().trim();
    }

    /** Half-open stay: date in [start, end] inclusive for desk day list (end = check-out day). */
    private static boolean dateCoversStay(String date, String start, String end) {
        if (date == null || date.isBlank() || start == null || start.isBlank() || end == null || end.isBlank()) {
            return false;
        }
        return date.compareTo(start) >= 0 && date.compareTo(end) <= 0;
    }

    private static String normalizePersonStatus(String status) {
        String value = status == null ? "" : status.trim().toLowerCase(Locale.ROOT);
        if ("checked_in".equals(value) || "checked-in".equals(value)) {
            return "checked_in";
        }
        if ("checked_out".equals(value) || "checked-out".equals(value)) {
            return "checked_out";
        }
        if ("did_not_arrive".equals(value) || "did-not-arrive".equals(value)) {
            return "did_not_arrive";
        }
        return "allotted";
    }

    private Person requireHotelDesk() {
        Person actor = authService.currentPerson();
        if (actor.getRoles() == null || !actor.getRoles().contains(SanghaRole.HOTEL_DESK)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Hotel Desk role required.");
        }
        return actor;
    }

    private Hotel requireBoundHotel(Person actor) {
        String hotelId = actor.getHotelId() == null ? "" : actor.getHotelId().trim();
        if (hotelId.isBlank()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "No hotel is attached to this Hotel Desk login.");
        }
        return hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND",
                        "Attached hotel was not found."));
    }

    private record GuestRef(String allotmentId, String guestKey) {
    }
}
