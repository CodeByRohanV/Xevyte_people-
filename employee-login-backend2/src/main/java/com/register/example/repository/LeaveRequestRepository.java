package com.register.example.repository;

import com.register.example.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface LeaveRequestRepository
        extends JpaRepository<LeaveRequest, Long>, JpaSpecificationExecutor<LeaveRequest> {

    // ===== Employee-Specific Queries =====

    List<LeaveRequest> findByEmployeeId(String employeeId);

    List<LeaveRequest> findByEmployeeIdAndStatus(String employeeId, String status);

    List<LeaveRequest> findByEmployeeIdAndType(String employeeId, String type);

    List<LeaveRequest> findByEmployeeIdInAndStatus(List<String> employeeIds, String status);

    List<LeaveRequest> findByEmployeeIdInAndStatusIn(List<String> employeeIds, List<String> statuses);

    Optional<LeaveRequest> findFirstByEmployeeIdAndFileNameOrderByCreatedDateDesc(String employeeId, String fileName);

    // ===== File-Related Queries =====

    List<LeaveRequest> findByAttachmentIsNotNull();

    List<LeaveRequest> findByAttachmentIsNull();

    List<LeaveRequest> findByFileNameContainingIgnoreCase(String fileName);

    List<LeaveRequest> findByFileName(String fileName);

    // ===== Workflow Queries =====
    List<LeaveRequest> findByPendingApproversContaining(String approverId);

    List<LeaveRequest> findByStatusStartingWith(String statusPrefix);

    List<LeaveRequest> findByAssignedHrIdAndStatus(String hrId, String status);
}
