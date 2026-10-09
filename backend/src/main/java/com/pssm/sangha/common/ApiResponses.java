package com.pssm.sangha.common;

import java.util.LinkedHashMap;
import java.util.Map;

public final class ApiResponses {

    private ApiResponses() {
    }

    public static Map<String, Object> data(Object value) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("data", value);
        return body;
    }

    public static Map<String, Object> error(String code, String message) {
        Map<String, Object> err = new LinkedHashMap<>();
        err.put("code", code);
        err.put("message", message);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", err);
        return body;
    }
}
