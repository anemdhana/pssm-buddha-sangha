package com.pssm.sangha.service;

import com.pssm.sangha.domain.FamilyMember;
import com.pssm.sangha.domain.Person;
import com.pssm.sangha.web.dto.ProfileDtos.MemberDto;
import com.pssm.sangha.web.dto.ProfileDtos.PlaceDto;
import com.pssm.sangha.web.dto.ProfileDtos.ProfileDto;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ProfileMapper {

    public ProfileDto toDto(Person person) {
        ProfileDto dto = new ProfileDto();
        dto.fullName = person.getFullName();
        dto.mobile = person.getMobile();
        dto.email = person.getEmail();
        dto.altMobile = person.getAltMobile();
        dto.gender = person.getGender();
        dto.age = person.getAgeGroup();
        dto.meditation = person.getMeditation();
        dto.birthDate = person.getBirthDate();
        dto.birthMonth = person.getBirthMonth();
        dto.language = person.getLanguage();
        dto.pyramidCenter = person.getPyramidCenter();
        dto.sinceYear = person.getSinceYear();
        dto.idType = person.getIdType();
        dto.livePhoto = person.getLivePhoto();
        dto.idProofPhoto = person.getIdProofPhoto();
        dto.place = placeFromPerson(person);
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
        person.setBirthDate(trim(dto.birthDate));
        person.setBirthMonth(trim(dto.birthMonth));
        person.setLanguage(trim(dto.language));
        person.setPyramidCenter(trim(dto.pyramidCenter));
        person.setSinceYear(trim(dto.sinceYear));
        person.setIdType(trim(dto.idType));
        person.setLivePhoto(dto.livePhoto);
        person.setIdProofPhoto(dto.idProofPhoto);
        applyPlace(person, dto.place);
        replaceMembers(person, dto.members);
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
        dto.addrMode = member.getAddrMode();
        dto.idType = member.getIdType();
        dto.livePhoto = member.getLivePhoto();
        dto.idProofPhoto = member.getIdProofPhoto();
        PlaceDto place = new PlaceDto();
        place.kind = member.getPlaceKind();
        place.village = member.getPlaceVillage();
        place.town = member.getPlaceTown();
        place.district = member.getPlaceDistrict();
        place.city = member.getPlaceCity();
        place.state = member.getPlaceState();
        place.country = member.getPlaceCountry();
        dto.place = place;
        return dto;
    }

    private void replaceMembers(Person person, List<MemberDto> members) {
        person.getMembers().clear();
        if (members == null) {
            return;
        }
        int order = 0;
        for (MemberDto dto : members) {
            FamilyMember member = new FamilyMember();
            member.setPerson(person);
            member.setSortOrder(order++);
            member.setName(trim(dto.name));
            member.setRelation(trim(dto.relation));
            member.setMobile(PasswordSupport.normalizeMobile(dto.mobile));
            member.setGender(trim(dto.gender));
            member.setAgeGroup(trim(dto.age));
            member.setMeditation(trim(dto.meditation));
            member.setAddrMode(trim(dto.addrMode));
            member.setIdType(trim(dto.idType));
            member.setLivePhoto(dto.livePhoto);
            member.setIdProofPhoto(dto.idProofPhoto);
            if (dto.place != null) {
                member.setPlaceKind(trim(dto.place.kind));
                member.setPlaceVillage(trim(dto.place.village));
                member.setPlaceTown(trim(dto.place.town));
                member.setPlaceDistrict(trim(dto.place.district));
                member.setPlaceCity(trim(dto.place.city));
                member.setPlaceState(trim(dto.place.state));
                member.setPlaceCountry(trim(dto.place.country));
            }
            person.getMembers().add(member);
        }
    }

    private PlaceDto placeFromPerson(Person person) {
        PlaceDto place = new PlaceDto();
        place.kind = person.getPlaceKind();
        place.village = person.getPlaceVillage();
        place.town = person.getPlaceTown();
        place.district = person.getPlaceDistrict();
        place.city = person.getPlaceCity();
        place.state = person.getPlaceState();
        place.country = person.getPlaceCountry();
        return place;
    }

    private void applyPlace(Person person, PlaceDto place) {
        if (place == null) {
            return;
        }
        person.setPlaceKind(trim(place.kind));
        person.setPlaceVillage(trim(place.village));
        person.setPlaceTown(trim(place.town));
        person.setPlaceDistrict(trim(place.district));
        person.setPlaceCity(trim(place.city));
        person.setPlaceState(trim(place.state));
        person.setPlaceCountry(trim(place.country));
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
