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

    private static String pad2(String value) {
        String digits = value.replaceAll("\\D", "");
        if (digits.length() >= 2) {
            return digits.substring(0, 2);
        }
        return ("0" + digits);
    }
}
