package com.pssm.sangha.web.dto;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class PageDtos {

    public static final int DEFAULT_SIZE = 24;
    public static final int MAX_SIZE = 100;

    private PageDtos() {
    }

    public static int normalizePage(Integer page) {
        if (page == null || page < 0) {
            return 0;
        }
        return page;
    }

    public static int normalizeSize(Integer size) {
        if (size == null || size < 1) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }

    public static Map<String, Object> page(List<?> items,
                                           long total,
                                           int page,
                                           int size,
                                           Map<String, Object> stats,
                                           Map<String, Object> facets) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", items);
        body.put("total", total);
        body.put("page", page);
        body.put("size", size);
        body.put("totalPages", size <= 0 ? 0 : (int) Math.ceil(total / (double) size));
        if (stats != null) {
            body.put("stats", stats);
        }
        if (facets != null) {
            body.put("facets", facets);
        }
        return body;
    }
}
