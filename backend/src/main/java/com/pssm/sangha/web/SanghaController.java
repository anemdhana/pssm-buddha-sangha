package com.pssm.sangha.web;

import com.pssm.sangha.common.ApiResponses;
import com.pssm.sangha.service.SanghaService;
import com.pssm.sangha.web.dto.ProfileDtos.ProfileDto;
import com.pssm.sangha.web.dto.ProfileDtos.RolesRequest;
import java.util.Map;
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

@RestController
@RequestMapping("/api/v1/sangha")
public class SanghaController {

    private final SanghaService sanghaService;

    public SanghaController(SanghaService sanghaService) {
        this.sanghaService = sanghaService;
    }

    @PostMapping("/join")
    public ResponseEntity<?> join(@RequestBody ProfileDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponses.data(sanghaService.join(body)));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        return ResponseEntity.ok(ApiResponses.data(sanghaService.getMe()));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@RequestBody ProfileDto body) {
        return ResponseEntity.ok(ApiResponses.data(sanghaService.updateMe(body)));
    }

    @GetMapping("/people")
    public ResponseEntity<?> people(@RequestParam(name = "mobile", required = false) String mobile) {
        return ResponseEntity.ok(ApiResponses.data(sanghaService.searchPeople(mobile)));
    }

    @PutMapping("/people/{mobile}/roles")
    public ResponseEntity<?> roles(@PathVariable String mobile, @RequestBody RolesRequest body) {
        return ResponseEntity.ok(ApiResponses.data(sanghaService.updateRoles(mobile, body.roles)));
    }

    @DeleteMapping("/people/{mobile}")
    public ResponseEntity<?> remove(@PathVariable String mobile) {
        return ResponseEntity.ok(ApiResponses.data(sanghaService.removePerson(mobile)));
    }

    @PostMapping("/admin/claim")
    public ResponseEntity<?> claim() {
        return ResponseEntity.ok(ApiResponses.data(sanghaService.claimAdmin()));
    }
}
