package com.register.example.service;

import com.register.example.entity.*;
import com.register.example.payload.ApprovalWorkflowRequest;
import com.register.example.payload.LeavePolicySummaryResponse;
import com.register.example.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class LeavePolicyService {

    private final LeavestypePolicyRepository leavestypePolicyRepository;
    private final LeaveApprovalWorkflowRepository approvalWorkflowRepo;
    private final LeaveUnifiedPolicyRepository unifiedRepo;
    private final LeaveTypeRepository leaveTypeRepository; // ✅ Added

    // Add these for automatic balance creation
    private final EmployeeRepository employeeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;

    // Inject Engine
    private final com.register.example.service.LeaveAccrualEngine accrualEngine;
    private final com.register.example.service.LeaveCarryForwardEngine carryEngine;
    private final LeaveEligibilityService eligibilityService;

    public LeavePolicyService(LeavestypePolicyRepository leavestypePolicyRepository,
            LeaveApprovalWorkflowRepository approvalWorkflowRepo,
            LeaveUnifiedPolicyRepository unifiedRepo,
            LeaveTypeRepository leaveTypeRepository, // ✅ Added
            EmployeeRepository employeeRepository,
            LeaveBalanceRepository leaveBalanceRepository,
            com.register.example.service.LeaveAccrualEngine accrualEngine,
            com.register.example.service.LeaveCarryForwardEngine carryEngine,
            LeaveEligibilityService eligibilityService) {
        this.leavestypePolicyRepository = leavestypePolicyRepository;
        this.approvalWorkflowRepo = approvalWorkflowRepo;
        this.unifiedRepo = unifiedRepo;
        this.leaveTypeRepository = leaveTypeRepository; // ✅ Added
        this.employeeRepository = employeeRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.accrualEngine = accrualEngine;
        this.carryEngine = carryEngine;
        this.eligibilityService = eligibilityService;
    }

    /* ================= SAVE ================= */

    public LeavestypePolicy saveLeaveType(LeavestypePolicy leaveType) {
        String tenantId = leaveType.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = getCurrentTenantId();
            leaveType.setTenantId(tenantId);
        }

        boolean isNewLeaveType = (leaveType.getId() == null);

        // ✅ Capture old type configuration to handle quota adjustments
        LeavestypePolicy oldType = null;
        if (!isNewLeaveType) {
            oldType = leavestypePolicyRepository.findById(leaveType.getId()).orElse(null);
        }
 
        // ✅ Preserve active status if it's explicitly set, otherwise default to true
        // for new types
        if (leaveType.getActive() == null) {
            if (isNewLeaveType) {
                leaveType.setActive(true);
            } else if (oldType != null) {
                leaveType.setActive(oldType.getActive());
            }
        }

        // ✅ Every save/update resets status to DRAFT (unless it's just a status toggle)
        // Only reset to DRAFT if we're not just toggling the active status
        if (oldType == null || !oldType.getName().equals(leaveType.getName()) ||
                !java.util.Objects.equals(oldType.getYearlyQuota(), leaveType.getYearlyQuota())) {
            leaveType.setStatus("DRAFT");
        } else if (oldType != null) {
            // Preserve status if only toggling active field
            leaveType.setStatus(oldType.getStatus());
        }

        LeavestypePolicy saved = leavestypePolicyRepository.save(leaveType);

        // ✅ Sync with LeaveType entity (for optional holidays and existence)
        LeaveType typeEntity = leaveTypeRepository.findByTypeAndTenantId(saved.getName(), tenantId)
                .orElse(new LeaveType(saved.getName(), tenantId));

        // Update optional holidays if provided
        if (leaveType.getOptionalHolidays() != null) {
            typeEntity.setOptionalHolidays(leaveType.getOptionalHolidays());
        }
        leaveTypeRepository.save(typeEntity);

        // Max Accrual Limit sync removed as field is deleted
        // accrualRepo.findByLeaveTypeId(saved.getId()).ifPresent(...);

        // ✅ AUTOMATIC BALANCE CREATION / ADJUSTMENT
        if (isNewLeaveType) {
            if (saved.getYearlyQuota() != null && saved.getYearlyQuota() > 0) {
                createLeaveBalancesForAllEmployees(saved);
                // Trigger initial accrual for new types
                List<LeaveUnifiedPolicy> policies = unifiedRepo.findByLeaveTypeId(saved.getId());
                for (LeaveUnifiedPolicy policy : policies) {
                    accrualEngine.applyInitialAccrual(policy);
                }
            }
        } else if (oldType != null) {
            // ✅ AUTO-PROPAGATE QUOTA CHANGE TO UNIFIED POLICIES
            // If the Leave Type quota changes, update any policies that were using the OLD
            // quota (i.e., not overridden).
            if (!java.util.Objects.equals(oldType.getYearlyQuota(), saved.getYearlyQuota())) {
                List<LeaveUnifiedPolicy> policies = unifiedRepo.findByLeaveTypeId(saved.getId());
                Double oldQuotaVal = oldType.getYearlyQuota() != null ? oldType.getYearlyQuota().doubleValue() : 0.0;

                for (LeaveUnifiedPolicy p : policies) {
                    Double currentPolicyQuota = p.getYearlyQuota() != null ? p.getYearlyQuota() : 0.0;
                    // If policy quota matches the old type quota (or is 0/null), update it to the
                    // new type quota
                    if (Math.abs(currentPolicyQuota - oldQuotaVal) < 0.1) {
                        p.setYearlyQuota(saved.getYearlyQuota() != null ? saved.getYearlyQuota().doubleValue() : 0.0);
                        unifiedRepo.save(p);
                        System.out
                                .println("🔄 [PROPAGATION] Auto-updated policy " + p.getPolicyName() + " quota to "
                                         + saved.getYearlyQuota() + " (matched old type quota)");
                    }
                }
            }

            // ✅ FOR UPDATES: Trigger adjustment sync for ALL policies affected by this type
            accrualEngine.applyAdjustedAccrualForTypeChange(oldType, saved);
        }

        return saved;
    }

    /**
     * Creates leave balances for all employees for a new leave type.
     * This ensures the leave type is immediately available in the leave balance
     * module.
     */
    private void createLeaveBalancesForAllEmployees(LeavestypePolicy leaveType) {
        List<Employee> allEmployees;
        if (leaveType.getTenantId() != null && !leaveType.getTenantId().isEmpty()) {
            allEmployees = employeeRepository.findByTenantId(leaveType.getTenantId());
        } else {
            allEmployees = employeeRepository.findAll();
        }
        int currentYear = java.time.LocalDate.now().getYear();

        int createdCount = 0;
        for (Employee employee : allEmployees) {
            // ✅ Eligibility rule
            if (!eligibilityService.isEligible(employee, leaveType.getId())) {
                continue;
            }

            // Check if balance already exists
            List<LeaveBalance> existingList = leaveBalanceRepository.findByEmployeeIdAndTypeAndYear(
                    employee.getEmployeeId(),
                    leaveType.getName(),
                    currentYear);

            if (existingList.isEmpty()) {
                // Create new balance
                LeaveBalance balance = new LeaveBalance();
                balance.setEmployeeId(employee.getEmployeeId());
                balance.setType(leaveType.getName());
                balance.setYear(currentYear);
                balance.setMonth(0);
                balance.setGranted(0.0);
                balance.setConsumed(0.0);
                balance.setBalance(0.0);
                balance.setLopCount(0.0);
                balance.setEncashedCount(0.0);

                leaveBalanceRepository.save(balance);
                createdCount++;
            }
        }

        System.out.println("✅ Created " + createdCount + " leave balances for leave type: " + leaveType.getName());
    }

    public void applyAccrualSync(LeaveUnifiedPolicy policy) {
        accrualEngine.applyInitialAccrual(policy);
    }

    public LeaveUnifiedPolicy saveUnifiedPolicy(LeaveUnifiedPolicy policy) {
        String tenantId = policy.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = getCurrentTenantId();
            policy.setTenantId(tenantId);
        }
        // Clone/Save the new policy
        LeaveUnifiedPolicy saved = unifiedRepo.save(policy);

        // ✅ AUTO-APPROVE PARENT TYPE IF IT'S IN DRAFT
        leavestypePolicyRepository.findById(saved.getLeaveTypeId()).ifPresent(type -> {
            if ("DRAFT".equalsIgnoreCase(type.getStatus())) {
                // Only auto-approve if no approval workflow exists or it's set to auto-approve
                // boolean shouldAutoApprove = approvalWorkflowRepo.findByLeaveType_Id(type.getId())
                //         .map(LeaveApprovalWorkflow::isAutoApprove)
                //         .orElse(true); // Default to true if no workflow defined yet
                
                // Always auto-approve since workflow is commented out
                boolean shouldAutoApprove = true;

                if (shouldAutoApprove) {
                    System.out.println(
                            "✅ [AUTO-APPROVE] Leave type " + type.getName() + " auto-approved on policy save.");
                    type.setStatus("APPROVED");
                    leavestypePolicyRepository.save(type);

                    // Create balances and trigger initial accrual
                    createLeaveBalancesForAllEmployees(type);
                }
            }
        });

        // ✅ Active Auto-Trigger for Accrual Synchronization
        if (saved.getAccrualMode() != null && !"NONE".equalsIgnoreCase(saved.getAccrualMode())) {
            // We use syncAccrual because it ensures the final state is correct regardless
            // of delta
            System.out.println("🔄 [POLICY-UPDATE] Synchronizing balances for policy: " + saved.getPolicyName());
            accrualEngine.syncAccrual(saved);
        }

        // ✅ Active Auto-Trigger for Carry Forward Date
        if (saved.getCarryForwardDate() != null && saved.getCarryForwardDate().equals(java.time.LocalDate.now())) {
            System.out.println(
                    "🚀 [UNIFIED] Active Auto-Trigger: Policy date is TODAY. Running Carry Forward process now...");
            carryEngine.checkDailyLapseAndProcess();
        }

        return saved;
    }

    public void deleteUnifiedPolicy(Long id) {
        unifiedRepo.deleteById(id);
    }

    public void deleteLeaveType(Long id) {
        // Get the leave type before deleting
        LeavestypePolicy leaveType = leavestypePolicyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave type not found: " + id));

        // Delete all leave balances for this leave type scoped to this tenant
        String leaveTypeName = leaveType.getName();
        String tenantId = leaveType.getTenantId();

        List<Employee> tenantEmployees = employeeRepository.findByTenantId(tenantId);
        int deletedBalancesCount = 0;
        for (Employee emp : tenantEmployees) {
            java.util.Optional<LeaveBalance> balOpt = leaveBalanceRepository.findByEmployeeIdAndType(emp.getEmployeeId(), leaveTypeName);
            if (balOpt.isPresent()) {
                leaveBalanceRepository.delete(balOpt.get());
                deletedBalancesCount++;
            }
        }

        System.out.println("🗑️ Deleted " + deletedBalancesCount + " leave balance records for: " + leaveTypeName + " in tenant: " + tenantId);

        // Delete the leave type config
        leavestypePolicyRepository.deleteById(id);

        // Also delete from LeaveType entity if exists (scoped by tenant)
        leaveTypeRepository.findByTypeAndTenantId(leaveTypeName, tenantId).ifPresent(lt -> {
            leaveTypeRepository.delete(lt);
            System.out.println("🗑️ Deleted LeaveType entity: " + leaveTypeName + " for tenant: " + tenantId);
        });

        System.out.println("✅ Leave type deleted successfully: " + leaveTypeName);
    }


    /* ================= FETCH ================= */

    public List<LeavestypePolicy> getAllLeaveTypes() {
        String tenantId = getCurrentTenantId();
        List<LeavestypePolicy> policies;
        if (tenantId != null && !tenantId.isEmpty()) {
            policies = leavestypePolicyRepository.findByTenantId(tenantId);
        } else {
            policies = leavestypePolicyRepository.findAll();
        }
        // ✅ Populate optional holidays from LeaveType entity
        for (LeavestypePolicy policy : policies) {
            leaveTypeRepository.findByTypeAndTenantId(policy.getName(), policy.getTenantId() != null ? policy.getTenantId() : tenantId)
                    .ifPresent(lt -> policy.setOptionalHolidays(lt.getOptionalHolidays()));
        }
        return policies;
    }

    public List<LeaveUnifiedPolicy> getUnifiedPoliciesByLeaveType(Long leaveTypeId) {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return unifiedRepo.findByLeaveTypeIdAndTenantId(leaveTypeId, tenantId);
        }
        return unifiedRepo.findByLeaveTypeId(leaveTypeId);
    }

    /* ================= APPROVAL WORKFLOW ================= */

    public LeaveApprovalWorkflow saveApprovalWorkflow(ApprovalWorkflowRequest request) {

        LeavestypePolicy leaveType = leavestypePolicyRepository
                .findById(request.getLeaveTypeId())
                .orElseThrow(() -> new RuntimeException("Leave type not found: " + request.getLeaveTypeId()));

        LeaveApprovalWorkflow workflow = approvalWorkflowRepo
                .findByLeaveType_Id(leaveType.getId())
                .orElse(new LeaveApprovalWorkflow());

        String tenantId = leaveType.getTenantId() != null ? leaveType.getTenantId() : getCurrentTenantId();
        workflow.setTenantId(tenantId);
        workflow.setLeaveType(leaveType);
        workflow.setAutoApprove(request.isAutoApprove());
        workflow.setTotalLevels(
                request.isAutoApprove() ? 0 : request.getTotalLevels());

        // Workflow levels are no longer used as per requested decommissioning of tables


        LeaveApprovalWorkflow savedWorkflow = approvalWorkflowRepo.save(workflow);


        // Always perform auto-approval sync as manual levels are decommissioned
        {
            // ✅ AUTO FLOW: Force approval and sync (Even if already approved, we re-sync to
            // pick up quota changes)
            leaveType.setStatus("APPROVED");
            leavestypePolicyRepository.save(leaveType);

            // ✅ TRIGGER AUTOMATIC BALANCE CREATION
            createLeaveBalancesForAllEmployees(leaveType);

            // ✅ TRIGGER ACCRUAL ENGINE TO SYNC BALANCES
            List<LeaveUnifiedPolicy> allPolicies;
            if (tenantId != null && !tenantId.isEmpty()) {
                allPolicies = unifiedRepo.findByLeaveTypeIdAndTenantId(leaveType.getId(), tenantId);
            } else {
                allPolicies = unifiedRepo.findByLeaveTypeId(leaveType.getId());
            }
            for (LeaveUnifiedPolicy unifiedPolicy : allPolicies) {
                System.out.println("🚀 [POLICY-SAVE] Synchronizing accruals for active policy: "
                        + leaveType.getName() + " (Policy: " + unifiedPolicy.getPolicyName() + ")");
                accrualEngine.syncAccrual(unifiedPolicy);
                // ✅ TRIGGER MID-YEAR AUTO-ENCASHMENT IF DATE IS TODAY
                carryEngine.applyCarryForwardIfToday(unifiedPolicy);
            }

        }
        return savedWorkflow;
    }

    // public void actionPolicyApproval(Long requestId, String approverId, String action, String remarks) {
    //     PolicyApprovalRequest currentReq = policyApprovalRepo.findById(requestId)
    //             .orElseThrow(() -> new RuntimeException("Approval request not found"));
    //
    //     if (!currentReq.getApproverId().equals(approverId)) {
    //         throw new RuntimeException("You are not authorized to approve this request.");
    //     }
    //
    //     LeavestypePolicy leaveType = leavestypePolicyRepository.findById(currentReq.getLeaveTypeId())
    //             .orElseThrow(() -> new RuntimeException("Leave policy not found"));
    //
    //     if ("REJECT".equalsIgnoreCase(action)) {
    //         currentReq.setStatus("REJECTED");
    //         currentReq.setRemarks(remarks);
    //         policyApprovalRepo.save(currentReq);
    //
    //         // Revert policy to DRAFT or perform other cleanup
    //         leaveType.setStatus("DRAFT");
    //         leavestypePolicyRepository.save(leaveType);
    //
    //     } else if ("APPROVE".equalsIgnoreCase(action)) {
    //         currentReq.setStatus("APPROVED");
    //         currentReq.setRemarks(remarks);
    //         policyApprovalRepo.save(currentReq);
    //
    //         // Check if there's a next level
    //         LeaveApprovalWorkflow workflow = approvalWorkflowRepo.findByLeaveType_Id(leaveType.getId())
    //                 .orElseThrow(() -> new RuntimeException("Workflow not found"));
    //
    //         int nextLevel = currentReq.getLevel() + 1;
    //         Optional<LeaveApprovalLevel> nextLvlConfig = workflow.getLevels().stream()
    //                 .filter(l -> l.getLevel() == nextLevel)
    //                 .findFirst();
    //
    //         if (!nextLvlConfig.isEmpty()) {
    //             System.out.println("DEBUG: Promoting to next level: " + nextLevel);
    //             // Create requests for the next level
    //             for (String nextApproverId : nextLvlConfig.get().getApproverIds()) {
    //                 PolicyApprovalRequest apr = PolicyApprovalRequest.builder()
    //                         .leaveTypeId(leaveType.getId())
    //                         .approverId(nextApproverId)
    //                         .level(nextLevel)
    //                         .status("PENDING")
    //                         .build();
    //                 policyApprovalRepo.save(apr);
    //             }
    //         } else {
    //             // Final approval
    //             System.out.println("DEBUG: Final Approval for Leave Type: " + leaveType.getName() + " (ID: "
    //                     + leaveType.getId() + "). Setting status to APPROVED.");
    //             leaveType.setStatus("APPROVED");
    //             leavestypePolicyRepository.save(leaveType);
    //
    //             // ✅ TRIGGER AUTOMATIC BALANCE CREATION
    //             createLeaveBalancesForAllEmployees(leaveType);
    //
    //             // ✅ TRIGGER ACCRUAL ENGINE TO POPULATE BALANCES
    //             // (Otherwise balances start at 0 until next scheduler run)
    //             List<LeaveUnifiedPolicy> allPolicies = unifiedRepo.findByLeaveTypeId(leaveType.getId());
    //             for (LeaveUnifiedPolicy unifiedPolicy : allPolicies) {
    //                 System.out.println("🚀 [APPROVAL] Triggering initial accrual for newly approved policy: "
    //                         + leaveType.getName() + " (Policy: " + unifiedPolicy.getPolicyName() + ")");
    //                 accrualEngine.applyInitialAccrual(unifiedPolicy);
    //                 // ✅ TRIGGER MID-YEAR AUTO-ENCASHMENT IF DATE IS TODAY
    //                 carryEngine.applyCarryForwardIfToday(unifiedPolicy);
    //             }
    //         }
    //     }
    // }

    // public LeaveApprovalWorkflow getApprovalWorkflowByLeaveType(Long leaveTypeId) {
    //     return approvalWorkflowRepo
    //             .findByLeaveType_Id(leaveTypeId)
    //             .orElse(null);
    // }

    /* ================= POLICY SUMMARY ================= */

    public LeavePolicySummaryResponse getPolicySummary(Long leaveTypeId) {
        System.out.println("DEBUG: Fetching policy summary for Leave Type ID: " + leaveTypeId);

        LeavestypePolicy leaveType = leavestypePolicyRepository
                .findById(leaveTypeId)
                .orElseThrow(() -> new RuntimeException("Leave type not found: " + leaveTypeId));

        // ✅ POPULATE TRANSIENT FIELD WITH OPTIONAL HOLIDAYS
        leaveTypeRepository.findByTypeAndTenantId(leaveType.getName(), leaveType.getTenantId())
                .ifPresent(lt -> leaveType.setOptionalHolidays(lt.getOptionalHolidays()));

        System.out.println("DEBUG: Found Leave Type: " + (leaveType != null ? leaveType.getName() : "NULL"));

        LeavePolicySummaryResponse response = new LeavePolicySummaryResponse();
        response.setLeavePolicy(leaveType);

        List<LeaveUnifiedPolicy> unifiedList;
        if (leaveType.getTenantId() != null && !leaveType.getTenantId().isEmpty()) {
            unifiedList = unifiedRepo.findByLeaveTypeIdAndTenantId(leaveTypeId, leaveType.getTenantId());
        } else {
            unifiedList = unifiedRepo.findByLeaveTypeId(leaveTypeId);
        }
        System.out.println("DEBUG: Unified Policies count: " + unifiedList.size());
        response.setUnifiedPolicies(unifiedList);

        // LeaveApprovalWorkflow workflow = approvalWorkflowRepo.findByLeaveType_Id(leaveTypeId).orElse(null);
        // Workflow levels debugging removed as levels are decommissioned

        // response.setApprovalWorkflow(workflow);
        
        // Set workflow to null since it's commented out
        // response.setApprovalWorkflow(null);

        return response;
    }

    public LeavestypePolicy togglePolicyStatus(Long id, Boolean active) {
        LeavestypePolicy policy = leavestypePolicyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        policy.setActive(active);
        LeavestypePolicy saved = leavestypePolicyRepository.save(policy);

        // If activating and already APPROVED, ensure balances exist
        if (Boolean.TRUE.equals(active) && "APPROVED".equalsIgnoreCase(saved.getStatus())) {
            createLeaveBalancesForAllEmployees(saved);
            List<LeaveUnifiedPolicy> allPolicies = unifiedRepo.findByLeaveTypeId(saved.getId());
            for (LeaveUnifiedPolicy unifiedPolicy : allPolicies) {
                System.out.println("🚀 [STATUS-TOGGLE] Reactivating policy. Refreshing accruals for: "
                        + unifiedPolicy.getPolicyName());
                accrualEngine.applyInitialAccrual(unifiedPolicy);
            }
        }

        return saved;
    }

    // public Boolean isEmployeeApprover(String employeeId) {
    //     System.out.println("🔍 Checking if employee is approver: " + employeeId);
    //
    //     // Check if the employee is an approver in any approval workflow
    //     List<LeaveApprovalWorkflow> allWorkflows = approvalWorkflowRepo.findAll();
    //     System.out.println("📋 Total approval workflows found: " + allWorkflows.size());
    //
    //     for (LeaveApprovalWorkflow workflow : allWorkflows) {
    //         System.out.println("  Checking workflow for Leave Type ID: " + workflow.getLeaveType().getId());
    //         for (LeaveApprovalLevel level : workflow.getLevels()) {
    //             System.out.println("    Level " + level.getLevel() + " approvers: " + level.getApproverIds());
    //             if (level.getApproverIds() != null && level.getApproverIds().contains(employeeId)) {
    //                 System.out.println("✅ Employee " + employeeId + " IS an approver!");
    //                 return true;
    //             }
    //         }
    //     }
    //
    //     System.out.println("❌ Employee " + employeeId + " is NOT an approver");
    //     return false;
    // }
    
    // Always return false since approval workflow is commented out
    public Boolean isEmployeeApprover(String employeeId) {
        return false;
    }

    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            java.util.Optional<com.register.example.entity.Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            if (empOpt.isPresent()) {
                return empOpt.get().getTenantId();
            }
        }
        return null;
    }
}
