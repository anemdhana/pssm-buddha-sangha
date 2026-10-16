package com.pssm.sangha.config;

import com.pssm.sangha.domain.PyramidCenter;
import com.pssm.sangha.repo.PyramidCenterRepository;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

@Configuration
public class PyramidCenterSeedLoader {

    private static final Logger log = LoggerFactory.getLogger(PyramidCenterSeedLoader.class);

    @Bean
    CommandLineRunner seedPyramidCenters(PyramidCenterRepository centerRepository) {
        return args -> {
            ClassPathResource resource = new ClassPathResource("data/sangha_pyramid_centers.csv");
            if (!resource.exists()) {
                log.warn("Pyramid center seed CSV missing on classpath: data/sangha_pyramid_centers.csv");
                return;
            }

            try (BufferedReader reader =
                    new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String headerLine = reader.readLine();
                if (headerLine == null) {
                    return;
                }
                List<String> headers = parseCsvLine(headerLine);
                Map<String, Integer> col = columnIndex(headers);
                Integer nameIdx = col.get("name");
                if (nameIdx == null) {
                    log.warn("Pyramid center CSV missing name column");
                    return;
                }

                Map<String, PyramidCenter> existingByName = new HashMap<>();
                for (PyramidCenter center : centerRepository.findAll()) {
                    if (center.getName() != null) {
                        existingByName.put(center.getName().trim().toLowerCase(Locale.ROOT), center);
                    }
                }

                List<PyramidCenter> toSave = new ArrayList<>();
                int inserted = 0;
                int updated = 0;
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.isBlank()) {
                        continue;
                    }
                    List<String> parts = parseCsvLine(line);
                    if (nameIdx >= parts.size()) {
                        continue;
                    }
                    String name = parts.get(nameIdx).trim();
                    if (name.isBlank()) {
                        continue;
                    }

                    String key = name.toLowerCase(Locale.ROOT);
                    PyramidCenter center = existingByName.get(key);
                    boolean isNew = center == null;
                    if (isNew) {
                        center = new PyramidCenter();
                        center.setName(name);
                        center.setUsageCount(0);
                        inserted += 1;
                    }

                    String locality = cell(parts, col, "locality");
                    String city = cell(parts, col, "city");
                    String state = cell(parts, col, "state");
                    String country = cell(parts, col, "country");
                    String address = cell(parts, col, "address");
                    boolean changed = isNew
                            || !eq(center.getLocality(), locality)
                            || !eq(center.getCity(), city)
                            || !eq(center.getState(), state)
                            || !eq(center.getCountry(), country)
                            || !eq(center.getAddress(), address);
                    if (!changed) {
                        continue;
                    }
                    center.setLocality(blankToNull(locality));
                    center.setCity(blankToNull(city));
                    center.setState(blankToNull(state));
                    center.setCountry(blankToNull(country.isBlank() ? "India" : country));
                    center.setAddress(blankToNull(address));
                    toSave.add(center);
                    if (!isNew) {
                        updated += 1;
                    }
                }

                if (!toSave.isEmpty()) {
                    centerRepository.saveAll(toSave);
                    log.info("Pyramid centers seed sync: {} inserted, {} updated from CSV", inserted, updated);
                }
            }
        };
    }

    private static Map<String, Integer> columnIndex(List<String> headers) {
        Map<String, Integer> col = new HashMap<>();
        for (int i = 0; i < headers.size(); i++) {
            col.put(headers.get(i).trim().toLowerCase(Locale.ROOT), i);
        }
        return col;
    }

    private static String cell(List<String> parts, Map<String, Integer> col, String key) {
        Integer idx = col.get(key);
        if (idx == null || idx >= parts.size()) {
            return "";
        }
        return parts.get(idx) == null ? "" : parts.get(idx).trim();
    }

    /** Minimal RFC4180-ish CSV line parser (quoted fields, commas inside quotes). */
    static List<String> parseCsvLine(String line) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (inQuotes) {
                if (ch == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        cur.append('"');
                        i += 1;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    cur.append(ch);
                }
            } else if (ch == '"') {
                inQuotes = true;
            } else if (ch == ',') {
                out.add(cur.toString());
                cur.setLength(0);
            } else {
                cur.append(ch);
            }
        }
        out.add(cur.toString());
        return out;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static boolean eq(String a, String b) {
        String left = a == null ? "" : a.trim();
        String right = b == null ? "" : b.trim();
        return left.equals(right);
    }
}
