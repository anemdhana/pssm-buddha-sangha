package com.pssm.sangha.repo;

import com.pssm.sangha.domain.SanghaEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SanghaEventRepository extends JpaRepository<SanghaEvent, String> {

    List<SanghaEvent> findAllByOrderByCreatedAtDesc();
}
