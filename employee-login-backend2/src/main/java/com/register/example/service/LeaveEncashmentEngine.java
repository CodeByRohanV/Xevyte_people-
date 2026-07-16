package com.register.example.service;

import com.register.example.entity.*;
import com.register.example.payload.LeaveEncashmentPreviewDTO;
import com.register.example.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class LeaveEncashmentEngine {

        private final LeaveBalanceRepository balanceRepo;
        private final EmployeeRepository employeeRepo;
        private final SalaryConfigurationRepository salaryRepo;
        private final LeavestypePolicyRepository typeRepo;
        private final LeaveEligibilityService eligibilityService;
        private final LeavePolicyMatcherService policyMatcher;

        public LeaveEncashmentEngine(LeaveBalanceRepository balanceRepo,
                        EmployeeRepository employeeRepo,
                        SalaryConfigurationRepository salaryRepo,
                        LeavestypePolicyRepository typeRepo,
                        LeaveEligibilityService eligibilityService,
                        LeavePolicyMatcherService policyMatcher) {
                this.balanceRepo = balanceRepo;
                this.employeeRepo = employeeRepo;
                this.salaryRepo = salaryRepo;
                this.typeRepo = typeRepo;
                this.eligibilityService = eligibilityService;
                this.policyMatcher = policyMatcher;
        }

        public LeaveEncashmentPreviewDTO previewEncashment(String employeeId, Long leaveTypeId, double requestedDays) {
                Employee emp = employeeRepo.findByEmployeeId(employeeId)
                                .stream().findFirst().orElseThrow(() -> new RuntimeException("Employee not found"));

                LeavestypePolicy type = typeRepo.findById(leaveTypeId)
                                .stream().findFirst().orElseThrow(() -> new RuntimeException("Leave type not found"));

                Optional<LeaveUnifiedPolicy> policyOpt = policyMatcher.findMatchingPolicy(emp, leaveTypeId);

                int currentYear = LocalDate.now().getYear();
                List<LeaveBalance> balanceList = balanceRepo.findByEmployeeIdAndTypeAndYear(employeeId,
                                type.getName(),
                                currentYear);

                double available = balanceList.isEmpty() ? 0.0 : balanceList.get(0).getBalance();

                if (!eligibilityService.isEligible(emp, leaveTypeId)) {
                        return LeaveEncashmentPreviewDTO.builder()
                                        .employeeId(employeeId)
                                        .employeeName(emp.getFirstName() + " " + emp.getLastName())
                                        .leaveTypeId(leaveTypeId)
                                        .leaveType(type.getName())
                                        .status("INELIGIBLE")
                                        .reason("You are not eligible for this leave type based on Eligibility Rules.")
                                        .finalAmount(BigDecimal.ZERO)
                                        .build();
                }

                // Fetch Salary for calculation (Part A Earnings Monthly)
                Optional<SalaryConfiguration> salaryOpt = salaryRepo
                                .findFirstByEmployeeIdAndSalaryYearOrderBySalaryMonthDesc(employeeId, currentYear);

                BigDecimal monthlyGross = salaryOpt.map(SalaryConfiguration::getPartAEarningsMonthly)
                                .orElse(BigDecimal.ZERO);
                BigDecimal perDaySalary = monthlyGross.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
                BigDecimal amount = perDaySalary.multiply(BigDecimal.valueOf(requestedDays)).setScale(2,
                                RoundingMode.HALF_UP);

                String status = "ELIGIBLE";
                String reason = "Calculation based on Part A Earnings.";

                if (available < requestedDays) {
                        status = "PARTIAL";
                        reason = "Insufficient balance. Available: " + available;
                }

                if (!policyOpt.isEmpty()) {
                        LeaveUnifiedPolicy policy = policyOpt.get(); // Get from Optional
                        if (policy.getEncashmentAllowed() != null && !policy.getEncashmentAllowed()) {
                                status = "INELIGIBLE";
                                reason = "Encashment is not allowed for this leave type.";
                        } else {
                                double minRetain = policy.getMinBalanceToRetain() != null
                                                ? policy.getMinBalanceToRetain()
                                                : 0;
                                if (available - requestedDays < minRetain) {
                                        status = "INELIGIBLE";
                                        reason = "Must retain at least " + minRetain + " days. Max encashable: "
                                                        + Math.max(0, available - minRetain);
                                }
                        }
                }

                if (monthlyGross.equals(BigDecimal.ZERO)) {
                        status = "INELIGIBLE";
                        reason = "Salary configuration not found for the current year.";
                }

                return LeaveEncashmentPreviewDTO.builder()
                                .employeeId(employeeId)
                                .employeeName(emp.getFirstName() + " " + emp.getLastName())
                                .leaveTypeId(leaveTypeId)
                                .leaveType(type.getName())
                                .availableBalance(available)
                                .requestedDays(requestedDays)
                                .monthlyGross(monthlyGross)
                                .perDaySalary(perDaySalary)
                                .finalAmount(amount)
                                .status(status)
                                .reason(reason)
                                .formula("Amount = (Gross / 30) * Days")
                                .build();
        }

        @Transactional
        public void processEncashment(String employeeId, Long leaveTypeId, double days) {
                // Re-run validation for safety
                LeaveEncashmentPreviewDTO preview = previewEncashment(employeeId, leaveTypeId, days);
                if ("INELIGIBLE".equalsIgnoreCase(preview.getStatus())) {
                        throw new RuntimeException("Encashment request ineligible: " + preview.getReason());
                }

                LeavestypePolicy type = typeRepo.findById(leaveTypeId)
                                .stream().findFirst().orElseThrow(() -> new RuntimeException("Leave type not found"));

                int currentYear = LocalDate.now().getYear();
                LeaveBalance balance = balanceRepo
                                .findByEmployeeIdAndTypeAndYear(employeeId, type.getName(), currentYear)
                                .stream().findFirst()
                                .orElseThrow(() -> new RuntimeException("Balance not found for " + type.getName()));

                // Deduct from balance
                balance.setEncashedCount(balance.getEncashedCount() + days);
                balance.setConsumed(balance.getConsumed() + days);
                balance.setBalance(balance.getGranted() - balance.getConsumed());
                balanceRepo.save(balance);

                log.info("✅ Encashed {} days for employee {} in type {}", days, employeeId, type.getName());
        }
}
