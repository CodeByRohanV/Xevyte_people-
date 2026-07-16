package com.register.example.repository;

import com.register.example.entity.ApplicantDocuments;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface ApplicantDocumentsRepository extends JpaRepository<ApplicantDocuments, Long> {

    Optional<ApplicantDocuments> findByApplicantId(Long applicantId);

    List<ApplicantDocuments> findAllByApplicantId(Long applicantId);

    Optional<ApplicantDocuments> findTopByOfferLetterFileNameOrderByIdDesc(String offerLetterFileName);
    Optional<ApplicantDocuments> findTopByAppointmentLetterFileNameOrderByIdDesc(String appointmentLetterFileName);

    Optional<ApplicantDocuments> findTopByTenantIdAndOfferLetterFileNameOrderByIdDesc(String tenantId, String offerLetterFileName);
    Optional<ApplicantDocuments> findTopByTenantIdAndAppointmentLetterFileNameOrderByIdDesc(String tenantId, String appointmentLetterFileName);
}
