package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.LeaveBalance;
import com.register.example.entity.LeaveRequest;
import com.register.example.entity.LeavestypePolicy;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.LeaveBalanceRepository;
import com.register.example.repository.LeaveRequestRepository;
import com.register.example.repository.LeavestypePolicyRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

/**
 * Service to handle auto-deduction of unused Menstrual Leave at month-end.
 * 
 * Business Rule:
 * - Employees are allocated 12 days of Menstrual Leave per year (1 per month)
 * - If not used by the last day of the month at 11:59:59 PM IST, it is
 * auto-deducted
 * - Employees can only apply for 1 Menstrual Leave per month
 */
@Service
public class MenstrualLeaveAutoDeductionService {

    private final LeaveBalanceRepository balanceRepo;
    private final EmployeeRepository employeeRepo;
    private final LeaveRequestRepository leaveRequestRepo;
    private final LeavestypePolicyRepository typeRepo;

    public MenstrualLeaveAutoDeductionService(
            LeaveBalanceRepository balanceRepo,
            EmployeeRepository employeeRepo,
            LeaveRequestRepository leaveRequestRepo,
            LeavestypePolicyRepository typeRepo) {
        this.balanceRepo = balanceRepo;
        this.employeeRepo = employeeRepo;
        this.leaveRequestRepo = leaveRequestRepo;
        this.typeRepo = typeRepo;
    }

    /**
     * Scheduled job to run at 11:59:59 PM IST on the last day of every month.
     * Cron expression: "59 59 23 L * ?"
     * - 59 seconds, 59 minutes, 23 hours (11:59:59 PM)
     * - L = Last day of month
     * - * = Every month
     * - ? = Any day of week
     */
    @Scheduled(cron = "59 59 23 L * ?", zone = "Asia/Kolkata")
    @Transactional
    public void autoDeductUnusedMenstrualLeave() {
        System.out.println("🔄 [MENSTRUAL LEAVE AUTO-DEDUCTION] Starting monthly auto-deduction job at: "
                + ZonedDateTime.now(ZoneId.of("Asia/Kolkata")));

        // Get current month and year
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        int currentMonth = today.getMonthValue();
        int currentYear = today.getYear();

        // Find all active employees
        List<Employee> employees = employeeRepo.findAll();

        // Find Menstrual Leave type
        List<LeavestypePolicy> menstrualLeaveTypes = typeRepo.findAll().stream()
                .filter(t -> t.getName() != null && t.getName().toLowerCase().contains("menstrual"))
                .filter(t -> t.getActive() != null && t.getActive())
                .toList();

        if (menstrualLeaveTypes.isEmpty()) {
            System.out.println("⚠️ [MENSTRUAL LEAVE AUTO-DEDUCTION] No active Menstrual Leave type found. Skipping.");
            return;
        }

        String menstrualLeaveTypeName = menstrualLeaveTypes.get(0).getName();

        int totalProcessed = 0;
        int totalDeducted = 0;

        for (Employee emp : employees) {
            try {
                // Check if employee has used menstrual leave this month
                boolean hasUsedThisMonth = hasEmployeeUsedMenstrualLeaveThisMonth(
                        emp.getEmployeeId(),
                        menstrualLeaveTypeName,
                        currentMonth,
                        currentYear);

                if (!hasUsedThisMonth) {
                    // Deduct 1 day from balance
                    deductMenstrualLeave(emp.getEmployeeId(), menstrualLeaveTypeName, currentYear);
                    totalDeducted++;
                    System.out.println("✅ [AUTO-DEDUCT] Employee " + emp.getEmployeeId()
                            + " - Deducted 1 Menstrual Leave (unused in " + currentMonth + "/" + currentYear + ")");
                }

                totalProcessed++;
            } catch (Exception e) {
                System.err.println(
                        "❌ [AUTO-DEDUCT ERROR] Failed for employee " + emp.getEmployeeId() + ": " + e.getMessage());
            }
        }

        System.out.println("✅ [MENSTRUAL LEAVE AUTO-DEDUCTION] Completed. Processed: " + totalProcessed
                + ", Deducted: " + totalDeducted);
    }

    /**
     * Check if employee has used menstrual leave in the given month.
     */
    private boolean hasEmployeeUsedMenstrualLeaveThisMonth(
            String employeeId,
            String leaveTypeName,
            int month,
            int year) {

        List<LeaveRequest> leaves = leaveRequestRepo.findByEmployeeIdAndType(employeeId, leaveTypeName);

        return leaves.stream()
                .filter(leave -> {
                    // ✅ Only count APPROVED or PENDING leaves (not REJECTED or CANCELLED)
                    String status = leave.getStatus();
                    return "APPROVED".equalsIgnoreCase(status) || "PENDING".equalsIgnoreCase(status);
                })
                .anyMatch(leave -> {
                    LocalDate startDate = leave.getStartDate();
                    if (startDate == null)
                        return false;
                    return startDate.getMonthValue() == month && startDate.getYear() == year;
                });
    }

    /**
     * Deduct 1 day of menstrual leave from employee's balance.
     */
    private void deductMenstrualLeave(String employeeId, String leaveTypeName, int year) {
        List<LeaveBalance> balanceList = balanceRepo.findByEmployeeIdAndTypeAndYear(
                employeeId,
                leaveTypeName,
                year);

        if (balanceList.isEmpty()) {
            System.out.println("⚠️ [AUTO-DEDUCT] No balance record found for " + employeeId + " - " + leaveTypeName);
            return;
        }

        LeaveBalance balance = balanceList.get(0);

        // Deduct 1 day from granted (which will reduce balance)
        double currentGranted = balance.getGranted();
        double currentConsumed = balance.getConsumed();

        // Increase consumed by 1 (marking it as "auto-consumed")
        balance.setConsumed(currentConsumed + 1.0);
        balance.setBalance(currentGranted - (currentConsumed + 1.0));

        balanceRepo.save(balance);
    }

}
