package com.pssm.sangha.config;

import com.pssm.sangha.domain.Person;
import com.pssm.sangha.domain.SanghaEvent;
import com.pssm.sangha.domain.SanghaPlace;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
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
        people.ensureIndex(new Index().on("mobile", Sort.Direction.ASC).unique().named("uk_people_mobile"));
        people.ensureIndex(new Index().on("roles", Sort.Direction.ASC).named("idx_people_roles"));
        people.ensureIndex(new Index().on("fullName", Sort.Direction.ASC).named("idx_people_full_name"));

        IndexOperations places = mongoTemplate.indexOps(SanghaPlace.class);
        places.ensureIndex(new Index()
                .on("kind", Sort.Direction.ASC)
                .on("name", Sort.Direction.ASC)
                .on("state", Sort.Direction.ASC)
                .on("country", Sort.Direction.ASC)
                .unique()
                .named("uk_places_kind_name_state_country"));
        places.ensureIndex(new Index()
                .on("kind", Sort.Direction.ASC)
                .on("usageCount", Sort.Direction.DESC)
                .on("name", Sort.Direction.ASC)
                .named("idx_places_kind_usage_name"));
        places.ensureIndex(new Index()
                .on("kind", Sort.Direction.ASC)
                .on("name", Sort.Direction.ASC)
                .named("idx_places_kind_name"));

        IndexOperations events = mongoTemplate.indexOps(SanghaEvent.class);
        events.ensureIndex(new Index().on("startDate", Sort.Direction.ASC).named("idx_events_start_date"));
        events.ensureIndex(new Index().on("createdBy", Sort.Direction.ASC).named("idx_events_created_by"));
        events.ensureIndex(new Index().on("createdAt", Sort.Direction.DESC).named("idx_events_created_at"));

        log.info("MongoDB indexes ensured for people, places, events");
    }
}
