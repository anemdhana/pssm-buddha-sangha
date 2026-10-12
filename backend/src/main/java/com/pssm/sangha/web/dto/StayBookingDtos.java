package com.pssm.sangha.web.dto;

import com.pssm.sangha.web.dto.ProfileDtos.ProfileDto;

public final class StayBookingDtos {

    private StayBookingDtos() {
    }

    public static class CreateStayBookingRequest {
        public String plan;
        public String eventId;
        public String eventName;
        public Boolean registerFamily;
        public ProfileDto family;
    }

    public static class UpdateStayBookingRequest {
        public String plan;
        public ProfileDto family;
        /** When true, sync family fields to the sangha person for family mobile. */
        public Boolean updateSanghaProfile;
    }
}
