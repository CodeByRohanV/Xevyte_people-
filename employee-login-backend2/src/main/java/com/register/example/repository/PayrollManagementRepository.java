package com.register.example.repository;

import com.register.example.entity.PayrollManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollManagementRepository extends JpaRepository<PayrollManagement, Long> {
    Optional<PayrollManagement> findByEmployeeIdAndPayableMonth(String employeeId, String payableMonth);

    // Find all payroll records for a specific employee (for external API)
    List<PayrollManagement> findByEmployeeId(String employeeId);

    // Find all payroll records for a specific month (for external API)
    List<PayrollManagement> findByPayableMonth(String payableMonth);
}
