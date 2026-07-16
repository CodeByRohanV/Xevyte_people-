package com.register.example.service;

import com.register.example.dto.DailyLogSummaryDTO;
import com.register.example.dto.EmployeeAnalyticsDTO;
import com.register.example.entity.DailyEntry;
import com.register.example.entity.LeaveRequest;
import com.register.example.repository.DailyEntryRepository;
import com.register.example.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class AttendanceAnalyticsService {

    @Autowired
    private DailyEntryRepository dailyEntryRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    public EmployeeAnalyticsDTO getEmployeeAnalytics(String employeeId, LocalDate start, LocalDate end) {
        // Fetch all timesheet entries for this date range
        List<DailyEntry> entries = dailyEntryRepository.findByEmployeeIdAndDateBetween(employeeId, start, end);

        // Calculate average effective hours
        double totalHoursSum = 0;
        long validEntries = 0;
        for (DailyEntry entry : entries) {
            if (entry.getTotalHours() > 0) {
                totalHoursSum += entry.getTotalHours();
                validEntries++;
            }
        }
        Double averageHours = validEntries > 0 ? (totalHoursSum / validEntries) : 0.0;

        // Build daily logs with both effective and gross hours
        List<DailyLogSummaryDTO> dailyLogs = entries.stream()
                .map(entry -> {
                    String derivedStatus = determineStatus(entry);
                    Double grossHours = calculateGrossHours(entry);
                    return new DailyLogSummaryDTO(entry.getDate(), entry.getTotalHours(), grossHours, derivedStatus);
                })
                .collect(Collectors.toList());

        // Calculate on-time percentage
        long onTimeCount = dailyLogs.stream()
                .filter(log -> "ON_TIME".equals(log.getStatus()))
                .count();
        long totalLogs = entries.size();
        Double onTimePercentage = totalLogs > 0 ? (double) onTimeCount / totalLogs * 100.0 : 0.0;

        // --- Leave Utilization (Real Data from leave_requests) ---
        Double approvedLeaveDays = calculateApprovedLeaves(employeeId, start, end);

        // --- Burnout Indicator (14-day trailing window from endDate) ---
        Boolean isBurnoutRisk = calculateBurnoutRisk(employeeId, end);

        return new EmployeeAnalyticsDTO(averageHours, onTimePercentage, dailyLogs, approvedLeaveDays, isBurnoutRisk);
    }

    /**
     * Calculates gross hours by parsing the loginTime and logoutTime strings.
     * Gross hours represent total time at the office (clock-in to clock-out),
     * as opposed to effective/productive hours.
     */
    private Double calculateGrossHours(DailyEntry entry) {
        if (entry.getLoginTime() == null || entry.getLoginTime().trim().isEmpty()) {
            return 0.0;
        }
        if (entry.getLogoutTime() == null || entry.getLogoutTime().trim().isEmpty()) {
            return 0.0;
        }

        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("h:mm a", Locale.US);
            LocalTime login = LocalTime.parse(entry.getLoginTime().trim(), formatter);
            LocalTime logout = LocalTime.parse(entry.getLogoutTime().trim(), formatter);

            long minutes = Duration.between(login, logout).toMinutes();
            if (minutes < 0) {
                // Handle overnight shifts (unlikely but safe)
                minutes += 24 * 60;
            }
            return Math.round(minutes / 60.0 * 100.0) / 100.0;
        } catch (DateTimeParseException e) {
            // If parsing fails, fall back to totalHours
            return entry.getTotalHours();
        }
    }

    /**
     * Queries LeaveRequestRepository for all APPROVED leaves for this employee
     * that overlap with the requested date range, and sums totalDays.
     * Handles mixed-case status values (e.g., "APPROVED", "Approved").
     */
    private Double calculateApprovedLeaves(String employeeId, LocalDate start, LocalDate end) {
        // Fetch all leaves for this employee, then filter in Java for date overlap and approved status
        List<LeaveRequest> allLeaves = leaveRequestRepository.findByEmployeeId(employeeId);

        return allLeaves.stream()
                .filter(lr -> lr.getStatus() != null && lr.getStatus().equalsIgnoreCase("APPROVED"))
                .filter(lr -> {
                    // Check if the leave period overlaps with the requested date range
                    LocalDate leaveStart = lr.getStartDate();
                    LocalDate leaveEnd = lr.getEndDate();
                    if (leaveStart == null || leaveEnd == null) return false;
                    return !leaveStart.isAfter(end) && !leaveEnd.isBefore(start);
                })
                .mapToDouble(lr -> lr.getTotalDays() != null ? lr.getTotalDays() : 0.0)
                .sum();
    }

    /**
     * Calculates burnout risk by looking at the 14-day trailing window from endDate.
     * If average gross hours exceed 9.5, the employee is flagged as at risk.
     */
    private Boolean calculateBurnoutRisk(String employeeId, LocalDate endDate) {
        LocalDate windowStart = endDate.minusDays(14);
        List<DailyEntry> recentEntries = dailyEntryRepository.findByEmployeeIdAndDateBetween(employeeId, windowStart, endDate);

        if (recentEntries.isEmpty()) {
            return false;
        }

        double totalGross = 0;
        long daysWithData = 0;
        for (DailyEntry entry : recentEntries) {
            Double gross = calculateGrossHours(entry);
            if (gross > 0) {
                totalGross += gross;
                daysWithData++;
            }
        }

        if (daysWithData == 0) {
            return false;
        }

        double averageGross = totalGross / daysWithData;
        return averageGross > 9.5;
    }

    private String determineStatus(DailyEntry entry) {
        if ("WFH".equalsIgnoreCase(entry.getWorkLocation())) {
            return "WFH";
        }

        if (entry.getLoginTime() == null || entry.getLoginTime().trim().isEmpty()) {
            return entry.getTotalHours() > 0 ? "ON_TIME" : "ABSENT";
        }

        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("h:mm a", Locale.US);
            LocalTime loginTime = LocalTime.parse(entry.getLoginTime().trim(), formatter);

            LocalTime threshold = LocalTime.of(9, 30);
            if (loginTime.isAfter(threshold)) {
                return "LATE";
            } else {
                return "ON_TIME";
            }
        } catch (DateTimeParseException e) {
            return "ON_TIME";
        }
    }
}
