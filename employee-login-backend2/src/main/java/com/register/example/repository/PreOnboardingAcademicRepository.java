package com.register.example.repository;

import com.register.example.entity.PreOnboardingAcademicDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PreOnboardingAcademicRepository
        extends JpaRepository<PreOnboardingAcademicDetails, String> {

    Optional<PreOnboardingAcademicDetails> findByApplicantId(String applicantId);

    void deleteByApplicantId(String applicantId);
}
