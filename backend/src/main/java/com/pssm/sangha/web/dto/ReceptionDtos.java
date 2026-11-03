package com.pssm.sangha.web.dto;

public final class ReceptionDtos {

    private ReceptionDtos() {
    }

    public static class PersonActionRequest {
        public String personId;
        public String allotmentId;
        public String guestKey;
    }
}
