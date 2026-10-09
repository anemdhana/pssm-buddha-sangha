package com.pssm.sangha.security;

import com.pssm.sangha.domain.Person;
import java.util.Collection;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class SanghaUserDetails implements UserDetails {

    private final Long id;
    private final String mobile;
    private final String fullName;
    private final String passwordHash;
    private final Collection<? extends GrantedAuthority> authorities;

    public SanghaUserDetails(Person person) {
        this.id = person.getId();
        this.mobile = person.getMobile();
        this.fullName = person.getFullName();
        this.passwordHash = person.getPasswordHash();
        this.authorities = person.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .collect(Collectors.toSet());
    }

    public Long getId() {
        return id;
    }

    public String getMobile() {
        return mobile;
    }

    public String getFullName() {
        return fullName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return mobile;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
