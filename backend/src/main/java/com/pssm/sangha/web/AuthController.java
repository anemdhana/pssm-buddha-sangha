package com.pssm.sangha.web;

import com.pssm.sangha.common.ApiResponses;
import com.pssm.sangha.service.AuthService;
import com.pssm.sangha.web.dto.ProfileDtos.LoginRequest;
import com.pssm.sangha.web.dto.ProfileDtos.PasswordRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest body,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        return ResponseEntity.ok(ApiResponses.data(authService.login(body, request, response)));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        return ResponseEntity.ok(ApiResponses.data(authService.logout(request)));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        return ResponseEntity.ok(ApiResponses.data(authService.me()));
    }

    @PostMapping("/password")
    public ResponseEntity<?> password(@RequestBody PasswordRequest body) {
        return ResponseEntity.ok(ApiResponses.data(authService.changePassword(body)));
    }
}
