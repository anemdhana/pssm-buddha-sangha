package com.pssm.sangha.service;

import com.pssm.sangha.common.ApiException;
import com.pssm.sangha.domain.Hotel;
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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
                id, q, hotelId, roomType, roomKind, gender, status, location);

        long total = allotmentQueryRepository.count(filters);
        List<Map<String, Object>> items = new ArrayList<>();
        for (StayAllotment allotment : allotmentQueryRepository.search(filters, page, size)) {
            items.add(toView(allotment));
        }

        Map<String, Object> stats = allotmentQueryRepository.stats(filters);
        Map<String, Object> facets = new LinkedHashMap<>();
        facets.put("hotels", allotmentQueryRepository.hotelFacets(filters));
        facets.put("locations", allotmentQueryRepository.locationFacets(filters));

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
        int index = 0;
        for (PlacementDto placement : placements) {
            if (placement == null) {
                continue;
            }
            String hotelId = placement.hotelId == null ? "" : placement.hotelId.trim();
            Hotel hotel = hotelRepository.findById(hotelId)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                            "Hotel not found for allotment."));
            if (!hotel.isActive() || hotel.isReserved()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Hotel not available for allotment (" + hotel.getName() + ").");
            }
            String roomNumber = placement.roomNumber == null ? "" : placement.roomNumber.trim();
            if (roomNumber.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Room number is required.");
            }

            StayAllotment allotment = new StayAllotment();
            allotment.setId("allot_" + System.currentTimeMillis() + "_" + index++);
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
            allotment.setCheckInDate(placement.checkInDate == null ? "" : placement.checkInDate.trim());
            allotment.setCheckOutDate(placement.checkOutDate == null ? "" : placement.checkOutDate.trim());
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
                guest.setPrimary(Boolean.TRUE.equals(member.primary) || (i == 0 && guests.isEmpty()));
                guests.add(guest);
                String key = guestIdentityKey(guest, allotment.getBookingId());
                if (!key.isBlank()) {
                    guestKeys.add(key);
                }
            }
            if (guests.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Each placement needs at least one person.");
            }
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
        for (GuestDto member : members) {
            if (member == null) {
                continue;
            }
            AllotmentGuest guest = new AllotmentGuest();
            guest.setName(member.name == null ? "" : member.name.trim());
            guest.setMobile(PasswordSupport.normalizeMobile(member.mobile));
            String key = guestIdentityKey(guest, "");
            if (!key.isBlank()) {
                guestKeys.add(key);
            }
        }
        if (guestKeys.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "No people to move to wait list.");
        }
        List<Map<String, Object>> released =
                stripGuestsFromEventAllotments(eventId, guestKeys, null);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("released", released.size());
        data.put("moves", released);
        return data;
    }

    private static String guestIdentityKey(AllotmentGuest guest, String bookingId) {
        if (guest == null) {
            return "";
        }
        String mobile = guest.getMobile() == null ? "" : guest.getMobile().trim();
        if (!mobile.isBlank()) {
            return "m:" + mobile;
        }
        String name = guest.getName() == null ? "" : guest.getName().trim().toLowerCase();
        if (name.isBlank()) {
            return "";
        }
        String booking = bookingId == null ? "" : bookingId.trim();
        return "n:" + booking + ":" + name;
    }

    private List<Map<String, Object>> stripGuestsFromEventAllotments(
            String eventId,
            Set<String> guestKeys,
            Map<String, Map<String, String>> targetsByGuestKey) {
        List<Map<String, Object>> moves = new ArrayList<>();
        if (guestKeys == null || guestKeys.isEmpty()) {
            return moves;
        }
        Set<String> reportedKeys = new HashSet<>();
        List<StayAllotment> existing = stayAllotmentRepository.findByEventId(eventId);
        for (StayAllotment row : existing) {
            if (row == null || row.getGuests() == null || row.getGuests().isEmpty()) {
                continue;
            }
            List<AllotmentGuest> kept = new ArrayList<>();
            boolean changed = false;
            String fromHotelId = row.getHotelId() == null ? "" : row.getHotelId().trim();
            String fromHotel = row.getHotelName() == null ? "" : row.getHotelName().trim();
            String fromRoom = row.getRoomNumber() == null ? "" : row.getRoomNumber().trim();
            for (AllotmentGuest guest : row.getGuests()) {
                String key = guestIdentityKey(guest, row.getBookingId());
                if (!key.isBlank() && guestKeys.contains(key)) {
                    changed = true;
                    Map<String, String> target =
                            targetsByGuestKey == null ? null : targetsByGuestKey.get(key);
                    if (!reportedKeys.contains(key)) {
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
                                reportedKeys.add(key);
                            }
                        } else {
                            Map<String, Object> move = new LinkedHashMap<>();
                            move.put("name", guest.getName() == null ? "" : guest.getName());
                            move.put("fromHotel", fromHotel);
                            move.put("fromRoom", fromRoom);
                            move.put("toHotel", "");
                            move.put("toRoom", "");
                            moves.add(move);
                            reportedKeys.add(key);
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
            row.put("name", guest.getName());
            row.put("relation", guest.getRelation());
            row.put("mobile", guest.getMobile());
            row.put("gender", guest.getGender());
            row.put("age", guest.getAge());
            row.put("livePhoto", guest.getLivePhoto());
            row.put("primary", guest.isPrimary());
            guests.add(row);
        }
        view.put("guests", guests);
        view.put("personCount", guests.size());
        return view;
    }
}
