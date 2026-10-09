package com.pssm.sangha.security;

import com.pssm.sangha.repo.PersonRepository;
import com.pssm.sangha.service.PasswordSupport;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class SanghaUserDetailsService implements UserDetailsService {

    private final PersonRepository personRepository;

    public SanghaUserDetailsService(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String mobile = PasswordSupport.normalizeMobile(username);
        return personRepository.findByMobile(mobile)
                .map(SanghaUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("No sangha join found for this mobile."));
    }
}
