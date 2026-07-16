package com.register.example.repository;

import com.register.example.entity.SalaryConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryConfigurationRepository extends JpaRepository<SalaryConfiguration, Long> {

        // --- Existing ---
        Optional<SalaryConfiguration> findByEmployeeId(String employeeId);

        boolean existsByEmployeeId(String employeeId);

        boolean existsBySalaryMonthAndSalaryYear(String salaryMonth, Integer salaryYear);

        void deleteByEmployeeId(String employeeId);

        // --- NEW: Required for monthly salary configurations ---
        Optional<SalaryConfiguration> findByEmployeeIdAndSalaryMonthAndSalaryYear(
                        String employeeId,
                        String salaryMonth,
                        Integer salaryYear);

        List<SalaryConfiguration> findBySalaryMonthAndSalaryYear(
                        String salaryMonth,
                        Integer salaryYear);

        Optional<SalaryConfiguration> findFirstByEmployeeIdAndSalaryYearOrderBySalaryMonthDesc(
                        String employeeId,
                        Integer salaryYear);
}
