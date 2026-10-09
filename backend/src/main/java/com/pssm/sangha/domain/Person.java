package com.pssm.sangha.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "sangha_person")
public class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String mobile;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    private String email;

    @Column(name = "alt_mobile")
    private String altMobile;

    private String gender;

    @Column(name = "age_group")
    private String ageGroup;

    private String meditation;

    @Column(name = "birth_date", length = 2)
    private String birthDate;

    @Column(name = "birth_month", length = 2)
    private String birthMonth;

    private String language;

    @Column(name = "pyramid_center")
    private String pyramidCenter;

    @Column(name = "since_year", length = 4)
    private String sinceYear;

    @Column(name = "id_type")
    private String idType;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

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

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "sangha_person_role", joinColumns = @JoinColumn(name = "person_id"))
    @Column(name = "role_id")
    private Set<String> roles = new HashSet<>();

    @OneToMany(mappedBy = "person", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<FamilyMember> members = new ArrayList<>();

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAltMobile() {
        return altMobile;
    }

    public void setAltMobile(String altMobile) {
        this.altMobile = altMobile;
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

    public String getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(String birthDate) {
        this.birthDate = birthDate;
    }

    public String getBirthMonth() {
        return birthMonth;
    }

    public void setBirthMonth(String birthMonth) {
        this.birthMonth = birthMonth;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getPyramidCenter() {
        return pyramidCenter;
    }

    public void setPyramidCenter(String pyramidCenter) {
        this.pyramidCenter = pyramidCenter;
    }

    public String getSinceYear() {
        return sinceYear;
    }

    public void setSinceYear(String sinceYear) {
        this.sinceYear = sinceYear;
    }

    public String getIdType() {
        return idType;
    }

    public void setIdType(String idType) {
        this.idType = idType;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public List<FamilyMember> getMembers() {
        return members;
    }

    public void setMembers(List<FamilyMember> members) {
        this.members = members;
    }
}
