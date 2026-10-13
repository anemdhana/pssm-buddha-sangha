package com.pssm.sangha.web.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class ProfileDtos {

    private ProfileDtos() {
    }

    public static class PlaceDto {
        public String kind;
        public String village;
        public String town;
        public String district;
        public String city;
        public String state;
        public String country;
    }

    public static class MemberDto {
        public String name;
        public String relation;
        public String mobile;
        public String gender;
        public String age;
        public String meditation;
        public String profession;
        public String addrMode;
        public String idType;
        public String livePhoto;
        public String idProofPhoto;
        public PlaceDto place;
        public String stayStartDate;
        public String stayEndDate;
    }

    public static class ProfileDto {
        public String fullName;
        public String mobile;
        public String email;
        public String altMobile;
        public String gender;
        public String age;
        public String meditation;
        public String profession;
        public String birthDate;
        public String birthMonth;
        public String language;
        public String pyramidCenter;
        public String sinceYear;
        public String idType;
        public String livePhoto;
        public String idProofPhoto;
        public PlaceDto place;
        public List<MemberDto> members = new ArrayList<>();
        public List<String> roles = new ArrayList<>();
        public String stayStartDate;
        public String stayEndDate;
    }

    public static class LoginRequest {
        public String mobile;
        public String password;
    }

    public static class PasswordRequest {
        public String currentPassword;
        public String newPassword;
        public String confirmPassword;
    }

    public static class RolesRequest {
        public List<String> roles;
    }

    public static class EventRequest {
        public String name;
        public String startDate;
        public String endDate;
        public String location;
        public Double expectedBudgetInr;
        public Double meditationHoursPerDay;
    }

    public static Map<String, Object> ok() {
        return Map.of("ok", true);
    }
}
