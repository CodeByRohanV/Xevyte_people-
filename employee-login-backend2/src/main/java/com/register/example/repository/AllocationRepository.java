package com.register.example.repository;

import com.register.example.entity.Allocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;
import java.time.LocalDate;


public interface AllocationRepository extends JpaRepository<Allocation, Long>, JpaSpecificationExecutor<Allocation> {

    // Find all allocations by project id
    List<Allocation> findByProjectProjectId(Long projectId);
    
    List<Allocation> findByEmployeeId(String employeeId);
    List<Allocation> findByEmployeeIdIn(List<String> employeeIds);
    
    List<Allocation> findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            String employeeId, LocalDate date1, LocalDate date2
    );

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Allocation a WHERE a.employeeId LIKE CONCAT(:tenantId, '_%')")
    List<Allocation> findByTenantId(@org.springframework.data.repository.query.Param("tenantId") String tenantId);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Allocation a WHERE a.project.projectId = :projectId AND a.employeeId LIKE CONCAT(:tenantId, '_%')")
    List<Allocation> findByProjectProjectIdAndTenantId(
            @org.springframework.data.repository.query.Param("projectId") Long projectId,
            @org.springframework.data.repository.query.Param("tenantId") String tenantId
    );



    // Optional: find by projectId and employeeId, if needed
    // List<Allocation> findByProjectProjectIdAndEmployeeId(Long projectId, Long employeeId);
}
