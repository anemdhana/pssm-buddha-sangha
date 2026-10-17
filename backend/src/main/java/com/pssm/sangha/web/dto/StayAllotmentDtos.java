package com.pssm.sangha.web.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class StayAllotmentDtos {

    private StayAllotmentDtos() {
    }

    public static class CreateAllotmentsRequest {
        public String eventId;
        public String eventName;
        public List<PlacementDto> placements = new ArrayList<>();
    }

    /** Remove guests from hotel rooms (return them to wait list). */
    public static class ReleaseAllotmentsRequest {
        public String eventId;
        public List<GuestDto> members = new ArrayList<>();
    }

    public static class PlacementDto {
        public String bookingId;
        public String plan;
        public String hotelId;
        public String roomNumber;
        public String roomType;
        public String roomKind;
        public String checkInDate;
        public String checkOutDate;
        public Map<String, Object> place;
        public List<GuestDto> members = new ArrayList<>();
    }

    public static class GuestDto {
        public String name;
        public String relation;
        public String mobile;
        public String gender;
        public String age;
        public String livePhoto;
        public Boolean primary;
    }
}
