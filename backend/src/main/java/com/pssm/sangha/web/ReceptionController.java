package com.pssm.sangha.web;

import com.pssm.sangha.common.ApiResponses;
import com.pssm.sangha.service.ReceptionService;
import com.pssm.sangha.web.dto.ReceptionDtos.PersonActionRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reception")
public class ReceptionController {

    private final ReceptionService receptionService;

    public ReceptionController(ReceptionService receptionService) {
        this.receptionService = receptionService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        return ResponseEntity.ok(ApiResponses.data(receptionService.deskContext()));
    }

    @GetMapping("/guests")
    public ResponseEntity<?> guests(
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "checkingOutOnDate", required = false) Boolean checkingOutOnDate,
            @RequestParam(value = "roomNumber", required = false) String roomNumber,
            @RequestParam(value = "q", required = false) String q) {
        return ResponseEntity.ok(ApiResponses.data(
                receptionService.listGuests(date, status, checkingOutOnDate, roomNumber, q)));
    }

    @PostMapping("/check-ins")
    public ResponseEntity<?> checkIn(@RequestBody PersonActionRequest body) {
        return ResponseEntity.ok(ApiResponses.data(receptionService.checkIn(body)));
    }

    @PostMapping("/check-outs")
    public ResponseEntity<?> checkOut(@RequestBody PersonActionRequest body) {
        return ResponseEntity.ok(ApiResponses.data(receptionService.checkOut(body)));
    }

    @PostMapping("/did-not-arrive")
    public ResponseEntity<?> didNotArrive(@RequestBody PersonActionRequest body) {
        return ResponseEntity.ok(ApiResponses.data(receptionService.didNotArrive(body)));
    }
}
