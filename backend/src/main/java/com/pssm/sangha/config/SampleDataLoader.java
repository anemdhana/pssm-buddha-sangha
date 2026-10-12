package com.pssm.sangha.config;

import com.pssm.sangha.domain.Person;
import com.pssm.sangha.domain.PlaceInfo;
import com.pssm.sangha.domain.SanghaRole;
import com.pssm.sangha.repo.PersonRepository;
import com.pssm.sangha.service.PasswordSupport;
import java.util.LinkedHashSet;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SampleDataLoader {

    private static final Logger log = LoggerFactory.getLogger(SampleDataLoader.class);

    @Bean
    CommandLineRunner seedSampleAdmin(PersonRepository personRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String mobile = "9000000001";
            if (personRepository.existsByMobile(mobile)) {
                return;
            }
            Person admin = new Person();
            admin.setMobile(mobile);
            admin.setFullName("Pssm Admin");
            admin.setEmail("admin@pssm.example");
            admin.setGender("male");
            admin.setAgeGroup("adult");
            admin.setMeditation("6");
            admin.setBirthDate("01");
            admin.setBirthMonth("01");
            admin.setLanguage("English");
            admin.setPyramidCenter("Pyramid Meditation Center, Hyderabad");
            admin.setSinceYear("2010");
            admin.setPlace(urbanPlace("Hyderabad", "Telangana", "India"));
            String password = PasswordSupport.composedPassword(
                    admin.getFullName(), admin.getBirthDate(), admin.getBirthMonth());
            admin.setPasswordHash(passwordEncoder.encode(password));
            admin.setRoles(new LinkedHashSet<>(Set.of(SanghaRole.PSSM_ADMIN)));
            personRepository.save(admin);

            seedPerson(personRepository, passwordEncoder,
                    "Ramakrishna", "9876543210", "15", "08",
                    "Pyramid Meditation Center, Vijayawada", "Vijayawada", "Andhra Pradesh",
                    Set.of());
            seedPerson(personRepository, passwordEncoder,
                    "Lakshmi Devi", "9876501234", "22", "03",
                    "Indiranagar Pyramid Group", "Bengaluru", "Karnataka",
                    Set.of(SanghaRole.PYRAMID_SEVADAL));
            seedPerson(personRepository, passwordEncoder,
                    "Meena Shah", "9876511111", "10", "05",
                    "Pyramid Meditation Center, Hyderabad", "Hyderabad", "Telangana",
                    Set.of(SanghaRole.ACCOMMODATION_VOLUNTEER));

            log.info("Seeded sample PSSM Admin {} / {}", mobile, password);
        };
    }

    private void seedPerson(PersonRepository repo,
                            PasswordEncoder encoder,
                            String name,
                            String mobile,
                            String birthDate,
                            String birthMonth,
                            String center,
                            String city,
                            String state,
                            Set<String> roles) {
        if (repo.existsByMobile(mobile)) {
            return;
        }
        Person person = new Person();
        person.setMobile(mobile);
        person.setFullName(name);
        person.setGender("male");
        person.setAgeGroup("adult");
        person.setMeditation("5");
        person.setBirthDate(birthDate);
        person.setBirthMonth(birthMonth);
        person.setLanguage("Telugu");
        person.setPyramidCenter(center);
        person.setPlace(urbanPlace(city, state, "India"));
        person.setPasswordHash(encoder.encode(
                PasswordSupport.composedPassword(name, birthDate, birthMonth)));
        person.setRoles(new LinkedHashSet<>(roles));
        repo.save(person);
    }

    private static PlaceInfo urbanPlace(String city, String state, String country) {
        PlaceInfo place = new PlaceInfo();
        place.setKind("urban");
        place.setCity(city);
        place.setState(state);
        place.setCountry(country);
        return place;
    }
}
