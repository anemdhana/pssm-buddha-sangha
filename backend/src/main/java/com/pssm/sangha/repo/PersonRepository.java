package com.pssm.sangha.repo;

import com.pssm.sangha.domain.Person;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PersonRepository extends MongoRepository<Person, String> {

    Optional<Person> findByMobile(String mobile);

    boolean existsByMobile(String mobile);

    List<Person> findByMobileContainingOrderByFullNameAsc(String digits);

    long countByRolesContaining(String role);
}
