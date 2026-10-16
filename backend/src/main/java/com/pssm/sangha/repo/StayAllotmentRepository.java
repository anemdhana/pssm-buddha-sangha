package com.pssm.sangha.repo;

import com.pssm.sangha.domain.StayAllotment;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StayAllotmentRepository extends MongoRepository<StayAllotment, String> {

    List<StayAllotment> findByEventIdOrderByHotelNameAscRoomNumberAsc(String eventId);

    List<StayAllotment> findByEventId(String eventId);
}
