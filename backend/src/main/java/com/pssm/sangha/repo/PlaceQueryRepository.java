package com.pssm.sangha.repo;

import com.pssm.sangha.domain.SanghaPlace;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class PlaceQueryRepository {

    private final MongoTemplate mongoTemplate;

    public PlaceQueryRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public List<SanghaPlace> search(String kind, String query, int limit) {
        Criteria criteria = Criteria.where("kind").is(kind);
        if (query != null && !query.isBlank()) {
            String escaped = Pattern.quote(query.trim());
            Pattern pattern = Pattern.compile(escaped, Pattern.CASE_INSENSITIVE);
            criteria = criteria.andOperator(
                    new Criteria().orOperator(
                            Criteria.where("name").regex(pattern),
                            Criteria.where("state").regex(pattern),
                            Criteria.where("country").regex(pattern),
                            Criteria.where("district").regex(pattern),
                            Criteria.where("town").regex(pattern)));
        }
        Query mongoQuery = Query.query(criteria)
                .with(Sort.by(Sort.Order.desc("usageCount"), Sort.Order.asc("name")))
                .limit(limit);
        return mongoTemplate.find(mongoQuery, SanghaPlace.class);
    }
}
