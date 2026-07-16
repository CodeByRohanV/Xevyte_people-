package com.register.example.repository;

import com.register.example.entity.PolicyAcknowledgment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PolicyAcknowledgmentRepository extends JpaRepository<PolicyAcknowledgment, Long> {
    List<PolicyAcknowledgment> findByEmployeeId(String employeeId);
    Optional<PolicyAcknowledgment> findByEmployeeIdAndPolicyId(String employeeId, Long policyId);
    List<PolicyAcknowledgment> findByEmployeeIdAndTenantId(String employeeId, String tenantId);
}
