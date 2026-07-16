package com.register.example.repository;

import com.register.example.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeaveTypeRepository extends JpaRepository<LeaveType, Long> {
    Optional<LeaveType> findByType(String type);
    Optional<LeaveType> findByTypeAndTenantId(String type, String tenantId);
    java.util.List<LeaveType> findByTenantId(String tenantId);
}
