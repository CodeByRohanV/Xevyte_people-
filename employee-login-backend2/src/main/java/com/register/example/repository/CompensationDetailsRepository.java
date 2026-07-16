package com.register.example.repository;

import com.register.example.entity.CompensationDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CompensationDetailsRepository extends JpaRepository<CompensationDetails, Long> {
        Optional<CompensationDetails> findByEmployeeId(String employeeId);

        java.util.List<CompensationDetails> findAllByEmployeeId(String employeeId);

        java.util.Optional<CompensationDetails> findByEmployeeIdAndEffectiveDate(String employeeId,
                        java.time.LocalDate effectiveDate);

        java.util.List<CompensationDetails> findByCurrentApproverIdAndApprovalStatusNot(String currentApproverId,
                        String status);

        java.util.Optional<CompensationDetails> findTopByEmployeeIdOrderByIdDesc(String employeeId);
}
