package com.pssm.sangha.repo;

import com.pssm.sangha.domain.Person;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PersonRepository extends JpaRepository<Person, Long> {

    Optional<Person> findByMobile(String mobile);

    boolean existsByMobile(String mobile);

    @Query("select distinct p from Person p left join fetch p.roles where p.mobile like concat('%', :digits, '%') order by p.fullName")
    List<Person> searchByMobile(@Param("digits") String digits);

    @Query("select count(distinct p) from Person p join p.roles r where r = 'pssm_admin'")
    long countPssmAdmins();
}
