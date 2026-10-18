package com.pssm.sangha.repo;

import com.pssm.sangha.domain.PlaceInfo;
import com.pssm.sangha.domain.StayBooking;
import com.pssm.sangha.domain.StayBooking.StayGuest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class StayBookingQueryRepository {

    private final MongoTemplate mongoTemplate;

    public StayBookingQueryRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public record BookingFilters(
            String eventId,
            String q,
            String gender,
            String ages,
            String meditation,
            String location,
            String stayRange,
            /** Exact party size (primary + family members), e.g. {@code "3"}. */
            String familySize,
            /** {@code wait} = exclude allotted (default); {@code allotted} = only allotted. */
            String allotment,
            /** Booking ids resolved against stay_allotments for the event (may be empty). */
            java.util.Collection<String> allotmentBookingIds
    ) {
        public BookingFilters(
                String eventId,
                String q,
                String gender,
                String ages,
                String meditation,
                String location,
                String stayRange) {
            this(eventId, q, gender, ages, meditation, location, stayRange, "", "wait", java.util.List.of());
        }
    }

    public long count(BookingFilters filters) {
        return mongoTemplate.count(Query.query(buildCriteria(filters, null)), StayBooking.class);
    }

    public List<StayBooking> search(BookingFilters filters, int page, int size) {
        Query query = Query.query(buildCriteria(filters, null))
                .with(Sort.by(Sort.Order.desc("createdAt")))
                .skip((long) page * size)
                .limit(size);
        return mongoTemplate.find(query, StayBooking.class);
    }

    public List<Map<String, Object>> locationFacets(BookingFilters filters) {
        Criteria criteria = buildCriteria(filters, "location");
        Query query = Query.query(criteria);
        query.fields().include("place", "guests", "familyDetail");
        List<StayBooking> bookings = mongoTemplate.find(query, StayBooking.class);
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (StayBooking booking : bookings) {
            String label = locationLabel(booking.getPlace());
            if (label.isBlank()) {
                continue;
            }
            counts.merge(label, personCount(booking), Integer::sum);
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        counts.entrySet().stream()
                .sorted((a, b) -> {
                    int byCount = Integer.compare(b.getValue(), a.getValue());
                    return byCount != 0 ? byCount : a.getKey().compareToIgnoreCase(b.getKey());
                })
                .forEach(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("name", entry.getKey());
                    row.put("count", entry.getValue());
                    rows.add(row);
                });
        return rows;
    }

    public List<Map<String, Object>> stayRangeFacets(BookingFilters filters) {
        Criteria criteria = buildCriteria(filters, "stayRange");
        Query query = Query.query(criteria);
        query.fields().include("guests", "familyDetail");
        List<StayBooking> bookings = mongoTemplate.find(query, StayBooking.class);
        Map<String, Map<String, Object>> counts = new LinkedHashMap<>();
        for (StayBooking booking : bookings) {
            List<StayGuest> guests = booking.getGuests() == null ? List.of() : booking.getGuests();
            if (guests.isEmpty()) {
                // Fallback: still count the party under familyDetail dates if present.
                int people = personCount(booking);
                String[] range = familyDetailStayRange(booking);
                if (range == null || people <= 0) {
                    continue;
                }
                bumpStayRange(counts, range[0], range[1], people);
                continue;
            }
            for (StayGuest guest : guests) {
                if (guest == null) {
                    continue;
                }
                String start = guest.getStayStartDate() == null ? "" : guest.getStayStartDate().trim();
                String end = guest.getStayEndDate() == null ? "" : guest.getStayEndDate().trim();
                if (start.isBlank() || end.isBlank()) {
                    continue;
                }
                bumpStayRange(counts, start, end, 1);
            }
        }
        List<Map<String, Object>> rows = new ArrayList<>(counts.values());
        rows.sort((a, b) -> String.valueOf(a.getOrDefault("key", ""))
                .compareTo(String.valueOf(b.getOrDefault("key", ""))));
        return rows;
    }

    /** Party-size facets: [{ size, count }] sorted high → low by size. */
    public List<Map<String, Object>> familySizeFacets(BookingFilters filters) {
        Criteria criteria = buildCriteria(filters, "familySize");
        Query query = Query.query(criteria);
        query.fields().include("guests", "familyDetail");
        List<StayBooking> bookings = mongoTemplate.find(query, StayBooking.class);
        Map<Integer, Integer> counts = new LinkedHashMap<>();
        for (StayBooking booking : bookings) {
            int size = personCount(booking);
            if (size <= 0) {
                continue;
            }
            counts.merge(size, 1, Integer::sum);
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        counts.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getKey(), a.getKey()))
                .forEach(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("size", entry.getKey());
                    row.put("count", entry.getValue());
                    rows.add(row);
                });
        return rows;
    }

    /** Primary + family members (guests preferred; familyDetail.members as fallback). */
    private static int personCount(StayBooking booking) {
        int guests = booking.getGuests() == null ? 0 : (int) booking.getGuests().stream()
                .filter(g -> g != null)
                .count();
        int members = 0;
        Map<String, Object> family = booking.getFamilyDetail();
        if (family != null) {
            Object raw = family.get("members");
            if (raw instanceof List<?> list) {
                members = (int) list.stream().filter(m -> m != null).count();
            }
        }
        int fromFamilyDetail = members > 0 ? members + 1 : 0;
        int count = Math.max(guests, fromFamilyDetail);
        return Math.max(count, 1);
    }

    private static void bumpStayRange(Map<String, Map<String, Object>> counts, String start, String end, int people) {
        String key = start + "|" + end;
        Map<String, Object> row = counts.computeIfAbsent(key, ignored -> {
            Map<String, Object> created = new LinkedHashMap<>();
            created.put("key", key);
            created.put("label", start + " to " + end);
            created.put("count", 0);
            return created;
        });
        row.put("count", ((Integer) row.get("count")) + people);
    }

    private static String[] familyDetailStayRange(StayBooking booking) {
        Map<String, Object> family = booking.getFamilyDetail();
        if (family == null) {
            return null;
        }
        String start = trim(family.get("stayStartDate"));
        String end = trim(family.get("stayEndDate"));
        if (!start.isBlank() && !end.isBlank()) {
            return new String[] {start, end};
        }
        Object rawMembers = family.get("members");
        if (rawMembers instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> member) {
            start = trim(member.get("stayStartDate"));
            end = trim(member.get("stayEndDate"));
            if (!start.isBlank() && !end.isBlank()) {
                return new String[] {start, end};
            }
        }
        return null;
    }

    private Criteria buildCriteria(BookingFilters filters, String omitField) {
        List<Criteria> parts = new ArrayList<>();
        parts.add(Criteria.where("eventId").is(filters.eventId()));

        if (filters.q() != null && !filters.q().isBlank() && !"q".equals(omitField)) {
            Pattern pattern = Pattern.compile(Pattern.quote(filters.q().trim()), Pattern.CASE_INSENSITIVE);
            parts.add(new Criteria().orOperator(
                    Criteria.where("familyFullName").regex(pattern),
                    Criteria.where("familyMobile").regex(pattern),
                    Criteria.where("guests.name").regex(pattern),
                    Criteria.where("guests.mobile").regex(pattern)
            ));
        }
        if (include(filters.gender(), omitField, "gender")) {
            parts.add(Criteria.where("guests.gender").is(filters.gender().trim().toLowerCase(Locale.ROOT)));
        }
        if (include(filters.ages(), omitField, "ages")) {
            List<String> ages = Arrays.stream(filters.ages().split(","))
                    .map(v -> v.trim().toLowerCase(Locale.ROOT))
                    .filter(v -> v.equals("child") || v.equals("adult") || v.equals("senior"))
                    .distinct()
                    .collect(Collectors.toList());
            if (!ages.isEmpty()) {
                parts.add(Criteria.where("guests.age").in(ages));
            }
        }
        if (include(filters.meditation(), omitField, "meditation")) {
            parts.add(Criteria.where("familyDetail.meditation")
                    .is(filters.meditation().trim().toLowerCase(Locale.ROOT)));
        }
        if (include(filters.location(), omitField, "location")) {
            String location = filters.location().trim();
            Pattern pattern = Pattern.compile("^" + Pattern.quote(location) + "$", Pattern.CASE_INSENSITIVE);
            parts.add(new Criteria().orOperator(
                    Criteria.where("place.city").regex(pattern),
                    Criteria.where("place.district").regex(pattern),
                    Criteria.where("place.name").regex(pattern),
                    Criteria.where("place.village").regex(pattern)
            ));
        }
        if (include(filters.stayRange(), omitField, "stayRange")) {
            String[] bits = filters.stayRange().split("\\|", 2);
            if (bits.length == 2) {
                String start = bits[0].trim();
                String end = bits[1].trim();
                parts.add(Criteria.where("guests").elemMatch(
                        Criteria.where("primary").is(true)
                                .and("stayStartDate").is(start)
                                .and("stayEndDate").is(end)
                ));
            }
        }
        if (include(filters.familySize(), omitField, "familySize")) {
            int size = parseFamilySize(filters.familySize());
            if (size > 0) {
                parts.add(partySizeCriteria(size));
            }
        }
        if (!"allotment".equals(omitField)) {
            String mode = filters.allotment() == null ? "wait" : filters.allotment().trim().toLowerCase(Locale.ROOT);
            java.util.Collection<String> ids = filters.allotmentBookingIds() == null
                    ? java.util.List.of()
                    : filters.allotmentBookingIds();
            if ("allotted".equals(mode)) {
                if (ids.isEmpty()) {
                    parts.add(Criteria.where("_id").is("__no_allotted_bookings__"));
                } else {
                    parts.add(Criteria.where("_id").in(ids));
                }
            } else if (!ids.isEmpty()) {
                parts.add(Criteria.where("_id").nin(ids));
            }
        }

        if (parts.size() == 1) {
            return parts.get(0);
        }
        return new Criteria().andOperator(parts.toArray(Criteria[]::new));
    }

    private static boolean include(String value, String omitField, String field) {
        return value != null && !value.isBlank() && !field.equals(omitField);
    }

    private static int parseFamilySize(String raw) {
        if (raw == null || raw.isBlank()) {
            return 0;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    /**
     * Match bookings whose party size equals {@code size}, aligning with {@link #personCount}:
     * guests array length, or familyDetail.members + 1 when guests are empty.
     */
    private static Criteria partySizeCriteria(int size) {
        Criteria guestsExact = Criteria.where("guests").size(size);
        if (size <= 1) {
            return new Criteria().orOperator(
                    guestsExact,
                    Criteria.where("guests").size(0),
                    Criteria.where("guests").exists(false),
                    Criteria.where("guests").is(null)
            );
        }
        Criteria emptyGuests = new Criteria().orOperator(
                Criteria.where("guests").size(0),
                Criteria.where("guests").exists(false),
                Criteria.where("guests").is(null)
        );
        Criteria fromFamilyDetail = new Criteria().andOperator(
                emptyGuests,
                Criteria.where("familyDetail.members").size(size - 1)
        );
        return new Criteria().orOperator(guestsExact, fromFamilyDetail);
    }

    private static String locationLabel(PlaceInfo place) {
        if (place == null) {
            return "Urban";
        }
        String kind = place.getKind() == null ? "urban" : place.getKind().trim().toLowerCase(Locale.ROOT);
        if ("rural".equals(kind)) {
            String district = trim(place.getDistrict());
            if (!district.isBlank()) {
                return district;
            }
        } else {
            String city = trim(place.getCity());
            if (!city.isBlank()) {
                return city;
            }
        }
        String district = trim(place.getDistrict());
        if (!district.isBlank()) {
            return district;
        }
        String village = trim(place.getVillage());
        if (!village.isBlank()) {
            return village;
        }
        return "rural".equals(kind) ? "Rural" : "Urban";
    }

    private static String trim(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
