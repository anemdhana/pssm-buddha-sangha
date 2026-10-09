package com.pssm.sangha;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.pssm.sangha.service.PasswordSupport;
import org.junit.jupiter.api.Test;

class PasswordSupportTest {

    @Test
    void composedPasswordMatchesPrototype() {
        assertEquals("PssmA0101", PasswordSupport.composedPassword("Pssm Admin", "01", "01"));
        assertEquals("Ramak1508", PasswordSupport.composedPassword("Ramakrishna", "15", "8"));
    }

    @Test
    void normalizeMobileStripsNonDigits() {
        assertEquals("9876543210", PasswordSupport.normalizeMobile("98765 43210"));
    }
}
