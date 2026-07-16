package com.register.example.controller;

import com.register.example.entity.LeaveBalance;
import com.register.example.entity.LeaveUnifiedPolicy;
import com.register.example.repository.LeaveBalanceRepository;
import com.register.example.repository.LeavestypePolicyRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.service.LeavePolicyMatcherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/leave-balances")
@CrossOrigin(origins = "*")
public class LeaveBalanceAdminController {

        private final LeaveBalanceRepository leaveBalanceRepo;
        private final LeavestypePolicyRepository typeRepo;
        private final EmployeeRepository employeeRepo;
        private final LeavePolicyMatcherService policyMatcher;

        public LeaveBalanceAdminController(LeaveBalanceRepository leaveBalanceRepo,
                        LeavestypePolicyRepository typeRepo,
                        EmployeeRepository employeeRepo,
                        LeavePolicyMatcherService policyMatcher) {
                this.leaveBalanceRepo = leaveBalanceRepo;
                this.typeRepo = typeRepo;
                this.employeeRepo = employeeRepo;
                this.policyMatcher = policyMatcher;
        }

        /**
         * Utility endpoint to round all existing leave balances according to their
         * policy rounding rules.
         * This is useful for fixing balances that were created before rounding logic
         * was implemented.
         */
        @PostMapping("/round-all")
        public ResponseEntity<Map<String, Object>> roundAllBalances() {
                List<LeaveBalance> allBalances = leaveBalanceRepo.findAll();
                int updated = 0;
                int skipped = 0;

                for (LeaveBalance balance : allBalances) {
                        // Find the leave type policy
                        Optional<com.register.example.entity.LeavestypePolicy> typeOpt = typeRepo.findAll().stream()
                                        .filter(t -> t.getName().equals(balance.getType()))
                                        .findFirst();

                        if (typeOpt.isEmpty()) {
                                skipped++;
                                continue;
                        }

                        // Find the employee to match the correct policy group
                        com.register.example.entity.Employee employee = employeeRepo
                                        .findByEmployeeId(balance.getEmployeeId())
                                        .orElse(null);

                        // Find the unified policy to get rounding rule
                        Optional<LeaveUnifiedPolicy> policyOpt = (employee != null)
                                        ? policyMatcher.findMatchingPolicy(employee, typeOpt.get().getId())
                                        : Optional.empty();

                        // Default to ROUND_UP if no policy or no rounding rule set
                        String roundingRule = policyOpt.map(LeaveUnifiedPolicy::getRoundingRule)
                                        .filter(r -> r != null && !r.isEmpty())
                                        .orElse("ROUND_UP");

                        System.out.println("🔍 Processing balance: " + balance.getType() +
                                        " | Granted: " + balance.getGranted() +
                                        " | Balance: " + balance.getBalance() +
                                        " | Rounding Rule: " + roundingRule);

                        // Apply rounding to granted and balance
                        double originalGranted = balance.getGranted();
                        double originalBalance = balance.getBalance();

                        double roundedGranted = com.register.example.util.LeaveRoundingUtil.applyRoundingRule(
                                        originalGranted,
                                        roundingRule);
                        double roundedBalance = com.register.example.util.LeaveRoundingUtil.applyRoundingRule(
                                        originalBalance,
                                        roundingRule);

                        System.out.println("   → Rounded Granted: " + originalGranted + " → " + roundedGranted);
                        System.out.println("   → Rounded Balance: " + originalBalance + " → " + roundedBalance);

                        // Use threshold for comparison to handle floating point precision
                        boolean grantedChanged = Math.abs(originalGranted - roundedGranted) > 0.0001;
                        boolean balanceChanged = Math.abs(originalBalance - roundedBalance) > 0.0001;

                        // Only update if values changed
                        if (grantedChanged || balanceChanged) {
                                balance.setGranted(roundedGranted);
                                balance.setBalance(roundedBalance);
                                leaveBalanceRepo.save(balance);
                                updated++;
                                System.out.println("   ✅ Updated!");
                        } else {
                                skipped++;
                                System.out.println("   ⏭️  Skipped (no change)");
                        }
                }

                Map<String, Object> result = new HashMap<>();
                result.put("totalBalances", allBalances.size());
                result.put("updated", updated);
                result.put("skipped", skipped);
                result.put("message", "Successfully rounded " + updated + " leave balances");

                return ResponseEntity.ok(result);
        }
}
