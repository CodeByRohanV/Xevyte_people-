package com.register.example.repository;

import com.register.example.entity.InsuranceNominee;
import com.register.example.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InsuranceNomineeRepository extends JpaRepository<InsuranceNominee, Long> {

    // Fetch nominees by Employee entity
    List<InsuranceNominee> findByEmployee(Employee employee);

    // Fetch nominees by employeeId directly (traverse Employee relationship)
    List<InsuranceNominee> findByEmployee_EmployeeId(String employeeId);
}
