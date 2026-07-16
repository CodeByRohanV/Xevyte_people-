package com.register.example.repository;

import com.register.example.entity.DepartmentMetricsSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentMetricsSummaryRepository extends JpaRepository<DepartmentMetricsSummary, Long> {
    
    Optional<DepartmentMetricsSummary> findByDepartmentAndRecordDate(String department, LocalDate recordDate);
    
    List<DepartmentMetricsSummary> findByRecordDateBetween(LocalDate startDate, LocalDate endDate);
}
