package com.register.example.service;

import com.register.example.dto.*;
import com.register.example.entity.Claim;
import com.register.example.entity.DailyEntry;
import com.register.example.entity.LeaveBalance;
import com.register.example.entity.LeaveRequest;
import com.register.example.entity.Payslip;
import com.register.example.entity.TravelRequest;
import com.register.example.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Facade service that orchestrates analytics across all HRMS modules.
 * Each domain aggregation is wrapped in a try-catch to ensure graceful
 * fallback — if a module's data is unavailable, it returns null rather
 * than crashing the entire endpoint.
 */
@Service
public class UnifiedAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(UnifiedAnalyticsService.class);

    @Autowired
    private DailyEntryRepository dailyEntryRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private TravelRequestRepository travelRequestRepository;

    @Autowired
    private PayslipRepository payslipRepository;

    /**
     * Main entry point: builds the complete ScalozAnalyticsHubDTO
     * by calling each domain aggregation independently.
     */
    public ScalozAnalyticsHubDTO getUnifiedAnalytics(String employeeId, LocalDate start, LocalDate end) {
        CompletableFuture<AttendanceMetricsDTO> attendanceFuture = CompletableFuture.supplyAsync(() -> buildAttendanceMetrics(employeeId, start, end));
        CompletableFuture<LeaveMetricsDTO> leaveFuture = CompletableFuture.supplyAsync(() -> buildLeaveMetrics(employeeId, start, end));
        CompletableFuture<ExpenseMetricsDTO> expenseFuture = CompletableFuture.supplyAsync(() -> buildExpenseMetrics(employeeId));
        CompletableFuture<SalaryMetricsDTO> salaryFuture = CompletableFuture.supplyAsync(() -> buildSalaryMetrics(employeeId));

        CompletableFuture.allOf(attendanceFuture, leaveFuture, expenseFuture, salaryFuture).join();

        return new ScalozAnalyticsHubDTO(
                attendanceFuture.join(),
                leaveFuture.join(),
                expenseFuture.join(),
                salaryFuture.join()
        );
    }

    // ===== ATTENDANCE MODULE =====

    private AttendanceMetricsDTO buildAttendanceMetrics(String employeeId, LocalDate start, LocalDate end) {
        try {
            List<DailyEntry> entries = dailyEntryRepository.findByEmployeeIdAndDateBetween(employeeId, start, end);

            if (entries.isEmpty()) {
                return new AttendanceMetricsDTO(0.0, 0.0, 0.0, 0L, false, 0.0, 0.0);
            }

            double effectiveSum = 0;
            double grossSum = 0;
            long validEffective = 0;
            long validGross = 0;
            long onTimeCount = 0;

            for (DailyEntry entry : entries) {
                if (entry.getTotalHours() > 0) {
                    effectiveSum += entry.getTotalHours();
                    validEffective++;
                }
                Double gross = calculateGrossHours(entry);
                if (gross > 0) {
                    grossSum += gross;
                    validGross++;
                }
                if ("ON_TIME".equals(determineStatus(entry))) {
                    onTimeCount++;
                }
            }

            Double avgEffective = validEffective > 0 ? effectiveSum / validEffective : 0.0;
            Double avgGross = validGross > 0 ? grossSum / validGross : 0.0;
            Double onTimePct = (double) onTimeCount / entries.size() * 100.0;
            Boolean burnout = calculateBurnoutRisk(employeeId, end);
            
            // Calculate target adherence (assuming 8 hours is target)
            Double targetAdherence = avgEffective > 0 ? (avgEffective / 8.0) * 100.0 : 0.0;

            // Calculate trend delta (compare to previous period of same length)
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1;
            LocalDate prevStart = start.minusDays(daysBetween);
            LocalDate prevEnd = start.minusDays(1);
            List<DailyEntry> prevEntries = dailyEntryRepository.findByEmployeeIdAndDateBetween(employeeId, prevStart, prevEnd);
            
            Double trendDelta = null; // null represents 'No prior data'
            if (!prevEntries.isEmpty()) {
                double prevEffectiveSum = 0;
                long prevValidEffective = 0;
                for (DailyEntry entry : prevEntries) {
                    if (entry.getTotalHours() > 0) {
                        prevEffectiveSum += entry.getTotalHours();
                        prevValidEffective++;
                    }
                }
                Double prevAvgEffective = prevValidEffective > 0 ? prevEffectiveSum / prevValidEffective : 0.0;
                if (prevAvgEffective > 0) {
                    trendDelta = ((avgEffective - prevAvgEffective) / prevAvgEffective) * 100.0;
                } else if (avgEffective > 0) {
                    trendDelta = 100.0; // Infinite increase represented as 100%
                } else {
                    trendDelta = 0.0; // both are 0
                }
            }

            return new AttendanceMetricsDTO(avgEffective, avgGross, onTimePct, (long) entries.size(), burnout, trendDelta, targetAdherence);
        } catch (Exception e) {
            log.warn("Failed to build attendance metrics for {}: {}", employeeId, e.getMessage());
            return null;
        }
    }

    // ===== LEAVE MODULE =====

    private LeaveMetricsDTO buildLeaveMetrics(String employeeId, LocalDate start, LocalDate end) {
        try {
            int currentYear = LocalDate.now().getYear();
            List<LeaveBalance> balances = leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, currentYear);

            double totalGranted = 0;
            double totalConsumed = 0;
            double totalBalance = 0;

            List<LeaveMetricsDTO.LeaveTypeBreakdown> breakdown = balances.stream()
                    .map(b -> {
                        double g = b.getGranted() != null ? b.getGranted() : 0;
                        double c = b.getConsumed() != null ? b.getConsumed() : 0;
                        double bal = b.getBalance() != null ? b.getBalance() : 0;
                        return new LeaveMetricsDTO.LeaveTypeBreakdown(b.getType(), g, c, bal);
                    })
                    .collect(Collectors.toList());

            for (LeaveMetricsDTO.LeaveTypeBreakdown b : breakdown) {
                totalGranted += b.getGranted();
                totalConsumed += b.getConsumed();
                totalBalance += b.getBalance();
            }

            // Approved leaves in the selected date range
            List<LeaveRequest> allLeaves = leaveRequestRepository.findByEmployeeId(employeeId);
            double approvedInRange = allLeaves.stream()
                    .filter(lr -> lr.getStatus() != null && lr.getStatus().equalsIgnoreCase("APPROVED"))
                    .filter(lr -> {
                        LocalDate ls = lr.getStartDate();
                        LocalDate le = lr.getEndDate();
                        if (ls == null || le == null) return false;
                        return !ls.isAfter(end) && !le.isBefore(start);
                    })
                    .mapToDouble(lr -> lr.getTotalDays() != null ? lr.getTotalDays() : 0.0)
                    .sum();

            // Calculate utilizationPace
            String utilizationPace = "ON_TRACK";
            if (totalGranted > 0) {
                double leavePct = (totalConsumed / totalGranted) * 100.0;
                double yearPct = ((double) LocalDate.now().getDayOfYear() / LocalDate.now().lengthOfYear()) * 100.0;

                if (leavePct > yearPct + 20) {
                    utilizationPace = "BURNING_FAST";
                } else if (yearPct > leavePct + 40) {
                    utilizationPace = "HOARDING";
                }
            }

            return new LeaveMetricsDTO(totalGranted, totalConsumed, totalBalance, approvedInRange, utilizationPace, breakdown);
        } catch (Exception e) {
            log.warn("Failed to build leave metrics for {}: {}", employeeId, e.getMessage());
            return null;
        }
    }

    // ===== EXPENSE MODULE =====

    private ExpenseMetricsDTO buildExpenseMetrics(String employeeId) {
        try {
            List<Claim> claims = claimRepository.findByEmployeeId(employeeId);

            double pendingAmount = 0;
            long pendingCount = 0;
            double approvedAmount = 0;
            long approvedCount = 0;
            long totalApprovalDays = 0;
            long claimsWithApprovalTime = 0;

            for (Claim claim : claims) {
                String status = claim.getStatus();
                if (status == null) continue;

                if (status.equalsIgnoreCase("Pending") || status.equalsIgnoreCase("PENDING")) {
                    pendingAmount += claim.getAmount() != null ? claim.getAmount() : 0;
                    pendingCount++;
                } else if (status.equalsIgnoreCase("Approved") || status.equalsIgnoreCase("APPROVED") || status.equalsIgnoreCase("Paid")) {
                    approvedAmount += claim.getAmount() != null ? claim.getAmount() : 0;
                    approvedCount++;
                    
                    if (claim.getCreatedAt() != null && claim.getUpdatedAt() != null) {
                        long days = java.time.temporal.ChronoUnit.DAYS.between(claim.getCreatedAt(), claim.getUpdatedAt());
                        if (days >= 0) {
                            totalApprovalDays += days;
                            claimsWithApprovalTime++;
                        }
                    }
                }
            }

            // Travel requests
            long pendingTravel = 0;
            long approvedTravel = 0;
            try {
                List<TravelRequest> travels = travelRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
                for (TravelRequest tr : travels) {
                    String status = tr.getStatus();
                    if (status == null) continue;
                    if (status.equalsIgnoreCase("Pending")) pendingTravel++;
                    else if (status.equalsIgnoreCase("Approved")) approvedTravel++;
                }
            } catch (Exception e) {
                log.warn("Could not load travel requests for {}: {}", employeeId, e.getMessage());
            }

            Integer averageApprovalDays = claimsWithApprovalTime > 0 ? (int) (totalApprovalDays / claimsWithApprovalTime) : 0;

            return new ExpenseMetricsDTO(pendingAmount, pendingCount, approvedAmount, approvedCount, pendingTravel, approvedTravel, averageApprovalDays);
        } catch (Exception e) {
            log.warn("Failed to build expense metrics for {}: {}", employeeId, e.getMessage());
            return null;
        }
    }

    // ===== SHARED UTILITY METHODS =====

    private Double calculateGrossHours(DailyEntry entry) {
        if (entry.getLoginTime() == null || entry.getLoginTime().trim().isEmpty()) return 0.0;
        if (entry.getLogoutTime() == null || entry.getLogoutTime().trim().isEmpty()) return 0.0;
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("h:mm a", Locale.US);
            LocalTime login = LocalTime.parse(entry.getLoginTime().trim(), formatter);
            LocalTime logout = LocalTime.parse(entry.getLogoutTime().trim(), formatter);
            long minutes = Duration.between(login, logout).toMinutes();
            if (minutes < 0) minutes += 24 * 60;
            return Math.round(minutes / 60.0 * 100.0) / 100.0;
        } catch (DateTimeParseException e) {
            return entry.getTotalHours();
        }
    }

    private Boolean calculateBurnoutRisk(String employeeId, LocalDate endDate) {
        LocalDate windowStart = endDate.minusDays(14);
        List<DailyEntry> recentEntries = dailyEntryRepository.findByEmployeeIdAndDateBetween(employeeId, windowStart, endDate);
        if (recentEntries.isEmpty()) return false;
        double totalGross = 0;
        long daysWithData = 0;
        for (DailyEntry entry : recentEntries) {
            Double gross = calculateGrossHours(entry);
            if (gross > 0) { totalGross += gross; daysWithData++; }
        }
        if (daysWithData == 0) return false;
        return (totalGross / daysWithData) > 9.5;
    }

    private String determineStatus(DailyEntry entry) {
        if ("WFH".equalsIgnoreCase(entry.getWorkLocation())) return "WFH";
        if (entry.getLoginTime() == null || entry.getLoginTime().trim().isEmpty()) {
            return entry.getTotalHours() > 0 ? "ON_TIME" : "ABSENT";
        }
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("h:mm a", Locale.US);
            LocalTime loginTime = LocalTime.parse(entry.getLoginTime().trim(), formatter);
            return loginTime.isAfter(LocalTime.of(9, 30)) ? "LATE" : "ON_TIME";
        } catch (DateTimeParseException e) {
            return "ON_TIME";
        }
    }

    // ===== SALARY MODULE =====

    /**
     * Builds salary metrics from the real payslips table.
     * Reads the salaryJson map for netPay, totalEarnings, and totalDeductions.
     * Calculates YTD by summing all payslips for the current calendar year.
     */
    private SalaryMetricsDTO buildSalaryMetrics(String employeeId) {
        try {
            int currentYear = LocalDate.now().getYear();
            List<Payslip> yearPayslips = payslipRepository.findByEmployeeIdAndSalaryYear(employeeId, currentYear);

            if (yearPayslips == null || yearPayslips.isEmpty()) {
                return new SalaryMetricsDTO(0.0, 0.0, 0.0, "No Data");
            }

            // Find the most recent payslip (latest month)
            Optional<Payslip> latestOpt = yearPayslips.stream()
                    .max(Comparator.comparing(p -> monthToNumber(p.getSalaryMonth())));

            Double latestNetPay = 0.0;
            String payPeriod = "";

            if (latestOpt.isPresent()) {
                Payslip latest = latestOpt.get();
                latestNetPay = toDouble(latest.getDecimal("netPay"));
                payPeriod = (latest.getSalaryMonth() != null ? latest.getSalaryMonth() : "") + " " + currentYear;
            }

            // Calculate YTD totals by summing across all payslips for this year
            double ytdEarnings = 0.0;
            double ytdDeductions = 0.0;

            for (Payslip p : yearPayslips) {
                ytdEarnings += toDouble(p.getDecimal("totalEarnings"));
                ytdDeductions += toDouble(p.getDecimal("totalDeductions"));
            }

            return new SalaryMetricsDTO(latestNetPay, ytdEarnings, ytdDeductions, payPeriod.trim());
        } catch (Exception e) {
            log.warn("Failed to build salary metrics for {}: {}", employeeId, e.getMessage());
            return null;
        }
    }

    /** Safely convert BigDecimal to Double */
    private Double toDouble(BigDecimal val) {
        return val != null ? val.doubleValue() : 0.0;
    }

    /** Convert month name to number for sorting (January=1, December=12) */
    private int monthToNumber(String monthName) {
        if (monthName == null) return 0;
        try {
            return java.time.Month.valueOf(monthName.toUpperCase().trim()).getValue();
        } catch (IllegalArgumentException e) {
            return 0;
        }
    }
}
