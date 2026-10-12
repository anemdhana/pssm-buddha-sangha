package com.pssm.sangha.config;

import com.pssm.sangha.domain.PyramidCenter;
import com.pssm.sangha.repo.PyramidCenterRepository;
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
public class PyramidCenterSeedLoader {

    private static final Logger log = LoggerFactory.getLogger(PyramidCenterSeedLoader.class);

    @Bean
    CommandLineRunner seedPyramidCenters(PyramidCenterRepository centerRepository) {
        return args -> {
            if (centerRepository.count() > 0) {
                return;
            }
            ClassPathResource resource = new ClassPathResource("data/sangha_pyramid_centers.csv");
            if (!resource.exists()) {
                log.warn("Pyramid center seed CSV missing on classpath: data/sangha_pyramid_centers.csv");
                return;
            }
            List<PyramidCenter> batch = new ArrayList<>();
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
                    String name = line.trim();
                    if (name.isBlank()) {
                        continue;
                    }
                    PyramidCenter center = new PyramidCenter();
                    center.setName(name);
                    center.setUsageCount(0);
                    batch.add(center);
                }
            }
            if (!batch.isEmpty()) {
                centerRepository.saveAll(batch);
                log.info("Seeded {} pyramid centers from CSV", batch.size());
            }
        };
    }
}
