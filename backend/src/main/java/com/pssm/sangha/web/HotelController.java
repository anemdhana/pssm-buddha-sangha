package com.pssm.sangha.web;

import com.pssm.sangha.common.ApiResponses;
import com.pssm.sangha.service.HotelService;
import com.pssm.sangha.web.dto.HotelDtos.HotelRequest;
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
@RequestMapping("/api/v1/hotels")
public class HotelController {

    private final HotelService hotelService;

    public HotelController(HotelService hotelService) {
        this.hotelService = hotelService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(value = "eventId", required = false) String eventId) {
        return ResponseEntity.ok(ApiResponses.data(hotelService.listHotels(eventId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponses.data(hotelService.getHotel(id)));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody HotelRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponses.data(hotelService.createHotel(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") String id, @RequestBody HotelRequest body) {
        return ResponseEntity.ok(ApiResponses.data(hotelService.updateHotel(id, body)));
    }
}
