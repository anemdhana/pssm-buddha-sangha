package com.pssm.sangha.config;

import com.pssm.sangha.domain.Hotel;
import com.pssm.sangha.domain.Person;
import com.pssm.sangha.domain.PyramidCenter;
import com.pssm.sangha.domain.SanghaEvent;
import com.pssm.sangha.domain.SanghaPlace;
import com.pssm.sangha.domain.StayAllotment;
import com.pssm.sangha.domain.StayBooking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class MongoIndexInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MongoIndexInitializer.class);

    private final MongoTemplate mongoTemplate;

    public MongoIndexInitializer(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        IndexOperations people = mongoTemplate.indexOps(Person.class);
        ensure(people, new Index().on("mobile", Sort.Direction.ASC).unique().named("uk_people_mobile"));
        ensure(people, new Index().on("roles", Sort.Direction.ASC).named("idx_people_roles"));
        ensure(people, new Index().on("fullName", Sort.Direction.ASC).named("idx_people_full_name"));

        IndexOperations places = mongoTemplate.indexOps(SanghaPlace.class);
        ensure(places, new Index()
                .on("kind", Sort.Direction.ASC)
                .on("name", Sort.Direction.ASC)
                .on("state", Sort.Direction.ASC)
                .on("country", Sort.Direction.ASC)
                .unique()
                .named("uk_places_kind_name_state_country"));
        ensure(places, new Index()
                .on("kind", Sort.Direction.ASC)
                .on("usageCount", Sort.Direction.DESC)
                .on("name", Sort.Direction.ASC)
                .named("idx_places_kind_usage_name"));
        ensure(places, new Index()
                .on("kind", Sort.Direction.ASC)
                .on("name", Sort.Direction.ASC)
                .named("idx_places_kind_name"));

        IndexOperations events = mongoTemplate.indexOps(SanghaEvent.class);
        ensure(events, new Index().on("startDate", Sort.Direction.ASC).named("idx_events_start_date"));
        ensure(events, new Index().on("createdBy", Sort.Direction.ASC).named("idx_events_created_by"));
        ensure(events, new Index().on("createdAt", Sort.Direction.DESC).named("idx_events_created_at"));

        IndexOperations centers = mongoTemplate.indexOps(PyramidCenter.class);
        ensure(centers, new Index().on("name", Sort.Direction.ASC).unique().named("uk_pyramid_centers_name"));
        ensure(centers, new Index()
                .on("usageCount", Sort.Direction.DESC)
                .on("name", Sort.Direction.ASC)
                .named("idx_pyramid_centers_usage_name"));

        IndexOperations bookings = mongoTemplate.indexOps(StayBooking.class);
        // Keep legacy name if the same key already exists in Mongo.
        ensure(bookings, new Index()
                .on("eventId", Sort.Direction.ASC)
                .on("createdAt", Sort.Direction.DESC)
                .named("idx_stay_event_created"));
        ensure(bookings, new Index()
                .on("eventId", Sort.Direction.ASC)
                .on("familyFullName", Sort.Direction.ASC)
                .named("idx_stay_bookings_event_family_name"));
        ensure(bookings, new Index()
                .on("eventId", Sort.Direction.ASC)
                .on("guests.name", Sort.Direction.ASC)
                .named("idx_stay_bookings_event_guest_name"));
        ensure(bookings, new Index()
                .on("eventId", Sort.Direction.ASC)
                .on("place.city", Sort.Direction.ASC)
                .named("idx_stay_bookings_event_city"));
        ensure(bookings, new Index()
                .on("eventId", Sort.Direction.ASC)
                .on("place.district", Sort.Direction.ASC)
                .named("idx_stay_bookings_event_district"));

        IndexOperations allotments = mongoTemplate.indexOps(StayAllotment.class);
        ensure(allotments, new Index()
                .on("eventId", Sort.Direction.ASC)
                .on("hotelName", Sort.Direction.ASC)
                .on("roomNumber", Sort.Direction.ASC)
                .named("idx_stay_allotments_event_hotel_room"));
        ensure(allotments, new Index()
                .on("eventId", Sort.Direction.ASC)
                .on("hotelId", Sort.Direction.ASC)
                .named("idx_stay_allotments_event_hotel"));
        ensure(allotments, new Index()
                .on("eventId", Sort.Direction.ASC)
                .on("guests.name", Sort.Direction.ASC)
                .named("idx_stay_allotments_event_guest_name"));
        ensure(allotments, new Index()
                .on("eventId", Sort.Direction.ASC)
                .on("status", Sort.Direction.ASC)
                .named("idx_stay_allotments_event_status"));

        IndexOperations hotels = mongoTemplate.indexOps(Hotel.class);
        ensure(hotels, new Index()
                .on("eventId", Sort.Direction.ASC)
                .on("distanceKm", Sort.Direction.ASC)
                .on("name", Sort.Direction.ASC)
                .named("idx_hotels_event_distance_name"));

        log.info("MongoDB indexes ensured for people, places, events, pyramid_centers, bookings, allotments, hotels");
    }

    private void ensure(IndexOperations ops, Index index) {
        try {
            ops.ensureIndex(index);
        } catch (DataIntegrityViolationException ex) {
            // Same key already exists under another name — keep the existing index.
            log.warn("Skipping index create (already present): {} ({})", index, ex.getMostSpecificCause().getMessage());
        }
    }
}
