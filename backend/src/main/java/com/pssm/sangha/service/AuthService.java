package com.pssm.sangha.service;

import com.pssm.sangha.common.ApiException;
import com.pssm.sangha.domain.Person;
import com.pssm.sangha.domain.SanghaRole;
import com.pssm.sangha.repo.PersonRepository;
import com.pssm.sangha.security.SanghaUserDetails;
import com.pssm.sangha.web.dto.ProfileDtos.LoginRequest;
import com.pssm.sangha.web.dto.ProfileDtos.PasswordRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final PersonRepository personRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       SecurityContextRepository securityContextRepository,
                       PersonRepository personRepository,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.personRepository = personRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> login(LoginRequest request,
                                     HttpServletRequest httpRequest,
                                     HttpServletResponse httpResponse) {
        String mobile = PasswordSupport.normalizeMobile(request.mobile);
        String password = request.password == null ? "" : request.password.trim();
        if (mobile.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter your mobile number.");
        }
        if (password.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter your password.");
        }
        if (!personRepository.existsByMobile(mobile)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED",
                    "No sangha join found for this mobile. Join first, then login.");
        }
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(mobile, password)
            );
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, httpRequest, httpResponse);

            SanghaUserDetails user = (SanghaUserDetails) authentication.getPrincipal();
            Person person = personRepository.findByMobile(user.getMobile()).orElseThrow();
            return sessionView(person);
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED",
                    "Mobile number or password is not correct.");
        }
    }

    public Map<String, Object> logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return Map.of("ok", true);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> me() {
        Person person = currentPerson();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("mobile", person.getMobile());
        data.put("name", person.getFullName());
        data.put("roles", sortedRoles(person));
        return data;
    }

    @Transactional
    public Map<String, Object> changePassword(PasswordRequest request) {
        Person person = currentPerson();
        String current = request.currentPassword == null ? "" : request.currentPassword.trim();
        String next = request.newPassword == null ? "" : request.newPassword.trim();
        String confirm = request.confirmPassword == null ? "" : request.confirmPassword.trim();
        if (current.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter your current password.");
        }
        if (next.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter a new password.");
        }
        if (next.length() < 6) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "New password must be at least 6 characters.");
        }
        if (!next.equals(confirm)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "New password and confirm do not match.");
        }
        if (!passwordEncoder.matches(current, person.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Current password is not correct.");
        }
        if (next.equals(current)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                    "Choose a new password that is different from the current one.");
        }
        person.setPasswordHash(passwordEncoder.encode(next));
        personRepository.save(person);
        return Map.of("ok", true);
    }

    public Person currentPerson() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof SanghaUserDetails user)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Not signed in.");
        }
        return personRepository.findByMobile(user.getMobile())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Not signed in."));
    }

    public void requireRole(String role) {
        Person person = currentPerson();
        if (!person.getRoles().contains(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Role not allowed.");
        }
    }

    public void requireAnyRole(String... roles) {
        Person person = currentPerson();
        if (roles == null || roles.length == 0) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Role not allowed.");
        }
        for (String role : roles) {
            if (role != null && person.getRoles().contains(role)) {
                return;
            }
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Role not allowed.");
    }

    private Map<String, Object> sessionView(Person person) {
        List<String> roles = sortedRoles(person);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("mobile", person.getMobile());
        data.put("name", person.getFullName());
        data.put("roles", roles);
        data.put("home", roles.contains(SanghaRole.PSSM_ADMIN) ? "/admin" : "/");
        return data;
    }

    private List<String> sortedRoles(Person person) {
        List<String> roles = new ArrayList<>(person.getRoles());
        roles.sort(String::compareTo);
        return roles;
    }
}
