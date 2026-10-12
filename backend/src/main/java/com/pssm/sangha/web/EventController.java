package com.pssm.sangha.web;

import com.pssm.sangha.common.ApiResponses;
import com.pssm.sangha.service.EventService;
import com.pssm.sangha.web.dto.ProfileDtos.EventRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(ApiResponses.data(eventService.listEvents()));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody EventRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponses.data(eventService.createEvent(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") String id, @RequestBody EventRequest body) {
        return ResponseEntity.ok(ApiResponses.data(eventService.updateEvent(id, body)));
    }
}
