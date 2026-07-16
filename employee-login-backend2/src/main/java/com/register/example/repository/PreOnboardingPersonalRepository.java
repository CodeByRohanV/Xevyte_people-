package com.register.example.repository;

import com.register.example.entity.PreOnboardingPersonalDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PreOnboardingPersonalRepository
        extends JpaRepository<PreOnboardingPersonalDetails, String> {

    Optional<PreOnboardingPersonalDetails> findByApplicantId(String applicantId);

    void deleteByApplicantId(String applicantId);
    
    boolean existsByWorkEmail(String workEmail);
}
