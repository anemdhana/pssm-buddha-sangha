package com.pssm.sangha.web;

import com.pssm.sangha.common.ApiResponses;
import com.pssm.sangha.service.PlaceService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/places")
public class PlaceController {

    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
    }

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam(name = "kind", defaultValue = "urban") String kind,
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "limit", defaultValue = "25") int limit) {
        return ResponseEntity.ok(ApiResponses.data(placeService.search(kind, q, limit)));
    }

    @PostMapping
    public ResponseEntity<?> remember(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponses.data(placeService.remember(body)));
    }
}
