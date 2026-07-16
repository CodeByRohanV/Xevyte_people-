package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.LeaveBalance;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.LeaveBalanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.register.example.entity.LeaveUnifiedPolicy;
import com.register.example.entity.LeavestypePolicy;
import com.register.example.repository.LeavestypePolicyRepository;

@Service
public class LeaveAssignmentService {

    private final LeaveBalanceRepository leaveBalanceRepo;
    private final EmployeeRepository employeeRepo;
    private final LeavestypePolicyRepository typeRepo;
    private final LeaveAccrualEngine accrualEngine;
    private final LeaveEligibilityService eligibilityService;

    private final LeavePolicyMatcherService policyMatcher;

    @Autowired
    @Lazy
    private LeaveAssignmentService self;

    public LeaveAssignmentService(LeaveBalanceRepository leaveBalanceRepo,
            EmployeeRepository employeeRepo, 
            LeavestypePolicyRepository typeRepo,
            LeaveAccrualEngine accrualEngine,
            LeavePolicyMatcherService policyMatcher,
            LeaveEligibilityService eligibilityService) {
        this.leaveBalanceRepo = leaveBalanceRepo;
        this.employeeRepo = employeeRepo;
        this.typeRepo = typeRepo;
        this.accrualEngine = accrualEngine;
        this.policyMatcher = policyMatcher;
        this.eligibilityService = eligibilityService;
    }

    @Transactional
    public Double assignLeavesByMonth(String employeeId) {
        Employee employee = employeeRepo.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));
        accrualEngine.applyInitialAccrualForNewEmployee(employee);
        int currentYear = LocalDate.now().getYear();
        List<LeaveBalance> existingBalances = leaveBalanceRepo.findByEmployeeIdAndTypeAndYear(employeeId, "LOP",
                currentYear);
        if (existingBalances.isEmpty()) {
            LeaveBalance lopBalance = new LeaveBalance();
            lopBalance.setEmployeeId(employeeId);
            lopBalance.setType("LOP");
            lopBalance.setGranted(0.0);
            lopBalance.setConsumed(0.0);
            lopBalance.setBalance(0.0);
            lopBalance.setYear(currentYear);
            lopBalance.setMonth(LocalDate.now().getMonthValue());
            leaveBalanceRepo.save(lopBalance);
        }
        return 0.0;
    }

    @Scheduled(cron = "0 0 0 1 1 *")
    @Transactional
    public void assignAnnualLeavesToAllEmployees() {
        System.out.println("⏰ Annual Scheduler triggered at " + LocalDateTime.now());
        accrualEngine.runAccrualForAllEmployees();
        System.out.println("✅ Annual leave accrual process completed.");
    }

    public Map<String, Double> getLeaveBalance(String employeeId) {
        int currentYear = LocalDate.now().getYear();
        Employee employeeForTenant = employeeRepo.findByEmployeeId(employeeId).orElse(null);
        String tenantId = employeeForTenant != null ? employeeForTenant.getTenantId() : null;

        List<LeavestypePolicy> activeTypes = typeRepo.findByStatus("APPROVED").stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()))
                .filter(p -> {
                    if (tenantId != null && p.getTenantId() != null && !tenantId.equals(p.getTenantId())) {
                        return false;
                    }
                    return true;
                })
                .filter(p -> isEmployeeEligibleForType(employeeId, p.getName()))
                .collect(java.util.stream.Collectors.toMap(
                        LeavestypePolicy::getName,
                        p -> p,
                        (existing, replacement) -> existing))
                .values().stream().collect(java.util.stream.Collectors.toList());
        for (LeavestypePolicy type : activeTypes) {
            List<LeaveBalance> existingList = leaveBalanceRepo.findByEmployeeIdAndTypeAndYear(
                    employeeId, type.getName(), currentYear);
            if (existingList.isEmpty()) {
                LeaveBalance newBalance = new LeaveBalance();
                newBalance.setEmployeeId(employeeId);
                newBalance.setType(type.getName());
                newBalance.setYear(currentYear);
                newBalance.setMonth(0); // Yearly balance
                newBalance.setGranted(0.0);
                newBalance.setConsumed(0.0);
                newBalance.setBalance(0.0);
                leaveBalanceRepo.save(newBalance);
            }
        }
        LocalDate today = LocalDate.now();
        int currentMonth = today.getMonthValue();
        List<LeaveBalance> balances = leaveBalanceRepo.findByEmployeeIdAndYear(employeeId, currentYear).stream()
                .filter(b -> {
                    if ("LOP".equalsIgnoreCase(b.getType()) || "LOSS OF PAY".equalsIgnoreCase(b.getType())) {
                        return b.getMonth() == currentMonth;
                    }
                    return isEmployeeEligibleForType(employeeId, b.getType());
                })
                .collect(java.util.stream.Collectors.toList());
        Double casualTotal = 0.0, casualUsed = 0.0, sickTotal = 0.0, sickUsed = 0.0, lopUsed = 0.0, encashedTotal = 0.0;
        for (LeaveBalance balance : balances) {
            String type = balance.getType();
            if (type == null)
                continue;
            encashedTotal += (balance.getEncashedCount() != null ? balance.getEncashedCount() : 0.0);
            switch (type.toUpperCase()) {
                case "CL":
                case "CASUAL":
                case "CASUAL LEAVE":
                    casualTotal = balance.getGranted();
                    casualUsed = balance.getConsumed();
                    break;
                case "SL":
                case "SICK":
                case "SICK LEAVE":
                    sickTotal = balance.getGranted();
                    sickUsed = balance.getConsumed();
                    break;
                case "LOP":
                case "LOSS OF PAY":
                    lopUsed = balance.getConsumed();
                    break;
            }
        }
        Map<String, Double> result = new HashMap<>();
        result.put("casualTotal", casualTotal);
        result.put("casualUsed", casualUsed);
        result.put("casualBalance", balances.stream()
                .filter(b -> b.getType() != null
                        && (b.getType().toUpperCase().contains("CASUAL") || b.getType().equalsIgnoreCase("CL")))
                .mapToDouble(LeaveBalance::getBalance).sum());
        result.put("sickTotal", sickTotal);
        result.put("sickUsed", sickUsed);
        result.put("sickBalance", balances.stream()
                .filter(b -> b.getType() != null
                        && (b.getType().toUpperCase().contains("SICK") || b.getType().equalsIgnoreCase("SL")))
                .mapToDouble(LeaveBalance::getBalance).sum());
        result.put("lopUsed", lopUsed);
        result.put("encashedCount", balances.stream().filter(b -> b.getEncashedCount() != null)
                .mapToDouble(LeaveBalance::getEncashedCount).sum());
        return result;
    }

    private boolean isEmployeeEligibleForType(String employeeId, String typeName) {
        Employee employee = employeeRepo.findByEmployeeId(employeeId).orElse(null);
        if (employee == null)
            return true;

        Optional<LeavestypePolicy> typeOpt = typeRepo.findByStatus("APPROVED").stream()
                .filter(t -> t.getName().equalsIgnoreCase(typeName))
                .filter(t -> employee.getTenantId() == null || t.getTenantId() == null || employee.getTenantId().equals(t.getTenantId()))
                .findFirst();

        if (typeOpt.isEmpty())
            return true;

        return eligibilityService.isEligible(employee, typeOpt.get().getId());
    }

    public List<com.register.example.payload.EmployeeLeaveBalanceDTO> getDetailedLeaveBalance(String employeeId) {
        int currentYear = LocalDate.now().getYear();

        // ✅ Get employee once for reuse
        Employee employee = employeeRepo.findByEmployeeId(employeeId).orElse(null);

        // ✅ Filter 1: Get APPROVED and ACTIVE leave types
        List<LeavestypePolicy> activeTypes = typeRepo.findByStatus("APPROVED").stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()))
                .filter(p -> {
                    if (employee != null && employee.getTenantId() != null && p.getTenantId() != null && !employee.getTenantId().equals(p.getTenantId())) {
                        return false;
                    }
                    return true;
                })
                .filter(p -> {
                    if (employee == null)
                        return true;
                    return eligibilityService.isEligible(employee, p.getId());
                })
                // ✅ Filter 2: Check if the matched policy for this employee is active
                .filter(p -> {
                    if (employee == null)
                        return true;

                    Optional<LeaveUnifiedPolicy> matchedPolicy = policyMatcher.findMatchingPolicy(employee, p.getId());

                    // If no policy found, exclude this leave type
                    if (matchedPolicy.isEmpty()) {
                        System.out.println("DEBUG [Balance]: No matching policy found for employee " + employeeId +
                                " and leave type " + p.getName());
                        return false;
                    }

                    // Check if the matched policy is active (default to true if null)
                    boolean isPolicyActive = matchedPolicy.get().getActive() == null || matchedPolicy.get().getActive();

                    System.out.println("DEBUG [Balance]: Leave type " + p.getName() +
                            " - Matched policy active status: " + isPolicyActive);

                    return isPolicyActive;
                })
                .collect(java.util.stream.Collectors.toMap(
                        LeavestypePolicy::getName,
                        p -> p,
                        (existing, replacement) -> existing))
                .values().stream().collect(java.util.stream.Collectors.toList());

        // Create balance records for active types if they don't exist
        for (LeavestypePolicy type : activeTypes) {
            List<LeaveBalance> existingList = leaveBalanceRepo.findByEmployeeIdAndTypeAndYear(
                    employeeId, type.getName(), currentYear);
            if (existingList.isEmpty()) {
                LeaveBalance newBalance = new LeaveBalance();
                newBalance.setEmployeeId(employeeId);
                newBalance.setType(type.getName());
                newBalance.setYear(currentYear);
                newBalance.setMonth(0);
                newBalance.setGranted(0.0);
                newBalance.setConsumed(0.0);
                newBalance.setBalance(0.0);
                leaveBalanceRepo.save(newBalance);
            }
        }

        // Get all balances and filter to only active types
        List<LeaveBalance> balances = leaveBalanceRepo.findByEmployeeIdAndYear(employeeId, currentYear);

        // ✅ DEDUPLICATION: Group by type and take the latest/highest granted balance
        // This prevents duplicate cards if there are multiple balance records for the
        // same type
        java.util.Map<String, LeaveBalance> uniqueBalances = new java.util.HashMap<>();
        for (LeaveBalance bal : balances) {
            String type = bal.getType();
            if (type == null)
                continue;

            // If we already have a balance for this type, keep the one with higher granted
            // value
            if (uniqueBalances.containsKey(type)) {
                LeaveBalance existing = uniqueBalances.get(type);
                if (bal.getGranted() > existing.getGranted()) {
                    uniqueBalances.put(type, bal);
                }
            } else {
                uniqueBalances.put(type, bal);
            }
        }

        java.util.List<com.register.example.payload.EmployeeLeaveBalanceDTO> dtos = new java.util.ArrayList<>();

        // Iterate over unique balances only
        for (LeaveBalance bal : uniqueBalances.values()) {
            if ("LOP".equalsIgnoreCase(bal.getType()))
                continue;

            // Only include if the leave type is in our active types list
            Optional<LeavestypePolicy> typeOpt = activeTypes.stream()
                    .filter(t -> t.getName().equalsIgnoreCase(bal.getType()))
                    .findFirst();

            if (typeOpt.isPresent()) {
                Optional<LeaveUnifiedPolicy> unifiedOpt = (employee != null)
                        ? policyMatcher.findMatchingPolicy(employee, typeOpt.get().getId())
                        : Optional.empty();

                double limit = unifiedOpt
                        .map(p -> p.getMaxCarryForwardLimit() != null ? p.getMaxCarryForwardLimit().doubleValue() : 0.0)
                        .orElse(0.0);
                double excess = Math.max(0.0, bal.getBalance() - limit);
                com.register.example.payload.EmployeeLeaveBalanceDTO dto = com.register.example.payload.EmployeeLeaveBalanceDTO
                        .builder()
                        .type(bal.getType())
                        .granted(bal.getGranted())
                        .consumed(bal.getConsumed())
                        .balance(bal.getBalance())
                        .encashedCount(bal.getEncashedCount() != null ? bal.getEncashedCount() : 0.0)
                        .carryForwardAllowed(unifiedOpt.map(p -> p.getCarryForwardAllowed()).orElse(false))
                        .maxCarryForwardLimit(limit)
                        .autoEncashableExcess(excess)
                        .encashmentAllowed(unifiedOpt.map(p -> p.getEncashmentAllowed()).orElse(false))
                        .accrualMode(unifiedOpt.map(p -> p.getAccrualMode()).orElse("N/A"))
                        .accrualDateType(unifiedOpt.map(p -> p.getAccrualDateType()).orElse("N/A"))
                        .carryForwardDate(unifiedOpt
                                .map(p -> p.getCarryForwardDate() != null ? p.getCarryForwardDate().toString() : null)
                                .orElse(null))
                        .build();
                dtos.add(dto);
            }
        }
        return dtos;
    }

    @Transactional
    public void deductLeaves(String employeeId, String leaveType, Double daysToDeduct) {
        // Maternity and Paternity leaves should also follow the standard deduction
        // logic
        // This ensures they deduct from their respective balances and trigger LOP if
        // quota is exceeded.

        String balanceType = leaveType;
        List<LeaveBalance> allBalances = leaveBalanceRepo.findByEmployeeId(employeeId);
        int currentYear = LocalDate.now().getYear();
        String targetType = balanceType;
        LocalDate today = LocalDate.now();
        int currentMonth = today.getMonthValue();
        Optional<LeaveBalance> leaveBalanceOpt = allBalances.stream()
                .filter(b -> b.getYear() == currentYear && b.getType().equalsIgnoreCase(targetType))
                .filter(b -> {
                    if ("LOP".equalsIgnoreCase(targetType) || "LOSS OF PAY".equalsIgnoreCase(targetType)) {
                        return b.getMonth() == currentMonth;
                    }
                    return true;
                })
                .findFirst();
        if (leaveBalanceOpt.isEmpty()) {
            handleLOP(employeeId, daysToDeduct);
            return;
        }
        LeaveBalance leaveBalance = leaveBalanceOpt.get();
        Double availableBalance = leaveBalance.getGranted() - leaveBalance.getConsumed();
        boolean negativeAllowed = false;
        double maxNegative = 0.0;
        Optional<LeavestypePolicy> typeOpt = typeRepo.findByName(leaveType).stream()
                .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()))
                .findFirst();
        if (typeOpt.isEmpty()) {
            typeOpt = typeRepo.findByStatus("APPROVED").stream()
                    .filter(t -> t.getName().equalsIgnoreCase(leaveType))
                    .findFirst();
        }
        if (typeOpt.isEmpty()) {
            return;
        }
        String falloutLeaveType = null; // ✅ Added
        if (typeOpt.isPresent()) {
            Employee employee = employeeRepo.findByEmployeeId(employeeId).orElse(null);
            Optional<LeaveUnifiedPolicy> policyOpt = (employee != null)
                    ? policyMatcher.findMatchingPolicy(employee, typeOpt.get().getId())
                    : Optional.empty();

            if (policyOpt.isPresent()) {
                LeaveUnifiedPolicy policy = policyOpt.get();
                negativeAllowed = policy.getNegativeAllowed() != null && policy.getNegativeAllowed();
                maxNegative = policy.getMaxNegativeBalance() != null ? policy.getMaxNegativeBalance().doubleValue()
                        : 0.0;
                falloutLeaveType = policy.getFalloutLeaveType(); // ✅ Added
            }
        }
        if (daysToDeduct <= availableBalance) {
            leaveBalance.setConsumed(leaveBalance.getConsumed() + daysToDeduct);
            leaveBalance.setBalance(leaveBalance.getGranted() - leaveBalance.getConsumed());
            leaveBalanceRepo.save(leaveBalance);
        } else if (falloutLeaveType != null && !falloutLeaveType.isEmpty()) { // ✅ Spillover Logic
            // 1. Consume any remaining positive balance
            double usedFromAccount = Math.max(0.0, availableBalance);
            leaveBalance.setConsumed(leaveBalance.getConsumed() + usedFromAccount);
            leaveBalance.setBalance(leaveBalance.getGranted() - leaveBalance.getConsumed());
            leaveBalanceRepo.save(leaveBalance);

            // 2. Deduct remainder from fallout leave type
            double shortfall = daysToDeduct - usedFromAccount;
            if (shortfall > 0) {
                System.out.println(
                        "🔄 Spilling over " + shortfall + " days from " + leaveType + " to " + falloutLeaveType);
                deductLeaves(employeeId, falloutLeaveType, shortfall);
            }
        } else if (negativeAllowed && (availableBalance - daysToDeduct >= -maxNegative)) {
            leaveBalance.setConsumed(leaveBalance.getConsumed() + daysToDeduct);
            leaveBalance.setBalance(leaveBalance.getGranted() - leaveBalance.getConsumed());
            leaveBalanceRepo.save(leaveBalance);
        } else {
            double usedFromAccount = 0.0;
            if (negativeAllowed) {
                double roomInNegative = availableBalance + maxNegative;
                usedFromAccount = Math.max(0.0, roomInNegative);
            } else {
                usedFromAccount = Math.max(0.0, availableBalance);
            }
            usedFromAccount = Math.min(usedFromAccount, daysToDeduct);
            double lopDays = daysToDeduct - usedFromAccount;
            leaveBalance.setConsumed(leaveBalance.getConsumed() + usedFromAccount);
            leaveBalance.setBalance(leaveBalance.getGranted() - leaveBalance.getConsumed());
            leaveBalanceRepo.save(leaveBalance);
            if (lopDays > 0) {
                handleLOP(employeeId, lopDays);
            }
        }
    }

    private void handleLOP(String employeeId, Double lopDays) {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        int month = today.getMonthValue();
        Optional<LeaveBalance> lopBalanceOpt = leaveBalanceRepo.findByEmployeeIdAndTypeAndYearAndMonth(employeeId,
                "LOP",
                year, month);
        LeaveBalance lopBalance;
        if (lopBalanceOpt.isEmpty()) {
            lopBalance = new LeaveBalance();
            lopBalance.setEmployeeId(employeeId);
            lopBalance.setType("LOP");
            lopBalance.setGranted(0.0);
            lopBalance.setConsumed(0.0);
            lopBalance.setBalance(0.0);
            lopBalance.setLopCount(0.0);
            lopBalance.setYear(year);
            lopBalance.setMonth(month);
        } else {
            lopBalance = lopBalanceOpt.get();
        }
        lopBalance.setLopCount(lopBalance.getLopCount() + lopDays);
        lopBalance.setConsumed(lopBalance.getConsumed() + lopDays);
        lopBalance.setBalance(lopBalance.getGranted() - lopBalance.getConsumed());
        leaveBalanceRepo.save(lopBalance);
    }

    public void validateLeaveApplication(String employeeId, String leaveType, Double requestedDays) {
        if (leaveType == null || "LOP".equalsIgnoreCase(leaveType)) {
            return;
        }

        int currentYear = LocalDate.now().getYear();
        List<LeaveBalance> balances = leaveBalanceRepo.findByEmployeeIdAndTypeAndYear(employeeId, leaveType,
                currentYear);
        double balance = balances.stream().mapToDouble(LeaveBalance::getBalance).sum();

        if (requestedDays > balance) {
            throw new RuntimeException("your assigned quota exhausted, if want to apply opt through lop");
        }
    }

    public String calculateSimulationWarning(String employeeId, String leaveType, Double requestedDays) {
        try {
            String balanceType = leaveType;
            int currentYear = LocalDate.now().getYear();
            double currentBalance = 0.0;
            boolean balanceFound = false;
            List<LeaveBalance> allBalances = leaveBalanceRepo.findByEmployeeId(employeeId);
            String targetType = balanceType;
            LocalDate today = LocalDate.now();
            int currentMonth = today.getMonthValue();
            Optional<LeaveBalance> balOpt = allBalances.stream()
                    .filter(b -> b.getYear() == currentYear && b.getType().equalsIgnoreCase(targetType))
                    .filter(b -> {
                        if ("LOP".equalsIgnoreCase(targetType) || "LOSS OF PAY".equalsIgnoreCase(targetType)) {
                            return b.getMonth() == currentMonth;
                        }
                        return true;
                    })
                    .findFirst();
            if (balOpt.isPresent()) {
                currentBalance = balOpt.get().getBalance();
                balanceFound = true;
            }
            if (!balanceFound) {
                return String.format("Loss of Pay: %.1f days", requestedDays);
            }
            boolean negativeAllowed = false;
            double maxNegative = 0.0;
            Optional<LeavestypePolicy> typeOpt = typeRepo.findByName(leaveType).stream()
                    .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()))
                    .findFirst();
            if (typeOpt.isEmpty())
                typeOpt = typeRepo.findAll().stream().filter(t -> t.getName().equalsIgnoreCase(leaveType)).findFirst();
            String falloutLeaveType = null;
            if (typeOpt.isPresent()) {
                Employee employee = employeeRepo.findByEmployeeId(employeeId).orElse(null);
                Optional<LeaveUnifiedPolicy> polOpt = (employee != null)
                        ? policyMatcher.findMatchingPolicy(employee, typeOpt.get().getId())
                        : Optional.empty();

                if (polOpt.isPresent()) {
                    negativeAllowed = polOpt.get().getNegativeAllowed() != null && polOpt.get().getNegativeAllowed();
                    maxNegative = polOpt.get().getMaxNegativeBalance() != null ? polOpt.get().getMaxNegativeBalance()
                            : 0.0;
                    falloutLeaveType = polOpt.get().getFalloutLeaveType(); // ✅ Added
                }
            }

            double usedPos = Math.max(0, Math.min(currentBalance, requestedDays));
            double rem = requestedDays - usedPos;

            if (rem > 0 && falloutLeaveType != null && !falloutLeaveType.isEmpty()) {
                // Return a special message for spillover
                return String.format(
                        "Spillover: %.1f days will be consumed from %s, and the remaining %.1f days will spill over to %s.",
                        usedPos, leaveType, rem, falloutLeaveType);
            }

            double usedNeg = 0.0;
            if (negativeAllowed && rem > 0) {
                double room = currentBalance + maxNegative;
                usedNeg = Math.min(room - usedPos, rem);
                if (usedNeg < 0)
                    usedNeg = 0;
            }
            rem = rem - usedNeg;
            double usedLop = rem;

            java.util.List<String> messages = new java.util.ArrayList<>();
            if (usedNeg > 0)
                messages.add(String.format("Negative Balance: %.1f days", usedNeg));
            if (usedLop > 0)
                messages.add(String.format("Loss of Pay: %.1f days", usedLop));
            return String.join(", ", messages);
        } catch (Exception e) {
            return "";
        }
    }
    @Transactional
    public void restoreLeaves(String employeeId, String leaveType, Double daysToRestore) {
        System.out.println("🔄 Restoring Balance: " + daysToRestore + " days to " + leaveType + " for employee " + employeeId);
        
        int currentYear = LocalDate.now().getYear();
        LocalDate today = LocalDate.now();
        int currentMonth = today.getMonthValue();

        // 1. Try to find the balance record for this leave type
        Optional<LeaveBalance> balanceOpt = leaveBalanceRepo.findByEmployeeIdAndTypeAndYear(employeeId, leaveType, currentYear)
                .stream()
                .filter(b -> {
                    // If it's LOP, we must match the specific month
                    if ("LOP".equalsIgnoreCase(leaveType) || "LOSS OF PAY".equalsIgnoreCase(leaveType)) {
                        return b.getMonth() == currentMonth;
                    }
                    return true;
                })
                .findFirst();

        if (balanceOpt.isPresent()) {
            LeaveBalance balance = balanceOpt.get();
            
            // 2. Reduce the 'Consumed' count (this is the auto-increment logic)
            double newConsumed = Math.max(0.0, balance.getConsumed() - daysToRestore);
            balance.setConsumed(newConsumed);
            
            // 3. Recalculate the available balance
            balance.setBalance(balance.getGranted() - newConsumed);
            
            // 4. If it's LOP, also reduce the specific lopCount field
            if ("LOP".equalsIgnoreCase(leaveType) || "LOSS OF PAY".equalsIgnoreCase(leaveType)) {
                double newLopCount = Math.max(0.0, (balance.getLopCount() != null ? balance.getLopCount() : 0.0) - daysToRestore);
                balance.setLopCount(newLopCount);
            }

            leaveBalanceRepo.save(balance);
            System.out.println("✅ Balance Restored. New Consumed: " + newConsumed + ", New Balance: " + balance.getBalance());
        } else {
            System.err.println("⚠️ Could not find balance record to restore for " + leaveType);
        }
    }
    public Double assignLeaves(String employeeId) {
        return self.assignLeavesByMonth(employeeId);
    }
} 
