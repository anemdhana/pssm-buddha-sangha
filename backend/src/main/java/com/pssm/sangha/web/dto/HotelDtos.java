package com.pssm.sangha.web.dto;

import java.util.List;

public final class HotelDtos {

    private HotelDtos() {
    }

    public static class HotelRoomRequest {
        public String roomNumber;
        public Integer capacity;
        public String kind;
        public String roomType;
        public String genderAllowed;
        public String status;
    }

    public static class HotelRequest {
        public String eventId;
        public String name;
        public String address;
        public String contact;
        public String image;
        public Double distanceKm;
        public Boolean active;
        public Boolean reserved;
        public List<HotelRoomRequest> rooms;
    }
}
