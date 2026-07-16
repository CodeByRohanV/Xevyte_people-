package com.register.example.repository;

import com.register.example.entity.ExitForm;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExitFormRepository extends JpaRepository<ExitForm, Long> {
    List<ExitForm> findByAssignedHrId(String hrId);
    List<ExitForm> findByEmployee_EmployeeId(String employeeId);
    List<ExitForm> findByResignationId(Long resignationId);
}
