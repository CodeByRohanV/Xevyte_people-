package com.register.example.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestTransactionController {

    @Autowired
    private com.register.example.repository.AllocationRepository allocationRepository;
    
    @Autowired
    private com.register.example.repository.EmployeeRepository employeeRepository;
    
    @Autowired
    private com.register.example.repository.ProjectRepository projectRepository;

    @PostMapping("/bulk-allocation-test")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Object> testBulkAllocation() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // Test basic transaction
            long allocationCount = allocationRepository.count();
            long employeeCount = employeeRepository.count();
            long projectCount = projectRepository.count();
            
            result.put("message", "Transaction test successful");
            result.put("allocationCount", allocationCount);
            result.put("employeeCount", employeeCount);
            result.put("projectCount", projectCount);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Transaction failed: " + e.getMessage());
            error.put("rollback", true);
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
