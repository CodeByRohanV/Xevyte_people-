package com.register.example.repository;

import com.register.example.entity.CalcStructure;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CalcStructureRepository extends JpaRepository<CalcStructure, Long> {

    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM CalcStructure s WHERE LOWER(s.name) = LOWER(:name) AND (:tenantId IS NULL AND s.tenantId IS NULL OR s.tenantId = :tenantId)")
    boolean existsByNameIgnoreCaseAndTenantId(@Param("name") String name, @Param("tenantId") String tenantId);

    /** Fetch all structures marked as reusable templates */
    List<CalcStructure> findByIsTemplateTrueOrderByNameAsc();

    @Query("SELECT s FROM CalcStructure s WHERE s.isTemplate = true AND (:tenantId IS NULL AND s.tenantId IS NULL OR s.tenantId = :tenantId) ORDER BY s.name ASC")
    List<CalcStructure> findByIsTemplateTrueAndTenantIdOrderByNameAsc(@Param("tenantId") String tenantId);

    Page<CalcStructure> findByStatus(String status, Pageable pageable);

    @Query("SELECT s FROM CalcStructure s WHERE " +
           "(:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:tenantId IS NULL AND s.tenantId IS NULL OR s.tenantId = :tenantId)")
    Page<CalcStructure> findBySearchAndStatusAndTenantId(
        @Param("search") String search,
        @Param("status") String status,
        @Param("tenantId") String tenantId,
        Pageable pageable
    );
}
