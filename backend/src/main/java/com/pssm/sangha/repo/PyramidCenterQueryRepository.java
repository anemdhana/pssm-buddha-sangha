package com.pssm.sangha.repo;

import com.pssm.sangha.domain.PyramidCenter;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class PyramidCenterQueryRepository {

    private final MongoTemplate mongoTemplate;

    public PyramidCenterQueryRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public List<PyramidCenter> search(String query, int limit) {
        Criteria criteria = new Criteria();
        if (query != null && !query.isBlank()) {
            String escaped = Pattern.quote(query.trim());
            Pattern pattern = Pattern.compile(escaped, Pattern.CASE_INSENSITIVE);
            criteria = new Criteria().orOperator(
                    Criteria.where("name").regex(pattern),
                    Criteria.where("locality").regex(pattern),
                    Criteria.where("city").regex(pattern),
                    Criteria.where("state").regex(pattern),
                    Criteria.where("address").regex(pattern)
            );
        }
        Query mongoQuery = Query.query(criteria)
                .with(Sort.by(Sort.Order.desc("usageCount"), Sort.Order.asc("name")))
                .limit(limit);
        return mongoTemplate.find(mongoQuery, PyramidCenter.class);
    }
}
