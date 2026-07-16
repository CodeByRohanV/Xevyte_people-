package com.register.example.controller;

import com.register.example.entity.Employee;
import com.register.example.entity.EmployeeHandbook;
import com.register.example.entity.PolicyAcknowledgment;
import com.register.example.repository.EmployeeHandbookRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.PolicyAcknowledgmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/policies")
@CrossOrigin(origins = "*")
public class PolicyAcknowledgmentController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmployeeHandbookRepository handbookRepository;

    @Autowired
    private PolicyAcknowledgmentRepository acknowledgmentRepository;

    private Employee getCurrentEmployee() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            return employeeRepository.findByEmployeeId(employeeId).orElse(null);
        }
        return null;
    }

    @GetMapping("/pending")
    public ResponseEntity<Object> getPendingPolicies() {
        Employee employee = getCurrentEmployee();
        if (employee == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        String tenantId = employee.getTenantId();

        // 1. Fetch all policies for the tenant
        List<EmployeeHandbook> allHandbooks;
        if (tenantId != null && !tenantId.isEmpty()) {
            allHandbooks = handbookRepository.findAllByTenantIdOrderByUploadedAtDesc(tenantId);
        } else {
            allHandbooks = handbookRepository.findAllByOrderByUploadedAtDesc();
        }

        // 2. Fetch all acknowledged records for the employee
        List<PolicyAcknowledgment> acknowledgments;
        if (tenantId != null && !tenantId.isEmpty()) {
            acknowledgments = acknowledgmentRepository.findByEmployeeIdAndTenantId(employee.getEmployeeId(), tenantId);
        } else {
            acknowledgments = acknowledgmentRepository.findByEmployeeId(employee.getEmployeeId());
        }

        Set<Long> acknowledgedPolicyIds = acknowledgments.stream()
                .filter(PolicyAcknowledgment::getAcknowledged)
                .map(PolicyAcknowledgment::getPolicyId)
                .collect(Collectors.toSet());

        // 3. Filter pending policies
        List<Map<String, Object>> pendingList = new ArrayList<>();
        for (EmployeeHandbook hb : allHandbooks) {
            if (!acknowledgedPolicyIds.contains(hb.getId())) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", hb.getId());
                map.put("originalFileName", hb.getOriginalFileName());
                map.put("category", hb.getCategory() != null ? hb.getCategory() : "");
                map.put("uploadedAt", hb.getUploadedAt());
                map.put("downloadUrl", "/api/handbook/file/" + hb.getId());
                pendingList.add(map);
            }
        }

        return ResponseEntity.ok(pendingList);
    }

    @PostMapping("/acknowledge/{policyId}")
    public ResponseEntity<Object> acknowledgePolicy(@PathVariable Long policyId) {
        Employee employee = getCurrentEmployee();
        if (employee == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        // Verify that the policy document exists
        Optional<EmployeeHandbook> handbookOpt = handbookRepository.findById(policyId);
        if (handbookOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Policy document not found"));
        }

        String tenantId = employee.getTenantId();

        // Create or update acknowledgment
        Optional<PolicyAcknowledgment> existingOpt = acknowledgmentRepository
                .findByEmployeeIdAndPolicyId(employee.getEmployeeId(), policyId);

        PolicyAcknowledgment acknowledgment;
        if (existingOpt.isPresent()) {
            acknowledgment = existingOpt.get();
            acknowledgment.setAcknowledged(true);
            acknowledgment.setAcknowledgedAt(java.time.LocalDateTime.now());
        } else {
            acknowledgment = new PolicyAcknowledgment(employee.getEmployeeId(), policyId, tenantId);
        }

        acknowledgmentRepository.save(acknowledgment);

        return ResponseEntity.ok(Map.of("message", "Policy acknowledged successfully"));
    }
}
