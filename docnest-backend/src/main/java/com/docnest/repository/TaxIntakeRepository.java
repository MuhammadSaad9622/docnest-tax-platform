package com.docnest.repository;

import com.docnest.entity.TaxIntake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TaxIntakeRepository extends JpaRepository<TaxIntake, Long> {

    Optional<TaxIntake> findByClientIdAndTaxYear(Long clientId, Integer taxYear);
}
