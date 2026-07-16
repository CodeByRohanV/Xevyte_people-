package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.LeaveUnifiedPolicy;
import com.register.example.payload.LeaveEligibilityPreviewDTO;
import com.register.example.repository.EmployeeRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LeaveEligibilityService {

    private final LeavePolicyMatcherService policyMatcher;
    private final EmployeeRepository employeeRepo;
    private final com.register.example.repository.LeaveUnifiedPolicyRepository policyRepo;
    private final com.register.example.repository.LeavestypePolicyRepository leaveTypePolicyRepo;

    public LeaveEligibilityPreviewDTO previewEligibility(String employeeId, Long leaveTypeId) {
        Employee employee = employeeRepo.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        Optional<LeaveUnifiedPolicy> policyOpt = policyMatcher.findMatchingPolicy(employee, leaveTypeId);

        if (policyOpt.isEmpty()) {
            boolean hasAnyPolicies = !policyRepo.findByLeaveTypeIdAndTenantId(leaveTypeId, employee.getTenantId()).isEmpty();

            return LeaveEligibilityPreviewDTO.builder()
                    .employeeId(employeeId)
                    .employeeName(employee.getFirstName() + " " + employee.getLastName())
                    .leaveTypeId(leaveTypeId)
                    .eligible(!hasAnyPolicies) // Eligible if no policies exist (legacy), otherwise ineligible
                    .message(hasAnyPolicies ? "No matching policy found for your profile. Not eligible."
                            : "No explicit policies defined. Eligible by default.")
                    .details(new ArrayList<>())
                    .build();
        }

        LeaveUnifiedPolicy policy = policyOpt.get();
        List<LeaveEligibilityPreviewDTO.EligibilityCriteriaDetail> details = new ArrayList<>();

        // Since findMatchingPolicy already performed the AND logic, we just populate
        // the details for the user to see
        if (policy.getLocation() != null && !policy.getLocation().isBlank()
                && !"ALL".equalsIgnoreCase(policy.getLocation())) {
            details.add(new LeaveEligibilityPreviewDTO.EligibilityCriteriaDetail("Location", policy.getLocation(),
                     employee.getWorkLocation(), true));
        }
        if (policy.getGender() != null && !policy.getGender().isBlank()
                && !"ALL".equalsIgnoreCase(policy.getGender())) {
            details.add(new LeaveEligibilityPreviewDTO.EligibilityCriteriaDetail("Gender", policy.getGender(),
                     employee.getGender(), true));
        }

        return LeaveEligibilityPreviewDTO.builder()
                .employeeId(employeeId)
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .leaveTypeId(leaveTypeId)
                .eligible(true)
                .message("Employee matches Policy: " + policy.getPolicyName())
                .details(details)
                .build();
    }

    public boolean isEligible(Employee employee, Long leaveTypeId) {
        List<LeaveUnifiedPolicy> policies = policyRepo.findByLeaveTypeIdAndTenantId(leaveTypeId, employee.getTenantId());
        if (policies.isEmpty()) {
            return true; // No restrictions = Eligible
        }

        // ✅ Special check for Maternity Leave: Require 90 days tenure
        Optional<LeaveUnifiedPolicy> matchingPolicy = policyMatcher.findMatchingPolicy(employee, leaveTypeId);
        if (matchingPolicy.isPresent()) {
            // Check if this is a Maternity Leave type by checking the leave type name
            String leaveTypeName = getLeaveTypeName(leaveTypeId);
            if (leaveTypeName != null && leaveTypeName.toUpperCase().contains("MATERNITY")) {
                // Check if employee has completed 90 days of tenure
                if (employee.getJoiningDate() != null) {
                    java.time.LocalDate joiningDate = employee.getJoiningDate();
                    java.time.LocalDate eligibleDate = joiningDate.plusDays(90);
                    java.time.LocalDate today = java.time.LocalDate.now();

                    if (today.isBefore(eligibleDate)) {
                        System.out.println("❌ Employee " + employee.getEmployeeId() +
                                " not eligible for Maternity Leave. Needs 90 days tenure. " +
                                "Joined: " + joiningDate + ", Eligible from: " + eligibleDate);
                        return false;
                    }
                }
            }
            return true;
        }

        return false;
    }

    /**
     * Helper method to get leave type name from ID
     */
    private String getLeaveTypeName(Long leaveTypeId) {
        try {
            // Get the leave type name from LeavestypePolicy
            return leaveTypePolicyRepo.findById(leaveTypeId)
                    .map(com.register.example.entity.LeavestypePolicy::getName)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    public void checkEligibility(Employee employee, Long leaveTypeId) {
        if (!isEligible(employee, leaveTypeId)) {
            throw new RuntimeException(
                    "Employee is not eligible for this leave type based on location, gender, or candidate group.");
        }
    }
}
