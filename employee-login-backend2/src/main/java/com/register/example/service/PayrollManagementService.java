package com.register.example.service;

import com.register.example.entity.DailyEntry;
import com.register.example.entity.Employee;
import com.register.example.entity.PayrollManagement;
import com.register.example.repository.DailyEntryRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.PayrollManagementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PayrollManagementService {

    private final DailyEntryRepository dailyEntryRepository;
    private final PayrollManagementRepository payrollManagementRepository;
    private final EmployeeRepository employeeRepository;
    private final com.register.example.repository.LeaveRequestRepository leaveRequestRepository;

    public PayrollManagementService(DailyEntryRepository dailyEntryRepository,
            PayrollManagementRepository payrollManagementRepository,
            EmployeeRepository employeeRepository,
            com.register.example.repository.LeaveRequestRepository leaveRequestRepository) {
        this.dailyEntryRepository = dailyEntryRepository;
        this.payrollManagementRepository = payrollManagementRepository;
        this.employeeRepository = employeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    /**
     * Calculates and saves/updates payroll management entry for an employee for a
     * specific month.
     * 
     * @param employeeId The employee ID.
     * @param monthYear  The month and year in format "MM-yyyy" or "MMMM yyyy".
     */
    @Transactional
    public PayrollManagement calculateAndSavePayroll(String employeeId, LocalDate dateInMonth) {
        String monthName = dateInMonth.getMonth().name();
        int year = dateInMonth.getYear();
        String payableMonth = monthName + " " + year;

        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        LocalDate startDate = dateInMonth.withDayOfMonth(1);
        LocalDate endDate = dateInMonth.withDayOfMonth(dateInMonth.lengthOfMonth());

        // 1. Fetch data for the whole month
        List<DailyEntry> entries = dailyEntryRepository.findByEmployeeIdAndDateBetween(employeeId, startDate, endDate);

        double payableDays = 0;
        double lopDays = 0;

        // Fetch ALL leaves for this employee to filter later
        List<com.register.example.entity.LeaveRequest> allLeaves = leaveRequestRepository
                .findByEmployeeId(employeeId);

        // Filter for both "Approved" and "Settled" statuses, excluding LOP
        List<com.register.example.entity.LeaveRequest> paidLeaves = allLeaves.stream()
                .filter(l -> ("Approved".equalsIgnoreCase(l.getStatus()) || "Settled".equalsIgnoreCase(l.getStatus()))
                        &&
                        !l.getType().equalsIgnoreCase("LOP") && !l.getType().equalsIgnoreCase("Loss of Pay"))
                .toList();

        // 2. Process ONLY existing entries that are Frozen
        for (DailyEntry entry : entries) {
            if (!entry.isFrozen()) {
                continue; // Skip any day that is not frozen (not approved)
            }

            LocalDate date = entry.getDate();
            String remarksRaw = entry.getRemarks();
            String remarks = (remarksRaw != null) ? remarksRaw.toLowerCase() : "";
            double hours = entry.getTotalHours();

            // Categorize the frozen entry based on remarks set during freeze process
            boolean isHoliday = remarks.contains("holiday");
            boolean isWeekend = remarks.contains("weekend");
            boolean isLOP = remarks.contains("lop") || remarks.contains("loss of pay");

            // Paid Leave: Check if there is an approved or settled leave request matching
            // this date
            final LocalDate currentD = date;
            boolean isPaidLeave = paidLeaves.stream()
                    .anyMatch(l -> !l.getStartDate().isAfter(currentD) && !l.getEndDate().isBefore(currentD));

            // Also check if the remarks itself indicates a leave (e.g., "Sick Leave")
            boolean isLeaveRemark = remarks.contains("leave");

            // Work Activity check
            boolean hasWorkActivity = (hours > 0) ||
                    (entry.getLoginTime() != null && !entry.getLoginTime().isEmpty()) ||
                    (entry.getLogoutTime() != null && !entry.getLogoutTime().isEmpty());

            // LOGIC: Since the entry is already Frozen, we count it if it fits our criteria
            if ((isHoliday || isWeekend || isPaidLeave || isLeaveRemark || hasWorkActivity) && !isLOP) {
                payableDays++;
            }

            if (isLOP) {
                lopDays++;
            }
        }

        // Result is already calculated in the loop above
        payableDays = Math.max(0, payableDays);

        Optional<PayrollManagement> existingOpt = payrollManagementRepository
                .findByEmployeeIdAndPayableMonth(employeeId, payableMonth);
        PayrollManagement payroll;
        if (existingOpt.isPresent()) {
            payroll = existingOpt.get();
        } else {
            payroll = new PayrollManagement();
            payroll.setEmployeeId(employeeId);
            payroll.setPayableMonth(payableMonth);
        }

        payroll.setEmployeeName(employee.getFirstName() + " " + employee.getLastName());
        payroll.setLopDays(lopDays);
        payroll.setPayableDays(payableDays);

        return payrollManagementRepository.save(payroll);
    }

    /**
     * Trigger calculation for all employees for a given month.
     */
    @Transactional
    public void calculatePayrollForAllEmployees(LocalDate dateInMonth) {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee emp : employees) {
            try {
                calculateAndSavePayroll(emp.getEmployeeId(), dateInMonth);
            } catch (Exception e) {
                // Log and continue or handle error
                System.err.println("Error calculating payroll for " + emp.getEmployeeId() + ": " + e.getMessage());
            }
        }
    }

    /**
     * Gets all payroll records for a month, syncing them if they don't exist.
     */
    @Transactional
    public List<PayrollManagement> getAndSyncPayrollForAllEmployees(LocalDate dateInMonth) {
        String monthName = dateInMonth.getMonth().name();
        int year = dateInMonth.getYear();
        String payableMonth = monthName + " " + year;

        List<Employee> employees = employeeRepository.findAll();
        for (Employee emp : employees) {
            Optional<PayrollManagement> opt = payrollManagementRepository
                    .findByEmployeeIdAndPayableMonth(emp.getEmployeeId(), payableMonth);
            if (opt.isEmpty()) {
                // Auto-fill/calculate if missing
                calculateAndSavePayroll(emp.getEmployeeId(), dateInMonth);
            }
        }

        return payrollManagementRepository.findByPayableMonth(payableMonth);
    }
}
