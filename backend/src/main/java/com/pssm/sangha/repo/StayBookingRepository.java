package com.pssm.sangha.repo;

import com.pssm.sangha.domain.StayBooking;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StayBookingRepository extends MongoRepository<StayBooking, String> {

    List<StayBooking> findByEventIdOrderByCreatedAtDesc(String eventId);

    List<StayBooking> findByFamilyMobileOrderByCreatedAtDesc(String familyMobile);
}
