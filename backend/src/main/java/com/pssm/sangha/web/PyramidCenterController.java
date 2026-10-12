package com.pssm.sangha.web;

import com.pssm.sangha.common.ApiResponses;
import com.pssm.sangha.service.PyramidCenterService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pyramid-centers")
public class PyramidCenterController {

    private final PyramidCenterService pyramidCenterService;

    public PyramidCenterController(PyramidCenterService pyramidCenterService) {
        this.pyramidCenterService = pyramidCenterService;
    }

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "limit", defaultValue = "25") int limit) {
        return ResponseEntity.ok(ApiResponses.data(pyramidCenterService.search(q, limit)));
    }

    @PostMapping
    public ResponseEntity<?> remember(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponses.data(pyramidCenterService.remember(body)));
    }
}
