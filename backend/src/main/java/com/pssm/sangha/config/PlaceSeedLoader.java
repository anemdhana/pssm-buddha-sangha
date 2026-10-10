package com.pssm.sangha.config;

import com.pssm.sangha.domain.SanghaPlace;
import com.pssm.sangha.repo.SanghaPlaceRepository;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

@Configuration
public class PlaceSeedLoader {

    private static final Logger log = LoggerFactory.getLogger(PlaceSeedLoader.class);

    @Bean
    CommandLineRunner seedSanghaPlaces(SanghaPlaceRepository placeRepository) {
        return args -> {
            if (placeRepository.count() > 0) {
                return;
            }
            ClassPathResource resource = new ClassPathResource("data/sangha_places.csv");
            if (!resource.exists()) {
                log.warn("Place seed CSV missing on classpath: data/sangha_places.csv");
                return;
            }
            List<SanghaPlace> batch = new ArrayList<>();
            try (BufferedReader reader =
                    new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String header = reader.readLine();
                if (header == null) {
                    return;
                }
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.isBlank()) {
                        continue;
                    }
                    String[] parts = line.split(",", -1);
                    if (parts.length < 6) {
                        continue;
                    }
                    String kind = parts[0].trim().toLowerCase();
                    String name = parts[1].trim();
                    if (name.isBlank() || (!kind.equals("urban") && !kind.equals("rural"))) {
                        continue;
                    }
                    SanghaPlace place = new SanghaPlace();
                    place.setKind(kind);
                    place.setName(name);
                    place.setTown(blankToNull(parts[2]));
                    place.setDistrict(blankToNull(parts[3]));
                    place.setState(parts[4] == null ? "" : parts[4].trim());
                    String country = parts[5] == null ? "" : parts[5].trim();
                    place.setCountry(country.isBlank() ? "India" : country);
                    place.setUsageCount(0);
                    batch.add(place);
                }
            }
            if (!batch.isEmpty()) {
                placeRepository.saveAll(batch);
                log.info("Seeded {} sangha places from CSV", batch.size());
            }
        };
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
