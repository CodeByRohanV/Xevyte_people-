package com.register.example.service;

import com.register.example.entity.*;
import com.register.example.repository.*;
import com.register.example.annotation.AuditLog;
import com.register.example.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class LeaveAccrualEngine {

    private final LeavestypePolicyRepository typeRepo;
    private final LeaveBalanceRepository balanceRepo;
    private final EmployeeRepository employeeRepo;
    private final LeaveEligibilityService eligibilityService;
    private final LeavePolicyMatcherService policyMatcher;
    
    @Autowired
    private AuditService auditService;

    public LeaveAccrualEngine(LeaveBalanceRepository balanceRepo,
            EmployeeRepository employeeRepo,
            LeavestypePolicyRepository typeRepo,
            LeaveEligibilityService eligibilityService,
            LeavePolicyMatcherService policyMatcher) {
        this.balanceRepo = balanceRepo;
        this.typeRepo = typeRepo;
        this.employeeRepo = employeeRepo;
        this.eligibilityService = eligibilityService;
        this.policyMatcher = policyMatcher;
    }

    /**
     * Executes accrual for all active leave types for all employees.
     * Runs every minute to provide real-time updates for new hires/policy changes.
     */
    @Transactional
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 * * * * ?") // Runs every minute
    public void runAccrualForAllEmployees() {
        List<Employee> employees = employeeRepo.findAll();
        List<LeavestypePolicy> activeTypes = typeRepo.findAll().stream()
                .filter(t -> t.getActive() != null && t.getActive())
                .filter(t -> "APPROVED".equalsIgnoreCase(t.getStatus()))
                .toList();

        LocalDate today = LocalDate.now();
        int totalProcessed = 0;
        int totalUpdated = 0;

        for (Employee emp : employees) {
            for (LeavestypePolicy type : activeTypes) {
                // Tenant isolation check
                if (emp.getTenantId() != null && type.getTenantId() != null && !emp.getTenantId().equals(type.getTenantId())) {
                    continue;
                }
                boolean updated = runAccrualForEmployeeAndType(emp, type, today);
                totalProcessed++;
                if (updated) totalUpdated++;
            }
        }
        
        // Only log summary instead of detailed debug info
        if (totalUpdated > 0) {
            System.out.println("📊 [ACCRUAL-SUMMARY] Processed " + totalProcessed + 
                " accruals, updated " + totalUpdated + " balances for " + today);
        }
    }

    @Transactional
    public boolean runAccrualForEmployeeAndType(Employee emp, LeavestypePolicy type, LocalDate date) {
        Optional<LeaveUnifiedPolicy> policyOpt = policyMatcher.findMatchingPolicy(emp, type.getId());
        if (policyOpt.isEmpty()) {
            return false;
        }

        LeaveUnifiedPolicy policy = policyOpt.get();

        if ("NONE".equalsIgnoreCase(policy.getAccrualMode()) || policy.getAccrualMode() == null) {
            return false;
        }

        // Eligibility check
        if (!eligibilityService.isEligible(emp, type.getId())) {
            return false;
        }

        // TARGET-BASED ACCRUAL LOGIC
        double targetGranted = calculateAccrualQuantity(emp, policy, date);

        List<LeaveBalance> existingList = balanceRepo.findByEmployeeIdAndTypeAndYear(emp.getEmployeeId(),
                type.getName(), date.getYear());

        LeaveBalance currentRec = existingList.isEmpty() ? null : existingList.get(0);
        double currentTotalGranted = currentRec == null ? 0.0 : currentRec.getGranted();
        double currentManualAdj = currentRec == null ? 0.0 : currentRec.getManualAdjustment();

        // IMPORTANT: The "Real" Target is (Policy Accrual + any Manual Adjustments)
        double finalTarget = targetGranted + currentManualAdj;

        boolean updated = false;

        if (finalTarget > currentTotalGranted) {
            double amountToGrant = finalTarget - currentTotalGranted;
            updateBalance(emp.getEmployeeId(), type.getName(), amountToGrant, policy, date.getYear());
            
            // Log the accrual action
            auditService.logCustomAction("ACCRUAL_GRANT", "LEAVE", "LeaveBalance", null, 
                emp.getEmployeeId(), "SYSTEM", 
                String.format("Leave accrual granted: %s %.2f days for %s", type.getName(), amountToGrant, emp.getEmployeeId()),
                null, String.format("{\"leaveType\": \"%s\", \"amount\": %.2f, \"target\": %.2f}", 
                    type.getName(), amountToGrant, finalTarget), null, null);
            
            updated = true;
        } else if (finalTarget < currentTotalGranted) {
            // Only adjust downward if we explicitly want to reduce the balance (e.g. policy change)
            // AND we won't push them below what they've already consumed.
            double amountToDeduct = currentTotalGranted - finalTarget;

            if (currentRec != null && finalTarget >= currentRec.getConsumed()) {
                updateBalance(emp.getEmployeeId(), type.getName(), -amountToDeduct, policy, date.getYear());
                
                // Log the adjustment action
                auditService.logCustomAction("ACCRUAL_ADJUST", "LEAVE", "LeaveBalance", null,
                    emp.getEmployeeId(), "SYSTEM",
                    String.format("Leave balance adjusted: %s %.2f days for %s due to policy change", 
                        type.getName(), amountToDeduct, emp.getEmployeeId()),
                    String.format("{\"previousTarget\": %.2f}", currentTotalGranted),
                    String.format("{\"newTarget\": %.2f, \"deduction\": %.2f}", finalTarget, amountToDeduct),
                    null, null);
                
                updated = true;
            }
        }

        return updated;
    }

    /**
     * Calculates the CUMULATIVE target granted amount for an employee up to the
     * given date.
     */
    public double calculateAccrualQuantity(Employee emp, LeaveUnifiedPolicy policy, LocalDate date) {
        LeavestypePolicy leaveType = typeRepo.findById(policy.getLeaveTypeId())
                .orElseThrow(() -> new RuntimeException("Leave Type not found"));

        double yearlyQuota = (policy.getYearlyQuota() != null && policy.getYearlyQuota() > 0)
                ? policy.getYearlyQuota()
                : (leaveType.getYearlyQuota() != null ? leaveType.getYearlyQuota() : 0.0);

        // ✅ SPECIAL HANDLING FOR OPTIONAL LEAVE AND MATERNITY LEAVE
        if (leaveType.getName() != null) {
            String typeName = leaveType.getName().trim().toUpperCase();
            if (typeName.contains("OPTIONAL") ||
                    typeName.contains("MATERNITY") ||
                    typeName.contains("PATERNITY")) {
                return com.register.example.util.LeaveRoundingUtil.applyRoundingRule(yearlyQuota,
                        policy.getRoundingRule());
            }
        }

        String mode = policy.getAccrualMode() != null ? policy.getAccrualMode() : "MONTHLY";
        LocalDate doj = emp.getJoiningDate() != null ? emp.getJoiningDate() : LocalDate.now();

        // 1. Get all triggers for the year
        List<LocalDate> triggers = getAccrualTriggers(mode, policy.getAccrualDateType(), policy.getCustomAccrualDay(),
                policy.getCustomAccrualDate(), date.getYear());

        // 2. Filter triggers based on joining date and current date
        // IMMEDIATE CREDIT ON JOINING: For joining year, credit ALL remaining months
        // at once
        // EXCLUDING THE JOINING MONTH - only remaining months in that year
        List<LocalDate> eligibleTriggers = triggers.stream()
                .filter(t -> {
                    if (t.getYear() > doj.getYear())
                        return true; // Future years: include all triggers
                    if (t.getYear() < doj.getYear())
                        return false; // Past years before joining: exclude

                    // FOR JOINING YEAR:

                    // 1. YEARLY Mode: Always include triggers in joining year
                    // (We handle pro-rata separately, so we typically want the trigger to count as
                    // "passed"
                    // or be available for immediate credit logic)
                    if ("YEARLY".equalsIgnoreCase(mode)) {
                        return true;
                    }

                    // 2. MONTHLY / QUARTERLY Mode:
                    // Rule: Triggers must be STRICTLY AFTER the joining date.
                    // This satisfies:
                    // - Join Jan 1, Trigger Jan 1 -> Excluded (0 credit)
                    // - Join Jan 1, Trigger Feb 1 -> Included (1 credit)
                    // - Join Jan 10, Trigger Jan 20 -> Included (1 credit)
                    return t.isAfter(doj);
                })
                .toList();

        // For joining year: Credit ALL eligible months immediately (not just passed
        // triggers)
        // IMMEDIATE ASSIGNMENT: Assign leaves immediately based on joining date
        // For subsequent years: Only count triggers that have passed
        List<LocalDate> passedTriggers;
        if (date.getYear() == doj.getYear() && "YEARLY".equalsIgnoreCase(mode)) {
            // IMMEDIATE CREDIT: Only for YEARLY mode in joining year
            passedTriggers = eligibleTriggers;
        } else {
            // Normal accrual for Monthly/Quarterly: Only count triggers that have actually
            // passed
            passedTriggers = eligibleTriggers.stream()
                    .filter(t -> !t.isAfter(date))
                    .toList();
        }

        int eventCount = passedTriggers.size();

        // 3. Base event quantity
        double perEventQty = 0.0;
        if ("MONTHLY".equalsIgnoreCase(mode))
            perEventQty = yearlyQuota / 12.0;
        else if ("QUARTERLY".equalsIgnoreCase(mode))
            perEventQty = yearlyQuota / 4.0;
        else if ("YEARLY".equalsIgnoreCase(mode))
            perEventQty = yearlyQuota;

        // 4. Handle Menstrual Leave (Non-cumulative / Use-it-or-lose-it)
        boolean isMenstrual = leaveType.getName() != null &&
                (leaveType.getName().toUpperCase().contains("MENSTRUAL")
                        || leaveType.getName().toUpperCase().contains("MENSTRUSL"));

        if (isMenstrual && "MONTHLY".equalsIgnoreCase(mode)) {
            // Check for 11:59 PM on last day of month (Auto-deduct/Lapse logic)
            java.time.LocalTime nowTime = java.time.LocalTime.now();
            boolean isLastDay = date.getDayOfMonth() == date.lengthOfMonth();
            boolean isLapseMinute = isLastDay && nowTime.getHour() == 23 && nowTime.getMinute() == 59;

            if (isLapseMinute) {
                // At 11:59 PM, the target should be just what was already consumed
                // effectively "deducting" the unused portion.
                List<LeaveBalance> existing = balanceRepo.findByEmployeeIdAndTypeAndYear(emp.getEmployeeId(),
                        leaveType.getName(), date.getYear());
                return existing.isEmpty() ? 0.0 : existing.get(0).getConsumed();
            }

            // ✅ PRO-RATA FOR MENSTRUAL LEAVE: Use passedTriggers count for joining year
            // For joining year, passedTriggers already contains only eligible months
            // (excluding joining month)
            List<LeaveBalance> existing = balanceRepo.findByEmployeeIdAndTypeAndYear(emp.getEmployeeId(),
                    leaveType.getName(), date.getYear());
            double consumed = existing.isEmpty() ? 0.0 : existing.get(0).getConsumed();

            // Target: number of eligible months × per month quota
            // For joining year (e.g., joined Feb), passedTriggers = 10 months (Mar-Dec)
            // For full year, passedTriggers = 12 months
            return consumed + (perEventQty * passedTriggers.size());
        }

        // 5. Normal Cumulative Calculation
        double targetCumulative = perEventQty * eventCount;

        // 6. Pro-rata Adjustment for Yearly mode (if needed)
        if ("YEARLY".equalsIgnoreCase(mode) && doj.getYear() == date.getYear()) {
            String typeName = leaveType.getName().trim().toUpperCase();
            boolean isAutoProRata = typeName.contains("EARNED") || typeName.contains("SICK") ||
                    typeName.contains("SL") || typeName.contains("EL") ||
                    typeName.contains("MENSTRUAL"); // ✅ Added Menstrual Leave auto pro-rata

            if (isAutoProRata || (policy.getProRata() != null && policy.getProRata())) {
                // ✅ Pro-rate yearly quota by remaining months (EXCLUDING joining month)
                int joiningMonth = doj.getMonthValue();
                int remainingMonths = 12 - joiningMonth; // Removed +1 to exclude joining month

                // ✅ IMMEDIATE CREDIT: Always credit based on joining date
                // Assign pro-rated leaves immediately when employee is created
                targetCumulative = (yearlyQuota / 12.0) * remainingMonths;
            }
        }

        // 7. Pro-rata Adjustment for Quarterly mode in joining year
        if ("QUARTERLY".equalsIgnoreCase(mode) && doj.getYear() == date.getYear()) {
            // Calculate partial credit for the joining quarter logic
            int joinMonth = doj.getMonthValue();
            int qEndMonth = (joinMonth <= 3) ? 3 : (joinMonth <= 6) ? 6 : (joinMonth <= 9) ? 9 : 12;

            // Remaining months in current quarter (EXCLUDING joining month)
            int partialMonths = qEndMonth - joinMonth;

            if (partialMonths > 0) {
                double monthlyRate = yearlyQuota / 12.0;
                targetCumulative += (monthlyRate * partialMonths);
            }
        }

        return com.register.example.util.LeaveRoundingUtil.applyRoundingRule(targetCumulative,
                policy.getRoundingRule());
    }

    private List<LocalDate> getAccrualTriggers(String mode, String dateType, Integer customDay, LocalDate customDate,
            int year) {
        List<LocalDate> triggers = new java.util.ArrayList<>();
        if ("MONTHLY".equalsIgnoreCase(mode)) {
            for (int m = 1; m <= 12; m++) {
                int triggerDay = 1;
                if ("CUSTOM_DAY".equalsIgnoreCase(dateType)) {
                    int last = LocalDate.of(year, m, 1).lengthOfMonth();
                    triggerDay = Math.min(customDay != null ? customDay : 1, last);
                } else if ("LAST_DAY".equalsIgnoreCase(dateType)) {
                    triggerDay = LocalDate.of(year, m, 1).lengthOfMonth();
                }
                triggers.add(LocalDate.of(year, m, triggerDay));
            }
        } else if ("QUARTERLY".equalsIgnoreCase(mode)) {
            int[] startMonths = { 1, 4, 7, 10 };
            int[] endMonths = { 3, 6, 9, 12 };
            for (int i = 0; i < 4; i++) {
                int triggerMonth = startMonths[i];
                int triggerDay = 1;
                if ("CUSTOM_DAY".equalsIgnoreCase(dateType)) {
                    int last = LocalDate.of(year, triggerMonth, 1).lengthOfMonth();
                    triggerDay = Math.min(customDay != null ? customDay : 1, last);
                } else if ("LAST_DAY".equalsIgnoreCase(dateType)) {
                    triggerMonth = endMonths[i];
                    triggerDay = LocalDate.of(year, triggerMonth, 1).lengthOfMonth();
                }
                triggers.add(LocalDate.of(year, triggerMonth, triggerDay));
            }
        } else if ("YEARLY".equalsIgnoreCase(mode)) {
            LocalDate d = LocalDate.of(year, 1, 1);
            if ("LAST_DAY".equalsIgnoreCase(dateType)) {
                d = LocalDate.of(year, 12, 31);
            } else if ("CUSTOM_DAY".equalsIgnoreCase(dateType)) {
                if (customDate != null) {
                    d = LocalDate.of(year, customDate.getMonthValue(), customDate.getDayOfMonth());
                } else if (customDay != null) {
                    d = LocalDate.of(year, 1, Math.min(customDay, 31));
                }
            }
            triggers.add(d);
        }
        return triggers;
    }

    public com.register.example.payload.LeaveAccrualPreviewDTO calculateAccrualWithTransparency(Employee emp,
            LeaveUnifiedPolicy policy, LocalDate date) {
        // Mock method to satisfy UI previews. In reality, it should call the same core
        // logic.
        com.register.example.payload.LeaveAccrualPreviewDTO preview = new com.register.example.payload.LeaveAccrualPreviewDTO();
        double target = calculateAccrualQuantity(emp, policy, date);
        preview.setFinalQuantity(target);
        preview.setExplanation("Calculated cumulative target for current period.");
        return preview;
    }

    private void updateBalance(String employeeId, String type, double amount, LeaveUnifiedPolicy policy, int year) {
        List<LeaveBalance> balanceList = balanceRepo.findByEmployeeIdAndTypeAndYear(employeeId, type, year);

        // CLEANUP: If there are duplicates, remove them and keep the best one
        if (balanceList.size() > 1) {
            // Sort by granted (descending) to keep the one with highest granted value
            balanceList.sort((a, b) -> Double.compare(b.getGranted(), a.getGranted()));

            // Keep the first one (highest granted)
            LeaveBalance toKeep = balanceList.get(0);

            // Delete the rest
            for (int i = 1; i < balanceList.size(); i++) {
                balanceRepo.delete(balanceList.get(i));
            }

            balanceList = java.util.Collections.singletonList(toKeep);
        }

        LeaveBalance balance = balanceList.isEmpty() ? new LeaveBalance(employeeId, type, 0.0, 0.0, 0.0, year, 0)
                : balanceList.get(0);

        String roundingRule = (policy.getRoundingRule() == null || "NONE".equalsIgnoreCase(policy.getRoundingRule()))
                ? "ROUND_UP"
                : policy.getRoundingRule();

        double newGranted = balance.getGranted() + amount;

        // Final safety rounding
        newGranted = com.register.example.util.LeaveRoundingUtil.applyRoundingRule(newGranted, roundingRule);
        double newBalance = newGranted - balance.getConsumed();
        newBalance = com.register.example.util.LeaveRoundingUtil.applyRoundingRule(newBalance, roundingRule);

        balance.setGranted(newGranted);
        balance.setBalance(newBalance);
        balanceRepo.save(balance);
    }

    @Transactional
    public void applyInitialAccrualForNewEmployee(Employee emp) {
        List<LeavestypePolicy> activeTypes = typeRepo.findAll().stream()
                .filter(t -> t.getActive() != null && t.getActive())
                .filter(t -> "APPROVED".equalsIgnoreCase(t.getStatus()))
                .toList();

        LocalDate today = LocalDate.now();
        for (LeavestypePolicy type : activeTypes) {
            if (emp.getTenantId() != null && type.getTenantId() != null && !emp.getTenantId().equals(type.getTenantId())) {
                continue;
            }
            runAccrualForEmployeeAndType(emp, type, today);
        }
    }

    @Transactional
    public void applyInitialAccrual(LeaveUnifiedPolicy policy) {
        syncAccrual(policy);
    }

    @Transactional
    public void applyAdjustedAccrual(LeaveUnifiedPolicy oldPolicy, LeaveUnifiedPolicy newPolicy) {
        syncAccrual(newPolicy);
    }

    @Transactional
    public void applyAdjustedAccrualForTypeChange(LeavestypePolicy oldType, LeavestypePolicy newType) {
        if (newType == null || newType.getActive() == null || !newType.getActive() || !"APPROVED".equalsIgnoreCase(newType.getStatus())) {
            return;
        }

        List<Employee> employees;
        if (newType.getTenantId() != null && !newType.getTenantId().isEmpty()) {
            employees = employeeRepo.findByTenantId(newType.getTenantId());
        } else {
            employees = employeeRepo.findAll();
        }

        LocalDate today = LocalDate.now();
        for (Employee emp : employees) {
            runAccrualForEmployeeAndType(emp, newType, today);
        }
    }

    @Transactional
    public void syncAccrual(LeaveUnifiedPolicy policy) {
        LeavestypePolicy type = typeRepo.findById(policy.getLeaveTypeId()).orElse(null);
        if (type == null || type.getActive() == null || !type.getActive() || !"APPROVED".equalsIgnoreCase(type.getStatus())) {
            return;
        }

        List<Employee> employees;
        if (policy.getTenantId() != null && !policy.getTenantId().isEmpty()) {
            employees = employeeRepo.findByTenantId(policy.getTenantId());
        } else {
            employees = employeeRepo.findAll();
        }

        LocalDate today = LocalDate.now();
        for (Employee emp : employees) {
            runAccrualForEmployeeAndType(emp, type, today);
        }
    }
}
