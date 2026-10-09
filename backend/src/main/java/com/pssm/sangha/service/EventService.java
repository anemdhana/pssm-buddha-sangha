package com.pssm.sangha.service;

import com.pssm.sangha.common.ApiException;
import com.pssm.sangha.domain.Person;
import com.pssm.sangha.domain.SanghaEvent;
import com.pssm.sangha.domain.SanghaRole;
import com.pssm.sangha.repo.SanghaEventRepository;
import com.pssm.sangha.web.dto.ProfileDtos.EventRequest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

    private final SanghaEventRepository eventRepository;
    private final AuthService authService;

    public EventService(SanghaEventRepository eventRepository, AuthService authService) {
        this.eventRepository = eventRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listEvents() {
        authService.currentPerson();
        List<Map<String, Object>> list = new ArrayList<>();
        for (SanghaEvent event : eventRepository.findAllByOrderByCreatedAtDesc()) {
            list.add(toMap(event));
        }
        return list;
    }

    @Transactional
    public Map<String, Object> createEvent(EventRequest request) {
        Person person = authService.currentPerson();
        authService.requireRole(SanghaRole.EVENT_ORGANIZER);

        String name = request.name == null ? "" : request.name.trim();
        if (name.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter the event name.");
        }
        if (request.startDate == null || request.startDate.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter the start date.");
        }
        if (request.endDate == null || request.endDate.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter the end date.");
        }
        LocalDate start = LocalDate.parse(request.startDate);
        LocalDate end = LocalDate.parse(request.endDate);
        if (end.isBefore(start)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION",
                    "End date must be on or after the start date.");
        }

        SanghaEvent event = new SanghaEvent();
        event.setId("evt_" + System.currentTimeMillis());
        event.setName(name);
        event.setStartDate(start);
        event.setEndDate(end);
        event.setCreatedBy(person.getMobile());
        event.setCreatedAt(Instant.now());
        eventRepository.save(event);
        return toMap(event);
    }

    private Map<String, Object> toMap(SanghaEvent event) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", event.getId());
        data.put("name", event.getName());
        data.put("startDate", event.getStartDate().toString());
        data.put("endDate", event.getEndDate().toString());
        data.put("createdBy", event.getCreatedBy());
        return data;
    }
}
