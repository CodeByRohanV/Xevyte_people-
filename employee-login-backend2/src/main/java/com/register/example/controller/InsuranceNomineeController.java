package com.register.example.controller;

import com.register.example.entity.Employee;
import com.register.example.entity.InsuranceNominee;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.InsuranceNomineeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class InsuranceNomineeController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private InsuranceNomineeRepository insuranceNomineeRepository;

    // === Fetch all nominees for an employee ===
    @GetMapping("/{employeeId}/insurance-nominees")
    public ResponseEntity<List<InsuranceNominee>> getNominees(@PathVariable String employeeId) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        List<InsuranceNominee> nominees = insuranceNomineeRepository.findByEmployee(employee);
        return ResponseEntity.ok(nominees);
    }

    // === Add a new nominee ===
    @PostMapping("/{employeeId}/insurance-nominees")
    public ResponseEntity<InsuranceNominee> addNominee(
            @PathVariable String employeeId,
            @RequestBody InsuranceNominee nomineeRequest) {

        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        InsuranceNominee nominee = new InsuranceNominee();
        nominee.setEmployee(employee);
        nominee.setNomineeName(nomineeRequest.getNomineeName());
        nominee.setRelationship(nomineeRequest.getRelationship());
        nominee.setDateOfBirth(nomineeRequest.getDateOfBirth());

        InsuranceNominee savedNominee = insuranceNomineeRepository.save(nominee);
        return ResponseEntity.ok(savedNominee);
    }
}
