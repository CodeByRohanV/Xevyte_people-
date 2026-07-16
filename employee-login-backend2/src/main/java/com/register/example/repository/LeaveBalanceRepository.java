package com.register.example.repository;

import com.register.example.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
	List<LeaveBalance> findByEmployeeId(String employeeId);

	Optional<LeaveBalance> findByEmployeeIdAndType(String employeeId, String type);

	List<LeaveBalance> findByEmployeeIdAndYear(String employeeId, int year); // This method is required by the service

	List<LeaveBalance> findByEmployeeIdAndTypeAndYear(String employeeId, String type, int year);

	Optional<LeaveBalance> findByEmployeeIdAndTypeAndYearAndMonth(String employeeId, String type, int year, int month);

	List<LeaveBalance> findByEmployeeIdAndTypeAndYearAndMonthOrderByMonthDesc(String employeeId, String type, int year,
			int month);

	// Find all balances for a specific leave type (for deletion when leave type is
	// removed)
	List<LeaveBalance> findByType(String type);
}