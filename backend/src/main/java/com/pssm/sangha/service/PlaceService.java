package com.pssm.sangha.service;

import com.pssm.sangha.common.ApiException;
import com.pssm.sangha.domain.SanghaPlace;
import com.pssm.sangha.repo.PlaceQueryRepository;
import com.pssm.sangha.repo.SanghaPlaceRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlaceService {

    private final SanghaPlaceRepository placeRepository;
    private final PlaceQueryRepository placeQueryRepository;

    public PlaceService(SanghaPlaceRepository placeRepository, PlaceQueryRepository placeQueryRepository) {
        this.placeRepository = placeRepository;
        this.placeQueryRepository = placeQueryRepository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> search(String kind, String query, int limit) {
        String normalizedKind = normalizeKind(kind);
        int size = Math.min(Math.max(limit, 1), 50);
        String q = query == null ? "" : query.trim();
        List<SanghaPlace> rows = placeQueryRepository.search(normalizedKind, q, size);
        List<Map<String, Object>> out = new ArrayList<>(rows.size());
        for (SanghaPlace place : rows) {
            out.add(toMap(place));
        }
        return out;
    }

    @Transactional
    public Map<String, Object> remember(Map<String, Object> body) {
        String kind = normalizeKind(asString(body.get("kind")));
        String name = asString(body.get("name")).trim();
        if (name.isBlank()) {
            name = asString(body.get(kind.equals("urban") ? "city" : "village")).trim();
        }
        if (name.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter a place name.");
        }
        String state = blankToEmpty(asString(body.get("state")));
        String country = asString(body.get("country")).trim();
        if (country.isBlank()) {
            country = "India";
        }
        String town = blankToNull(asString(body.get("town")));
        String district = blankToNull(asString(body.get("district")));

        SanghaPlace place = placeRepository
                .findByKindAndNameIgnoreCaseAndStateIgnoreCaseAndCountryIgnoreCase(kind, name, state, country)
                .orElseGet(SanghaPlace::new);

        boolean isNew = place.getId() == null;
        place.setKind(kind);
        place.setName(name);
        place.setTown(town);
        place.setDistrict(district);
        place.setState(state);
        place.setCountry(country);
        if (isNew) {
            place.setUsageCount(1);
        } else {
            place.setUsageCount(place.getUsageCount() + 1);
        }
        placeRepository.save(place);
        return toMap(place);
    }

    private static String normalizeKind(String kind) {
        String value = kind == null ? "" : kind.trim().toLowerCase(Locale.ROOT);
        if (!value.equals("urban") && !value.equals("rural")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Place kind must be urban or rural.");
        }
        return value;
    }

    private static Map<String, Object> toMap(SanghaPlace place) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", place.getId());
        row.put("kind", place.getKind());
        row.put("name", place.getName());
        row.put("city", "urban".equals(place.getKind()) ? place.getName() : null);
        row.put("village", "rural".equals(place.getKind()) ? place.getName() : null);
        row.put("town", place.getTown());
        row.put("district", place.getDistrict());
        row.put("state", blankToNull(place.getState()));
        row.put("country", place.getCountry());
        row.put("usageCount", place.getUsageCount());
        row.put(
                "label",
                buildLabel(place.getName(), place.getDistrict(), place.getState(), place.getCountry()));
        return row;
    }

    private static String buildLabel(String name, String district, String state, String country) {
        StringBuilder sb = new StringBuilder(name);
        if (district != null && !district.isBlank()) {
            sb.append(" · ").append(district);
        }
        if (state != null && !state.isBlank()) {
            sb.append(" · ").append(state);
        }
        if (country != null && !country.isBlank()) {
            sb.append(" · ").append(country);
        }
        return sb.toString();
    }

    private static String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String blankToEmpty(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }
}
