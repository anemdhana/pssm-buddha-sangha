package com.pssm.sangha.repo;

import com.pssm.sangha.domain.PyramidCenter;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PyramidCenterRepository extends MongoRepository<PyramidCenter, String> {

    Optional<PyramidCenter> findByNameIgnoreCase(String name);
}
