package com.pssm.sangha.service;

public final class PasswordSupport {

    private PasswordSupport() {
    }

    public static String normalizeMobile(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }

    public static String composedPassword(String fullName, String birthDate, String birthMonth) {
        if (fullName == null || birthDate == null || birthMonth == null) {
            return "";
        }
        String letters = fullName.replaceAll("[^A-Za-z]", "");
        if (letters.length() > 5) {
            letters = letters.substring(0, 5);
        }
        if (letters.isEmpty() || birthDate.isBlank() || birthMonth.isBlank()) {
            return "";
        }
        return letters + pad2(birthDate) + pad2(birthMonth);
    }

    /**
     * Hotel Desk temp password: up to 4 letters of hotel name + up to 4 of person name
     * + last 4 digits of contact (e.g. Sai Prakash / Meena Rao / 9966362691 → SaipMeen2691).
     */
    public static String hotelDeskPassword(String hotelName, String personName, String contact) {
        String hotelLetters = lettersOnly(hotelName);
        String personLetters = lettersOnly(personName);
        if (hotelLetters.length() > 4) {
            hotelLetters = hotelLetters.substring(0, 4);
        }
        if (personLetters.length() > 4) {
            personLetters = personLetters.substring(0, 4);
        }
        String digits = normalizeMobile(contact);
        String last4 = digits.length() <= 4 ? digits : digits.substring(digits.length() - 4);
        if (hotelLetters.isEmpty() || personLetters.isEmpty() || last4.isEmpty()) {
            return "";
        }
        return hotelLetters + personLetters + last4;
    }

    private static String lettersOnly(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("[^A-Za-z]", "");
    }

    private static String pad2(String value) {
        String digits = value.replaceAll("\\D", "");
        if (digits.length() >= 2) {
            return digits.substring(0, 2);
        }
        return ("0" + digits);
    }
}
