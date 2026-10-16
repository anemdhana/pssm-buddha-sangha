package com.pssm.sangha.domain;

import java.util.Set;

public final class SanghaRole {

    public static final String PSSM_ADMIN = "pssm_admin";
    public static final String EVENT_ORGANIZER = "event_organizer";
    public static final String PYRAMID_SEVADAL = "pyramid_sevadal";
    public static final String PMMA_MEMBER = "pmma_member";
    public static final String ACCOMMODATION_VOLUNTEER = "accommodation_volunteer";
    public static final String ACCOMMODATION_ADMIN = "accommodation_admin";

    public static final Set<String> ALL = Set.of(
            PSSM_ADMIN, EVENT_ORGANIZER, PYRAMID_SEVADAL, PMMA_MEMBER,
            ACCOMMODATION_VOLUNTEER, ACCOMMODATION_ADMIN
    );

    public static final Set<String> ASSIGNABLE = Set.of(
            EVENT_ORGANIZER, PYRAMID_SEVADAL, PMMA_MEMBER,
            ACCOMMODATION_VOLUNTEER, ACCOMMODATION_ADMIN
    );

    private SanghaRole() {
    }
}
