package com.pssm.sangha.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "sangha_family_member")
public class FamilyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    private String name;

    @Column(name = "relation_label")
    private String relation;

    private String mobile;
    private String gender;

    @Column(name = "age_group")
    private String ageGroup;

    private String meditation;

    @Column(name = "addr_mode")
    private String addrMode;

    @Column(name = "id_type")
    private String idType;

    @Column(name = "live_photo", columnDefinition = "LONGTEXT")
    private String livePhoto;

    @Column(name = "id_proof_photo", columnDefinition = "LONGTEXT")
    private String idProofPhoto;

    @Column(name = "place_kind")
    private String placeKind;

    @Column(name = "place_village")
    private String placeVillage;

    @Column(name = "place_town")
    private String placeTown;

    @Column(name = "place_district")
    private String placeDistrict;

    @Column(name = "place_city")
    private String placeCity;

    @Column(name = "place_state")
    private String placeState;

    @Column(name = "place_country")
    private String placeCountry;

    public Long getId() {
        return id;
    }

    public Person getPerson() {
        return person;
    }

    public void setPerson(Person person) {
        this.person = person;
    }

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

    public String getPlaceKind() {
        return placeKind;
    }

    public void setPlaceKind(String placeKind) {
        this.placeKind = placeKind;
    }

    public String getPlaceVillage() {
        return placeVillage;
    }

    public void setPlaceVillage(String placeVillage) {
        this.placeVillage = placeVillage;
    }

    public String getPlaceTown() {
        return placeTown;
    }

    public void setPlaceTown(String placeTown) {
        this.placeTown = placeTown;
    }

    public String getPlaceDistrict() {
        return placeDistrict;
    }

    public void setPlaceDistrict(String placeDistrict) {
        this.placeDistrict = placeDistrict;
    }

    public String getPlaceCity() {
        return placeCity;
    }

    public void setPlaceCity(String placeCity) {
        this.placeCity = placeCity;
    }

    public String getPlaceState() {
        return placeState;
    }

    public void setPlaceState(String placeState) {
        this.placeState = placeState;
    }

    public String getPlaceCountry() {
        return placeCountry;
    }

    public void setPlaceCountry(String placeCountry) {
        this.placeCountry = placeCountry;
    }
}
