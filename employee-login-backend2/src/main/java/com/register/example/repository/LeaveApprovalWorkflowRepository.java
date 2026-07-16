package com.register.example.repository;

import com.register.example.entity.LeaveApprovalWorkflow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeaveApprovalWorkflowRepository
        extends JpaRepository<LeaveApprovalWorkflow, Long> {

    Optional<LeaveApprovalWorkflow> findByLeaveType_Id(Long leaveTypeId);
    Optional<LeaveApprovalWorkflow> findByLeaveType_IdAndTenantId(Long leaveTypeId, String tenantId);
    java.util.List<LeaveApprovalWorkflow> findByTenantId(String tenantId);
}
