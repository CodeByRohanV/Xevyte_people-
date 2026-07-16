package com.register.example.repository;

import com.register.example.entity.PreOnboardingWorkHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PreOnboardingWorkHistoryRepository
extends JpaRepository<PreOnboardingWorkHistory, Long>
{

 

    List<PreOnboardingWorkHistory> findAllByApplicantId(String applicantId);

    void deleteByApplicantId(String applicantId);
}
