package com.pssm.sangha.service;

import com.pssm.sangha.common.ApiException;
import com.pssm.sangha.domain.Person;
import com.pssm.sangha.domain.SanghaEvent;
import com.pssm.sangha.domain.SanghaRole;
import com.pssm.sangha.domain.StayAllotment;
import com.pssm.sangha.domain.StayBooking;
import com.pssm.sangha.domain.StayBooking.StayGuest;
import com.pssm.sangha.repo.PersonRepository;
import com.pssm.sangha.repo.SanghaEventRepository;
import com.pssm.sangha.repo.StayAllotmentRepository;
import com.pssm.sangha.repo.StayBookingQueryRepository;
import com.pssm.sangha.repo.StayBookingQueryRepository.BookingFilters;
import com.pssm.sangha.repo.StayBookingRepository;
import com.pssm.sangha.web.dto.PageDtos;
import com.pssm.sangha.web.dto.ProfileDtos.MemberDto;
import com.pssm.sangha.web.dto.ProfileDtos.ProfileDto;
import com.pssm.sangha.web.dto.StayBookingDtos.CreateStayBookingRequest;
import com.pssm.sangha.web.dto.StayBookingDtos.UpdateStayBookingRequest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
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
public class StayBookingService {

    private final StayBookingRepository stayBookingRepository;
    private final StayBookingQueryRepository stayBookingQueryRepository;
    private final StayAllotmentRepository stayAllotmentRepository;
    private final SanghaEventRepository eventRepository;
    private final PersonRepository personRepository;
    private final ProfileMapper profileMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public StayBookingService(StayBookingRepository stayBookingRepository,
                              StayBookingQueryRepository stayBookingQueryRepository,
                              StayAllotmentRepository stayAllotmentRepository,
                              SanghaEventRepository eventRepository,
                              PersonRepository personRepository,
                              ProfileMapper profileMapper,
                              PasswordEncoder passwordEncoder,
                              AuthService authService) {
        this.stayBookingRepository = stayBookingRepository;
        this.stayBookingQueryRepository = stayBookingQueryRepository;
        this.stayAllotmentRepository = stayAllotmentRepository;
        this.eventRepository = eventRepository;
        this.personRepository = personRepository;
        this.profileMapper = profileMapper;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    @Transactional
    public Map<String, Object> create(CreateStayBookingRequest body) {
        Person actor = authService.currentPerson();
        if (body == null || body.family == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Family details are required.");
        }

        String plan = normalizePlan(body.plan);
        String eventId = body.eventId == null ? "" : body.eventId.trim();
        if (eventId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Select an event before booking.");
        }
        SanghaEvent event = eventRepository.findById(eventId).orElse(null);
        String eventName = event != null
                ? event.getName()
                : (body.eventName == null ? "" : body.eventName.trim());
        if (event == null && eventName.isBlank()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Event not found.");
        }

        boolean registerFamily = Boolean.TRUE.equals(body.registerFamily);
        if (registerFamily && !canManageRegistrations(actor)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "Only an Accommodation Volunteer can register a new visitor while booking.");
        }

        ProfileDto family = body.family;
        String fullName = family.fullName == null ? "" : family.fullName.trim();
        String mobile = PasswordSupport.normalizeMobile(family.mobile);
        validateFamilyIdentity(fullName, mobile);

        boolean newlyRegistered = false;
        String temporaryPassword = null;
        if (registerFamily) {
            temporaryPassword = registerNewPerson(family, fullName, mobile);
            newlyRegistered = true;
        } else if (!mobile.equals(actor.getMobile()) && !canManageRegistrations(actor)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "You can only book accommodation for your own family.");
        }

        LocalDate eventStart = event == null ? null : event.getStartDate();
        LocalDate eventEnd = event == null ? null : event.getEndDate();
        List<StayGuest> guests = buildGuests(family, eventStart, eventEnd);

        StayBooking booking = new StayBooking();
        booking.setEventId(eventId);
        booking.setEventName(eventName);
        booking.setPlan(plan);
        booking.setStatus("registered");
        booking.setCreatedByMobile(actor.getMobile());
        booking.setFamilyMobile(mobile);
        booking.setFamilyFullName(fullName);
        booking.setRegisteredFamily(newlyRegistered);
        booking.setPlace(profileMapper.toPlaceInfo(family.place));
        booking.setFamilyDetail(profileMapper.profileToMap(family));
        booking.setGuests(guests);
        booking.setCreatedAt(Instant.now());
        stayBookingRepository.save(booking);

        return createResponse(booking, temporaryPassword, newlyRegistered);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listForEvent(String eventId,
                                            String q,
                                            String gender,
                                            String ages,
                                            String meditation,
                                            String location,
                                            String stayRange,
                                            String allotment,
                                            Integer pageRaw,
                                            Integer sizeRaw) {
        requireRegistrationViewer(authService.currentPerson());
        String id = eventId == null ? "" : eventId.trim();
        if (id.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Event id is required.");
        }
        int page = PageDtos.normalizePage(pageRaw);
        int size = PageDtos.normalizeSize(sizeRaw);
        String allotmentMode = normalizeAllotmentMode(allotment);
        Set<String> allottedIds = resolveAllottedBookingIds(id);
        BookingFilters filters = new BookingFilters(
                id, q, gender, ages, meditation, location, stayRange, allotmentMode, allottedIds);

        long total = stayBookingQueryRepository.count(filters);
        List<Map<String, Object>> items = new ArrayList<>();
        for (StayBooking booking : stayBookingQueryRepository.search(filters, page, size)) {
            items.add(safeView(booking));
        }

        Map<String, Object> stats = buildRegistrationStats(filters, total, allottedIds);
        Map<String, Object> facets = new LinkedHashMap<>();
        facets.put("locations", stayBookingQueryRepository.locationFacets(filters));
        facets.put("stayRanges", stayBookingQueryRepository.stayRangeFacets(filters));

        return PageDtos.page(items, total, page, size, stats, facets);
    }

    private static String normalizeAllotmentMode(String allotment) {
        String raw = allotment == null ? "" : allotment.trim().toLowerCase(Locale.ROOT);
        if ("allotted".equals(raw) || "only".equals(raw) || "true".equals(raw) || "1".equals(raw)) {
            return "allotted";
        }
        return "wait";
    }

    private Set<String> resolveAllottedBookingIds(String eventId) {
        Set<String> allottedBookingIds = new HashSet<>();
        Set<String> allottedMobiles = new HashSet<>();
        for (StayAllotment allotment :
                stayAllotmentRepository.findByEventIdOrderByHotelNameAscRoomNumberAsc(eventId)) {
            if (allotment == null) {
                continue;
            }
            String bookingId = allotment.getBookingId() == null ? "" : allotment.getBookingId().trim();
            if (!bookingId.isBlank()) {
                allottedBookingIds.add(bookingId);
            }
            String mobile = PasswordSupport.normalizeMobile(allotment.getFamilyMobile());
            if (!mobile.isBlank()) {
                allottedMobiles.add(mobile);
            }
        }
        if (allottedMobiles.isEmpty()) {
            return allottedBookingIds;
        }
        BookingFilters eventOnly = new BookingFilters(eventId, "", "", "", "", "", "");
        long eventTotal = stayBookingQueryRepository.count(eventOnly);
        int eventLimit = (int) Math.min(Math.max(eventTotal, 0), 5000);
        for (StayBooking booking :
                stayBookingQueryRepository.search(eventOnly, 0, Math.max(eventLimit, 1))) {
            if (booking == null || booking.getId() == null) {
                continue;
            }
            if (allottedBookingIds.contains(booking.getId())) {
                continue;
            }
            String mobile = PasswordSupport.normalizeMobile(booking.getFamilyMobile());
            if (!mobile.isBlank() && allottedMobiles.contains(mobile)) {
                allottedBookingIds.add(booking.getId());
            }
        }
        return allottedBookingIds;
    }

    private Map<String, Object> safeView(StayBooking booking) {
        try {
            return toView(booking);
        } catch (RuntimeException ex) {
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("id", booking.getId());
            fallback.put("eventId", booking.getEventId());
            fallback.put("eventName", booking.getEventName());
            fallback.put("plan", booking.getPlan());
            fallback.put("status", booking.getStatus());
            fallback.put("familyMobile", booking.getFamilyMobile());
            fallback.put("familyFullName", booking.getFamilyFullName());
            fallback.put("bookedAt",
                    booking.getCreatedAt() == null ? null : booking.getCreatedAt().toString());
            fallback.put("createdAt",
                    booking.getCreatedAt() == null ? null : booking.getCreatedAt().toString());
            fallback.put("place", profileMapper.placeToMap(booking.getPlace()));
            fallback.put("guests", booking.getGuests() == null ? List.of() : booking.getGuests());
            int count = booking.getGuests() == null ? 0 : booking.getGuests().size();
            fallback.put("personCount", count);
            fallback.put("familyCount", Math.max(0, count - 1));
            fallback.put("family", Map.of());
            return fallback;
        }
    }

    private Map<String, Object> buildRegistrationStats(
            BookingFilters filters, long totalFamilies, Set<String> allottedBookingIds) {
        // Filtered stats from matching docs (cap scan for safety).
        int limit = (int) Math.min(Math.max(totalFamilies, 0), 5000);
        List<StayBooking> matched = stayBookingQueryRepository.search(filters, 0, Math.max(limit, 1));
        int people = 0;
        int rural = 0;
        int urban = 0;
        for (StayBooking booking : matched) {
            int count = booking.getGuests() == null ? 0 : booking.getGuests().size();
            people += count;
            String kind = booking.getPlace() == null ? "" : String.valueOf(booking.getPlace().getKind());
            if ("rural".equalsIgnoreCase(kind)) {
                rural += count;
            } else {
                urban += count;
            }
        }

        // Event-wide accommodation (independent of current list filters).
        BookingFilters eventOnly = new BookingFilters(filters.eventId(), "", "", "", "", "", "");
        long eventTotal = stayBookingQueryRepository.count(eventOnly);
        int eventLimit = (int) Math.min(Math.max(eventTotal, 0), 5000);
        List<StayBooking> eventBookings =
                stayBookingQueryRepository.search(eventOnly, 0, Math.max(eventLimit, 1));
        Set<String> allottedIds = allottedBookingIds == null ? Set.of() : allottedBookingIds;
        int waitList = 0;
        int allotted = 0;
        for (StayBooking booking : eventBookings) {
            int count = booking.getGuests() == null ? 0 : booking.getGuests().size();
            boolean isAllotted = booking.getId() != null && allottedIds.contains(booking.getId());
            if (isAllotted) {
                allotted += count;
            } else {
                waitList += count;
            }
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("families", totalFamilies);
        stats.put("people", people);
        stats.put("rural", rural);
        stats.put("urban", urban);
        stats.put("waitList", waitList);
        stats.put("allotted", allotted);
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getById(String bookingId) {
        requireRegistrationViewer(authService.currentPerson());
        StayBooking booking = findBookingOrThrow(bookingId);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("booking", toView(booking));
        return data;
    }

    @Transactional
    public void delete(String bookingId) {
        Person actor = authService.currentPerson();
        requireRegistrationViewer(actor);
        StayBooking booking = findBookingOrThrow(bookingId);
        stayBookingRepository.delete(booking);
    }

    @Transactional
    public Map<String, Object> update(String bookingId, UpdateStayBookingRequest body) {
        Person actor = authService.currentPerson();
        requireRegistrationViewer(actor);
        if (body == null || body.family == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Family details are required.");
        }
        StayBooking booking = findBookingOrThrow(bookingId);
        ProfileDto family = body.family;
        String fullName = family.fullName == null ? "" : family.fullName.trim();
        String mobile = PasswordSupport.normalizeMobile(family.mobile);
        validateFamilyIdentity(fullName, mobile);

        String existingMobile = PasswordSupport.normalizeMobile(booking.getFamilyMobile());
        if (!mobile.equals(existingMobile) && !canManageRegistrations(actor)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You cannot change the primary mobile on this registration.");
        }

        SanghaEvent event = eventRepository.findById(booking.getEventId()).orElse(null);
        LocalDate eventStart = event == null ? null : event.getStartDate();
        LocalDate eventEnd = event == null ? null : event.getEndDate();

        if (body.plan != null && !body.plan.isBlank()) {
            booking.setPlan(normalizePlan(body.plan));
        }

        booking.setFamilyMobile(mobile);
        booking.setFamilyFullName(fullName);
        booking.setPlace(profileMapper.toPlaceInfo(family.place));
        booking.setFamilyDetail(profileMapper.profileToMap(family));
        booking.setGuests(buildGuests(family, eventStart, eventEnd));

        if (Boolean.TRUE.equals(body.updateSanghaProfile)) {
            syncSanghaPerson(mobile, family);
        }

        stayBookingRepository.save(booking);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("booking", toView(booking));
        return data;
    }

    private Map<String, Object> createResponse(StayBooking booking, String temporaryPassword, boolean newlyRegistered) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("booking", toView(booking));
        if (temporaryPassword != null) {
            data.put("temporaryPassword", temporaryPassword);
            data.put("registeredFamily", newlyRegistered);
        }
        return data;
    }

    private void syncSanghaPerson(String mobile, ProfileDto family) {
        Optional<Person> existing = personRepository.findByMobile(mobile);
        if (existing.isEmpty()) {
            return;
        }
        Person person = existing.get();
        profileMapper.applyProfile(person, family, true);
        person.setMobile(mobile);
        person.setFullName(family.fullName == null ? "" : family.fullName.trim());
        personRepository.save(person);
    }

    private String registerNewPerson(ProfileDto family, String fullName, String mobile) {
        if (personRepository.existsByMobile(mobile)) {
            throw new ApiException(HttpStatus.CONFLICT, "MOBILE_TAKEN",
                    "This mobile is already registered. Book for them as an existing member, or use another mobile.");
        }
        if (family.birthDate == null || family.birthDate.isBlank()
                || family.birthMonth == null || family.birthMonth.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter birth date and month.");
        }
        Person person = new Person();
        profileMapper.applyProfile(person, family, true);
        person.setMobile(mobile);
        person.setFullName(fullName);
        String temporaryPassword = PasswordSupport.composedPassword(fullName, family.birthDate, family.birthMonth);
        if (temporaryPassword.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter birth date and month.");
        }
        person.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        if (person.getRoles() == null) {
            person.setRoles(new LinkedHashSet<>());
        }
        personRepository.save(person);
        return temporaryPassword;
    }

    private void validateFamilyIdentity(String fullName, String mobile) {
        if (fullName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter the visitor full name.");
        }
        if (mobile.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter the visitor mobile number.");
        }
    }

    private StayBooking findBookingOrThrow(String bookingId) {
        String id = bookingId == null ? "" : bookingId.trim();
        if (id.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Booking id is required.");
        }
        return stayBookingRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Registration not found."));
    }

    private void requireRegistrationViewer(Person actor) {
        if (!canManageRegistrations(actor)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Not allowed to view event registrations.");
        }
    }

    private boolean canManageRegistrations(Person actor) {
        if (actor == null || actor.getRoles() == null) {
            return false;
        }
        return actor.getRoles().contains(SanghaRole.ACCOMMODATION_VOLUNTEER)
                || actor.getRoles().contains(SanghaRole.PSSM_ADMIN)
                || actor.getRoles().contains(SanghaRole.EVENT_ORGANIZER);
    }

    private static String normalizePlan(String plan) {
        return "paid".equalsIgnoreCase(String.valueOf(plan)) ? "paid" : "free";
    }

    private List<StayGuest> buildGuests(ProfileDto family, LocalDate eventStart, LocalDate eventEnd) {
        List<StayGuest> guests = new ArrayList<>();
        StayGuest primary = new StayGuest();
        primary.setPrimary(true);
        primary.setName(family.fullName == null ? "" : family.fullName.trim());
        primary.setMobile(PasswordSupport.normalizeMobile(family.mobile));
        primary.setGender(family.gender);
        primary.setAge(family.age);
        primary.setRelation("");
        applyStayDates(primary, family.stayStartDate, family.stayEndDate, eventStart, eventEnd, "your");
        guests.add(primary);

        if (family.members != null) {
            int i = 1;
            for (MemberDto member : family.members) {
                StayGuest guest = new StayGuest();
                guest.setPrimary(false);
                guest.setName(member.name == null ? "" : member.name.trim());
                guest.setRelation(member.relation);
                guest.setMobile(PasswordSupport.normalizeMobile(member.mobile));
                guest.setGender(member.gender);
                guest.setAge(member.age);
                String label = guest.getName().isBlank() ? ("family member " + i) : guest.getName();
                applyStayDates(guest, member.stayStartDate, member.stayEndDate, eventStart, eventEnd, label);
                guests.add(guest);
                i++;
            }
        }
        return guests;
    }

    private void applyStayDates(StayGuest guest,
                                String startRaw,
                                String endRaw,
                                LocalDate eventStart,
                                LocalDate eventEnd,
                                String who) {
        LocalDate start = parseDate(startRaw, "Enter stay start date for " + who + ".");
        LocalDate end = parseDate(endRaw, "Enter stay end date for " + who + ".");
        if (end.isBefore(start)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                    "Stay end must be on or after stay start for " + who + ".");
        }
        if (eventStart != null && start.isBefore(eventStart)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                    "Stay start is before the event for " + who + ".");
        }
        if (eventEnd != null && end.isAfter(eventEnd)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                    "Stay end is after the event for " + who + ".");
        }
        guest.setStayStartDate(start.toString());
        guest.setStayEndDate(end.toString());
    }

    private LocalDate parseDate(String raw, String message) {
        String value = raw == null ? "" : raw.trim();
        if (value.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", message);
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", message);
        }
    }

    private void mergeGuestDatesIntoProfile(ProfileDto family, List<StayGuest> guests) {
        if (family == null || guests == null || guests.isEmpty()) {
            return;
        }
        StayGuest primary = guests.stream().filter(StayGuest::isPrimary).findFirst().orElse(guests.get(0));
        family.stayStartDate = primary.getStayStartDate();
        family.stayEndDate = primary.getStayEndDate();
        if (family.members == null) {
            return;
        }
        List<StayGuest> members = guests.stream().filter(g -> !g.isPrimary()).toList();
        for (int i = 0; i < family.members.size() && i < members.size(); i++) {
            MemberDto member = family.members.get(i);
            StayGuest guest = members.get(i);
            member.stayStartDate = guest.getStayStartDate();
            member.stayEndDate = guest.getStayEndDate();
        }
    }

    private Map<String, Object> toView(StayBooking booking) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", booking.getId());
        view.put("eventId", booking.getEventId());
        view.put("eventName", booking.getEventName());
        view.put("plan", booking.getPlan());
        view.put("status", booking.getStatus());
        view.put("familyMobile", booking.getFamilyMobile());
        view.put("familyFullName", booking.getFamilyFullName());
        view.put("registeredFamily", booking.isRegisteredFamily());
        view.put("createdByMobile", booking.getCreatedByMobile());
        String bookedAt = booking.getCreatedAt() == null ? null : booking.getCreatedAt().toString();
        view.put("bookedAt", bookedAt);
        view.put("createdAt", bookedAt);
        view.put("place", profileMapper.placeToMap(booking.getPlace()));

        List<StayGuest> guestList = booking.getGuests() == null ? List.of() : booking.getGuests();
        List<Map<String, Object>> guests = new ArrayList<>();
        for (StayGuest guest : guestList) {
            if (guest == null) {
                continue;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", guest.getName());
            row.put("relation", guest.getRelation());
            row.put("mobile", guest.getMobile());
            row.put("gender", guest.getGender());
            row.put("age", guest.getAge());
            row.put("stayStartDate", guest.getStayStartDate());
            row.put("stayEndDate", guest.getStayEndDate());
            row.put("primary", guest.isPrimary());
            guests.add(row);
        }
        view.put("guests", guests);
        int personCount = guests.size();
        view.put("personCount", personCount);
        view.put("familyCount", Math.max(0, personCount - 1));

        ProfileDto family = profileMapper.profileFromMap(booking.getFamilyDetail());
        mergeGuestDatesIntoProfile(family, guestList);
        view.put("family", profileMapper.profileToMap(family));
        return view;
    }
}
