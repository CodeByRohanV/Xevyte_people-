package com.register.example.repository;

import com.register.example.entity.Grievance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface GrievanceRepository extends JpaRepository<Grievance, String> {

        @Query(value = "SELECT * FROM grievance_master " +
                        "WHERE grievance_id LIKE CONCAT(:prefix, '%') " +
                        "ORDER BY CAST(SUBSTRING(grievance_id, LENGTH(:prefix) + 1) AS UNSIGNED) DESC " +
                        "LIMIT 1", nativeQuery = true)
        Optional<Grievance> findLastByPrefix(@Param("prefix") String prefix);

        Page<Grievance> findByStatusAndTenantId(String status, String tenantId, Pageable pageable);

        Page<Grievance> findByCategoryAndTenantId(String category, String tenantId, Pageable pageable);

        Page<Grievance> findByStatusAndCategoryAndTenantId(String status, String category, String tenantId, Pageable pageable);

        Page<Grievance> findByCategoryStartingWithAndTenantId(String prefix, String tenantId, Pageable pageable);

        Page<Grievance> findByStatusAndCategoryStartingWithAndTenantId(String status, String prefix, String tenantId, Pageable pageable);

        Page<Grievance> findByTenantId(String tenantId, Pageable pageable);

        @Query("""
                        SELECT g FROM Grievance g
                        WHERE g.tenantId = :tenantId
                        AND (:category IS NULL OR g.category = :category)
                        AND (:type IS NULL OR g.type = :type)
                        AND (:status IS NULL OR g.status = :status)
                        AND (:startDate IS NULL OR g.createdDate >= :startDate)
                        AND (:endDate IS NULL OR g.createdDate <= :endDate)
                        """)
        java.util.List<Grievance> getFilteredGrievances(
                        @Param("category") String category,
                        @Param("type") String type,
                        @Param("status") String status,
                        @Param("startDate") java.time.LocalDateTime startDate,
                        @Param("endDate") java.time.LocalDateTime endDate,
                        @Param("tenantId") String tenantId);
}