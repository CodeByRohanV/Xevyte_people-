package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.InsuranceNominee;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.InsuranceNomineeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class InsuranceNomineeService {

    private final InsuranceNomineeRepository insuranceNomineeRepository;
    private final EmployeeRepository employeeRepository;

    public InsuranceNomineeService(InsuranceNomineeRepository insuranceNomineeRepository,
                                   EmployeeRepository employeeRepository) {
        this.insuranceNomineeRepository = insuranceNomineeRepository;
        this.employeeRepository = employeeRepository;
    }

    // Fetch all nominees for a specific employee using employeeId
    public List<InsuranceNominee> getNomineesByEmployeeId(String employeeId) {
        return insuranceNomineeRepository.findByEmployee_EmployeeId(employeeId);
    }

    // Add new nominee
    public InsuranceNominee addNominee(String employeeId, InsuranceNominee nominee) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId)); 
        nominee.setEmployee(employee);
        return insuranceNomineeRepository.save(nominee);
    }

    // Update existing nominee
    public InsuranceNominee updateNominee(Long nomineeId, InsuranceNominee updatedNominee) {
        InsuranceNominee existing = insuranceNomineeRepository.findById(nomineeId)
                .orElseThrow(() -> new RuntimeException("Nominee not found: " + nomineeId));

        existing.setNomineeName(updatedNominee.getNomineeName());
        existing.setRelationship(updatedNominee.getRelationship());
        existing.setDateOfBirth(updatedNominee.getDateOfBirth());

        return insuranceNomineeRepository.save(existing);
    }

    // Delete a nominee
    public void deleteNominee(Long nomineeId) {
        insuranceNomineeRepository.deleteById(nomineeId);
    }
}
