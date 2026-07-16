package com.register.example.repository;

import com.register.example.entity.PreOnboardingAddressDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PreOnboardingAddressRepository
        extends JpaRepository<PreOnboardingAddressDetails, String> {

    Optional<PreOnboardingAddressDetails> findByApplicantId(String applicantId);

    void deleteByApplicantId(String applicantId);
}
