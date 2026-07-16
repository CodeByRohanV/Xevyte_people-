package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.LeaveUnifiedPolicy;
import com.register.example.repository.LeaveUnifiedPolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeavePolicyMatcherService {

    private final LeaveUnifiedPolicyRepository policyRepo;

    /**
     * Finds the best matching policy for an employee and leave type. 
     * Returns the policy with highest priority (lowest priority value) that
     * matches AND is active.
     * ✅ UPDATED: Now filters out inactive policies
     */
    public Optional<LeaveUnifiedPolicy> findMatchingPolicy(Employee emp, Long leaveTypeId) {
        List<LeaveUnifiedPolicy> policies;
        if (emp.getTenantId() != null && !emp.getTenantId().isEmpty()) {
            policies = policyRepo.findByLeaveTypeIdAndTenantIdOrderByPriorityAsc(leaveTypeId, emp.getTenantId());
        } else {
            policies = policyRepo.findByLeaveTypeIdOrderByPriorityAsc(leaveTypeId);
        }

        for (LeaveUnifiedPolicy policy : policies) {
            // ✅ Skip inactive policies
            if (policy.getActive() != null && !policy.getActive()) {
                log.debug("Skipping inactive policy: {} (ID: {})", policy.getPolicyName(), policy.getId());
                continue;
            }

            if (matches(emp, policy)) {
                log.debug("Matched policy: {} (ID: {}) for employee: {}",
                        policy.getPolicyName(), policy.getId(), emp.getEmployeeId());
                return Optional.of(policy);
            }
        }

        log.debug("No matching active policy found for employee: {} and leaveTypeId: {}",
                emp.getEmployeeId(), leaveTypeId);
        return Optional.empty();
    }

    public boolean matches(Employee emp, LeaveUnifiedPolicy policy) {
        // Strict AND logic for Location and Gender
        boolean locationMatch = true;
        boolean genderMatch = true;

        // 1. Location match check
        if (policy.getLocation() != null && !policy.getLocation().isBlank()
                && !"ALL".equalsIgnoreCase(policy.getLocation().trim())
                && !"Any".equalsIgnoreCase(policy.getLocation().trim())) {

            if (emp.getWorkLocation() == null || emp.getWorkLocation().isBlank()) {
                locationMatch = false;
            } else {
                String empLoc = emp.getWorkLocation().trim().toLowerCase();
                String[] allowedLocs = policy.getLocation().toLowerCase().split(",");
                locationMatch = java.util.Arrays.stream(allowedLocs)
                        .map(String::trim)
                        .anyMatch(loc -> loc.equals(empLoc));
            }
        }

        // 2. Gender match check
        if (policy.getGender() != null && !policy.getGender().isBlank()
                && !"ALL".equalsIgnoreCase(policy.getGender().trim())
                && !"Any".equalsIgnoreCase(policy.getGender().trim())) {

            if (emp.getGender() == null || emp.getGender().isBlank()) {
                genderMatch = false;
            } else {
                genderMatch = policy.getGender().trim().equalsIgnoreCase(emp.getGender().trim());
            }
        }

        // Both must match (AND logic)
        return locationMatch && genderMatch;
    }
}
