package com.register.example.service;

import com.register.example.entity.*;
import com.register.example.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LeaveCarryForwardEngine {

    private static final Logger log = LoggerFactory.getLogger(LeaveCarryForwardEngine.class);

    private final EmployeeRepository employeeRepo;
    private final LeaveBalanceRepository balanceRepo;
    private final LeavestypePolicyRepository typeRepo;
    private final SalaryConfigurationRepository salaryRepo;
    private final LeaveEligibilityService eligibilityService;
    private final LeavePolicyMatcherService policyMatcher;

    /**
     * Executes Carry Forward and Lapsing logic for all employees.
     * Normally triggered at Year-End or manually by Admin.
     */
    @Transactional
    public void processCarryForwardAndLapse(int year) {
        log.info("🚀 Starting Carry Forward & Lapse processing for year {}...", year);

        List<LeavestypePolicy> allTypes = typeRepo.findByStatus("APPROVED");
        List<Employee> allEmployees = employeeRepo.findAll();

        for (LeavestypePolicy type : allTypes) {
            log.info("Processing {} for {} employees...", type.getName(), allEmployees.size());

            for (Employee emp : allEmployees) {
                // Find matching policy for this employee
                Optional<LeaveUnifiedPolicy> policyOpt = policyMatcher.findMatchingPolicy(emp, type.getId());
                if (policyOpt.isEmpty())
                    continue;

                LeaveUnifiedPolicy policy = policyOpt.get();
                // ✅ Eligibility Check
                if (eligibilityService.isEligible(emp, type.getId())) {
                    processForEmployee(emp, type, policy, year);
                } else {
                    log.debug("Employee {} is not eligible for {}. Skipping carry forward.", emp.getEmployeeId(),
                            type.getName());
                }
            }
        }
        log.info("✅ Carry Forward & Lapse processing completed.");
    }

    private void processForEmployee(Employee emp, LeavestypePolicy type, LeaveUnifiedPolicy policy, int year) {
        List<LeaveBalance> currentBalanceList = balanceRepo.findByEmployeeIdAndTypeAndYear(emp.getEmployeeId(),
                type.getName(), year);
        if (currentBalanceList.isEmpty())
            return;

        LeaveBalance currentBalance = currentBalanceList.get(0); // Take first if duplicates exist
        double available = currentBalance.getBalance();

        // Use 0 if balance is negative (we don't carry forward debt, that stays in the
        // account)
        if (available <= 0) {
            log.info("Employee {}: No positive balance to carry forward for {}.", emp.getEmployeeId(), type.getName());
            return;
        }

        double carryAmount = 0;
        double lapseAmount = 0;
        double autoEncashedAmount = 0;

        // ========== CASE 1: Carry Forward = YES ==========
        if (Boolean.TRUE.equals(policy.getCarryForwardAllowed())) {
            double limit = policy.getMaxCarryForwardLimit() != null ? policy.getMaxCarryForwardLimit().doubleValue()
                    : 0.0;

            carryAmount = Math.min(available, limit);
            double excess = Math.max(0.0, available - limit);

            // Excess gets ENCASHED (not lapsed)
            if (excess > 0) {
                log.info("💰 Carry Forward YES: Excess {} days will be ENCASHED for {} ({})",
                        excess, emp.getEmployeeId(), type.getName());
                autoEncashedAmount = excess;
                updateSalaryWithAutoEncashment(emp, autoEncashedAmount);
            }

            log.debug(
                    "Employee {}: Carry Forward = YES. Available: {}, Limit: {}, Result -> Carry: {}, Encashed: {}",
                    emp.getEmployeeId(), available, limit, carryAmount, autoEncashedAmount);
        }
        // ========== CASE 2: Carry Forward = NO ==========
        else {
            // All remaining leave gets ENCASHED (not lapsed)
            log.info("💰 Carry Forward NO: All {} days will be ENCASHED for {} ({})",
                    available, emp.getEmployeeId(), type.getName());
            autoEncashedAmount = available;
            carryAmount = 0;

            updateSalaryWithAutoEncashment(emp, autoEncashedAmount);

            log.debug("Employee {}: Carry Forward = NO. Available: {} -> All ENCASHED",
                    emp.getEmployeeId(), available);
        }

        // 2. Perform Carry Forward to NEXT year (Year + 1)
        if (carryAmount > 0) {
            String targetType = type.getName();
            // Handle "Carry to Another Bucket" logic
            if ("ANOTHER".equalsIgnoreCase(policy.getCarryForwardTo()) && policy.getTargetLeaveTypeId() != null) {
                targetType = typeRepo.findById(policy.getTargetLeaveTypeId())
                        .map(LeavestypePolicy::getName)
                        .orElse(type.getName());
            }

            updateBalanceForNextYear(emp.getEmployeeId(), targetType, carryAmount, year + 1);
        }

        // 3. Update Current Year Record with Audit Info
        log.info(
                "✅ Processed Carry Forward for {}: Employee {} | Available: {} | Carried: {} | Encashed: {} | Lapsed: {}",
                type.getName(), emp.getEmployeeId(), available, carryAmount, autoEncashedAmount, lapseAmount);

        currentBalance.setBalance(0.0); // Close current year balance
        currentBalance.setLapsed(lapseAmount); // Record lapsed days (should be 0 now)
        currentBalance.setCarriedForward(carryAmount); // Record carried days

        double currentEncashed = currentBalance.getEncashedCount() != null ? currentBalance.getEncashedCount() : 0.0;
        currentBalance.setEncashedCount(currentEncashed + autoEncashedAmount); // Record encashed days

        balanceRepo.save(currentBalance);
    }

    private void processAutoEncashmentOnly(Employee emp, LeavestypePolicy type, LeaveUnifiedPolicy policy,
            int year) {
        List<LeaveBalance> currentBalanceList = balanceRepo.findByEmployeeIdAndTypeAndYear(emp.getEmployeeId(),
                type.getName(), year);
        if (currentBalanceList.isEmpty())
            return;

        LeaveBalance currentBalance = currentBalanceList.get(0); // Take first if duplicates exist
        double available = currentBalance.getBalance();

        if (available <= 0)
            return;

        double limit = policy.getMaxCarryForwardLimit() != null ? policy.getMaxCarryForwardLimit().doubleValue() : 0.0;
        double autoEncashedAmount = Math.max(0.0, available - limit);

        if (autoEncashedAmount > 0) {
            log.info("💰 [MID-YEAR] Auto-Encashing {} excess days for {} ({})", autoEncashedAmount, emp.getEmployeeId(),
                    type.getName());

            // 1. Update Salary
            updateSalaryWithAutoEncashment(emp, autoEncashedAmount);

            // 2. Update Current Balance
            double currentEncashed = currentBalance.getEncashedCount() != null ? currentBalance.getEncashedCount()
                    : 0.0;
            currentBalance.setEncashedCount(currentEncashed + autoEncashedAmount);

            // Important: Deduct from 'granted' or just adjust 'balance' by increasing
            // 'consumed'?
            // Usually, encashment is treated as a consumption of the balance.
            currentBalance.setConsumed(currentBalance.getConsumed() + autoEncashedAmount);
            currentBalance.setBalance(currentBalance.getGranted() - currentBalance.getConsumed());

            balanceRepo.save(currentBalance);
        }
    }

    private void updateSalaryWithAutoEncashment(Employee emp, double days) {
        int currentYear = java.time.LocalDate.now().getYear();
        String currentMonth = java.time.LocalDate.now().getMonth().name();

        // Fetch Salary for calculation (Part A Earnings Monthly)
        Optional<SalaryConfiguration> salaryOpt = salaryRepo
                .findFirstByEmployeeIdAndSalaryYearOrderBySalaryMonthDesc(emp.getEmployeeId(), currentYear);

        if (!salaryOpt.isEmpty()) {
            SalaryConfiguration salary = salaryOpt.get(); // Get from Optional
            java.math.BigDecimal monthlyGross = salary.getPartAEarningsMonthly() != null
                    ? salary.getPartAEarningsMonthly()
                    : java.math.BigDecimal.ZERO;

            java.math.BigDecimal perDaySalary = monthlyGross.divide(java.math.BigDecimal.valueOf(30), 2,
                    java.math.RoundingMode.HALF_UP);
            java.math.BigDecimal amount = perDaySalary.multiply(java.math.BigDecimal.valueOf(days)).setScale(2,
                    java.math.RoundingMode.HALF_UP);

            // Update current month's record
            SalaryConfiguration currentSalary = salaryRepo
                    .findByEmployeeIdAndSalaryMonthAndSalaryYear(emp.getEmployeeId(), currentMonth, currentYear)
                    .orElse(salary); // Fallback to last found if current month not yet created

            java.math.BigDecimal currentMonthly = currentSalary.getLeaveEncashmentsMonthly() != null
                    ? currentSalary.getLeaveEncashmentsMonthly()
                    : java.math.BigDecimal.ZERO;
            java.math.BigDecimal currentYearly = currentSalary.getLeaveEncashmentsYearly() != null
                    ? currentSalary.getLeaveEncashmentsYearly()
                    : java.math.BigDecimal.ZERO;

            currentSalary.setLeaveEncashmentsMonthly(currentMonthly.add(amount));
            currentSalary.setLeaveEncashmentsYearly(currentYearly.add(amount));

            salaryRepo.save(currentSalary);
            log.info("💰 Salary Updated for {} with Auto-Encashment: +{}", emp.getEmployeeId(), amount);
        } else {
            log.warn("⚠️ No Salary configuration found for employee {}. Auto-Encashment amount not calculated.",
                    emp.getEmployeeId());
        }
    }

    /**
     * Daily check for mid-year lapses (Custom Date).
     * Also handles year-end lapse if calling on Dec 31st or Jan 1st.
     */
    @Transactional
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 1 * * ?") // Runs daily at 1 AM
    public void checkDailyLapseAndProcess() {
        java.time.LocalDate today = java.time.LocalDate.now();
        int year = today.getYear();

        List<LeavestypePolicy> allTypes = typeRepo.findByStatus("APPROVED");
        List<Employee> allEmployees = employeeRepo.findAll();

        for (LeavestypePolicy type : allTypes) {
            for (Employee emp : allEmployees) {
                policyMatcher.findMatchingPolicy(emp, type.getId()).ifPresent(policy -> {
                    // 1. Check for Lapse
                    if (Boolean.TRUE.equals(policy.getLapseApplicable())) {
                        if (shouldTriggerLapseToday(policy, today)) {
                            log.info("⏰ Lapse Triggered for {} on {}. Employee {}", type.getName(), today,
                                    emp.getEmployeeId());
                            applyLapseForEmployee(emp, type, policy, year);
                        }
                    }

                    // 2. Check for Custom Carry Forward & Auto-Encashment
                    if (shouldTriggerCarryForwardToday(policy, today)) {
                        log.info("🚀 Carry Forward Date Triggered for {} on {}. Employee {}",
                                type.getName(), today, emp.getEmployeeId());

                        // IF TODAY IS YEAR END, perform full carry forward
                        if (today.getMonthValue() == 12 && today.getDayOfMonth() == 31) {
                            processForEmployee(emp, type, policy, year);
                        } else {
                            // MID-YEAR: Just encash the excess, don't close the balance yet
                            processAutoEncashmentOnly(emp, type, policy, year);
                        }
                    }
                });
            }
        }
    }

    private boolean shouldTriggerCarryForwardToday(LeaveUnifiedPolicy policy, java.time.LocalDate today) {
        if (policy.getCarryForwardDate() == null)
            return false;
        return today.equals(policy.getCarryForwardDate());
    }

    private boolean shouldTriggerLapseToday(LeaveUnifiedPolicy policy, java.time.LocalDate today) {
        // Algorithm Step 1 & 2: Calculate Lapse Date
        java.time.LocalDate lapseDate;
        if ("YEAR_END".equalsIgnoreCase(policy.getLapseMode())) {
            lapseDate = java.time.LocalDate.of(today.getYear(), 12, 31);
        } else if ("CUSTOM_DATE".equalsIgnoreCase(policy.getLapseMode()) && policy.getLapseDate() != null) {
            lapseDate = policy.getLapseDate();
        } else {
            return false;
        }

        // According to requirement: Lapse happens at 23:59:59 of lapseDate.
        // If our scheduler runs daily at 01:00 AM, we trigger the lapse if 'yesterday'
        // was the lapse date.
        // Or if 'today' is the lapse date and we consider it already passed?
        // Usually, if Today is 01-Apr and Lapse was 31-Mar, then Today >= LapseDate is
        // true.
        return today.isAfter(lapseDate) || today.equals(lapseDate);
        // Note: In a real system we'd track if lapse was ALREADY applied for this
        // period to avoid double-resetting.
        // For now, we follow the logic: if currently past the lapse date, apply it.
    }

    private void applyLapseForEmployee(Employee emp, LeavestypePolicy type, LeaveUnifiedPolicy policy, int year) {
        List<LeaveBalance> currentBalanceList = balanceRepo.findByEmployeeIdAndTypeAndYear(emp.getEmployeeId(),
                type.getName(), year);

        if (!currentBalanceList.isEmpty()) {
            LeaveBalance balance = currentBalanceList.get(0); // Take first if duplicates exist
            double unused = Math.max(0.0, balance.getBalance());

            if (unused > 0) {
                log.info("Applying Lapse for {}: Employee {} | Lapsing {} days", type.getName(), emp.getEmployeeId(),
                        unused);
                balance.setLapsed(balance.getLapsed() + unused);
                balance.setBalance(0.0);
                balanceRepo.save(balance);
            }
        }
    }

    private void updateBalanceForNextYear(String employeeId, String typeName, double amount, int nextYear) {
        LeaveBalance nextBalance = balanceRepo.findByEmployeeIdAndTypeAndYear(employeeId, typeName, nextYear)
                .stream().findFirst().orElseGet(() -> {
                    LeaveBalance nb = new LeaveBalance();
                    nb.setEmployeeId(employeeId);
                    nb.setType(typeName);
                    nb.setYear(nextYear);
                    nb.setMonth(0);
                    nb.setGranted(0.0);
                    nb.setConsumed(0.0);
                    nb.setBalance(0.0);
                    nb.setLopCount(0.0);
                    nb.setCarriedForward(0.0);
                    nb.setLapsed(0.0);
                    return nb;
                });

        nextBalance.setGranted(nextBalance.getGranted() + amount);
        nextBalance.setBalance(nextBalance.getGranted() - nextBalance.getConsumed());
        balanceRepo.save(nextBalance);
    }

    @Transactional
    public void applyCarryForwardIfToday(LeaveUnifiedPolicy policy) {
        java.time.LocalDate today = java.time.LocalDate.now();
        if (shouldTriggerCarryForwardToday(policy, today)) {
            log.info("🚀 [TRIGGER] Carry Forward Date (Today) matches Policy: {}. Processing for all employees...",
                    policy.getPolicyName());
            List<Employee> allEmployees = employeeRepo.findAll();
            LeavestypePolicy type = typeRepo.findById(policy.getLeaveTypeId()).orElse(null);
            if (type == null)
                return;

            for (Employee emp : allEmployees) {
                // Find matching policy for this employee (must match the specific policy being
                // triggered)
                if (policyMatcher.matches(emp, policy)) {
                    if (eligibilityService.isEligible(emp, type.getId())) {
                        int year = today.getYear();
                        // IF TODAY IS YEAR END, perform full carry forward
                        if (today.getMonthValue() == 12 && today.getDayOfMonth() == 31) {
                            processForEmployee(emp, type, policy, year);
                        } else {
                            // MID-YEAR: Just encash the excess
                            processAutoEncashmentOnly(emp, type, policy, year);
                        }
                    }
                }
            }
        }
    }
}
