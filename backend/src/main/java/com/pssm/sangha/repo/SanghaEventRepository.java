package com.pssm.sangha.repo;

import com.pssm.sangha.domain.SanghaEvent;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SanghaEventRepository extends MongoRepository<SanghaEvent, String> {

    List<SanghaEvent> findAllByOrderByCreatedAtDesc();
}
