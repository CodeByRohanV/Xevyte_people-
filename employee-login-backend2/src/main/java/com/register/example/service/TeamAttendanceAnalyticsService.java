package com.register.example.service;

import com.register.example.dto.AttendanceAnalyticsDeepDTO;
import com.register.example.dto.TeamAttendanceAnalyticsDTO;
import com.register.example.entity.DailyEntry;
import com.register.example.entity.Employee;
import com.register.example.repository.DailyEntryRepository;
import com.register.example.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeamAttendanceAnalyticsService {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("h:mm a", Locale.US);

    @Autowired
    private DailyEntryRepository dailyEntryRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceAnalyticsDeepService deepService;

    public TeamAttendanceAnalyticsDTO getTeamAnalytics(String role, String authEmpId, LocalDate startDate, LocalDate endDate, String department) {
        // Delegate to Deep Service for full aggregation payload
        AttendanceAnalyticsDeepDTO deepDto = deepService.buildDeepAnalytics(role, authEmpId, startDate, endDate, null, department, true);

        TeamAttendanceAnalyticsDTO dto = new TeamAttendanceAnalyticsDTO();
        // Map all fields from AttendanceAnalyticsDeepDTO
        dto.setKpis(deepDto.getKpis());
        dto.setDailyLogs(deepDto.getDailyLogs());
        dto.setHoursDistribution(deepDto.getHoursDistribution());
        dto.setPunctuality(deepDto.getPunctuality());
        dto.setWeekdayAverages(deepDto.getWeekdayAverages());
        dto.setMonthlyAggregates(deepDto.getMonthlyAggregates());
        dto.setLocationAnalysis(deepDto.getLocationAnalysis());
        dto.setDepartmentBreakdown(deepDto.getDepartmentBreakdown());
        dto.setAnomalies(deepDto.getAnomalies());
        dto.setCalendarData(deepDto.getCalendarData());
        dto.setOvertimeIntelligence(deepDto.getOvertimeIntelligence());

        // 1. Get employees in scope for Roster
        List<Employee> inScopeEmployees = getInScopeEmployees(role, authEmpId, department);
        if (inScopeEmployees.isEmpty()) {
            return dto;
        }

        List<String> empIds = inScopeEmployees.stream().map(Employee::getEmployeeId).collect(Collectors.toList());
        Map<String, Employee> empMap = inScopeEmployees.stream().collect(Collectors.toMap(Employee::getEmployeeId, e -> e, (e1, e2) -> e1));

        // 2. Fetch daily entries for Rankings
        List<DailyEntry> entries = dailyEntryRepository.findByEmployeeIdInAndDateBetween(empIds, startDate, endDate);
        entries = entries.stream().filter(e -> e.getDate() != null).collect(Collectors.toList());

        // 3. Set all employees for the explorer table
        dto.setAllEmployees(buildRankings(entries, empMap));

        return dto;
    }

    private List<Employee> getInScopeEmployees(String role, String authEmpId, String department) {
        boolean isOrgWideRole = "HR".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role) || "SUB_ADMIN".equalsIgnoreCase(role) || "SUB ADMIN".equalsIgnoreCase(role);
        List<Employee> inScopeEmployees;

        if (isOrgWideRole) {
            if (department != null && !department.isEmpty()) {
                inScopeEmployees = employeeRepository.findByDepartment(department);
            } else {
                inScopeEmployees = employeeRepository.findAll();
            }
        } else if ("MANAGER".equalsIgnoreCase(role)) {
            inScopeEmployees = employeeRepository.findByAssignedManagerId(authEmpId);
            employeeRepository.findByEmployeeId(authEmpId).ifPresent(inScopeEmployees::add);
        } else {
            inScopeEmployees = employeeRepository.findByEmployeeId(authEmpId).map(Collections::singletonList).orElse(Collections.emptyList());
        }
        return inScopeEmployees;
    }

    private List<AttendanceAnalyticsDeepDTO.EmployeeRanking> buildRankings(List<DailyEntry> entries, Map<String, Employee> empMap) {
        List<AttendanceAnalyticsDeepDTO.EmployeeRanking> rankings = new ArrayList<>();

        Map<String, List<DailyEntry>> byEmp = entries.stream()
                .collect(Collectors.groupingBy(DailyEntry::getEmployeeId));

        for (String empId : empMap.keySet()) {
            List<DailyEntry> logs = byEmp.getOrDefault(empId, Collections.emptyList());
            
            AttendanceAnalyticsDeepDTO.EmployeeRanking rank = new AttendanceAnalyticsDeepDTO.EmployeeRanking();
            rank.setEmployeeId(empId);
            Employee emp = empMap.get(empId);
            rank.setEmployeeName(emp != null ? emp.getFirstName() + " " + emp.getLastName() : empId);
            rank.setDesignation(emp != null ? emp.getRole() : "Team Member");
            
            long onTime = logs.stream().filter(e -> "ON_TIME".equals(determineStatus(e))).count();
            double punctuality = logs.size() > 0 ? (double) onTime / logs.size() * 100.0 : 0;
            rank.setPunctualityScore(punctuality);
            
            double avgHours = logs.stream().mapToDouble(DailyEntry::getTotalHours).average().orElse(0.0);
            rank.setAvgEffectiveHours(Math.round(avgHours * 100.0) / 100.0);
            
            int absences = (int) logs.stream().filter(e -> "ABSENT".equals(determineStatus(e))).count();
            rank.setAbsences(absences);

            double hoursScore = Math.min(100.0, (avgHours / 8.0) * 100.0);
            double attendanceRate = logs.size() > 0 ? ((double)(logs.size() - absences) / logs.size()) * 100.0 : 0;
            double healthScore = (punctuality * 0.5) + (hoursScore * 0.3) + (attendanceRate * 0.2);
            rank.setHealthScore(Math.round(healthScore * 10.0) / 10.0);
            
            rankings.add(rank);
        }
        return rankings;
    }

    private String determineStatus(DailyEntry entry) {
        if (entry.getWorkLocation() != null && entry.getWorkLocation().equalsIgnoreCase("WFH")) {
            return "WFH";
        }
        if (entry.getLoginTime() == null) {
            return "ABSENT";
        }
        try {
            LocalTime login = LocalTime.parse(entry.getLoginTime().toUpperCase(), TIME_FORMAT);
            if (login.isAfter(LocalTime.of(10, 15))) {
                return "LATE";
            }
            return "ON_TIME";
        } catch (DateTimeParseException e) {
            return "UNKNOWN";
        }
    }
}

