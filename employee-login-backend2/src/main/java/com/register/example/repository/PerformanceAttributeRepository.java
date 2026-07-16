package com.register.example.repository;

import com.register.example.entity.PerformanceAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PerformanceAttributeRepository
        extends JpaRepository<PerformanceAttribute, Long>, JpaSpecificationExecutor<PerformanceAttribute> {

    List<PerformanceAttribute> findByEmployeeId(String employeeId);

    List<PerformanceAttribute> findByAssignedBy(String assignedBy);

    List<PerformanceAttribute> findByAssignedByAndStatus(String assignedBy, String status);

    List<PerformanceAttribute> findByEmployeeIdInAndStatus(List<String> employeeIds, String status);

    List<PerformanceAttribute> findByStatus(String status);

    List<PerformanceAttribute> findByStatusIn(List<String> statuses);

    List<PerformanceAttribute> findByStatusInAndIsArchived(List<String> statuses, boolean isArchived);

    List<PerformanceAttribute> findByEmployeeIdAndIsArchived(String employeeId, boolean isArchived);

    List<PerformanceAttribute> findByEmployeeIdAndIsArchivedAndArchivedHalfContaining(
            String employeeId, boolean isArchived, String year);
}
