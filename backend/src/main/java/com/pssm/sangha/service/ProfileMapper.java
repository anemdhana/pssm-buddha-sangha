package com.pssm.sangha.service;

import com.pssm.sangha.domain.FamilyMember;
import com.pssm.sangha.domain.Person;
import com.pssm.sangha.domain.PlaceInfo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pssm.sangha.web.dto.ProfileDtos.MemberDto;
import com.pssm.sangha.web.dto.ProfileDtos.PlaceDto;
import com.pssm.sangha.web.dto.ProfileDtos.ProfileDto;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ProfileMapper {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public Map<String, Object> profileToMap(ProfileDto dto) {
        if (dto == null) {
            return new LinkedHashMap<>();
        }
        return MAPPER.convertValue(dto, new TypeReference<LinkedHashMap<String, Object>>() {
        });
    }

    public ProfileDto profileFromMap(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return new ProfileDto();
        }
        try {
            // Mongo may return org.bson.Document values — normalize via Jackson first.
            Object normalized = MAPPER.convertValue(sanitizeMap(map), Object.class);
            return MAPPER.convertValue(normalized, ProfileDto.class);
        } catch (IllegalArgumentException ex) {
            return new ProfileDto();
        }
    }

    public Map<String, Object> placeToMap(PlaceInfo place) {
        PlaceDto dto = placeFromInfo(place);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("kind", dto.kind);
        out.put("village", dto.village);
        out.put("town", dto.town);
        out.put("district", dto.district);
        out.put("city", dto.city);
        out.put("state", dto.state);
        out.put("country", dto.country);
        return out;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> sanitizeMap(Map<?, ?> raw) {
        Map<String, Object> clean = new LinkedHashMap<>();
        if (raw == null) {
            return clean;
        }
        for (Map.Entry<?, ?> entry : raw.entrySet()) {
            if (entry.getKey() == null) {
                continue;
            }
            clean.put(String.valueOf(entry.getKey()), sanitizeValue(entry.getValue()));
        }
        return clean;
    }

    @SuppressWarnings("unchecked")
    private Object sanitizeValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Map<?, ?> nested) {
            return sanitizeMap(nested);
        }
        if (value instanceof List<?> list) {
            List<Object> next = new ArrayList<>(list.size());
            for (Object item : list) {
                next.add(sanitizeValue(item));
            }
            return next;
        }
        return value;
    }

    public ProfileDto toDto(Person person) {
        ProfileDto dto = new ProfileDto();
        dto.fullName = person.getFullName();
        dto.mobile = person.getMobile();
        dto.email = person.getEmail();
        dto.altMobile = person.getAltMobile();
        dto.gender = person.getGender();
        dto.age = person.getAgeGroup();
        dto.meditation = person.getMeditation();
        dto.profession = person.getProfession();
        dto.birthDate = person.getBirthDate();
        dto.birthMonth = person.getBirthMonth();
        dto.language = person.getLanguage();
        dto.pyramidCenter = person.getPyramidCenter();
        dto.sinceYear = person.getSinceYear();
        dto.idType = person.getIdType();
        dto.livePhoto = person.getLivePhoto();
        dto.idProofPhoto = person.getIdProofPhoto();
        dto.place = placeFromInfo(person.getPlace());
        dto.roles = new ArrayList<>(person.getRoles());
        dto.roles.sort(Comparator.naturalOrder());
        dto.members = new ArrayList<>();
        for (FamilyMember member : person.getMembers()) {
            dto.members.add(toMemberDto(member));
        }
        return dto;
    }

    public void applyProfile(Person person, ProfileDto dto, boolean preservePassword) {
        person.setFullName(trim(dto.fullName));
        person.setEmail(trim(dto.email));
        person.setAltMobile(PasswordSupport.normalizeMobile(dto.altMobile));
        person.setGender(trim(dto.gender));
        person.setAgeGroup(trim(dto.age));
        person.setMeditation(trim(dto.meditation));
        person.setProfession(trim(dto.profession));
        person.setBirthDate(trim(dto.birthDate));
        person.setBirthMonth(trim(dto.birthMonth));
        person.setLanguage(trim(dto.language));
        person.setPyramidCenter(trim(dto.pyramidCenter));
        person.setSinceYear(trim(dto.sinceYear));
        person.setIdType(trim(dto.idType));
        person.setLivePhoto(dto.livePhoto);
        person.setIdProofPhoto(dto.idProofPhoto);
        person.setPlace(toPlaceInfo(dto.place));
        person.setMembers(toMembers(dto.members));
        if (!preservePassword) {
            // caller sets password hash
        }
    }

    public Set<String> normalizeAssignable(List<String> roles, boolean keepAdmin) {
        Set<String> next = new LinkedHashSet<>();
        if (roles != null) {
            for (String role : roles) {
                if (com.pssm.sangha.domain.SanghaRole.ASSIGNABLE.contains(role)) {
                    next.add(role);
                }
            }
        }
        if (keepAdmin) {
            next.add(com.pssm.sangha.domain.SanghaRole.PSSM_ADMIN);
        }
        return next;
    }

    private MemberDto toMemberDto(FamilyMember member) {
        MemberDto dto = new MemberDto();
        dto.name = member.getName();
        dto.relation = member.getRelation();
        dto.mobile = member.getMobile();
        dto.gender = member.getGender();
        dto.age = member.getAgeGroup();
        dto.meditation = member.getMeditation();
        dto.profession = member.getProfession();
        dto.addrMode = member.getAddrMode();
        dto.idType = member.getIdType();
        dto.livePhoto = member.getLivePhoto();
        dto.idProofPhoto = member.getIdProofPhoto();
        dto.place = placeFromInfo(member.getPlace());
        return dto;
    }

    private List<FamilyMember> toMembers(List<MemberDto> members) {
        List<FamilyMember> out = new ArrayList<>();
        if (members == null) {
            return out;
        }
        int order = 0;
        for (MemberDto dto : members) {
            FamilyMember member = new FamilyMember();
            member.setSortOrder(order++);
            member.setName(trim(dto.name));
            member.setRelation(trim(dto.relation));
            member.setMobile(PasswordSupport.normalizeMobile(dto.mobile));
            member.setGender(trim(dto.gender));
            member.setAgeGroup(trim(dto.age));
            member.setMeditation(trim(dto.meditation));
            member.setProfession(trim(dto.profession));
            member.setAddrMode(trim(dto.addrMode));
            member.setIdType(trim(dto.idType));
            member.setLivePhoto(dto.livePhoto);
            member.setIdProofPhoto(dto.idProofPhoto);
            member.setPlace(toPlaceInfo(dto.place));
            out.add(member);
        }
        return out;
    }

    private PlaceDto placeFromInfo(PlaceInfo place) {
        PlaceDto dto = new PlaceDto();
        if (place == null) {
            return dto;
        }
        dto.kind = place.getKind();
        dto.village = place.getVillage();
        dto.town = place.getTown();
        dto.district = place.getDistrict();
        dto.city = place.getCity();
        dto.state = place.getState();
        dto.country = place.getCountry();
        return dto;
    }

    public PlaceInfo toPlaceInfo(PlaceDto place) {
        if (place == null) {
            return null;
        }
        PlaceInfo info = new PlaceInfo();
        info.setKind(trim(place.kind));
        info.setVillage(trim(place.village));
        info.setTown(trim(place.town));
        info.setDistrict(trim(place.district));
        info.setCity(trim(place.city));
        info.setState(trim(place.state));
        info.setCountry(trim(place.country));
        return info;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
