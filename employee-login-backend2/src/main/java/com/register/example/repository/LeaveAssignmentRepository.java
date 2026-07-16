package com.register.example.repository;

import com.register.example.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveAssignmentRepository extends JpaRepository<LeaveBalance, Long> {

    List<LeaveBalance> findByEmployeeId(String employeeId);
}
