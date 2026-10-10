package com.pssm.sangha.repo;

import com.pssm.sangha.domain.SanghaPlace;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SanghaPlaceRepository extends MongoRepository<SanghaPlace, String> {

    Optional<SanghaPlace> findByKindAndNameIgnoreCaseAndStateIgnoreCaseAndCountryIgnoreCase(
            String kind, String name, String state, String country);

    long countByKind(String kind);
}
