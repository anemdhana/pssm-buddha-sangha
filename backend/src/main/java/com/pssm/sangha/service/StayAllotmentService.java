package com.pssm.sangha.service;

import com.pssm.sangha.common.ApiException;
import com.pssm.sangha.domain.Hotel;
import com.pssm.sangha.domain.Hotel.HotelRoom;
import com.pssm.sangha.domain.Person;
import com.pssm.sangha.domain.PlaceInfo;
import com.pssm.sangha.domain.SanghaRole;
import com.pssm.sangha.domain.StayAllotment;
import com.pssm.sangha.domain.StayAllotment.AllotmentGuest;
import com.pssm.sangha.repo.HotelRepository;
import com.pssm.sangha.repo.StayAllotmentQueryRepository;
import com.pssm.sangha.repo.StayAllotmentQueryRepository.AllotmentFilters;
import com.pssm.sangha.repo.StayAllotmentRepository;
import com.pssm.sangha.web.dto.PageDtos;
import com.pssm.sangha.web.dto.StayAllotmentDtos.CreateAllotmentsRequest;
import com.pssm.sangha.web.dto.StayAllotmentDtos.GuestDto;
import com.pssm.sangha.web.dto.StayAllotmentDtos.PlacementDto;
import com.pssm.sangha.web.dto.StayAllotmentDtos.ReleaseAllotmentsRequest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StayAllotmentService {

    private final StayAllotmentQueryRepository allotmentQueryRepository;
    private final StayAllotmentRepository stayAllotmentRepository;
    private final HotelRepository hotelRepository;
    private final AuthService authService;
    private final ProfileMapper profileMapper;

    public StayAllotmentService(StayAllotmentQueryRepository allotmentQueryRepository,
                               StayAllotmentRepository stayAllotmentRepository,
                               HotelRepository hotelRepository,
                               AuthService authService,
                               ProfileMapper profileMapper) {
        this.allotmentQueryRepository = allotmentQueryRepository;
        this.stayAllotmentRepository = stayAllotmentRepository;
        this.hotelRepository = hotelRepository;
        this.authService = authService;
        this.profileMapper = profileMapper;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listForEvent(String eventId,
                                            String q,
                                            String hotelId,
                                            String roomType,
                                            String roomKind,
                                            String gender,
                                            String status,
                                            String location,
                                            String stayRange,
                                            Integer pageRaw,
                                            Integer sizeRaw) {
        requireViewer(authService.currentPerson());
        String id = eventId == null ? "" : eventId.trim();
        if (id.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Event id is required.");
        }
        int page = PageDtos.normalizePage(pageRaw);
        int size = PageDtos.normalizeSize(sizeRaw);
        AllotmentFilters filters = new AllotmentFilters(
                id, q, hotelId, roomType, roomKind, gender, status, location, stayRange);

        long total = allotmentQueryRepository.count(filters);
        List<Map<String, Object>> items = new ArrayList<>();
        for (StayAllotment allotment : allotmentQueryRepository.search(filters, page, size)) {
            items.add(toView(allotment));
        }

        Map<String, Object> stats = allotmentQueryRepository.stats(filters);
        Map<String, Object> facets = new LinkedHashMap<>();
        facets.put("hotels", allotmentQueryRepository.hotelFacets(filters));
        facets.put("locations", allotmentQueryRepository.locationFacets(filters));
        facets.put("stayRanges", allotmentQueryRepository.stayRangeFacets(filters));

        return PageDtos.page(items, total, page, size, stats, facets);
    }

    @Transactional
    public Map<String, Object> createBatch(CreateAllotmentsRequest body) {
        requireViewer(authService.currentPerson());
        if (body == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Allotment details are required.");
        }
        String eventId = body.eventId == null ? "" : body.eventId.trim();
        if (eventId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Event id is required.");
        }
        List<PlacementDto> placements = body.placements == null ? List.of() : body.placements;
        if (placements.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "No room placements to save.");
        }

        String eventName = body.eventName == null ? "" : body.eventName.trim();
        List<StayAllotment> toSave = new ArrayList<>();
        Set<String> guestKeys = new HashSet<>();
        Map<String, Hotel> hotelsById = new HashMap<>();
        for (PlacementDto placement : placements) {
            if (placement == null) {
                continue;
            }
            String hotelId = placement.hotelId == null ? "" : placement.hotelId.trim();
            Hotel hotel = hotelsById.computeIfAbsent(hotelId, id -> hotelRepository.findById(id)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                            "Hotel not found for allotment.")));
            if (!hotel.isActive() || hotel.isReserved()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Hotel not available for allotment (" + hotel.getName() + ").");
            }
            String roomNumber = placement.roomNumber == null ? "" : placement.roomNumber.trim();
            if (roomNumber.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Room number is required.");
            }
            HotelRoom room = findHotelRoom(hotel, roomNumber);
            if (room == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Room " + roomNumber + " was not found in " + hotel.getName() + ".");
            }
            if ("blocked".equalsIgnoreCase(blankToEmpty(room.getStatus()))) {
                throw new ApiException(HttpStatus.CONFLICT, "ROOM_BLOCKED",
                        "Room " + roomNumber + " is blocked.");
            }

            StayAllotment allotment = new StayAllotment();
            allotment.setId("allot_" + UUID.randomUUID());
            allotment.setEventId(eventId);
            allotment.setEventName(eventName);
            allotment.setBookingId(placement.bookingId == null ? "" : placement.bookingId.trim());
            allotment.setPlan("paid".equalsIgnoreCase(placement.plan) ? "paid" : "free");
            allotment.setStatus("allotted");
            allotment.setHotelId(hotel.getId());
            allotment.setHotelName(hotel.getName());
            allotment.setRoomNumber(roomNumber);
            allotment.setRoomType("non_ac".equalsIgnoreCase(placement.roomType) ? "non_ac" : "ac");
            allotment.setRoomKind(placement.roomKind == null || placement.roomKind.isBlank()
                    ? "regular" : placement.roomKind.trim());
            String checkIn = placement.checkInDate == null ? "" : placement.checkInDate.trim();
            String checkOut = placement.checkOutDate == null ? "" : placement.checkOutDate.trim();
            allotment.setPlace(placeFromMap(placement.place));
            allotment.setCreatedAt(Instant.now());

            List<AllotmentGuest> guests = new ArrayList<>();
            List<GuestDto> members = placement.members == null ? List.of() : placement.members;
            for (int i = 0; i < members.size(); i++) {
                GuestDto member = members.get(i);
                if (member == null) {
                    continue;
                }
                AllotmentGuest guest = new AllotmentGuest();
                guest.setName(member.name == null ? "" : member.name.trim());
                guest.setRelation(member.relation == null ? "" : member.relation.trim());
                guest.setMobile(PasswordSupport.normalizeMobile(member.mobile));
                guest.setGender(member.gender == null ? "" : member.gender.trim());
                guest.setAge(member.age == null ? "" : member.age.trim());
                guest.setLivePhoto(member.livePhoto == null ? "" : member.livePhoto);
                guest.setIdProofPhoto(member.idProofPhoto == null ? "" : member.idProofPhoto);
                guest.setIdType(member.idType == null ? "" : member.idType.trim());
                String guestStart = member.stayStartDate == null ? "" : member.stayStartDate.trim();
                String guestEnd = member.stayEndDate == null ? "" : member.stayEndDate.trim();
                if (guestStart.isBlank()) {
                    guestStart = checkIn;
                }
                if (guestEnd.isBlank()) {
                    guestEnd = checkOut;
                }
                guest.setStayStartDate(guestStart);
                guest.setStayEndDate(guestEnd);
                guest.setPrimary(Boolean.TRUE.equals(member.primary) || (i == 0 && guests.isEmpty()));
                guest.setGuestKey(allotment.getId() + ":g" + guests.size());
                guest.setPersonStatus("allotted");
                guests.add(guest);
                String key = guestIdentityKey(guest, allotment.getBookingId());
                if (key.isBlank()) {
                    continue;
                }
                if (!guestKeys.add(key)) {
                    throw new ApiException(HttpStatus.CONFLICT, "DUPLICATE_GUEST",
                            "The same person appears more than once in this allotment batch.");
                }
            }
            if (guests.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Each placement needs at least one person.");
            }
            assertRoomAllowsGuests(hotel, room, guests);
            if (checkIn.isBlank() || checkOut.isBlank()) {
                for (AllotmentGuest guest : guests) {
                    String start = guest.getStayStartDate() == null ? "" : guest.getStayStartDate().trim();
                    String end = guest.getStayEndDate() == null ? "" : guest.getStayEndDate().trim();
                    if (checkIn.isBlank() && !start.isBlank()) {
                        checkIn = start;
                    } else if (!start.isBlank() && start.compareTo(checkIn) < 0) {
                        checkIn = start;
                    }
                    if (checkOut.isBlank() && !end.isBlank()) {
                        checkOut = end;
                    } else if (!end.isBlank() && end.compareTo(checkOut) > 0) {
                        checkOut = end;
                    }
                }
            }
            allotment.setCheckInDate(checkIn);
            allotment.setCheckOutDate(checkOut);
            AllotmentGuest primary = guests.stream().filter(AllotmentGuest::isPrimary).findFirst()
                    .orElse(guests.get(0));
            allotment.setFamilyMobile(primary.getMobile());
            allotment.setFamilyFullName(primary.getName());
            allotment.setGuests(guests);
            toSave.add(allotment);
        }

        Map<String, Map<String, String>> targetsByGuestKey = new LinkedHashMap<>();
        for (StayAllotment allotment : toSave) {
            if (allotment == null || allotment.getGuests() == null) {
                continue;
            }
            for (AllotmentGuest guest : allotment.getGuests()) {
                String key = guestIdentityKey(guest, allotment.getBookingId());
                if (key.isBlank() || targetsByGuestKey.containsKey(key)) {
                    continue;
                }
                Map<String, String> target = new LinkedHashMap<>();
                target.put("hotelId", allotment.getHotelId() == null ? "" : allotment.getHotelId());
                target.put("hotelName", allotment.getHotelName() == null ? "" : allotment.getHotelName());
                target.put("roomNumber", allotment.getRoomNumber() == null ? "" : allotment.getRoomNumber());
                target.put("name", guest.getName() == null ? "" : guest.getName());
                targetsByGuestKey.put(key, target);
            }
        }

        assertBatchFitsCapacity(eventId, toSave, guestKeys, hotelsById);

        // Drop these people from any prior rooms in the event so old beds are freed.
        List<Map<String, Object>> moves = stripGuestsFromEventAllotments(eventId, guestKeys, targetsByGuestKey);

        List<Map<String, Object>> created = new ArrayList<>();
        for (StayAllotment allotment : toSave) {
            stayAllotmentRepository.save(allotment);
            created.add(toView(allotment));
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("created", created.size());
        data.put("allotments", created);
        data.put("moves", moves);
        return data;
    }

    @Transactional
    public Map<String, Object> releaseGuests(ReleaseAllotmentsRequest body) {
        requireViewer(authService.currentPerson());
        if (body == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Release details are required.");
        }
        String eventId = body.eventId == null ? "" : body.eventId.trim();
        if (eventId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Event id is required.");
        }
        List<GuestDto> members = body.members == null ? List.of() : body.members;
        Set<String> guestKeys = new HashSet<>();
        Set<String> bookingIds = new HashSet<>();
        if (body.bookingIds != null) {
            for (String raw : body.bookingIds) {
                if (raw == null) {
                    continue;
                }
                String id = raw.trim();
                if (!id.isBlank()) {
                    bookingIds.add(id);
                }
            }
        }
        for (GuestDto member : members) {
            if (member == null) {
                continue;
            }
            String bookingId = member.bookingId == null ? "" : member.bookingId.trim();
            String name = member.name == null ? "" : member.name.trim();
            String mobile = PasswordSupport.normalizeMobile(member.mobile);
            // Always add booking+name — tiles often inherit family mobile, while allotment
            // guests without a personal mobile are stored under n:bookingId:name.
            String nameKey = guestNameKey(name, bookingId);
            if (!nameKey.isBlank()) {
                guestKeys.add(nameKey);
            }
            if (!mobile.isBlank()) {
                guestKeys.add("m:" + mobile);
            }
        }
        if (guestKeys.isEmpty() && bookingIds.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "No people to move to wait list.");
        }
        List<Map<String, Object>> released =
                stripGuestsFromEventAllotments(eventId, guestKeys, bookingIds, null);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("released", released.size());
        data.put("moves", released);
        return data;
    }

    /**
     * Remove all allotments / guests for a booking (used when registration is deleted).
     * Checked-in / checked-out guests block the delete.
     */
    @Transactional
    public List<Map<String, Object>> releaseByBookingId(String eventId, String bookingId) {
        String eid = eventId == null ? "" : eventId.trim();
        String bid = bookingId == null ? "" : bookingId.trim();
        if (eid.isBlank() || bid.isBlank()) {
            return List.of();
        }
        return stripGuestsFromEventAllotments(eid, Set.of(), Set.of(bid), null);
    }

    /**
     * Sync allotted (not checked-in) guest fields after a registration update.
     * Strips allotted guests removed from the booking; refuses if checked-in guests would be removed.
     */
    @Transactional
    public void syncBookingGuests(String eventId, String bookingId, List<AllotmentGuest> bookingGuests) {
        String eid = eventId == null ? "" : eventId.trim();
        String bid = bookingId == null ? "" : bookingId.trim();
        if (eid.isBlank() || bid.isBlank()) {
            return;
        }
        Set<String> keepKeys = new HashSet<>();
        Map<String, AllotmentGuest> byKey = new HashMap<>();
        List<AllotmentGuest> source = bookingGuests == null ? List.of() : bookingGuests;
        for (AllotmentGuest guest : source) {
            String key = guestIdentityKey(guest, bid);
            if (key.isBlank()) {
                continue;
            }
            keepKeys.add(key);
            byKey.put(key, guest);
        }

        List<StayAllotment> rows = stayAllotmentRepository.findByEventId(eid);
        for (StayAllotment row : rows) {
            if (row == null || row.getGuests() == null || row.getGuests().isEmpty()) {
                continue;
            }
            String rowBooking = row.getBookingId() == null ? "" : row.getBookingId().trim();
            if (!bid.equals(rowBooking)) {
                continue;
            }
            List<AllotmentGuest> kept = new ArrayList<>();
            boolean changed = false;
            for (AllotmentGuest guest : row.getGuests()) {
                String key = guestIdentityKey(guest, rowBooking);
                String status = normalizePersonStatus(guest == null ? null : guest.getPersonStatus());
                if (key.isBlank() || !keepKeys.contains(key)) {
                    if ("checked_in".equals(status) || "checked_out".equals(status)) {
                        String name = guest == null || guest.getName() == null ? "Guest" : guest.getName();
                        throw new ApiException(HttpStatus.CONFLICT, "GUEST_CHECKED_IN",
                                "Cannot update registration — " + name
                                        + " is already checked in or out at the hotel.");
                    }
                    changed = true;
                    continue;
                }
                AllotmentGuest src = byKey.get(key);
                if (src != null && syncGuestFields(guest, src)) {
                    changed = true;
                }
                kept.add(guest);
            }
            if (!changed) {
                continue;
            }
            if (kept.isEmpty()) {
                stayAllotmentRepository.delete(row);
                continue;
            }
            AllotmentGuest primary = kept.stream().filter(AllotmentGuest::isPrimary).findFirst()
                    .orElse(kept.get(0));
            row.setGuests(kept);
            row.setFamilyMobile(primary.getMobile());
            row.setFamilyFullName(primary.getName());
            stayAllotmentRepository.save(row);
        }
    }

    private static boolean syncGuestFields(AllotmentGuest target, AllotmentGuest source) {
        boolean changed = false;
        if (source.getName() != null && !source.getName().equals(target.getName())) {
            target.setName(source.getName());
            changed = true;
        }
        if (source.getMobile() != null && !source.getMobile().equals(target.getMobile())) {
            target.setMobile(source.getMobile());
            changed = true;
        }
        if (source.getGender() != null && !source.getGender().equals(target.getGender())) {
            target.setGender(source.getGender());
            changed = true;
        }
        if (source.getAge() != null && !source.getAge().equals(target.getAge())) {
            target.setAge(source.getAge());
            changed = true;
        }
        if (source.getRelation() != null && !source.getRelation().equals(target.getRelation())) {
            target.setRelation(source.getRelation());
            changed = true;
        }
        if (source.getStayStartDate() != null
                && !source.getStayStartDate().equals(blankToEmpty(target.getStayStartDate()))) {
            target.setStayStartDate(source.getStayStartDate());
            changed = true;
        }
        if (source.getStayEndDate() != null
                && !source.getStayEndDate().equals(blankToEmpty(target.getStayEndDate()))) {
            target.setStayEndDate(source.getStayEndDate());
            changed = true;
        }
        return changed;
    }

    private static String guestNameKey(String name, String bookingId) {
        String n = name == null ? "" : name.trim().toLowerCase(Locale.ROOT);
        if (n.isBlank()) {
            return "";
        }
        String booking = bookingId == null ? "" : bookingId.trim();
        return "n:" + booking + ":" + n;
    }

    private static String guestIdentityKey(AllotmentGuest guest, String bookingId) {
        if (guest == null) {
            return "";
        }
        String mobile = guest.getMobile() == null ? "" : guest.getMobile().trim();
        if (!mobile.isBlank()) {
            return "m:" + mobile;
        }
        return guestNameKey(guest.getName(), bookingId);
    }

    private static HotelRoom findHotelRoom(Hotel hotel, String roomNumber) {
        if (hotel == null || hotel.getRooms() == null) {
            return null;
        }
        String wanted = roomNumber == null ? "" : roomNumber.trim();
        for (HotelRoom room : hotel.getRooms()) {
            if (room == null) {
                continue;
            }
            String number = room.getRoomNumber() == null ? "" : room.getRoomNumber().trim();
            if (wanted.equals(number)) {
                return room;
            }
        }
        return null;
    }

    private static void assertRoomAllowsGuests(Hotel hotel, HotelRoom room, List<AllotmentGuest> guests) {
        String kind = blankToEmpty(room.getKind()).toLowerCase(Locale.ROOT);
        String gate = normalizeGender(room.getGenderAllowed());
        if (("dormitory".equals(kind) || "hall".equals(kind)) && !gate.isBlank()) {
            for (AllotmentGuest guest : guests) {
                String gender = normalizeGender(guest.getGender());
                if (!gate.equals(gender)) {
                    throw new ApiException(HttpStatus.CONFLICT, "GENDER_MISMATCH",
                            "Room " + room.getRoomNumber() + " in " + hotel.getName()
                                    + " only allows " + gate + " guests.");
                }
            }
        }
    }

    /**
     * Server-side capacity + same-gender lock against existing (non-moving) occupants
     * and other placements in this batch. Mixed gender is allowed inside one family
     * placement; exclusive gender lock applies when sharing with other parties
     * (alone / single-person parties).
     */
    private void assertBatchFitsCapacity(String eventId,
                                         List<StayAllotment> toSave,
                                         Set<String> movingKeys,
                                         Map<String, Hotel> hotelsById) {
        List<StayAllotment> existing = stayAllotmentRepository.findByEventId(eventId);
        List<OccupancySlice> planned = new ArrayList<>();

        for (StayAllotment allotment : toSave) {
            Hotel hotel = hotelsById.get(allotment.getHotelId());
            HotelRoom room = findHotelRoom(hotel, allotment.getRoomNumber());
            if (room == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Room " + allotment.getRoomNumber() + " was not found.");
            }
            int capacity = Math.max(0, room.getCapacity());
            String roomKey = roomKey(allotment.getHotelId(), allotment.getRoomNumber());

            int used = 0;
            String lock = "";
            for (StayAllotment row : existing) {
                if (row == null || row.getGuests() == null) {
                    continue;
                }
                if (!roomKey.equals(roomKey(row.getHotelId(), row.getRoomNumber()))) {
                    continue;
                }
                String rowBooking = row.getBookingId() == null ? "" : row.getBookingId().trim();
                for (AllotmentGuest guest : row.getGuests()) {
                    String key = guestIdentityKey(guest, rowBooking);
                    if (!key.isBlank() && movingKeys.contains(key)) {
                        continue;
                    }
                    if (!guestOverlapsAllotment(guest, row, allotment)) {
                        continue;
                    }
                    used += 1;
                    lock = mergeGenderLock(lock, normalizeGender(guest.getGender()));
                }
            }
            for (OccupancySlice slice : planned) {
                if (!roomKey.equals(slice.roomKey)) {
                    continue;
                }
                if (!staysOverlap(slice.start, slice.end, allotmentWindowStart(allotment),
                        allotmentWindowEnd(allotment))) {
                    continue;
                }
                used += 1;
                lock = mergeGenderLock(lock, slice.gender);
            }

            List<AllotmentGuest> guests = allotment.getGuests() == null ? List.of() : allotment.getGuests();
            if (used + guests.size() > capacity) {
                throw new ApiException(HttpStatus.CONFLICT, "ROOM_FULL",
                        "Room " + allotment.getRoomNumber() + " in " + allotment.getHotelName()
                                + " does not have enough free beds (capacity " + capacity + ").");
            }
            // Gender lock is only vs other parties already in the room (or earlier in this
            // batch). A whole family may be mixed — do not segregate within one placement.
            // Alone (single-person) parties must still match the room's exclusive gender lock.
            String partyGender = "";
            for (AllotmentGuest guest : guests) {
                partyGender = mergeGenderLock(partyGender, normalizeGender(guest.getGender()));
            }
            if (!lock.isBlank() && !"mixed".equals(lock) && !partyGender.isBlank() && !partyGender.equals(lock)) {
                throw new ApiException(HttpStatus.CONFLICT, "GENDER_MISMATCH",
                        "Room " + allotment.getRoomNumber() + " already has "
                                + lock + " guests — cannot add "
                                + ("mixed".equals(partyGender) ? "a mixed family" : (partyGender + " guest"))
                                + ".");
            }
            for (AllotmentGuest guest : guests) {
                String gender = normalizeGender(guest.getGender());
                planned.add(new OccupancySlice(
                        roomKey,
                        guestStayStart(guest, allotment),
                        guestStayEnd(guest, allotment),
                        gender
                ));
            }
        }
    }

    private static boolean guestOverlapsAllotment(AllotmentGuest guest,
                                                  StayAllotment existing,
                                                  StayAllotment incoming) {
        String startA = guestStayStart(guest, existing);
        String endA = guestStayEnd(guest, existing);
        // Overlap if guest stay overlaps any incoming guest stay (or the party window).
        if (incoming.getGuests() != null) {
            for (AllotmentGuest other : incoming.getGuests()) {
                if (staysOverlap(startA, endA, guestStayStart(other, incoming), guestStayEnd(other, incoming))) {
                    return true;
                }
            }
        }
        return staysOverlap(startA, endA, allotmentWindowStart(incoming), allotmentWindowEnd(incoming));
    }

    private static String allotmentWindowStart(StayAllotment allotment) {
        String start = blankToEmpty(allotment.getCheckInDate());
        if (allotment.getGuests() != null) {
            for (AllotmentGuest guest : allotment.getGuests()) {
                String s = guestStayStart(guest, allotment);
                if (!s.isBlank() && (start.isBlank() || s.compareTo(start) < 0)) {
                    start = s;
                }
            }
        }
        return start;
    }

    private static String allotmentWindowEnd(StayAllotment allotment) {
        String end = blankToEmpty(allotment.getCheckOutDate());
        if (allotment.getGuests() != null) {
            for (AllotmentGuest guest : allotment.getGuests()) {
                String e = guestStayEnd(guest, allotment);
                if (!e.isBlank() && (end.isBlank() || e.compareTo(end) > 0)) {
                    end = e;
                }
            }
        }
        return end;
    }

    private static String guestStayStart(AllotmentGuest guest, StayAllotment allotment) {
        String start = guest == null || guest.getStayStartDate() == null ? "" : guest.getStayStartDate().trim();
        if (!start.isBlank()) {
            return start;
        }
        return allotment == null || allotment.getCheckInDate() == null ? "" : allotment.getCheckInDate().trim();
    }

    private static String guestStayEnd(AllotmentGuest guest, StayAllotment allotment) {
        String end = guest == null || guest.getStayEndDate() == null ? "" : guest.getStayEndDate().trim();
        if (!end.isBlank()) {
            return end;
        }
        return allotment == null || allotment.getCheckOutDate() == null ? "" : allotment.getCheckOutDate().trim();
    }

    /** Half-open [start, end): checkout day frees the bed. */
    private static boolean staysOverlap(String startA, String endA, String startB, String endB) {
        String a0 = blankToEmpty(startA);
        String a1 = blankToEmpty(endA);
        String b0 = blankToEmpty(startB);
        String b1 = blankToEmpty(endB);
        if (a0.isBlank() || a1.isBlank() || b0.isBlank() || b1.isBlank()) {
            return true;
        }
        return a0.compareTo(b1) < 0 && b0.compareTo(a1) < 0;
    }

    private static String roomKey(String hotelId, String roomNumber) {
        return blankToEmpty(hotelId) + "|" + blankToEmpty(roomNumber);
    }

    private static String normalizeGender(String value) {
        String g = blankToEmpty(value).toLowerCase(Locale.ROOT);
        if ("male".equals(g) || "m".equals(g) || "gents".equals(g) || "gents_only".equals(g)) {
            return "male";
        }
        if ("female".equals(g) || "f".equals(g) || "ladies".equals(g) || "ladies_only".equals(g)) {
            return "female";
        }
        return "";
    }

    private static String mergeGenderLock(String current, String next) {
        if (next == null || next.isBlank()) {
            return current == null ? "" : current;
        }
        if (current == null || current.isBlank()) {
            return next;
        }
        if ("mixed".equals(current) || current.equals(next)) {
            return current;
        }
        return "mixed";
    }

    private static String normalizePersonStatus(String status) {
        String value = blankToEmpty(status).toLowerCase(Locale.ROOT);
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

    private static String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private List<Map<String, Object>> stripGuestsFromEventAllotments(
            String eventId,
            Set<String> guestKeys,
            Map<String, Map<String, String>> targetsByGuestKey) {
        return stripGuestsFromEventAllotments(eventId, guestKeys, Set.of(), targetsByGuestKey);
    }

    private List<Map<String, Object>> stripGuestsFromEventAllotments(
            String eventId,
            Set<String> guestKeys,
            Set<String> bookingIds,
            Map<String, Map<String, String>> targetsByGuestKey) {
        List<Map<String, Object>> moves = new ArrayList<>();
        boolean hasKeys = guestKeys != null && !guestKeys.isEmpty();
        boolean hasBookings = bookingIds != null && !bookingIds.isEmpty();
        if (!hasKeys && !hasBookings) {
            return moves;
        }
        Set<String> keys = guestKeys == null ? Set.of() : guestKeys;
        Set<String> bookings = bookingIds == null ? Set.of() : bookingIds;
        Set<String> reportedKeys = new HashSet<>();
        List<StayAllotment> existing = stayAllotmentRepository.findByEventId(eventId);
        for (StayAllotment row : existing) {
            if (row == null || row.getGuests() == null || row.getGuests().isEmpty()) {
                continue;
            }
            List<AllotmentGuest> kept = new ArrayList<>();
            boolean changed = false;
            String rowBookingId = row.getBookingId() == null ? "" : row.getBookingId().trim();
            boolean wipeBooking = !rowBookingId.isBlank() && bookings.contains(rowBookingId);
            String fromHotelId = row.getHotelId() == null ? "" : row.getHotelId().trim();
            String fromHotel = row.getHotelName() == null ? "" : row.getHotelName().trim();
            String fromRoom = row.getRoomNumber() == null ? "" : row.getRoomNumber().trim();
            for (AllotmentGuest guest : row.getGuests()) {
                String key = guestIdentityKey(guest, rowBookingId);
                String nameKey = guestNameKey(guest.getName(), rowBookingId);
                String mobileOrBare = guestIdentityKey(guest, "");
                boolean matched = wipeBooking
                        || (!key.isBlank() && keys.contains(key))
                        || (!nameKey.isBlank() && keys.contains(nameKey))
                        || (!mobileOrBare.isBlank() && keys.contains(mobileOrBare));
                if (matched) {
                    String status = normalizePersonStatus(guest.getPersonStatus());
                    if ("checked_in".equals(status) || "checked_out".equals(status)) {
                        String name = guest.getName() == null ? "Guest" : guest.getName();
                        throw new ApiException(HttpStatus.CONFLICT, "GUEST_CHECKED_IN",
                                "Cannot move or release " + name
                                        + " — already checked in or out at the hotel.");
                    }
                    changed = true;
                    String reportKey = !key.isBlank() ? key : mobileOrBare;
                    Map<String, String> target = null;
                    if (targetsByGuestKey != null) {
                        if (!key.isBlank()) {
                            target = targetsByGuestKey.get(key);
                        }
                        if (target == null && !mobileOrBare.isBlank()) {
                            target = targetsByGuestKey.get(mobileOrBare);
                        }
                    }
                    if (!reportKey.isBlank() && !reportedKeys.contains(reportKey)) {
                        if (target != null) {
                            String toHotelId = target.getOrDefault("hotelId", "");
                            String toRoom = target.getOrDefault("roomNumber", "");
                            boolean sameRoom = fromHotelId.equals(toHotelId) && fromRoom.equals(toRoom);
                            if (!sameRoom) {
                                Map<String, Object> move = new LinkedHashMap<>();
                                move.put("name", target.getOrDefault("name",
                                        guest.getName() == null ? "" : guest.getName()));
                                move.put("fromHotel", fromHotel);
                                move.put("fromRoom", fromRoom);
                                move.put("toHotel", target.getOrDefault("hotelName", ""));
                                move.put("toRoom", toRoom);
                                moves.add(move);
                                reportedKeys.add(reportKey);
                            }
                        } else {
                            Map<String, Object> move = new LinkedHashMap<>();
                            move.put("name", guest.getName() == null ? "" : guest.getName());
                            move.put("fromHotel", fromHotel);
                            move.put("fromRoom", fromRoom);
                            move.put("toHotel", "");
                            move.put("toRoom", "");
                            moves.add(move);
                            reportedKeys.add(reportKey);
                        }
                    }
                    continue;
                }
                kept.add(guest);
            }
            if (!changed) {
                continue;
            }
            if (kept.isEmpty()) {
                stayAllotmentRepository.delete(row);
                continue;
            }
            AllotmentGuest primary = kept.stream().filter(AllotmentGuest::isPrimary).findFirst()
                    .orElse(kept.get(0));
            row.setGuests(kept);
            row.setFamilyMobile(primary.getMobile());
            row.setFamilyFullName(primary.getName());
            stayAllotmentRepository.save(row);
        }
        return moves;
    }

    private record OccupancySlice(String roomKey, String start, String end, String gender) {
    }

    private PlaceInfo placeFromMap(Map<String, Object> place) {
        if (place == null || place.isEmpty()) {
            return null;
        }
        PlaceInfo info = new PlaceInfo();
        Object kind = place.get("kind");
        info.setKind(kind == null ? "" : String.valueOf(kind));
        Object city = place.get("city");
        info.setCity(city == null ? "" : String.valueOf(city));
        Object village = place.get("village");
        info.setVillage(village == null ? "" : String.valueOf(village));
        Object town = place.get("town");
        info.setTown(town == null ? "" : String.valueOf(town));
        Object district = place.get("district");
        info.setDistrict(district == null ? "" : String.valueOf(district));
        Object state = place.get("state");
        info.setState(state == null ? "" : String.valueOf(state));
        Object country = place.get("country");
        info.setCountry(country == null ? "" : String.valueOf(country));
        return info;
    }

    private void requireViewer(Person actor) {
        if (actor == null || actor.getRoles() == null
                || (!actor.getRoles().contains(SanghaRole.ACCOMMODATION_VOLUNTEER)
                && !actor.getRoles().contains(SanghaRole.ACCOMMODATION_ADMIN)
                && !actor.getRoles().contains(SanghaRole.PSSM_ADMIN)
                && !actor.getRoles().contains(SanghaRole.EVENT_ORGANIZER))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "Not allowed to view who is staying in hotels.");
        }
    }

    private Map<String, Object> toView(StayAllotment allotment) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", allotment.getId());
        view.put("eventId", allotment.getEventId());
        view.put("eventName", allotment.getEventName());
        view.put("bookingId", allotment.getBookingId());
        view.put("plan", allotment.getPlan());
        view.put("status", allotment.getStatus());
        view.put("hotelId", allotment.getHotelId());
        view.put("hotelName", allotment.getHotelName());
        view.put("roomNumber", allotment.getRoomNumber());
        view.put("roomType", allotment.getRoomType());
        view.put("roomKind", allotment.getRoomKind());
        view.put("familyMobile", allotment.getFamilyMobile());
        view.put("familyFullName", allotment.getFamilyFullName());
        view.put("checkInDate", allotment.getCheckInDate());
        view.put("checkOutDate", allotment.getCheckOutDate());
        view.put("createdAt", allotment.getCreatedAt() == null ? null : allotment.getCreatedAt().toString());
        view.put("place", profileMapper.placeToMap(allotment.getPlace()));

        List<Map<String, Object>> guests = new ArrayList<>();
        List<AllotmentGuest> guestList = allotment.getGuests() == null ? List.of() : allotment.getGuests();
        for (AllotmentGuest guest : guestList) {
            if (guest == null) {
                continue;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            String guestKey = guest.getGuestKey();
            if (guestKey == null || guestKey.isBlank()) {
                guestKey = allotment.getId() + ":g" + guests.size();
            }
            String personStatus = guest.getPersonStatus();
            if (personStatus == null || personStatus.isBlank()) {
                personStatus = "allotted";
            }
            row.put("guestKey", guestKey);
            row.put("personId", allotment.getId() + "::" + guestKey);
            row.put("name", guest.getName());
            row.put("relation", guest.getRelation());
            row.put("mobile", guest.getMobile());
            row.put("gender", guest.getGender());
            row.put("age", guest.getAge());
            row.put("livePhoto", guest.getLivePhoto());
            row.put("idProofPhoto", guest.getIdProofPhoto());
            row.put("idType", guest.getIdType());
            row.put("stayStartDate", guest.getStayStartDate());
            row.put("stayEndDate", guest.getStayEndDate());
            row.put("primary", guest.isPrimary());
            row.put("personStatus", personStatus);
            guests.add(row);
        }
        view.put("guests", guests);
        view.put("personCount", guests.size());
        return view;
    }
}
