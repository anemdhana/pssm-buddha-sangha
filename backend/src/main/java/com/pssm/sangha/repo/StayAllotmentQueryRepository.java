package com.pssm.sangha.repo;

import com.pssm.sangha.domain.StayAllotment;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class StayAllotmentQueryRepository {

    private final MongoTemplate mongoTemplate;

    public StayAllotmentQueryRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public record AllotmentFilters(
            String eventId,
            String q,
            String hotelId,
            String roomType,
            String roomKind,
            String gender,
            String status,
            String location,
            String stayRange
    ) {
    }

    public long count(AllotmentFilters filters) {
        return mongoTemplate.count(Query.query(buildCriteria(filters, null)), StayAllotment.class);
    }

    public List<StayAllotment> search(AllotmentFilters filters, int page, int size) {
        Query query = Query.query(buildCriteria(filters, null))
                .with(Sort.by(Sort.Order.asc("hotelName"), Sort.Order.asc("roomNumber")))
                .skip((long) page * size)
                .limit(size);
        return mongoTemplate.find(query, StayAllotment.class);
    }

    public Map<String, Object> stats(AllotmentFilters filters) {
        Criteria criteria = buildCriteria(filters, null);
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.project("hotelId", "status")
                        .and("guests").size().as("guestCount")
                        .andExpression("cond(eq(status, 'checked_in'), 1, 0)").as("checkedInFlag"),
                Aggregation.group()
                        .count().as("parties")
                        .sum("guestCount").as("people")
                        .addToSet("hotelId").as("hotelIds")
                        .sum("checkedInFlag").as("checkedIn")
        );
        AggregationResults<Map> results = mongoTemplate.aggregate(aggregation, StayAllotment.class, Map.class);
        Map raw = results.getUniqueMappedResult();
        Map<String, Object> stats = new LinkedHashMap<>();
        if (raw == null) {
            stats.put("parties", 0);
            stats.put("people", 0);
            stats.put("hotels", 0);
            stats.put("allotted", 0);
            stats.put("checkedIn", 0);
            return stats;
        }
        int parties = ((Number) raw.getOrDefault("parties", 0)).intValue();
        int people = ((Number) raw.getOrDefault("people", 0)).intValue();
        int checkedIn = ((Number) raw.getOrDefault("checkedIn", 0)).intValue();
        Object hotelIds = raw.get("hotelIds");
        int hotels = hotelIds instanceof List<?> list ? list.size() : 0;
        stats.put("parties", parties);
        stats.put("people", people);
        stats.put("hotels", hotels);
        stats.put("checkedIn", checkedIn);
        stats.put("allotted", Math.max(0, parties - checkedIn));
        return stats;
    }

    public List<Map<String, Object>> hotelFacets(AllotmentFilters filters) {
        Criteria criteria = buildCriteria(filters, "hotelId");
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.group("hotelId")
                        .first("hotelName").as("label")
                        .count().as("count"),
                Aggregation.project("count", "label")
                        .and("_id").as("key"),
                Aggregation.sort(Sort.by(Sort.Order.asc("label")))
        );
        AggregationResults<Map> results = mongoTemplate.aggregate(aggregation, StayAllotment.class, Map.class);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Map raw : results.getMappedResults()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("key", String.valueOf(raw.get("key") == null ? "" : raw.get("key")));
            row.put("label", String.valueOf(raw.get("label") == null ? row.get("key") : raw.get("label")));
            row.put("count", ((Number) raw.getOrDefault("count", 0)).intValue());
            rows.add(row);
        }
        return rows;
    }

    /** Hometown chips: people counts by city (urban) or district (rural). */
    public List<Map<String, Object>> locationFacets(AllotmentFilters filters) {
        Criteria criteria = buildCriteria(filters, "location");
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.project()
                        .and("place.kind").as("kind")
                        .and("place.city").as("city")
                        .and("place.district").as("district")
                        .and("place.name").as("name")
                        .and("guests").size().as("guestCount")
        );
        AggregationResults<Map> results = mongoTemplate.aggregate(aggregation, StayAllotment.class, Map.class);
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (Map raw : results.getMappedResults()) {
            String label = locationLabel(raw);
            if (label.isBlank()) {
                continue;
            }
            int people = ((Number) raw.getOrDefault("guestCount", 0)).intValue();
            if (people <= 0) {
                people = 1;
            }
            counts.merge(label, people, Integer::sum);
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

    /** Stay date chips: people counts by check-in|check-out range. */
    public List<Map<String, Object>> stayRangeFacets(AllotmentFilters filters) {
        Criteria criteria = buildCriteria(filters, "stayRange");
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.project("checkInDate", "checkOutDate")
                        .and("guests").size().as("guestCount")
        );
        AggregationResults<Map> results = mongoTemplate.aggregate(aggregation, StayAllotment.class, Map.class);
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (Map raw : results.getMappedResults()) {
            String start = trim(raw.get("checkInDate"));
            String end = trim(raw.get("checkOutDate"));
            if (start.isBlank() || end.isBlank()) {
                continue;
            }
            String key = start + "|" + end;
            int people = ((Number) raw.getOrDefault("guestCount", 0)).intValue();
            if (people <= 0) {
                people = 1;
            }
            counts.merge(key, people, Integer::sum);
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        counts.entrySet().stream()
                .sorted((a, b) -> {
                    int byKey = a.getKey().compareTo(b.getKey());
                    return byKey != 0 ? byKey : Integer.compare(b.getValue(), a.getValue());
                })
                .forEach(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    String key = entry.getKey();
                    int pipe = key.indexOf('|');
                    row.put("key", key);
                    row.put("start", pipe > 0 ? key.substring(0, pipe) : "");
                    row.put("end", pipe > 0 ? key.substring(pipe + 1) : "");
                    row.put("count", entry.getValue());
                    rows.add(row);
                });
        return rows;
    }

    private static String locationLabel(Map raw) {
        String kind = String.valueOf(raw.getOrDefault("kind", "urban")).toLowerCase(Locale.ROOT);
        if ("rural".equals(kind)) {
            String district = trim(raw.get("district"));
            if (!district.isBlank()) {
                return district;
            }
        } else {
            String city = trim(raw.get("city"));
            if (!city.isBlank()) {
                return city;
            }
            String name = trim(raw.get("name"));
            if (!name.isBlank()) {
                return name;
            }
        }
        String district = trim(raw.get("district"));
        if (!district.isBlank()) {
            return district;
        }
        return "rural".equals(kind) ? "Rural" : "Urban";
    }

    private static String trim(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private Criteria buildCriteria(AllotmentFilters filters, String omitField) {
        List<Criteria> parts = new ArrayList<>();
        parts.add(Criteria.where("eventId").is(filters.eventId()));

        if (filters.q() != null && !filters.q().isBlank() && !"q".equals(omitField)) {
            Pattern pattern = Pattern.compile(Pattern.quote(filters.q().trim()), Pattern.CASE_INSENSITIVE);
            parts.add(new Criteria().orOperator(
                    Criteria.where("familyFullName").regex(pattern),
                    Criteria.where("familyMobile").regex(pattern),
                    Criteria.where("hotelName").regex(pattern),
                    Criteria.where("roomNumber").regex(pattern),
                    Criteria.where("guests.name").regex(pattern),
                    Criteria.where("guests.mobile").regex(pattern)
            ));
        }
        if (include(filters.hotelId(), omitField, "hotelId")) {
            parts.add(Criteria.where("hotelId").is(filters.hotelId().trim()));
        }
        if (include(filters.roomType(), omitField, "roomType")) {
            parts.add(Criteria.where("roomType").is(normalizeRoomType(filters.roomType())));
        }
        if (include(filters.roomKind(), omitField, "roomKind")) {
            parts.add(Criteria.where("roomKind").is(normalizeKind(filters.roomKind())));
        }
        if (include(filters.status(), omitField, "status")) {
            parts.add(Criteria.where("status").is(filters.status().trim().toLowerCase(Locale.ROOT)));
        }
        if (include(filters.gender(), omitField, "gender")) {
            String gender = filters.gender().trim().toLowerCase(Locale.ROOT);
            parts.add(Criteria.where("guests.gender").is(gender));
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
            String range = filters.stayRange().trim();
            int pipe = range.indexOf('|');
            if (pipe > 0) {
                String start = range.substring(0, pipe).trim();
                String end = range.substring(pipe + 1).trim();
                if (!start.isBlank() && !end.isBlank()) {
                    parts.add(Criteria.where("checkInDate").is(start));
                    parts.add(Criteria.where("checkOutDate").is(end));
                }
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

    private static String normalizeRoomType(String roomType) {
        String value = roomType.trim().toLowerCase(Locale.ROOT).replace('-', '_');
        return "non_ac".equals(value) ? "non_ac" : "ac";
    }

    private static String normalizeKind(String kind) {
        String value = kind.trim().toLowerCase(Locale.ROOT);
        if ("dormitory".equals(value) || "dorm".equals(value)) {
            return "dormitory";
        }
        if ("hall".equals(value)) {
            return "hall";
        }
        return "regular";
    }
}
