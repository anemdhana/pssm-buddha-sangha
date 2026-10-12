package com.pssm.sangha.domain;

import java.time.Instant;
import java.time.LocalDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "events")
public class SanghaEvent {

    @Id
    private String id;

    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private String location;
    private double expectedBudgetInr;
    private Double meditationHoursPerDay;
    private String createdBy;
    private Instant createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public double getExpectedBudgetInr() {
        return expectedBudgetInr;
    }

    public void setExpectedBudgetInr(double expectedBudgetInr) {
        this.expectedBudgetInr = expectedBudgetInr;
    }

    public Double getMeditationHoursPerDay() {
        return meditationHoursPerDay;
    }

    public void setMeditationHoursPerDay(Double meditationHoursPerDay) {
        this.meditationHoursPerDay = meditationHoursPerDay;
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
}
