package com.pssm.sangha.web;

import com.pssm.sangha.common.ApiResponses;
import com.pssm.sangha.service.StayBookingService;
import com.pssm.sangha.web.dto.StayBookingDtos.CreateStayBookingRequest;
import com.pssm.sangha.web.dto.StayBookingDtos.UpdateStayBookingRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings")
public class StayBookingController {

    private final StayBookingService stayBookingService;

    public StayBookingController(StayBookingService stayBookingService) {
        this.stayBookingService = stayBookingService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateStayBookingRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponses.data(stayBookingService.create(body)));
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam("eventId") String eventId) {
        return ResponseEntity.ok(ApiResponses.data(stayBookingService.listForEvent(eventId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponses.data(stayBookingService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") String id, @RequestBody UpdateStayBookingRequest body) {
        return ResponseEntity.ok(ApiResponses.data(stayBookingService.update(id, body)));
    }
}
