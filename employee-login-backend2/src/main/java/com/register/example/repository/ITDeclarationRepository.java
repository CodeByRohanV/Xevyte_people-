package com.register.example.repository;

import com.register.example.entity.ITDeclaration;
import com.register.example.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ITDeclarationRepository extends JpaRepository<ITDeclaration, Long> {
    Optional<ITDeclaration> findByEmployeeAndFinancialYear(Employee employee, String financialYear);
    List<ITDeclaration> findByEmployee(Employee employee);
    List<ITDeclaration> findByEmployee_EmployeeId(String employeeId);
    Optional<ITDeclaration> findFirstByEmployee_EmployeeIdOrderByFinancialYearDesc(String employeeId);
    List<ITDeclaration> findByStatus(String status);
    List<ITDeclaration> findByEmployeeIn(List<Employee> employees);
    List<ITDeclaration> findByEmployeeInAndStatusNot(List<Employee> employees, String status);
}
