package com.register.example.repository;

import com.register.example.entity.AssetAllocation;
import com.register.example.entity.AssetMaster;
import com.register.example.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssetAllocationRepository extends JpaRepository<AssetAllocation, Long> {
    List<AssetAllocation> findByEmployeeAndActiveTrue(Employee employee);

    Optional<AssetAllocation> findByAssetAndActiveTrue(AssetMaster asset);
    List<AssetAllocation> findByAssetOrderByCreatedAtDesc(AssetMaster asset);
    Optional<AssetAllocation> findTopByAllocationIdStartingWithOrderByIdDesc(String prefix);
    AssetAllocation findTopByOrderByIdDesc();

    @Query("SELECT DISTINCT a FROM AssetAllocation a JOIN FETCH a.asset s JOIN FETCH a.employee e LEFT JOIN FETCH s.category c LEFT JOIN FETCH s.subCategory sc ORDER BY a.id DESC")
    List<AssetAllocation> findAllWithDetails();
    
    // Tenant-scoped version
    @Query("SELECT DISTINCT a FROM AssetAllocation a JOIN FETCH a.asset s JOIN FETCH a.employee e LEFT JOIN FETCH s.category c LEFT JOIN FETCH s.subCategory sc WHERE e.employeeId LIKE CONCAT(:tenantId, '_%') ORDER BY a.id DESC")
    List<AssetAllocation> findAllWithDetailsByTenantId(@Param("tenantId") String tenantId);

    @Query("SELECT DISTINCT a FROM AssetAllocation a JOIN FETCH a.asset s JOIN FETCH a.employee e LEFT JOIN FETCH s.category c LEFT JOIN FETCH s.subCategory sc ORDER BY a.id DESC")
    Page<AssetAllocation> findAllWithDetailsPaginated(Pageable pageable);
    
    // Tenant-scoped paginated version
    @Query("SELECT DISTINCT a FROM AssetAllocation a JOIN FETCH a.asset s JOIN FETCH a.employee e LEFT JOIN FETCH s.category c LEFT JOIN FETCH s.subCategory sc WHERE e.employeeId LIKE CONCAT(:tenantId, '_%') ORDER BY a.id DESC")
    Page<AssetAllocation> findAllWithDetailsPaginatedByTenantId(@Param("tenantId") String tenantId, Pageable pageable);

    @Query("SELECT DISTINCT a FROM AssetAllocation a JOIN FETCH a.asset s JOIN FETCH a.employee e LEFT JOIN FETCH s.category c LEFT JOIN FETCH s.subCategory sc WHERE " +
           "a.allocationId LIKE %:search% OR " +
           "s.assetTag LIKE %:search% OR " +
           "e.employeeId LIKE %:search% OR " +
           "e.firstName LIKE %:search% OR " +
           "e.lastName LIKE %:search% OR " +
           "a.conditionAtIssue LIKE %:search% OR " +
           "a.conditionAtReturn LIKE %:search% OR " +
           "a.accessoriesIssued LIKE %:search% OR " +
           "a.damageNotes LIKE %:search%")
    Page<AssetAllocation> searchAllocations(@Param("search") String search, Pageable pageable);

    // Tenant-scoped search
    @Query("SELECT DISTINCT a FROM AssetAllocation a JOIN FETCH a.asset s JOIN FETCH a.employee e LEFT JOIN FETCH s.category c LEFT JOIN FETCH s.subCategory sc WHERE " +
           "e.employeeId LIKE CONCAT(:tenantId, '_%') AND (" +
           "a.allocationId LIKE %:search% OR " +
           "s.assetTag LIKE %:search% OR " +
           "e.employeeId LIKE %:search% OR " +
           "e.firstName LIKE %:search% OR " +
           "e.lastName LIKE %:search% OR " +
           "a.conditionAtIssue LIKE %:search% OR " +
           "a.conditionAtReturn LIKE %:search% OR " +
           "a.accessoriesIssued LIKE %:search% OR " +
           "a.damageNotes LIKE %:search%)")
    Page<AssetAllocation> searchAllocationsByTenantId(@Param("search") String search, @Param("tenantId") String tenantId, Pageable pageable);

    @Query("SELECT a FROM AssetAllocation a WHERE a.returnDate IS NULL AND a.expectedReturnDate BETWEEN :start AND :end")
    List<AssetAllocation> findByReturnDateIsNullAndExpectedReturnDateBetween(@Param("start") java.time.LocalDate start, @Param("end") java.time.LocalDate end);
}
