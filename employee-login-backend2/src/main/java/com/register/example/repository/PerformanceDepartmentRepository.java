package com.register.example.repository;

import com.register.example.entity.PerformanceDepartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceDepartmentRepository extends JpaRepository<PerformanceDepartment, Long> {

    List<PerformanceDepartment> findByTenantId(String tenantId);

    Optional<PerformanceDepartment> findByNameAndTenantId(String name, String tenantId);

    Optional<PerformanceDepartment> findByName(String name);

    @Query("SELECT pd.name FROM PerformanceDepartment pd WHERE pd.tenantId = :tenantId ORDER BY pd.name")
    List<String> findNamesByTenantId(@Param("tenantId") String tenantId);

    @Query("SELECT pd.name FROM PerformanceDepartment pd ORDER BY pd.name")
    List<String> findAllNames();
}
