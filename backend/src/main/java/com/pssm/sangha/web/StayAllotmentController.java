package com.pssm.sangha.web;

import com.pssm.sangha.common.ApiResponses;
import com.pssm.sangha.service.StayAllotmentService;
import com.pssm.sangha.web.dto.StayAllotmentDtos.CreateAllotmentsRequest;
import com.pssm.sangha.web.dto.StayAllotmentDtos.ReleaseAllotmentsRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/allotments")
public class StayAllotmentController {

    private final StayAllotmentService stayAllotmentService;

    public StayAllotmentController(StayAllotmentService stayAllotmentService) {
        this.stayAllotmentService = stayAllotmentService;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam("eventId") String eventId,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "hotelId", required = false) String hotelId,
            @RequestParam(value = "roomType", required = false) String roomType,
            @RequestParam(value = "roomKind", required = false) String roomKind,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        return ResponseEntity.ok(ApiResponses.data(stayAllotmentService.listForEvent(
                eventId, q, hotelId, roomType, roomKind, gender, status, location, page, size)));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateAllotmentsRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponses.data(stayAllotmentService.createBatch(body)));
    }

    @PostMapping("/release")
    public ResponseEntity<?> release(@RequestBody ReleaseAllotmentsRequest body) {
        return ResponseEntity.ok(ApiResponses.data(stayAllotmentService.releaseGuests(body)));
    }
}
