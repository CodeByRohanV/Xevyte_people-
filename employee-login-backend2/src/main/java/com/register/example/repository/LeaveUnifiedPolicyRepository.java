package com.register.example.repository;

import com.register.example.entity.LeaveUnifiedPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LeaveUnifiedPolicyRepository extends JpaRepository<LeaveUnifiedPolicy, Long> {
    List<LeaveUnifiedPolicy> findByLeaveTypeId(Long leaveTypeId);

    List<LeaveUnifiedPolicy> findByLeaveTypeIdOrderByPriorityAsc(Long leaveTypeId);

    List<LeaveUnifiedPolicy> findByTenantId(String tenantId);

    List<LeaveUnifiedPolicy> findByLeaveTypeIdAndTenantId(Long leaveTypeId, String tenantId);

    List<LeaveUnifiedPolicy> findByLeaveTypeIdAndTenantIdOrderByPriorityAsc(Long leaveTypeId, String tenantId);
}
