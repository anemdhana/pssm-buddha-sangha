package com.pssm.sangha.service;

import com.pssm.sangha.common.ApiException;
import com.pssm.sangha.domain.Person;
import com.pssm.sangha.domain.SanghaRole;
import com.pssm.sangha.repo.PersonRepository;
import com.pssm.sangha.web.dto.ProfileDtos.ProfileDto;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SanghaService {

    private final PersonRepository personRepository;
    private final ProfileMapper profileMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public SanghaService(PersonRepository personRepository,
                         ProfileMapper profileMapper,
                         PasswordEncoder passwordEncoder,
                         AuthService authService) {
        this.personRepository = personRepository;
        this.profileMapper = profileMapper;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    @Transactional
    public Map<String, Object> join(ProfileDto dto) {
        String fullName = dto.fullName == null ? "" : dto.fullName.trim();
        String mobile = PasswordSupport.normalizeMobile(dto.mobile);
        if (fullName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter your full name.");
        }
        if (mobile.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter your mobile number.");
        }
        if (dto.birthDate == null || dto.birthDate.isBlank() || dto.birthMonth == null || dto.birthMonth.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter birth date and month.");
        }
        if (personRepository.existsByMobile(mobile)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "MOBILE_TAKEN",
                    "This mobile is already registered. Login to My Space instead.");
        }

        Person person = new Person();
        profileMapper.applyProfile(person, dto, true);
        person.setMobile(mobile);
        person.setFullName(fullName);

        String temporary = PasswordSupport.composedPassword(fullName, dto.birthDate, dto.birthMonth);
        if (temporary.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter birth date and month.");
        }
        person.setPasswordHash(passwordEncoder.encode(temporary));
        if (person.getRoles() == null) {
            person.setRoles(Set.of());
        }
        personRepository.save(person);

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("mobile", person.getMobile());
        profile.put("fullName", person.getFullName());
        profile.put("roles", new ArrayList<>(person.getRoles()));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("profile", profile);
        data.put("temporaryPassword", temporary);
        return data;
    }

    @Transactional(readOnly = true)
    public ProfileDto getMe() {
        return profileMapper.toDto(authService.currentPerson());
    }

    @Transactional
    public ProfileDto updateMe(ProfileDto dto) {
        Person person = authService.currentPerson();
        profileMapper.applyProfile(person, dto, true);
        person.setMobile(person.getMobile());
        personRepository.save(person);
        return profileMapper.toDto(person);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchPeople(String mobileQuery) {
        authService.requireRole(SanghaRole.PSSM_ADMIN);
        String digits = PasswordSupport.normalizeMobile(mobileQuery);
        if (digits.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter a mobile number.");
        }
        List<Person> matches = personRepository.findByMobileContainingOrderByFullNameAsc(digits);
        if (matches.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "No person found for that mobile.");
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Person person : matches) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("mobile", person.getMobile());
            row.put("fullName", person.getFullName());
            row.put("pyramidCenter", person.getPyramidCenter() == null ? "" : person.getPyramidCenter());
            row.put("roles", new ArrayList<>(person.getRoles()));
            result.add(row);
        }
        return result;
    }

    @Transactional
    public Map<String, Object> updateRoles(String mobilePath, List<String> roles) {
        authService.requireRole(SanghaRole.PSSM_ADMIN);
        String mobile = PasswordSupport.normalizeMobile(mobilePath);
        Person person = personRepository.findByMobile(mobile)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND",
                        "No joined person found for that mobile."));
        boolean keepAdmin = person.getRoles().contains(SanghaRole.PSSM_ADMIN);
        person.setRoles(profileMapper.normalizeAssignable(roles, keepAdmin));
        personRepository.save(person);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("mobile", person.getMobile());
        data.put("roles", new ArrayList<>(person.getRoles()));
        return data;
    }

    @Transactional
    public Map<String, Object> removePerson(String mobilePath) {
        authService.requireRole(SanghaRole.PSSM_ADMIN);
        String mobile = PasswordSupport.normalizeMobile(mobilePath);
        Person self = authService.currentPerson();
        if (self.getMobile().equals(mobile)) {
            throw new ApiException(HttpStatus.CONFLICT, "CONFLICT",
                    "You cannot remove your own account while signed in.");
        }
        Person person = personRepository.findByMobile(mobile)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND",
                        "No joined person found for that mobile."));
        personRepository.delete(person);
        return Map.of("ok", true);
    }

    @Transactional
    public Map<String, Object> claimAdmin() {
        Person person = authService.currentPerson();
        if (personRepository.countByRolesContaining(SanghaRole.PSSM_ADMIN) > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "CONFLICT", "A PSSM Admin is already assigned.");
        }
        Set<String> roles = new LinkedHashSet<>(person.getRoles());
        roles.add(SanghaRole.PSSM_ADMIN);
        person.setRoles(roles);
        personRepository.save(person);
        return Map.of("roles", new ArrayList<>(person.getRoles()));
    }
}
