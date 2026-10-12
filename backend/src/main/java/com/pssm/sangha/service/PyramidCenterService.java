package com.pssm.sangha.service;

import com.pssm.sangha.common.ApiException;
import com.pssm.sangha.domain.PyramidCenter;
import com.pssm.sangha.repo.PyramidCenterQueryRepository;
import com.pssm.sangha.repo.PyramidCenterRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PyramidCenterService {

    private final PyramidCenterRepository centerRepository;
    private final PyramidCenterQueryRepository centerQueryRepository;

    public PyramidCenterService(
            PyramidCenterRepository centerRepository, PyramidCenterQueryRepository centerQueryRepository) {
        this.centerRepository = centerRepository;
        this.centerQueryRepository = centerQueryRepository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> search(String query, int limit) {
        int size = Math.min(Math.max(limit, 1), 50);
        String q = query == null ? "" : query.trim();
        List<PyramidCenter> rows = centerQueryRepository.search(q, size);
        List<Map<String, Object>> out = new ArrayList<>(rows.size());
        for (PyramidCenter center : rows) {
            out.add(toMap(center));
        }
        return out;
    }

    @Transactional
    public Map<String, Object> remember(Map<String, Object> body) {
        String name = asString(body.get("name")).trim();
        if (name.isBlank()) {
            name = asString(body.get("pyramidCenter")).trim();
        }
        if (name.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Enter a pyramid center or group.");
        }

        PyramidCenter center = centerRepository.findByNameIgnoreCase(name).orElseGet(PyramidCenter::new);
        boolean isNew = center.getId() == null;
        if (isNew) {
            center.setName(name);
            center.setUsageCount(1);
        } else {
            center.setUsageCount(center.getUsageCount() + 1);
        }
        centerRepository.save(center);
        return toMap(center);
    }

    private static Map<String, Object> toMap(PyramidCenter center) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", center.getId());
        row.put("name", center.getName());
        row.put("usageCount", center.getUsageCount());
        row.put("label", center.getName());
        return row;
    }

    private static String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
