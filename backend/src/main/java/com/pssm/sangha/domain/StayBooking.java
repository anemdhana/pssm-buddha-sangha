package com.pssm.sangha.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "stay_bookings")
public class StayBooking {

    @Id
    private String id;

    private String eventId;
    private String eventName;
    private String plan;
    private String status;
    private String createdByMobile;
    private String familyMobile;
    private String familyFullName;
    private boolean registeredFamily;
    private PlaceInfo place;
    private List<StayGuest> guests = new ArrayList<>();
    /** Full wizard payload for edit and display. */
    private Map<String, Object> familyDetail = new LinkedHashMap<>();
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

    public String getCreatedByMobile() {
        return createdByMobile;
    }

    public void setCreatedByMobile(String createdByMobile) {
        this.createdByMobile = createdByMobile;
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

    public boolean isRegisteredFamily() {
        return registeredFamily;
    }

    public void setRegisteredFamily(boolean registeredFamily) {
        this.registeredFamily = registeredFamily;
    }

    public PlaceInfo getPlace() {
        return place;
    }

    public void setPlace(PlaceInfo place) {
        this.place = place;
    }

    public List<StayGuest> getGuests() {
        return guests;
    }

    public void setGuests(List<StayGuest> guests) {
        this.guests = guests;
    }

    public Map<String, Object> getFamilyDetail() {
        return familyDetail;
    }

    public void setFamilyDetail(Map<String, Object> familyDetail) {
        this.familyDetail = familyDetail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static class StayGuest {
        private String name;
        private String relation;
        private String mobile;
        private String gender;
        private String age;
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
