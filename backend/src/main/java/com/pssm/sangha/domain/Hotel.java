package com.pssm.sangha.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "hotels")
public class Hotel {

    @Id
    private String id;

    /** Event this hotel inventory belongs to. */
    private String eventId;
    private String name;
    private String address;
    /** Front-desk / manager phone number. */
    private String contact;
    /** Small hotel photo as data URL or http(s) URL. */
    private String image;
    /** Distance from event venue in kilometres. */
    private double distanceKm;
    private boolean active = true;
    private boolean reserved;
    private List<HotelRoom> rooms = new ArrayList<>();
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isReserved() {
        return reserved;
    }

    public void setReserved(boolean reserved) {
        this.reserved = reserved;
    }

    public List<HotelRoom> getRooms() {
        return rooms;
    }

    public void setRooms(List<HotelRoom> rooms) {
        this.rooms = rooms;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static class HotelRoom {
        private String roomNumber;
        private int capacity;
        /** regular | dormitory | hall */
        private String kind;
        /** ac | non_ac */
        private String roomType;
        /** gents | ladies — required for dormitory/hall */
        private String genderAllowed;
        /** available | occupied */
        private String status;

        public String getRoomNumber() {
            return roomNumber;
        }

        public void setRoomNumber(String roomNumber) {
            this.roomNumber = roomNumber;
        }

        public int getCapacity() {
            return capacity;
        }

        public void setCapacity(int capacity) {
            this.capacity = capacity;
        }

        public String getKind() {
            return kind;
        }

        public void setKind(String kind) {
            this.kind = kind;
        }

        public String getRoomType() {
            return roomType;
        }

        public void setRoomType(String roomType) {
            this.roomType = roomType;
        }

        public String getGenderAllowed() {
            return genderAllowed;
        }

        public void setGenderAllowed(String genderAllowed) {
            this.genderAllowed = genderAllowed;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
