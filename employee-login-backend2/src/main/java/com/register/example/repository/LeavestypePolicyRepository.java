package com.register.example.repository;

import com.register.example.entity.LeavestypePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeavestypePolicyRepository
        extends JpaRepository<LeavestypePolicy, Long> {

    java.util.List<LeavestypePolicy> findByName(String name);

    java.util.List<LeavestypePolicy> findByStatus(String status);

    Optional<LeavestypePolicy> findByNameAndStatus(String name, String status);

    java.util.List<LeavestypePolicy> findByTenantId(String tenantId);

    Optional<LeavestypePolicy> findByNameAndTenantId(String name, String tenantId);

    Optional<LeavestypePolicy> findByNameAndStatusAndTenantId(String name, String status, String tenantId);
}
