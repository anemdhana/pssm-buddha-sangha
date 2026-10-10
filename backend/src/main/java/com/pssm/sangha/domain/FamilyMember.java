package com.pssm.sangha.domain;

public class FamilyMember {

    private int sortOrder;
    private String name;
    private String relation;
    private String mobile;
    private String gender;
    private String ageGroup;
    private String meditation;
    private String addrMode;
    private String idType;
    private String livePhoto;
    private String idProofPhoto;
    private PlaceInfo place;

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

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

    public String getAgeGroup() {
        return ageGroup;
    }

    public void setAgeGroup(String ageGroup) {
        this.ageGroup = ageGroup;
    }

    public String getMeditation() {
        return meditation;
    }

    public void setMeditation(String meditation) {
        this.meditation = meditation;
    }

    public String getAddrMode() {
        return addrMode;
    }

    public void setAddrMode(String addrMode) {
        this.addrMode = addrMode;
    }

    public String getIdType() {
        return idType;
    }

    public void setIdType(String idType) {
        this.idType = idType;
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

    public PlaceInfo getPlace() {
        return place;
    }

    public void setPlace(PlaceInfo place) {
        this.place = place;
    }
}
