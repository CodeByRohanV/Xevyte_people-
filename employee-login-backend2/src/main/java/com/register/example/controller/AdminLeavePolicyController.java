package com.register.example.controller;

import com.register.example.entity.*;
import com.register.example.payload.*;
import com.register.example.service.LeavePolicyService;
import com.register.example.service.LeaveEligibilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/leave-policy")
@RequiredArgsConstructor
public class AdminLeavePolicyController {

    private final LeavePolicyService service;
    private final com.register.example.service.LeaveAccrualEngine accrualEngine;
    private final com.register.example.repository.EmployeeRepository employeeRepo;
    private final com.register.example.service.LeaveEncashmentEngine encashEngine;
    private final LeaveEligibilityService eligibilityService;
    private final com.register.example.service.LeaveCarryForwardEngine carryEngine;
    private final com.register.example.service.LeavePolicyMatcherService policyMatcher;
    private final com.register.example.service.EmployeeService employeeService;

    /* ================= SAVE ================= */

    @PostMapping("/type")
    public LeavestypePolicy saveLeaveType(
            @Valid @RequestBody com.register.example.payload.LeavestypePolicyDTO leaveTypeDto) {
        LeavestypePolicy leaveType = new LeavestypePolicy();
        leaveType.setId(leaveTypeDto.getId());
        leaveType.setName(leaveTypeDto.getName());
        leaveType.setUnit(leaveTypeDto.getUnit());
        leaveType.setYearlyQuota(leaveTypeDto.getYearlyQuota());
        leaveType.setSandwichRule(Boolean.TRUE.equals(leaveTypeDto.getSandwichRule()));
        leaveType.setDocumentRequired(Boolean.TRUE.equals(leaveTypeDto.getDocumentRequired()));
        leaveType.setDocumentThreshold(leaveTypeDto.getDocumentThreshold());
        leaveType.setHalfDayAllowed(Boolean.TRUE.equals(leaveTypeDto.getHalfDayAllowed()));
        leaveType.setRoundingRule(leaveTypeDto.getRoundingRule());
        leaveType.setActive(!Boolean.FALSE.equals(leaveTypeDto.getActive()));
        leaveType.setStatus(leaveTypeDto.getStatus() != null ? leaveTypeDto.getStatus() : "DRAFT");
        leaveType.setOptionalHolidays(leaveTypeDto.getOptionalHolidays());
        leaveType.setTenantId(leaveTypeDto.getTenantId());
        return service.saveLeaveType(leaveType);
    }

    @PostMapping("/unified")
    public LeaveUnifiedPolicy saveUnifiedPolicy(@RequestBody com.register.example.payload.LeaveUnifiedPolicyDTO policyDto) {
        LeaveUnifiedPolicy policy = new LeaveUnifiedPolicy();
        policy.setId(policyDto.getId());
        policy.setLeaveTypeId(policyDto.getLeaveTypeId());
        policy.setTenantId(policyDto.getTenantId());
        policy.setPolicyName(policyDto.getPolicyName());
        policy.setPriority(policyDto.getPriority());
        policy.setLocation(policyDto.getLocation());
        policy.setGender(policyDto.getGender());
        policy.setYearlyQuota(policyDto.getYearlyQuota());
        policy.setAccrualMode(policyDto.getAccrualMode());
        policy.setProRata(Boolean.TRUE.equals(policyDto.getProRata()));
        policy.setAccrualDateType(policyDto.getAccrualDateType());
        policy.setCustomAccrualDay(policyDto.getCustomAccrualDay());
        policy.setCustomAccrualDate(policyDto.getCustomAccrualDate());
        policy.setNegativeAllowed(Boolean.TRUE.equals(policyDto.getNegativeAllowed()));
        policy.setMaxNegativeBalance(policyDto.getMaxNegativeBalance());
        policy.setRoundingRule(policyDto.getRoundingRule());
        policy.setFalloutLeaveType(policyDto.getFalloutLeaveType());
        policy.setCarryForwardAllowed(Boolean.TRUE.equals(policyDto.getCarryForwardAllowed()));
        policy.setMaxCarryForwardLimit(policyDto.getMaxCarryForwardLimit());
        policy.setCarryForwardTo(policyDto.getCarryForwardTo());
        policy.setTargetLeaveTypeId(policyDto.getTargetLeaveTypeId());
        policy.setLapseApplicable(Boolean.TRUE.equals(policyDto.getLapseApplicable()));
        policy.setLapseMode(policyDto.getLapseMode());
        policy.setLapseDate(policyDto.getLapseDate());
        policy.setCarryForwardDate(policyDto.getCarryForwardDate());
        policy.setEncashmentAllowed(Boolean.TRUE.equals(policyDto.getEncashmentAllowed()));
        policy.setEncashEligibleCandidates(policyDto.getEncashEligibleCandidates());
        policy.setMinBalanceToRetain(policyDto.getMinBalanceToRetain());
        policy.setEncashmentFormula(policyDto.getEncashmentFormula());
        policy.setActive(!Boolean.FALSE.equals(policyDto.getActive()));
        return service.saveUnifiedPolicy(policy);
    }

    @PostMapping("/{id}/status")
    public LeavestypePolicy toggleStatus(@PathVariable Long id, @RequestParam Boolean active) {
        return service.togglePolicyStatus(id, active);
    }

    /* ================= FETCH ================= */

    @GetMapping("/types")
    public List<LeavestypePolicy> getAllLeaveTypes() {
        return service.getAllLeaveTypes();
    }

    @GetMapping("/unified/{leaveTypeId}")
    public List<LeaveUnifiedPolicy> getUnifiedPolicies(@PathVariable Long leaveTypeId) {
        return service.getUnifiedPoliciesByLeaveType(leaveTypeId);
    }

    /* ================= APPROVAL WORKFLOW ================= */

    @PostMapping("/approval")
    public LeaveApprovalWorkflow saveApprovalWorkflow(
            @Valid @RequestBody ApprovalWorkflowRequest request) {
        return service.saveApprovalWorkflow(request);
    }



    /* ================= SUMMARY ================= */

    @GetMapping("/summary/{leaveTypeId}")
    public LeavePolicySummaryResponse getPolicySummary(
            @PathVariable Long leaveTypeId) {
        return service.getPolicySummary(leaveTypeId);
    }

    @GetMapping("/accrual-preview/{leaveTypeId}/{employeeId}")
    public com.register.example.payload.LeaveAccrualPreviewDTO previewAccrual(
            @PathVariable Long leaveTypeId,
            @PathVariable String employeeId) {
        Employee emp = employeeRepo.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        LeaveUnifiedPolicy policy = policyMatcher.findMatchingPolicy(emp, leaveTypeId)
                .orElseThrow(
                        () -> new RuntimeException("No matching Accrual policy (Unified) found for this employee"));
        return accrualEngine.calculateAccrualWithTransparency(emp, policy, LocalDate.now(java.time.ZoneId.systemDefault()));
    }

    @GetMapping("/encashment-preview/{leaveTypeId}/{employeeId}/{days}")
    public com.register.example.payload.LeaveEncashmentPreviewDTO previewEncashment(
            @PathVariable Long leaveTypeId,
            @PathVariable String employeeId,
            @PathVariable double days) {
        return encashEngine.previewEncashment(employeeId, leaveTypeId, days);
    }

    @PostMapping("/process-encashment")
    public void processEncashment(@RequestBody com.register.example.payload.LeaveEncashmentPreviewDTO request) {
        encashEngine.processEncashment(request.getEmployeeId(), request.getLeaveTypeId(), request.getRequestedDays());
    }

    @GetMapping("/eligibility-preview/{leaveTypeId}/{employeeId}")
    public LeaveEligibilityPreviewDTO previewEligibility(
            @PathVariable Long leaveTypeId,
            @PathVariable String employeeId) {
        return eligibilityService.previewEligibility(employeeId, leaveTypeId);
    }

    @GetMapping("/eligibility-options")
    public EligibilityOptionsDTO getEligibilityOptions() {
        List<String> locations = employeeService.getDistinctWorkLocations();
        List<String> genders = employeeService.getDistinctGenders();
        return new EligibilityOptionsDTO(locations, genders);
    }

    /* ================= POLICY APPROVAL ACTIONS ================= */

    @GetMapping("/approvals/is-approver/{employeeId}")
    public Boolean isApprover(@PathVariable String employeeId) {
        return service.isEmployeeApprover(employeeId);
    }

    @DeleteMapping("/unified/{id}")
    public void deleteUnifiedPolicy(@PathVariable Long id) {
        service.deleteUnifiedPolicy(id);
    }

    @DeleteMapping("/type/{id}")
    public void deleteLeaveType(@PathVariable Long id) {
        service.deleteLeaveType(id);
    }

    /* ================= MANUAL TRIGGER ================= */
    @PostMapping("/trigger-carry-forward")
    public String triggerCarryForward() {
        carryEngine.checkDailyLapseAndProcess();
        return "Carry Forward process triggered manually.";
    }
}
