package com.pssm.sangha.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "stay_allotments")
public class StayAllotment {

    @Id
    private String id;

    private String eventId;
    private String eventName;
    private String bookingId;
    private String plan;
    /** allotted | checked_in | checked_out */
    private String status;
    private String hotelId;
    private String hotelName;
    private String roomNumber;
    /** ac | non_ac */
    private String roomType;
    /** regular | dormitory | hall */
    private String roomKind;
    private String familyMobile;
    private String familyFullName;
    private PlaceInfo place;
    private List<AllotmentGuest> guests = new ArrayList<>();
    private String checkInDate;
    private String checkOutDate;
    private Instant createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getHotelId() {
        return hotelId;
    }

    public void setHotelId(String hotelId) {
        this.hotelId = hotelId;
    }

    public String getHotelName() {
        return hotelName;
    }

    public void setHotelName(String hotelName) {
        this.hotelName = hotelName;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public String getRoomKind() {
        return roomKind;
    }

    public void setRoomKind(String roomKind) {
        this.roomKind = roomKind;
    }

    public String getFamilyMobile() {
        return familyMobile;
    }

    public void setFamilyMobile(String familyMobile) {
        this.familyMobile = familyMobile;
    }

    public String getFamilyFullName() {
        return familyFullName;
    }

    public void setFamilyFullName(String familyFullName) {
        this.familyFullName = familyFullName;
    }

    public PlaceInfo getPlace() {
        return place;
    }

    public void setPlace(PlaceInfo place) {
        this.place = place;
    }

    public List<AllotmentGuest> getGuests() {
        return guests;
    }

    public void setGuests(List<AllotmentGuest> guests) {
        this.guests = guests;
    }

    public String getCheckInDate() {
        return checkInDate;
    }

    public void setCheckInDate(String checkInDate) {
        this.checkInDate = checkInDate;
    }

    public String getCheckOutDate() {
        return checkOutDate;
    }

    public void setCheckOutDate(String checkOutDate) {
        this.checkOutDate = checkOutDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static class AllotmentGuest {
        private String name;
        private String relation;
        private String mobile;
        private String gender;
        private String age;
        private String livePhoto;
        private String idProofPhoto;
        private String idType;
        private String stayStartDate;
        private String stayEndDate;
        private boolean primary;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getRelation() {
            return relation;
        }

        public void setRelation(String relation) {
            this.relation = relation;
        }

        public String getMobile() {
            return mobile;
        }

        public void setMobile(String mobile) {
            this.mobile = mobile;
        }

        public String getGender() {
            return gender;
        }

        public void setGender(String gender) {
            this.gender = gender;
        }

        public String getAge() {
            return age;
        }

        public void setAge(String age) {
            this.age = age;
        }

        public String getLivePhoto() {
            return livePhoto;
        }

        public void setLivePhoto(String livePhoto) {
            this.livePhoto = livePhoto;
        }

        public String getIdProofPhoto() {
            return idProofPhoto;
        }

        public void setIdProofPhoto(String idProofPhoto) {
            this.idProofPhoto = idProofPhoto;
        }

        public String getIdType() {
            return idType;
        }

        public void setIdType(String idType) {
            this.idType = idType;
        }

        public String getStayStartDate() {
            return stayStartDate;
        }

        public void setStayStartDate(String stayStartDate) {
            this.stayStartDate = stayStartDate;
        }

        public String getStayEndDate() {
            return stayEndDate;
        }

        public void setStayEndDate(String stayEndDate) {
            this.stayEndDate = stayEndDate;
        }

        public boolean isPrimary() {
            return primary;
        }

        public void setPrimary(boolean primary) {
            this.primary = primary;
        }
    }
}
