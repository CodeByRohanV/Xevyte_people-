package com.register.example.repository;

import com.register.example.entity.PerformanceGoalTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PerformanceGoalTemplateRepository extends JpaRepository<PerformanceGoalTemplate, Long> {
    List<PerformanceGoalTemplate> findByTenantId(String tenantId);
    List<PerformanceGoalTemplate> findByDepartmentAndTenantId(String department, String tenantId);
    List<PerformanceGoalTemplate> findByDepartment(String department);
}
