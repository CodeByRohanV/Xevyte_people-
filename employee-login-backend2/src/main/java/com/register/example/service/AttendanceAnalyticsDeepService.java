package com.register.example.service;

import com.register.example.dto.AttendanceAnalyticsDeepDTO;
import com.register.example.dto.AttendanceAnalyticsDeepDTO.*;
import com.register.example.dto.EmployeeSummaryDTO;
import com.register.example.entity.DailyEntry;
import com.register.example.entity.Employee;
import com.register.example.repository.DailyEntryRepository;
import com.register.example.repository.EmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.TextStyle;
import java.time.temporal.IsoFields;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service that performs comprehensive server-side aggregation
 * of real attendance data for the deep analytics dashboard.
 */
@Service
public class AttendanceAnalyticsDeepService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceAnalyticsDeepService.class);
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("h:mm a", Locale.US);

    @Autowired
    private DailyEntryRepository dailyEntryRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    /**
     * Build the complete deep analytics DTO.
     *
     * @param role        The authenticated user's role (HR, ADMIN, MANAGER, EMPLOYEE)
     * @param authEmpId   The authenticated user's employee ID
     * @param startDate   Range start
     * @param endDate     Range end
     * @param filterEmpId Optional employee ID filter (HR/Admin drill-down)
     * @param filterDept  Optional department filter
     */
    public AttendanceAnalyticsDeepDTO buildDeepAnalytics(
            String role, String authEmpId,
            LocalDate startDate, LocalDate endDate,
            String filterEmpId, String filterDept,
            boolean isTeamView) {

        // 1. Determine which entries to fetch based on role and view mode
        List<DailyEntry> entries = fetchEntries(role, authEmpId, startDate, endDate, filterEmpId, filterDept, isTeamView);
        
        // Remove invalid entries without a date to prevent NPEs
        entries = entries.stream().filter(e -> e.getDate() != null).collect(Collectors.toList());

        // 2. Build employee lookup map
        Map<String, Employee> employeeMap = buildEmployeeMap(entries);

        // 3. Enrich entries
        List<EnrichedDailyLog> enrichedLogs = enrichEntries(entries, employeeMap);

        // 4. Build all sections
        AttendanceAnalyticsDeepDTO dto = new AttendanceAnalyticsDeepDTO();
        dto.setKpis(buildKpis(entries, enrichedLogs, role, authEmpId, startDate, endDate, filterEmpId, filterDept, isTeamView));
        dto.setDailyLogs(enrichedLogs);
        dto.setDailyTrend(buildDailyTrend(enrichedLogs));
        dto.setPunctuality(buildPunctuality(enrichedLogs));
        dto.setHoursDistribution(buildHoursDistribution(enrichedLogs));
        dto.setWeekdayAverages(buildWeekdayAverages(enrichedLogs));
        dto.setMonthlyAggregates(buildMonthlyAggregates(enrichedLogs));
        dto.setLocationAnalysis(buildLocationAnalysis(enrichedLogs));
        dto.setCalendarData(buildCalendarData(entries));
        dto.setAnomalies(buildAnomalies(entries, employeeMap));
        dto.setOvertimeIntelligence(buildOvertimeIntelligence(enrichedLogs));

        // Department breakdown only for HR/Admin org-wide view
        boolean isOrgWide = isOrgWideRole(role) && filterEmpId == null;
        if (isOrgWide) {
            dto.setDepartmentBreakdown(buildDepartmentBreakdown(enrichedLogs));
        }

        return dto;
    }


    // ===== DATA FETCHING =====

    private List<DailyEntry> fetchEntries(String role, String authEmpId,
                                           LocalDate start, LocalDate end,
                                           String filterEmpId, String filterDept,
                                           boolean isTeamView) {
        // If filtering by a specific employee
        if (filterEmpId != null && !filterEmpId.isEmpty()) {
            // RBAC Check: Is this user allowed to view filterEmpId?
            if (!isOrgWideRole(role) && !authEmpId.equals(filterEmpId)) {
                if ("MANAGER".equalsIgnoreCase(role)) {
                    List<Employee> teamMembers = employeeRepository.findByAssignedManagerId(authEmpId);
                    boolean isMyTeam = teamMembers.stream().anyMatch(e -> e.getEmployeeId().equals(filterEmpId));
                    if (!isMyTeam) {
                        throw new RuntimeException("Access Denied: Employee not in your team.");
                    }
                } else {
                    throw new RuntimeException("Access Denied: You can only view your own analytics.");
                }
            }
            return dailyEntryRepository.findByEmployeeIdAndDateBetween(filterEmpId, start, end);
        }
        // If not in team view (and no explicit filter), ALWAYS fetch just the individual user's data
        if (!isTeamView) {
            return dailyEntryRepository.findByEmployeeIdAndDateBetween(authEmpId, start, end);
        }

        // --- TEAM VIEW LOGIC BELOW ---
        // HR / Admin / Sub Admin: org-wide or department-filtered
        if (isOrgWideRole(role)) {
            if (filterDept != null && !filterDept.isEmpty()) {
                List<Employee> deptEmployees = employeeRepository.findByDepartment(filterDept);
                List<String> empIds = deptEmployees.stream().map(Employee::getEmployeeId).collect(Collectors.toList());
                if (empIds.isEmpty()) return Collections.emptyList();
                return dailyEntryRepository.findByEmployeeIdInAndDateBetween(empIds, start, end);
            }
            return dailyEntryRepository.findByDateBetween(start, end);
        }

        // Manager: team data
        if ("MANAGER".equalsIgnoreCase(role)) {
            List<Employee> teamMembers = employeeRepository.findByAssignedManagerId(authEmpId);
            List<String> empIds = teamMembers.stream().map(Employee::getEmployeeId).collect(Collectors.toList());
            empIds.add(authEmpId); // Include manager's own data
            return dailyEntryRepository.findByEmployeeIdInAndDateBetween(empIds, start, end);
        }

        // Employee: self only
        return dailyEntryRepository.findByEmployeeIdAndDateBetween(authEmpId, start, end);
    }

    private boolean isOrgWideRole(String role) {
        if (role == null) return false;
        String upper = role.toUpperCase().trim();
        return "HR".equals(upper) || "ADMIN".equals(upper)
                || "SUB_ADMIN".equals(upper) || "SUB ADMIN".equals(upper);
    }

    public List<EmployeeSummaryDTO> getTeamMembers(String role, String authEmpId) {
        List<Employee> employees;
        if (isOrgWideRole(role)) {
            employees = employeeRepository.findAll();
        } else if ("MANAGER".equalsIgnoreCase(role)) {
            employees = employeeRepository.findByAssignedManagerId(authEmpId);
        } else {
            employees = employeeRepository.findByEmployeeId(authEmpId).map(Collections::singletonList).orElse(Collections.emptyList());
        }

        return employees.stream()
                .map(e -> new EmployeeSummaryDTO(e.getEmployeeId(), e.getFirstName(), e.getLastName(), e.getDepartment(), e.getRole()))
                .collect(Collectors.toList());
    }

    private Map<String, Employee> buildEmployeeMap(List<DailyEntry> entries) {
        Set<String> empIds = entries.stream().map(DailyEntry::getEmployeeId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        if (empIds.isEmpty()) return Collections.emptyMap();

        List<Employee> employees = employeeRepository.findByEmployeeIdIn(new ArrayList<>(empIds));
        return employees.stream().collect(Collectors.toMap(Employee::getEmployeeId, e -> e, (a, b) -> a));
    }

    // ===== ENRICHMENT =====

    private List<EnrichedDailyLog> enrichEntries(List<DailyEntry> entries, Map<String, Employee> empMap) {
        return entries.stream()
                .sorted(Comparator.comparing(DailyEntry::getDate))
                .map(entry -> {
                    EnrichedDailyLog log = new EnrichedDailyLog();
                    log.setDate(entry.getDate());
                    log.setEffectiveHours(entry.getTotalHours());
                    log.setGrossHours(calculateGrossHours(entry));
                    log.setStatus(determineStatus(entry));
                    log.setLoginTime(entry.getLoginTime());
                    log.setLogoutTime(entry.getLogoutTime());
                    log.setWorkLocation(entry.getWorkLocation());
                    log.setEmployeeId(entry.getEmployeeId());

                    if (entry.getDate() != null) {
                        log.setDayOfWeek(entry.getDate().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                        log.setWeekNumber(entry.getDate().get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
                    }

                    // Parse login hour
                    log.setLoginHour(parseLoginHour(entry.getLoginTime()));

                    // Employee info
                    Employee emp = empMap.get(entry.getEmployeeId());
                    if (emp != null) {
                        log.setEmployeeName((emp.getFirstName() != null ? emp.getFirstName() : "")
                                + " " + (emp.getLastName() != null ? emp.getLastName() : ""));
                        log.setDepartment(emp.getDepartment());
                    }

                    return log;
                })
                .collect(Collectors.toList());
    }

    // ===== KPI SUMMARY =====

    private KpiSummary buildKpis(List<DailyEntry> entries, List<EnrichedDailyLog> logs,
                                  String role, String authEmpId, LocalDate start, LocalDate end,
                                  String filterEmpId, String filterDept, boolean isTeamView) {
        KpiSummary kpi = new KpiSummary();

        long total = logs.size();
        kpi.setTotalDaysTracked(total);

        if (total == 0) return kpi;

        double effectiveSum = logs.stream().mapToDouble(EnrichedDailyLog::getEffectiveHours).sum();
        double grossSum = logs.stream().mapToDouble(EnrichedDailyLog::getGrossHours).sum();
        long validEffective = logs.stream().filter(l -> l.getEffectiveHours() > 0).count();
        long validGross = logs.stream().filter(l -> l.getGrossHours() > 0).count();

        kpi.setAvgEffectiveHours(validEffective > 0 ? Math.round(effectiveSum / validEffective * 100.0) / 100.0 : 0);
        kpi.setAvgGrossHours(validGross > 0 ? Math.round(grossSum / validGross * 100.0) / 100.0 : 0);

        long onTime = logs.stream().filter(l -> "ON_TIME".equals(l.getStatus())).count();
        long late = logs.stream().filter(l -> "LATE".equals(l.getStatus())).count();
        long wfh = logs.stream().filter(l -> "WFH".equals(l.getStatus())).count();
        long absent = logs.stream().filter(l -> "ABSENT".equals(l.getStatus())).count();

        kpi.setOnTimePercent(Math.round((double) onTime / total * 1000.0) / 10.0);
        kpi.setLatePercent(Math.round((double) late / total * 1000.0) / 10.0);
        kpi.setWfhPercent(Math.round((double) wfh / total * 1000.0) / 10.0);
        kpi.setAbsentDays(absent);

        // Consistency Score Calculation
        if (logs.isEmpty()) {
            kpi.setConsistencyScore(0);
        } else {
            Map<String, List<EnrichedDailyLog>> logsByEmp = logs.stream().filter(l -> l.getEmployeeId() != null).collect(Collectors.groupingBy(EnrichedDailyLog::getEmployeeId));
            double totalConsistency = 0;
            for (List<EnrichedDailyLog> empLogs : logsByEmp.values()) {
                double score = 100;
                for (EnrichedDailyLog log : empLogs) {
                    if ("LATE".equals(log.getStatus())) score -= 5;
                    else if ("ABSENT".equals(log.getStatus())) score -= 10;
                    else if (!"LEAVE".equals(log.getStatus()) && log.getEffectiveHours() > 0 && log.getEffectiveHours() < 8.0) score -= 5;
                }
                totalConsistency += Math.max(0, score);
            }
            kpi.setConsistencyScore(logsByEmp.size() > 0 ? Math.round(totalConsistency / logsByEmp.size() * 10.0) / 10.0 : 0);
        }

        kpi.setTargetAdherence(kpi.getAvgEffectiveHours() > 0
                ? Math.round(kpi.getAvgEffectiveHours() / 8.0 * 1000.0) / 10.0 : 0);

        // Burnout: check 14-day trailing avg gross > 9.5h
        kpi.setBurnoutRisk(kpi.getAvgGrossHours() > 9.5);

        // Trend delta: compare to previous period
        try {
            long daysBetween = ChronoUnit.DAYS.between(start, end) + 1;
            LocalDate prevStart = start.minusDays(daysBetween);
            LocalDate prevEnd = start.minusDays(1);
            List<DailyEntry> prevEntries = fetchEntries(role, authEmpId, prevStart, prevEnd, filterEmpId, filterDept, isTeamView);
            if (!prevEntries.isEmpty()) {
                double prevSum = prevEntries.stream().mapToDouble(DailyEntry::getTotalHours).sum();
                long prevValid = prevEntries.stream().filter(e -> e.getTotalHours() > 0).count();
                double prevAvg = prevValid > 0 ? prevSum / prevValid : 0;
                if (prevAvg > 0) {
                    kpi.setTrendDelta(Math.round((kpi.getAvgEffectiveHours() - prevAvg) / prevAvg * 1000.0) / 10.0);
                }
            }
        } catch (Exception e) {
            log.debug("Could not calculate trend delta: {}", e.getMessage());
        }

        return kpi;
    }

    // ===== PUNCTUALITY ANALYSIS =====

    private PunctualityAnalysis buildPunctuality(List<EnrichedDailyLog> logs) {
        PunctualityAnalysis pa = new PunctualityAnalysis();

        pa.setOnTimeCount(logs.stream().filter(l -> "ON_TIME".equals(l.getStatus())).count());
        pa.setLateCount(logs.stream().filter(l -> "LATE".equals(l.getStatus())).count());
        pa.setWfhCount(logs.stream().filter(l -> "WFH".equals(l.getStatus())).count());
        pa.setAbsentCount(logs.stream().filter(l -> "ABSENT".equals(l.getStatus())).count());

        // Late arrival time buckets
        List<TimeBucket> buckets = new ArrayList<>();
        long b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;

        for (EnrichedDailyLog log : logs) {
            if (!"LATE".equals(log.getStatus())) continue;
            Integer hour = log.getLoginHour();
            if (hour == null) continue;

            try {
                LocalTime loginTime = LocalTime.parse(log.getLoginTime().trim(), TIME_FORMAT);
                int minutes = loginTime.getHour() * 60 + loginTime.getMinute();
                int threshold = 9 * 60; // 9:00 AM

                if (minutes <= threshold + 15) b1++;
                else if (minutes <= threshold + 30) b2++;
                else if (minutes <= threshold + 45) b3++;
                else if (minutes <= threshold + 60) b4++;
                else b5++;
            } catch (Exception ignored) {}
        }

        buckets.add(new TimeBucket("9:00-9:15", b1));
        buckets.add(new TimeBucket("9:15-9:30", b2));
        buckets.add(new TimeBucket("9:30-9:45", b3));
        buckets.add(new TimeBucket("9:45-10:00", b4));
        buckets.add(new TimeBucket("10:00+", b5));
        pa.setLateArrivalBuckets(buckets);

        // Weekly punctuality trend
        Map<Integer, List<EnrichedDailyLog>> byWeek = logs.stream()
                .filter(l -> l.getDate() != null)
                .collect(Collectors.groupingBy(EnrichedDailyLog::getWeekNumber, TreeMap::new, Collectors.toList()));

        List<WeeklyPunctuality> weeklyTrend = new ArrayList<>();
        for (Map.Entry<Integer, List<EnrichedDailyLog>> entry : byWeek.entrySet()) {
            List<EnrichedDailyLog> weekLogs = entry.getValue();
            long weekTotal = weekLogs.size();
            long weekOnTime = weekLogs.stream().filter(l -> "ON_TIME".equals(l.getStatus())).count();
            double pct = weekTotal > 0 ? Math.round((double) weekOnTime / weekTotal * 1000.0) / 10.0 : 0;
            weeklyTrend.add(new WeeklyPunctuality("W" + entry.getKey(), pct));
        }
        pa.setWeeklyTrend(weeklyTrend);

        return pa;
    }

    // ===== HOURS DISTRIBUTION =====

    private HoursDistribution buildHoursDistribution(List<EnrichedDailyLog> logs) {
        HoursDistribution hd = new HoursDistribution();

        long total = logs.size();
        if (total == 0) {
            hd.setBuckets(Collections.emptyList());
            return hd;
        }

        long lt4 = 0, b46 = 0, b67 = 0, b78 = 0, b89 = 0, b910 = 0, gt10 = 0;

        for (EnrichedDailyLog log : logs) {
            double h = log.getEffectiveHours();
            if (h < 4) lt4++;
            else if (h < 6) b46++;
            else if (h < 7) b67++;
            else if (h < 8) b78++;
            else if (h < 9) b89++;
            else if (h < 10) b910++;
            else gt10++;
        }

        List<HoursBucket> buckets = new ArrayList<>();
        buckets.add(new HoursBucket("<4h", lt4, Math.round((double) lt4 / total * 1000.0) / 10.0));
        buckets.add(new HoursBucket("4-6h", b46, Math.round((double) b46 / total * 1000.0) / 10.0));
        buckets.add(new HoursBucket("6-7h", b67, Math.round((double) b67 / total * 1000.0) / 10.0));
        buckets.add(new HoursBucket("7-8h", b78, Math.round((double) b78 / total * 1000.0) / 10.0));
        buckets.add(new HoursBucket("8-9h", b89, Math.round((double) b89 / total * 1000.0) / 10.0));
        buckets.add(new HoursBucket("9-10h", b910, Math.round((double) b910 / total * 1000.0) / 10.0));
        buckets.add(new HoursBucket("10h+", gt10, Math.round((double) gt10 / total * 1000.0) / 10.0));
        hd.setBuckets(buckets);

        return hd;
    }

    // ===== WEEKDAY AVERAGES =====

    private List<WeekdayAverage> buildWeekdayAverages(List<EnrichedDailyLog> logs) {
        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        DayOfWeek[] dayEnums = {DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY};

        List<WeekdayAverage> result = new ArrayList<>();

        for (int i = 0; i < days.length; i++) {
            final DayOfWeek dow = dayEnums[i];
            List<EnrichedDailyLog> dayLogs = logs.stream()
                    .filter(l -> l.getDate() != null && l.getDate().getDayOfWeek() == dow)
                    .collect(Collectors.toList());

            if (dayLogs.isEmpty()) {
                result.add(new WeekdayAverage(days[i], 0, 0));
                continue;
            }

            double avgE = dayLogs.stream().mapToDouble(EnrichedDailyLog::getEffectiveHours).average().orElse(0);
            double avgG = dayLogs.stream().mapToDouble(EnrichedDailyLog::getGrossHours).average().orElse(0);
            result.add(new WeekdayAverage(days[i], Math.round(avgE * 100.0) / 100.0, Math.round(avgG * 100.0) / 100.0));
        }

        return result;
    }

    // ===== MONTHLY AGGREGATES =====

    private List<MonthlyAggregate> buildMonthlyAggregates(List<EnrichedDailyLog> logs) {
        Map<String, List<EnrichedDailyLog>> byMonth = logs.stream()
                .filter(l -> l.getDate() != null)
                .collect(Collectors.groupingBy(
                        l -> l.getDate().getYear() + "-" + String.format("%02d", l.getDate().getMonthValue()),
                        TreeMap::new, Collectors.toList()));

        List<MonthlyAggregate> result = new ArrayList<>();
        for (Map.Entry<String, List<EnrichedDailyLog>> entry : byMonth.entrySet()) {
            List<EnrichedDailyLog> monthLogs = entry.getValue();
            MonthlyAggregate ma = new MonthlyAggregate();
            ma.setMonth(entry.getKey());
            ma.setTotalEntries(monthLogs.size());
            ma.setAvgEffective(Math.round(monthLogs.stream().mapToDouble(EnrichedDailyLog::getEffectiveHours).average().orElse(0) * 100.0) / 100.0);
            ma.setAvgGross(Math.round(monthLogs.stream().mapToDouble(EnrichedDailyLog::getGrossHours).average().orElse(0) * 100.0) / 100.0);
            long onTime = monthLogs.stream().filter(l -> "ON_TIME".equals(l.getStatus())).count();
            ma.setOnTimePercent(monthLogs.size() > 0 ? Math.round((double) onTime / monthLogs.size() * 1000.0) / 10.0 : 0);
            result.add(ma);
        }

        return result;
    }

    // ===== LOCATION ANALYSIS =====

    private LocationAnalysis buildLocationAnalysis(List<EnrichedDailyLog> logs) {
        LocationAnalysis la = new LocationAnalysis();

        long wfh = logs.stream().filter(l -> "WFH".equalsIgnoreCase(l.getWorkLocation())).count();
        long office = logs.stream().filter(l -> {
            String loc = l.getWorkLocation();
            return loc != null && !loc.isEmpty() && !"WFH".equalsIgnoreCase(loc);
        }).count();
        long other = logs.size() - wfh - office;

        la.setWfhCount(wfh);
        la.setOfficeCount(office);
        la.setOtherCount(Math.max(0, other));
        la.setWfhPercent(logs.size() > 0 ? Math.round((double) wfh / logs.size() * 1000.0) / 10.0 : 0);

        // Weekly breakdown
        Map<Integer, List<EnrichedDailyLog>> byWeek = logs.stream()
                .filter(l -> l.getDate() != null)
                .collect(Collectors.groupingBy(EnrichedDailyLog::getWeekNumber, TreeMap::new, Collectors.toList()));

        List<WeeklyLocationBreakdown> weeklyBreakdown = new ArrayList<>();
        for (Map.Entry<Integer, List<EnrichedDailyLog>> entry : byWeek.entrySet()) {
            List<EnrichedDailyLog> weekLogs = entry.getValue();
            long wW = weekLogs.stream().filter(l -> "WFH".equalsIgnoreCase(l.getWorkLocation())).count();
            long oW = weekLogs.stream().filter(l -> {
                String loc = l.getWorkLocation();
                return loc != null && !loc.isEmpty() && !"WFH".equalsIgnoreCase(loc);
            }).count();
            long otW = weekLogs.size() - wW - oW;
            weeklyBreakdown.add(new WeeklyLocationBreakdown("W" + entry.getKey(), oW, wW, Math.max(0, otW)));
        }
        la.setWeeklyBreakdown(weeklyBreakdown);

        return la;
    }

    // ===== CALENDAR HEATMAP =====

    private List<CalendarDayData> buildCalendarData(List<DailyEntry> entries) {
        return entries.stream()
                .sorted(Comparator.comparing(DailyEntry::getDate))
                .map(entry -> {
                    CalendarDayData cd = new CalendarDayData();
                    cd.setDate(entry.getDate());
                    cd.setEffectiveHours(entry.getTotalHours());
                    cd.setGrossHours(calculateGrossHours(entry));
                    cd.setStatus(determineStatus(entry));
                    cd.setLoginTime(entry.getLoginTime());
                    cd.setLogoutTime(entry.getLogoutTime());
                    return cd;
                })
                .collect(Collectors.toList());
    }

    // ===== DAILY TREND =====
    private List<AttendanceAnalyticsDeepDTO.DailyAggregate> buildDailyTrend(List<EnrichedDailyLog> logs) {
        Map<String, List<EnrichedDailyLog>> logsByDate = logs.stream()
                .filter(l -> l.getDate() != null)
                .collect(Collectors.groupingBy(l -> l.getDate().toString(), TreeMap::new, Collectors.toList()));

        List<AttendanceAnalyticsDeepDTO.DailyAggregate> result = new ArrayList<>();
        for (Map.Entry<String, List<EnrichedDailyLog>> entry : logsByDate.entrySet()) {
            List<EnrichedDailyLog> dayLogs = entry.getValue();
            double avgEff = dayLogs.stream().mapToDouble(EnrichedDailyLog::getEffectiveHours).average().orElse(0);
            double avgGross = dayLogs.stream().mapToDouble(EnrichedDailyLog::getGrossHours).average().orElse(0);
            result.add(new AttendanceAnalyticsDeepDTO.DailyAggregate(entry.getKey(), Math.round(avgEff * 100.0) / 100.0, Math.round(avgGross * 100.0) / 100.0));
        }
        return result;
    }

    // ===== DEPARTMENT BREAKDOWN =====

    private List<DepartmentBreakdown> buildDepartmentBreakdown(List<EnrichedDailyLog> logs) {
        Map<String, List<EnrichedDailyLog>> byDept = logs.stream()
                .filter(l -> l.getDepartment() != null && !l.getDepartment().isEmpty())
                .collect(Collectors.groupingBy(EnrichedDailyLog::getDepartment));

        List<DepartmentBreakdown> result = new ArrayList<>();
        for (Map.Entry<String, List<EnrichedDailyLog>> entry : byDept.entrySet()) {
            List<EnrichedDailyLog> deptLogs = entry.getValue();
            DepartmentBreakdown db = new DepartmentBreakdown();
            db.setDepartment(entry.getKey());
            db.setTotalEntries(deptLogs.size());
            db.setEmployeeCount(deptLogs.stream().map(EnrichedDailyLog::getEmployeeId).distinct().count());
            db.setAvgEffectiveHours(Math.round(deptLogs.stream().mapToDouble(EnrichedDailyLog::getEffectiveHours).average().orElse(0) * 100.0) / 100.0);

            long onTime = deptLogs.stream().filter(l -> "ON_TIME".equals(l.getStatus())).count();
            long late = deptLogs.stream().filter(l -> "LATE".equals(l.getStatus())).count();
            long absent = deptLogs.stream().filter(l -> "ABSENT".equals(l.getStatus())).count();

            db.setOnTimePercent(deptLogs.size() > 0 ? Math.round((double) onTime / deptLogs.size() * 1000.0) / 10.0 : 0);
            db.setLatePercent(deptLogs.size() > 0 ? Math.round((double) late / deptLogs.size() * 1000.0) / 10.0 : 0);
            db.setAbsentCount(absent);
            result.add(db);
        }

        result.sort(Comparator.comparing(DepartmentBreakdown::getDepartment));
        return result;
    }

    // ===== ANOMALY DETECTION =====

    private List<Anomaly> buildAnomalies(List<DailyEntry> entries, Map<String, Employee> empMap) {
        List<Anomaly> anomalies = new ArrayList<>();

        // Group by employee, safely ignoring null employeeIds
        Map<String, List<DailyEntry>> byEmployee = entries.stream()
                .filter(e -> e.getEmployeeId() != null)
                .collect(Collectors.groupingBy(DailyEntry::getEmployeeId));

        for (Map.Entry<String, List<DailyEntry>> empEntry : byEmployee.entrySet()) {
            String empId = empEntry.getKey();
            List<DailyEntry> empEntries = empEntry.getValue();
            empEntries.sort(Comparator.comparing(DailyEntry::getDate));

            Employee emp = empMap.get(empId);
            String name = emp != null
                    ? (emp.getFirstName() != null ? emp.getFirstName() : "") + " " + (emp.getLastName() != null ? emp.getLastName() : "")
                    : empId;

            int consecutiveLate = 0;

            for (DailyEntry entry : empEntries) {
                double gross = calculateGrossHours(entry);
                String status = determineStatus(entry);

                // Overwork: >12h gross
                if (gross > 12) {
                    anomalies.add(new Anomaly("OVERWORK", "HIGH",
                            name + " logged " + String.format("%.1f", gross) + "h gross hours",
                            entry.getDate(), empId, name));
                }

                // Zero hours on a non-absent day
                if (entry.getTotalHours() <= 0 && !"ABSENT".equals(status) && !"LEAVE".equals(status)) {
                    anomalies.add(new Anomaly("ZERO_HOURS", "MEDIUM",
                            name + " has 0 effective hours but is not marked absent",
                            entry.getDate(), empId, name));
                }

                // Consecutive late tracking
                if ("LATE".equals(status)) {
                    consecutiveLate++;
                    if (consecutiveLate >= 3) {
                        anomalies.add(new Anomaly("CONSECUTIVE_LATE", "MEDIUM",
                                name + " has been late for " + consecutiveLate + " consecutive days",
                                entry.getDate(), empId, name));
                    }
                } else {
                    consecutiveLate = 0;
                }
            }
        }

        // Sort by severity then date
        anomalies.sort(Comparator.comparing(Anomaly::getSeverity)
                .thenComparing(Comparator.comparing(Anomaly::getDate).reversed()));

        // Cap at 50 anomalies to avoid response bloat
        if (anomalies.size() > 50) {
            anomalies = anomalies.subList(0, 50);
        }

        return anomalies;
    }

    // ===== UTILITY METHODS =====

    private Double calculateGrossHours(DailyEntry entry) {
        if (entry.getLoginTime() == null || entry.getLoginTime().trim().isEmpty()) return 0.0;
        if (entry.getLogoutTime() == null || entry.getLogoutTime().trim().isEmpty()) return 0.0;
        try {
            LocalTime login = LocalTime.parse(entry.getLoginTime().trim(), TIME_FORMAT);
            LocalTime logout = LocalTime.parse(entry.getLogoutTime().trim(), TIME_FORMAT);
            long minutes = Duration.between(login, logout).toMinutes();
            if (minutes < 0) minutes += 24 * 60;
            return Math.round(minutes / 60.0 * 100.0) / 100.0;
        } catch (DateTimeParseException e) {
            return entry.getTotalHours();
        }
    }

    private String determineStatus(DailyEntry entry) {
        if ("WFH".equalsIgnoreCase(entry.getWorkLocation())) return "WFH";
        if (entry.getLoginTime() == null || entry.getLoginTime().trim().isEmpty()) {
            return entry.getTotalHours() > 0 ? "ON_TIME" : "ABSENT";
        }
        try {
            LocalTime loginTime = LocalTime.parse(entry.getLoginTime().trim(), TIME_FORMAT);
            return loginTime.isAfter(LocalTime.of(9, 0)) ? "LATE" : "ON_TIME";
        } catch (DateTimeParseException e) {
            return "ON_TIME";
        }
    }

    private Integer parseLoginHour(String loginTimeStr) {
        if (loginTimeStr == null || loginTimeStr.trim().isEmpty()) return null;
        try {
            LocalTime lt = LocalTime.parse(loginTimeStr.trim(), TIME_FORMAT);
            return lt.getHour();
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private AttendanceAnalyticsDeepDTO.OvertimeIntelligence buildOvertimeIntelligence(List<AttendanceAnalyticsDeepDTO.EnrichedDailyLog> logs) {
        AttendanceAnalyticsDeepDTO.OvertimeIntelligence oi = new AttendanceAnalyticsDeepDTO.OvertimeIntelligence();
        double totalOvertime = 0.0;
        long fatigueDays = 0;

        for (AttendanceAnalyticsDeepDTO.EnrichedDailyLog log : logs) {
            if ("ABSENT".equals(log.getStatus()) || "LEAVE".equals(log.getStatus())) continue;
            
            // Fatigue risk if gross hours > 9.5
            if (log.getGrossHours() > 9.5) {
                fatigueDays++;
            }
            // Overtime based on effective hours > 8.0
            if (log.getEffectiveHours() > 8.0) {
                totalOvertime += (log.getEffectiveHours() - 8.0);
            }
        }

        oi.setTotalOvertimeHours(Math.round(totalOvertime * 100.0) / 100.0);
        oi.setFatigueDaysCount(fatigueDays);
        // Estimate cost at 500 per hour
        oi.setEstimatedOvertimeCost(Math.round((totalOvertime * 500.0) * 100.0) / 100.0);
        
        return oi;
    }
}
