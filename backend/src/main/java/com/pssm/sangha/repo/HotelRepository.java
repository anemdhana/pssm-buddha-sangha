package com.pssm.sangha.repo;

import com.pssm.sangha.domain.Hotel;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface HotelRepository extends MongoRepository<Hotel, String> {

    List<Hotel> findAllByOrderByDistanceKmAscNameAsc();

    List<Hotel> findByEventIdOrderByDistanceKmAscNameAsc(String eventId);
}
