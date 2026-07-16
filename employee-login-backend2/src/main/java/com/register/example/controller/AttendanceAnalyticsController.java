package com.register.example.controller;

import com.register.example.dto.AttendanceAnalyticsDeepDTO;
import com.register.example.dto.EmployeeAnalyticsDTO;
import com.register.example.entity.Employee;
import com.register.example.repository.EmployeeRepository;
import com.register.example.service.AttendanceAnalyticsDeepService;
import com.register.example.service.AttendanceAnalyticsService;
import com.register.example.dto.EmployeeSummaryDTO;
import com.register.example.dto.TeamAttendanceAnalyticsDTO;
import com.register.example.service.TeamAttendanceAnalyticsService;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/analytics")
@CrossOrigin(origins = "*")
public class AttendanceAnalyticsController {

    @Autowired
    private AttendanceAnalyticsService analyticsService;

    @Autowired
    private AttendanceAnalyticsDeepService deepService;

    @Autowired
    private TeamAttendanceAnalyticsService teamService;

    @Autowired
    private EmployeeRepository employeeRepository;

    @GetMapping("/me")
    public ResponseEntity<Object> getMyAnalytics(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        
        String employeeId = auth.getName();
        
        EmployeeAnalyticsDTO dto = analyticsService.getEmployeeAnalytics(employeeId, startDate, endDate);
        return ResponseEntity.ok(dto);
    }

    /**
     * Deep attendance analytics endpoint.
     * Role-based data scoping:
     *   - HR / Admin / Sub Admin: org-wide (all employees)
     *   - Manager: team members + self
     *   - Employee: self only
     * Optional filters: employeeId (drill-down), department
     */
    @GetMapping("/deep")
    public ResponseEntity<Object> getDeepAnalytics(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "employeeId", required = false) String filterEmployeeId,
            @RequestParam(value = "department", required = false) String department) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        String authEmpId = auth.getName();

        // Look up role from Employee table
        Optional<Employee> empOpt = employeeRepository.findByEmployeeId(authEmpId);
        String role = empOpt.map(Employee::getRole).orElse("EMPLOYEE");

        try {
            AttendanceAnalyticsDeepDTO dto = deepService.buildDeepAnalytics(
                    role, authEmpId, startDate, endDate, filterEmployeeId, department, false);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            try {
                java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter("deep_error.txt"));
                e.printStackTrace(pw);
                pw.close();
            } catch (Exception ex) {}
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal Server Error", "message", e.getMessage(), "cause", e.toString()));
        }
    }

    @GetMapping("/team-members")
    public ResponseEntity<Object> getTeamMembers() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        String authEmpId = auth.getName();
        Optional<Employee> empOpt = employeeRepository.findByEmployeeId(authEmpId);
        String role = empOpt.map(Employee::getRole).orElse("EMPLOYEE");

        try {
            List<EmployeeSummaryDTO> teamMembers = deepService.getTeamMembers(role, authEmpId);
            return ResponseEntity.ok(teamMembers);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal Server Error", "message", e.getMessage()));
        }
    }

    @GetMapping("/team")
    public ResponseEntity<Object> getTeamAnalytics(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "department", required = false) String department) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        String authEmpId = auth.getName();
        Optional<Employee> empOpt = employeeRepository.findByEmployeeId(authEmpId);
        String role = empOpt.map(Employee::getRole).orElse("EMPLOYEE");

        try {
            TeamAttendanceAnalyticsDTO dto = teamService.getTeamAnalytics(role, authEmpId, startDate, endDate, department);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            try {
                java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter("team_error.txt"));
                e.printStackTrace(pw);
                pw.close();
            } catch (Exception ex) {}
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal Server Error", "message", e.getMessage(), "cause", String.valueOf(e.getCause())));
        }
    }

    @GetMapping("/deep-test")
    public ResponseEntity<Object> getDeepAnalyticsTest() {
        try {
            LocalDate startDate = LocalDate.of(2026, 7, 1);
            LocalDate endDate = LocalDate.of(2026, 7, 10);
            AttendanceAnalyticsDeepDTO dto = deepService.buildDeepAnalytics(
                    "HR", "EMP-001", startDate, endDate, null, null, false);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            try {
                java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter("deep_error.txt"));
                e.printStackTrace(pw);
                pw.close();
            } catch (Exception ex) {}
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error", "message", e.getMessage(), "cause", e.toString()));
        }
    }

    @Autowired
    private com.register.example.repository.DailyEntryRepository dailyEntryRepository;

    @jakarta.annotation.PostConstruct
    public void generateTeamDataOnStartup() {
        cleanupRohanData();
        generateTeamData();
    }

    @GetMapping("/generate-team-data")
    public ResponseEntity<String> generateTeamData() {
        List<Employee> allEmployees = employeeRepository.findAll();
        List<Employee> teamMembers = allEmployees.stream()
                .filter(e -> !(e.getFirstName() != null && e.getFirstName().toLowerCase().contains("rohan")) && !(e.getEmail() != null && e.getEmail().toLowerCase().contains("rohan"))) // Skip Rohan properly
                .collect(Collectors.toList());

        if (teamMembers.isEmpty()) return ResponseEntity.ok("No other team members found!");

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(30);

        List<com.register.example.entity.DailyEntry> newEntries = new ArrayList<>();
        java.util.Random random = new java.util.Random();

        for (Employee emp : teamMembers) {
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                if (date.getDayOfWeek().getValue() >= 6) continue;

                com.register.example.entity.DailyEntry entry = new com.register.example.entity.DailyEntry();
                entry.setEmployeeId(emp.getEmployeeId());
                entry.setDate(date);

                int chance = random.nextInt(100);
                if (chance < 10) {
                    continue; // Absent
                } else if (chance < 20) {
                    entry.setLoginTime("10:30 AM");
                    entry.setLogoutTime("06:30 PM");
                    entry.setTotalHours(8.0);
                    entry.setWorkLocation("Office");
                } else if (chance < 40) {
                    entry.setLoginTime("09:00 AM");
                    entry.setLogoutTime("06:00 PM");
                    entry.setTotalHours(9.0);
                    entry.setWorkLocation("WFH");
                } else if (chance < 50) {
                    entry.setLoginTime("09:00 AM");
                    entry.setLogoutTime("01:00 PM");
                    entry.setTotalHours(4.0);
                    entry.setWorkLocation("Office");
                } else {
                    entry.setLoginTime("09:00 AM");
                    entry.setLogoutTime("05:00 PM");
                    entry.setTotalHours(8.0);
                    entry.setWorkLocation("Office");
                }
                newEntries.add(entry);
            }
        }
        dailyEntryRepository.saveAll(newEntries);
        return ResponseEntity.ok("Generated " + newEntries.size() + " entries for " + teamMembers.size() + " employees.");
    }

    @GetMapping("/cleanup-rohan-data")
    public ResponseEntity<String> cleanupRohanData() {
        List<com.register.example.entity.DailyEntry> dummyEntries = dailyEntryRepository.findAll().stream()
                .filter(e -> e.getLoginTime() != null && (
                        e.getLoginTime().equals("10:30 AM") ||
                        e.getLoginTime().equals("09:00 AM")
                ))
                .collect(Collectors.toList());

        dailyEntryRepository.deleteAll(dummyEntries);
        return ResponseEntity.ok("Deleted " + dummyEntries.size() + " dummy entries globally.");
    }

    @GetMapping("/dump-rohan-data")
    public ResponseEntity<List<com.register.example.entity.DailyEntry>> dumpRohanData() {
        return ResponseEntity.ok(
            dailyEntryRepository.findAll().stream()
                .filter(e -> "EMP001".equals(e.getEmployeeId()))
                .collect(Collectors.toList())
        );
    }
}

