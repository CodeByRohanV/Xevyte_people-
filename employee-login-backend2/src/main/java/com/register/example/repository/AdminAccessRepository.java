package com.register.example.repository;

import com.register.example.entity.AdminAccess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminAccessRepository extends JpaRepository<AdminAccess, Long> {
    Optional<AdminAccess> findByRoleNameAndTenantId(String roleName, String tenantId);
}
