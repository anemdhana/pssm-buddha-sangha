package com.pssm.sangha.service;

import com.pssm.sangha.common.ApiException;
import com.pssm.sangha.domain.Hotel;
import com.pssm.sangha.domain.Hotel.DeskPerson;
import com.pssm.sangha.domain.Hotel.HotelRoom;
import com.pssm.sangha.domain.Person;
import com.pssm.sangha.domain.SanghaRole;
import com.pssm.sangha.repo.HotelRepository;
import com.pssm.sangha.repo.PersonRepository;
import com.pssm.sangha.web.dto.HotelDtos.DeskPersonRequest;
import com.pssm.sangha.web.dto.HotelDtos.HotelRequest;
import com.pssm.sangha.web.dto.HotelDtos.HotelRoomRequest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HotelService {

    private final HotelRepository hotelRepository;
    private final PersonRepository personRepository;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    public HotelService(HotelRepository hotelRepository,
                        PersonRepository personRepository,
                        AuthService authService,
                        PasswordEncoder passwordEncoder) {
        this.hotelRepository = hotelRepository;
        this.personRepository = personRepository;
        this.authService = authService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listHotels(String eventIdRaw) {
        requireHotelReader();
        String eventId = eventIdRaw == null ? "" : eventIdRaw.trim();
        if (eventId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Event id is required.");
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Hotel hotel : hotelRepository.findByEventIdOrderByDistanceKmAscNameAsc(eventId)) {
            rows.add(toMap(hotel, null));
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHotel(String id) {
        requireHotelReader();
        return toMap(findOrThrow(id), null);
    }

    @Transactional
    public Map<String, Object> createHotel(HotelRequest body) {
        Person actor = requireHotelAdmin();
        Hotel hotel = new Hotel();
        hotel.setId("htl_" + System.currentTimeMillis());
        hotel.setCreatedBy(actor.getMobile());
        hotel.setCreatedAt(Instant.now());
        Map<String, String> temps = applyRequest(hotel, body, true);
        hotel.setUpdatedAt(Instant.now());
        hotelRepository.save(hotel);
        return toMap(hotel, temps);
    }

    @Transactional
    public Map<String, Object> updateHotel(String id, HotelRequest body) {
        requireHotelAdmin();
        Hotel hotel = findOrThrow(id);
        Map<String, String> temps = applyRequest(hotel, body, false);
        hotel.setUpdatedAt(Instant.now());
        hotelRepository.save(hotel);
        return toMap(hotel, temps);
    }

    private Map<String, String> applyRequest(Hotel hotel, HotelRequest body, boolean creating) {
        if (body == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Hotel details are required.");
        }
        String name = body.name == null ? "" : body.name.trim();
        if (name.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter the hotel name.");
        }
        String address = body.address == null ? "" : body.address.trim();
        if (address.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter the hotel address.");
        }
        String contact = body.contact == null ? "" : body.contact.trim();
        if (contact.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter the hotel contact number.");
        }
        if (body.distanceKm == null || body.distanceKm < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                    "Enter distance from the event place in kilometres (0 or more).");
        }
        String eventId = body.eventId == null ? "" : body.eventId.trim();
        if (creating) {
            if (eventId.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Select an event before adding a hotel.");
            }
            hotel.setEventId(eventId);
        } else if (!eventId.isBlank()) {
            hotel.setEventId(eventId);
        }
        if (hotel.getEventId() == null || hotel.getEventId().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                    "Hotel must belong to an event.");
        }

        hotel.setName(name);
        hotel.setAddress(address);
        hotel.setContact(contact);
        hotel.setImage(body.image == null ? "" : body.image.trim());
        hotel.setDistanceKm(body.distanceKm);
        if (body.active != null || creating) {
            hotel.setActive(body.active == null || Boolean.TRUE.equals(body.active));
        }
        if (body.reserved != null || creating) {
            hotel.setReserved(Boolean.TRUE.equals(body.reserved));
        }
        hotel.setRooms(normalizeRooms(body.rooms));
        if (body.deskPeople == null && !creating) {
            return Map.of();
        }
        return applyDeskPeople(hotel, body.deskPeople);
    }

    private Map<String, String> applyDeskPeople(Hotel hotel, List<DeskPersonRequest> rawPeople) {
        List<DeskPersonRequest> input = rawPeople == null ? List.of() : rawPeople;
        if (input.size() > 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                    "At most 3 Hotel Desk people can be attached to a hotel.");
        }

        List<DeskPerson> previous = hotel.getDeskPeople() == null ? List.of() : hotel.getDeskPeople();
        Set<String> previousContacts = new HashSet<>();
        for (DeskPerson prev : previous) {
            if (prev == null) {
                continue;
            }
            String dig = PasswordSupport.normalizeMobile(prev.getContact());
            if (!dig.isBlank()) {
                previousContacts.add(dig);
            }
        }

        List<DeskPerson> next = new ArrayList<>();
        Map<String, String> tempsByContact = new LinkedHashMap<>();
        Set<String> seenContacts = new HashSet<>();
        int index = 0;
        for (DeskPersonRequest raw : input) {
            index++;
            if (raw == null) {
                continue;
            }
            String personName = raw.name == null ? "" : raw.name.trim();
            String personContact = PasswordSupport.normalizeMobile(raw.contact);
            if (personName.isBlank() && personContact.isBlank()) {
                continue;
            }
            if (personName.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Enter name for Hotel Desk person " + index + ".");
            }
            if (personContact.isBlank() || personContact.length() < 10) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Enter a valid contact number for Hotel Desk person " + personName + ".");
            }
            if (!seenContacts.add(personContact)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Duplicate Hotel Desk contact " + personContact + ".");
            }

            DeskPerson row = new DeskPerson();
            String id = raw.id == null ? "" : raw.id.trim();
            if (id.isBlank()) {
                id = "hdesk_" + hotel.getId() + "_" + personContact;
            }
            row.setId(id);
            row.setName(personName);
            row.setContact(personContact);
            next.add(row);

            String temp = syncDeskLogin(hotel, personName, personContact);
            if (temp != null && !temp.isBlank()) {
                tempsByContact.put(personContact, temp);
            }
        }

        hotel.setDeskPeople(next);

        Set<String> kept = new HashSet<>(seenContacts);
        for (String oldContact : previousContacts) {
            if (!kept.contains(oldContact)) {
                clearDeskBinding(oldContact, hotel.getId());
            }
        }
        return tempsByContact;
    }

    private String syncDeskLogin(Hotel hotel, String personName, String contact) {
        String temp = PasswordSupport.hotelDeskPassword(hotel.getName(), personName, contact);
        if (temp.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                    "Could not generate a temporary password for " + personName + ".");
        }
        Optional<Person> existing = personRepository.findByMobile(contact);
        Person person;
        if (existing.isPresent()) {
            person = existing.get();
            person.setFullName(personName);
        } else {
            person = new Person();
            person.setMobile(contact);
            person.setFullName(personName);
        }
        Set<String> roles = person.getRoles() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(person.getRoles());
        roles.add(SanghaRole.HOTEL_DESK);
        person.setRoles(roles);
        person.setHotelId(hotel.getId());
        person.setPasswordHash(passwordEncoder.encode(temp));
        personRepository.save(person);
        return temp;
    }

    private void clearDeskBinding(String contact, String hotelId) {
        personRepository.findByMobile(contact).ifPresent(person -> {
            String bound = person.getHotelId() == null ? "" : person.getHotelId().trim();
            if (!bound.equals(hotelId)) {
                return;
            }
            Set<String> roles = person.getRoles() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(person.getRoles());
            roles.remove(SanghaRole.HOTEL_DESK);
            person.setRoles(roles);
            if (roles.isEmpty() || !roles.contains(SanghaRole.HOTEL_DESK)) {
                person.setHotelId(null);
            }
            // Keep account/password; only drop hotel_desk binding.
            personRepository.save(person);
        });
    }

    private List<HotelRoom> normalizeRooms(List<HotelRoomRequest> rawRooms) {
        List<HotelRoomRequest> input = rawRooms == null ? List.of() : rawRooms;
        List<HotelRoom> rooms = new ArrayList<>();
        Set<String> seenNumbers = new LinkedHashSet<>();
        int index = 0;
        for (HotelRoomRequest raw : input) {
            index++;
            if (raw == null) {
                continue;
            }
            String number = raw.roomNumber == null ? "" : raw.roomNumber.trim();
            if (number.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Enter room number for room row " + index + ".");
            }
            String key = number.toLowerCase(Locale.ROOT);
            if (!seenNumbers.add(key)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Room number " + number + " is duplicated in this hotel.");
            }
            if (raw.capacity == null || raw.capacity < 1) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                        "Enter capacity (persons) for room " + number + ".");
            }
            String kind = normalizeKind(raw.kind);
            String roomType = normalizeRoomType(raw.roomType);
            String gender = normalizeGender(raw.genderAllowed, kind, number);
            String status = normalizeStatus(raw.status);

            HotelRoom room = new HotelRoom();
            room.setRoomNumber(number);
            room.setCapacity(raw.capacity);
            room.setKind(kind);
            room.setRoomType(roomType);
            room.setGenderAllowed(gender);
            room.setStatus(status);
            rooms.add(room);
        }
        return rooms;
    }

    private static String normalizeKind(String kind) {
        String value = kind == null ? "" : kind.trim().toLowerCase(Locale.ROOT).replace('-', '_');
        if ("dormitory".equals(value) || "dorm".equals(value)) {
            return "dormitory";
        }
        if ("hall".equals(value)) {
            return "hall";
        }
        return "regular";
    }

    private static String normalizeRoomType(String roomType) {
        String value = roomType == null ? "" : roomType.trim().toLowerCase(Locale.ROOT).replace('-', '_');
        if ("non_ac".equals(value) || "nonac".equals(value) || "non_a.c".equals(value) || "non ac".equals(value)) {
            return "non_ac";
        }
        return "ac";
    }

    private static String normalizeGender(String genderAllowed, String kind, String roomNumber) {
        boolean needsGender = "dormitory".equals(kind) || "hall".equals(kind);
        String value = genderAllowed == null ? "" : genderAllowed.trim().toLowerCase(Locale.ROOT);
        if (!needsGender) {
            return "";
        }
        if ("gents".equals(value) || "gents_only".equals(value) || "male".equals(value)) {
            return "gents";
        }
        if ("ladies".equals(value) || "ladies_only".equals(value) || "female".equals(value)) {
            return "ladies";
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                "Choose who may stay (Gents or Ladies) for dormitory/hall room " + roomNumber + ".");
    }

    private static String normalizeStatus(String status) {
        String value = status == null ? "" : status.trim().toLowerCase(Locale.ROOT);
        if ("occupied".equals(value)) {
            return "occupied";
        }
        return "available";
    }

    private Hotel findOrThrow(String id) {
        String hotelId = id == null ? "" : id.trim();
        if (hotelId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Hotel id is required.");
        }
        return hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Hotel not found."));
    }

    private Person requireHotelAdmin() {
        Person actor = authService.currentPerson();
        if (actor.getRoles() == null
                || (!actor.getRoles().contains(SanghaRole.ACCOMMODATION_ADMIN)
                && !actor.getRoles().contains(SanghaRole.PSSM_ADMIN))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "Only an Accommodation Admin can manage hotels and rooms.");
        }
        return actor;
    }

    /** Volunteers / organizers need hotel inventory to propose allotments. */
    private Person requireHotelReader() {
        Person actor = authService.currentPerson();
        if (actor.getRoles() == null
                || (!actor.getRoles().contains(SanghaRole.ACCOMMODATION_ADMIN)
                && !actor.getRoles().contains(SanghaRole.ACCOMMODATION_VOLUNTEER)
                && !actor.getRoles().contains(SanghaRole.EVENT_ORGANIZER)
                && !actor.getRoles().contains(SanghaRole.PSSM_ADMIN)
                && !actor.getRoles().contains(SanghaRole.HOTEL_DESK))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Not allowed to view hotels.");
        }
        return actor;
    }

    private Map<String, Object> toMap(Hotel hotel, Map<String, String> tempsByContact) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", hotel.getId());
        view.put("eventId", hotel.getEventId());
        view.put("name", hotel.getName());
        view.put("address", hotel.getAddress());
        view.put("contact", hotel.getContact());
        view.put("image", hotel.getImage() == null ? "" : hotel.getImage());
        view.put("distanceKm", hotel.getDistanceKm());
        view.put("active", hotel.isActive());
        view.put("reserved", hotel.isReserved());
        view.put("createdBy", hotel.getCreatedBy());
        view.put("createdAt", hotel.getCreatedAt() == null ? null : hotel.getCreatedAt().toString());
        view.put("updatedAt", hotel.getUpdatedAt() == null ? null : hotel.getUpdatedAt().toString());

        List<Map<String, Object>> rooms = new ArrayList<>();
        int capacityTotal = 0;
        if (hotel.getRooms() != null) {
            for (HotelRoom room : hotel.getRooms()) {
                if (room == null) {
                    continue;
                }
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("roomNumber", room.getRoomNumber());
                row.put("capacity", room.getCapacity());
                row.put("kind", room.getKind());
                row.put("roomType", room.getRoomType());
                row.put("genderAllowed", room.getGenderAllowed() == null ? "" : room.getGenderAllowed());
                row.put("status", room.getStatus());
                rooms.add(row);
                capacityTotal += Math.max(0, room.getCapacity());
            }
        }
        view.put("rooms", rooms);
        view.put("roomCount", rooms.size());
        view.put("capacityTotal", capacityTotal);

        List<Map<String, Object>> deskPeople = new ArrayList<>();
        if (hotel.getDeskPeople() != null) {
            for (DeskPerson desk : hotel.getDeskPeople()) {
                if (desk == null) {
                    continue;
                }
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", desk.getId());
                row.put("name", desk.getName());
                row.put("contact", desk.getContact());
                row.put("role", SanghaRole.HOTEL_DESK);
                if (tempsByContact != null) {
                    String temp = tempsByContact.get(PasswordSupport.normalizeMobile(desk.getContact()));
                    if (temp != null && !temp.isBlank()) {
                        row.put("temporaryPassword", temp);
                    }
                }
                deskPeople.add(row);
            }
        }
        view.put("deskPeople", deskPeople);
        view.put("deskPeopleCount", deskPeople.size());
        return view;
    }
}
