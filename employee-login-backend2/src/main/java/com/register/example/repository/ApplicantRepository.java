package com.register.example.repository;

import com.register.example.entity.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicantRepository extends JpaRepository<Applicant, String> {

    boolean existsByApplicantId(String applicantId);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    List<Applicant> findByStatusIgnoreCase(String status);

    List<Applicant> findByStatus(String status);

    List<Applicant> findByStatusAndTenantId(String status, String tenantId);

    List<Applicant> findByStatusIgnoreCaseAndTenantId(String status, String tenantId);

    Optional<Applicant> findByApplicantId(String applicantId);

    // Fetch all IDs starting with prefix (YYYYMM), ordered descending
    @Query("SELECT a.applicantId FROM Applicant a " +
            "WHERE a.applicantId LIKE CONCAT(:prefix, '%') " +
            "ORDER BY a.applicantId DESC")
    List<String> findLatestApplicantIdByPrefix(@Param("prefix") String prefix);

    @Query("SELECT a.applicantId FROM Applicant a " +
            "WHERE a.tenantId = :tenantId " +
            "AND a.applicantId LIKE CONCAT(:tenantId, '_', :yearMonth, '%') " +
            "ORDER BY a.applicantId DESC")
    List<String> findLatestApplicantIdByTenantIdAndYearMonth(
            @Param("tenantId") String tenantId, 
            @Param("yearMonth") String yearMonth);

    @Query("SELECT a.applicantId FROM Applicant a " +
            "WHERE (a.tenantId IS NULL OR a.tenantId = '') " +
            "AND a.applicantId LIKE CONCAT(:yearMonth, '%') " +
            "ORDER BY a.applicantId DESC")
    List<String> findLatestApplicantIdWithoutTenantAndYearMonth(
            @Param("yearMonth") String yearMonth);

    @Query("SELECT a.applicantId FROM Applicant a WHERE LOWER(a.status) = 'accepted'")
    List<String> findAcceptedApplicantIds();

    @Query("SELECT DISTINCT a.client FROM Applicant a WHERE a.client IS NOT NULL AND a.client <> ''")
    List<String> findDistinctClients();

    @Query("SELECT DISTINCT a.position FROM Applicant a WHERE a.position IS NOT NULL AND a.position <> ''")
    List<String> findDistinctPositions();

    @Query("SELECT DISTINCT a.status FROM Applicant a WHERE a.status IS NOT NULL AND a.status <> ''")
    List<String> findDistinctStatuses();

    @Query("SELECT DISTINCT a.client FROM Applicant a WHERE a.tenantId = :tenantId AND a.client IS NOT NULL AND a.client <> ''")
    List<String> findDistinctClientsByTenant(@Param("tenantId") String tenantId);

    @Query("SELECT DISTINCT a.position FROM Applicant a WHERE a.tenantId = :tenantId AND a.position IS NOT NULL AND a.position <> ''")
    List<String> findDistinctPositionsByTenant(@Param("tenantId") String tenantId);

    @Query("SELECT DISTINCT a.status FROM Applicant a WHERE a.tenantId = :tenantId AND a.status IS NOT NULL AND a.status <> ''")
    List<String> findDistinctStatusesByTenant(@Param("tenantId") String tenantId);
}
