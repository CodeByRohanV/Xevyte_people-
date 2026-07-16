package com.register.example.repository;

import com.register.example.entity.PreOnboardingDocumentDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PreOnboardingDocumentRepository
        extends JpaRepository<PreOnboardingDocumentDetails, String> {

    Optional<PreOnboardingDocumentDetails> findByApplicantId(String applicantId);

    void deleteByApplicantId(String applicantId);
}
