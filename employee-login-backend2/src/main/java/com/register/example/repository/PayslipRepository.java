package com.register.example.repository;

import com.register.example.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, Long> {

    List<Payslip> findByEmployeeId(String employeeId);
    
    List<Payslip> findByEmployeeIdIn(List<String> employeeIds);

    List<Payslip> findByEmployeeIdAndSalaryYear(String employeeId, Integer salaryYear);

    Optional<Payslip> findByEmployeeIdAndSalaryMonthAndSalaryYear(
            String employeeId, String salaryMonth, Integer salaryYear);

    List<Payslip> findBySalaryMonthAndSalaryYear(String salaryMonth, Integer salaryYear);

    @Query("SELECT p FROM Payslip p WHERE p.salaryYear = :year ORDER BY p.employeeId")
    List<Payslip> findAllByYear(@Param("year") Integer year);

    @Query("SELECT DISTINCT p.salaryMonth FROM Payslip p WHERE p.salaryYear = :year ORDER BY p.salaryMonth")
    List<String> findDistinctMonthsByYear(@Param("year") Integer year);

    @Query("SELECT DISTINCT p.salaryYear FROM Payslip p ORDER BY p.salaryYear DESC")
    List<Integer> findDistinctYears();
}
