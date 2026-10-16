package com.pssm.sangha.web;

import com.pssm.sangha.common.ApiResponses;
import com.pssm.sangha.service.StayBookingService;
import com.pssm.sangha.web.dto.StayBookingDtos.CreateStayBookingRequest;
import com.pssm.sangha.web.dto.StayBookingDtos.UpdateStayBookingRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

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
    public ResponseEntity<?> list(
            @RequestParam("eventId") String eventId,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "ages", required = false) String ages,
            @RequestParam(value = "meditation", required = false) String meditation,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "stayRange", required = false) String stayRange,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        return ResponseEntity.ok(ApiResponses.data(stayBookingService.listForEvent(
                eventId, q, gender, ages, meditation, location, stayRange, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponses.data(stayBookingService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") String id, @RequestBody UpdateStayBookingRequest body) {
        return ResponseEntity.ok(ApiResponses.data(stayBookingService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") String id) {
        stayBookingService.delete(id);
        return ResponseEntity.ok(ApiResponses.data(Map.of("deleted", true, "id", id)));
    }
}
