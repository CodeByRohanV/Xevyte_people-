package com.register.example.repository;

import com.register.example.entity.ExitReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExitReasonRepository extends JpaRepository<ExitReason, Long> {

    List<ExitReason> findByActiveTrue();

    @org.springframework.data.jpa.repository.Query("SELECT e FROM ExitReason e WHERE e.active = true AND (e.tenantId = :tenantId OR e.tenantId IS NULL)")
    List<ExitReason> findActiveByTenantIdOrGlobal(@org.springframework.data.repository.query.Param("tenantId") String tenantId);

    List<ExitReason> findByReasonIgnoreCaseAndTenantId(String reason, String tenantId);
}
