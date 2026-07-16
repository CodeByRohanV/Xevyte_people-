package com.register.example.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Comprehensive DTO for the deep Attendance Analytics dashboard.
 * All sections are populated from real DailyEntry + Employee data.
 */
public class AttendanceAnalyticsDeepDTO {

    private KpiSummary kpis;
    private List<EnrichedDailyLog> dailyLogs;
    private PunctualityAnalysis punctuality;
    private HoursDistribution hoursDistribution;
    private List<WeekdayAverage> weekdayAverages;
    private List<MonthlyAggregate> monthlyAggregates;
    private LocationAnalysis locationAnalysis;
    private List<DepartmentBreakdown> departmentBreakdown;
    private List<Anomaly> anomalies;
    private List<CalendarDayData> calendarData;
    private List<DailyAggregate> dailyTrend;
    private List<EmployeeRanking> allEmployees;
    private OvertimeIntelligence overtimeIntelligence;

    public AttendanceAnalyticsDeepDTO() {}

    // ===== GETTERS & SETTERS =====

    public KpiSummary getKpis() { return kpis; }
    public void setKpis(KpiSummary kpis) { this.kpis = kpis; }

    public List<EnrichedDailyLog> getDailyLogs() { return dailyLogs; }
    public void setDailyLogs(List<EnrichedDailyLog> dailyLogs) { this.dailyLogs = dailyLogs; }

    public PunctualityAnalysis getPunctuality() { return punctuality; }
    public void setPunctuality(PunctualityAnalysis punctuality) { this.punctuality = punctuality; }

    public HoursDistribution getHoursDistribution() { return hoursDistribution; }
    public void setHoursDistribution(HoursDistribution hoursDistribution) { this.hoursDistribution = hoursDistribution; }

    public List<WeekdayAverage> getWeekdayAverages() { return weekdayAverages; }
    public void setWeekdayAverages(List<WeekdayAverage> weekdayAverages) { this.weekdayAverages = weekdayAverages; }

    public List<MonthlyAggregate> getMonthlyAggregates() { return monthlyAggregates; }
    public void setMonthlyAggregates(List<MonthlyAggregate> monthlyAggregates) { this.monthlyAggregates = monthlyAggregates; }

    public LocationAnalysis getLocationAnalysis() { return locationAnalysis; }
    public void setLocationAnalysis(LocationAnalysis locationAnalysis) { this.locationAnalysis = locationAnalysis; }

    public List<DepartmentBreakdown> getDepartmentBreakdown() { return departmentBreakdown; }
    public void setDepartmentBreakdown(List<DepartmentBreakdown> departmentBreakdown) { this.departmentBreakdown = departmentBreakdown; }

    public List<Anomaly> getAnomalies() { return anomalies; }
    public void setAnomalies(List<Anomaly> anomalies) { this.anomalies = anomalies; }

    public List<CalendarDayData> getCalendarData() { return calendarData; }
    public void setCalendarData(List<CalendarDayData> calendarData) { this.calendarData = calendarData; }

    public List<DailyAggregate> getDailyTrend() { return dailyTrend; }
    public void setDailyTrend(List<DailyAggregate> dailyTrend) { this.dailyTrend = dailyTrend; }

    public List<EmployeeRanking> getAllEmployees() { return allEmployees; }
    public void setAllEmployees(List<EmployeeRanking> allEmployees) { this.allEmployees = allEmployees; }

    public OvertimeIntelligence getOvertimeIntelligence() { return overtimeIntelligence; }
    public void setOvertimeIntelligence(OvertimeIntelligence overtimeIntelligence) { this.overtimeIntelligence = overtimeIntelligence; }

    // ===== INNER CLASSES =====

    /** Executive KPI summary */
    public static class KpiSummary {
        private long totalDaysTracked;
        private double avgEffectiveHours;
        private double avgGrossHours;
        private double onTimePercent;
        private double latePercent;
        private double wfhPercent;
        private long absentDays;
        private boolean burnoutRisk;
        private Double trendDelta;        // % change vs previous period
        private double targetAdherence;   // % of 8-hour target

        private double absenteeismTrend;
        private double consistencyScore;

        public KpiSummary() {}

        public long getTotalDaysTracked() { return totalDaysTracked; }
        public void setTotalDaysTracked(long totalDaysTracked) { this.totalDaysTracked = totalDaysTracked; }

        public double getAvgEffectiveHours() { return avgEffectiveHours; }
        public void setAvgEffectiveHours(double avgEffectiveHours) { this.avgEffectiveHours = avgEffectiveHours; }

        public double getAvgGrossHours() { return avgGrossHours; }
        public void setAvgGrossHours(double avgGrossHours) { this.avgGrossHours = avgGrossHours; }

        public double getOnTimePercent() { return onTimePercent; }
        public void setOnTimePercent(double onTimePercent) { this.onTimePercent = onTimePercent; }

        public double getLatePercent() { return latePercent; }
        public void setLatePercent(double latePercent) { this.latePercent = latePercent; }

        public double getWfhPercent() { return wfhPercent; }
        public void setWfhPercent(double wfhPercent) { this.wfhPercent = wfhPercent; }

        public long getAbsentDays() { return absentDays; }
        public void setAbsentDays(long absentDays) { this.absentDays = absentDays; }

        public boolean isBurnoutRisk() { return burnoutRisk; }
        public void setBurnoutRisk(boolean burnoutRisk) { this.burnoutRisk = burnoutRisk; }

        public Double getTrendDelta() { return trendDelta; }
        public void setTrendDelta(Double trendDelta) { this.trendDelta = trendDelta; }

        public double getTargetAdherence() { return targetAdherence; }
        public void setTargetAdherence(double targetAdherence) { this.targetAdherence = targetAdherence; }

        public double getAbsenteeismTrend() { return absenteeismTrend; }
        public void setAbsenteeismTrend(double absenteeismTrend) { this.absenteeismTrend = absenteeismTrend; }

        public double getConsistencyScore() { return consistencyScore; }
        public void setConsistencyScore(double consistencyScore) { this.consistencyScore = consistencyScore; }
    }

    public static class EmployeeRanking {
        private String employeeId;
        private String employeeName;
        private double punctualityScore;
        private double avgEffectiveHours;
        private int absences;
        private String designation;
        private double healthScore;
        
        public EmployeeRanking() {}

        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

        public double getPunctualityScore() { return punctualityScore; }
        public void setPunctualityScore(double punctualityScore) { this.punctualityScore = punctualityScore; }

        public double getAvgEffectiveHours() { return avgEffectiveHours; }
        public void setAvgEffectiveHours(double avgEffectiveHours) { this.avgEffectiveHours = avgEffectiveHours; }

        public int getAbsences() { return absences; }
        public void setAbsences(int absences) { this.absences = absences; }

        public String getDesignation() { return designation; }
        public void setDesignation(String designation) { this.designation = designation; }

        public double getHealthScore() { return healthScore; }
        public void setHealthScore(double healthScore) { this.healthScore = healthScore; }
    }

    public static class DailyAggregate {
        private String date;
        private double effectiveHours;
        private double grossHours;

        public DailyAggregate() {}
        public DailyAggregate(String date, double effectiveHours, double grossHours) {
            this.date = date;
            this.effectiveHours = effectiveHours;
            this.grossHours = grossHours;
        }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public double getEffectiveHours() { return effectiveHours; }
        public void setEffectiveHours(double effectiveHours) { this.effectiveHours = effectiveHours; }
        public double getGrossHours() { return grossHours; }
        public void setGrossHours(double grossHours) { this.grossHours = grossHours; }
    }

    /** Enriched daily log entry for charts */
    public static class EnrichedDailyLog {
        private LocalDate date;
        private String dayOfWeek;
        private int weekNumber;
        private double effectiveHours;
        private double grossHours;
        private String status;
        private String loginTime;
        private String logoutTime;
        private Integer loginHour;
        private String workLocation;
        private String employeeId;
        private String employeeName;
        private String department;

        public EnrichedDailyLog() {}

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public String getDayOfWeek() { return dayOfWeek; }
        public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

        public int getWeekNumber() { return weekNumber; }
        public void setWeekNumber(int weekNumber) { this.weekNumber = weekNumber; }

        public double getEffectiveHours() { return effectiveHours; }
        public void setEffectiveHours(double effectiveHours) { this.effectiveHours = effectiveHours; }

        public double getGrossHours() { return grossHours; }
        public void setGrossHours(double grossHours) { this.grossHours = grossHours; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getLoginTime() { return loginTime; }
        public void setLoginTime(String loginTime) { this.loginTime = loginTime; }

        public String getLogoutTime() { return logoutTime; }
        public void setLogoutTime(String logoutTime) { this.logoutTime = logoutTime; }

        public Integer getLoginHour() { return loginHour; }
        public void setLoginHour(Integer loginHour) { this.loginHour = loginHour; }

        public String getWorkLocation() { return workLocation; }
        public void setWorkLocation(String workLocation) { this.workLocation = workLocation; }

        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
    }

    /** Punctuality analysis breakdown */
    public static class PunctualityAnalysis {
        private long onTimeCount;
        private long lateCount;
        private long wfhCount;
        private long absentCount;
        private List<TimeBucket> lateArrivalBuckets;
        private List<WeeklyPunctuality> weeklyTrend;

        public PunctualityAnalysis() {}

        public long getOnTimeCount() { return onTimeCount; }
        public void setOnTimeCount(long onTimeCount) { this.onTimeCount = onTimeCount; }

        public long getLateCount() { return lateCount; }
        public void setLateCount(long lateCount) { this.lateCount = lateCount; }

        public long getWfhCount() { return wfhCount; }
        public void setWfhCount(long wfhCount) { this.wfhCount = wfhCount; }

        public long getAbsentCount() { return absentCount; }
        public void setAbsentCount(long absentCount) { this.absentCount = absentCount; }

        public List<TimeBucket> getLateArrivalBuckets() { return lateArrivalBuckets; }
        public void setLateArrivalBuckets(List<TimeBucket> lateArrivalBuckets) { this.lateArrivalBuckets = lateArrivalBuckets; }

        public List<WeeklyPunctuality> getWeeklyTrend() { return weeklyTrend; }
        public void setWeeklyTrend(List<WeeklyPunctuality> weeklyTrend) { this.weeklyTrend = weeklyTrend; }
    }

    /** Time bucket for late arrival histogram */
    public static class TimeBucket {
        private String label;
        private long count;

        public TimeBucket() {}
        public TimeBucket(String label, long count) { this.label = label; this.count = count; }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    /** Weekly punctuality trend data point */
    public static class WeeklyPunctuality {
        private String weekLabel;
        private double onTimePercent;

        public WeeklyPunctuality() {}
        public WeeklyPunctuality(String weekLabel, double onTimePercent) { this.weekLabel = weekLabel; this.onTimePercent = onTimePercent; }

        public String getWeekLabel() { return weekLabel; }
        public void setWeekLabel(String weekLabel) { this.weekLabel = weekLabel; }

        public double getOnTimePercent() { return onTimePercent; }
        public void setOnTimePercent(double onTimePercent) { this.onTimePercent = onTimePercent; }
    }

    /** Hours distribution histogram */
    public static class HoursDistribution {
        private List<HoursBucket> buckets;

        public HoursDistribution() {}

        public List<HoursBucket> getBuckets() { return buckets; }
        public void setBuckets(List<HoursBucket> buckets) { this.buckets = buckets; }
    }

    /** Individual hours bucket */
    public static class HoursBucket {
        private String label;
        private long count;
        private double percentage;

        public HoursBucket() {}
        public HoursBucket(String label, long count, double percentage) {
            this.label = label; this.count = count; this.percentage = percentage;
        }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }

        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }
    }

    /** Weekday average data point */
    public static class WeekdayAverage {
        private String day;
        private double avgEffective;
        private double avgGross;

        public WeekdayAverage() {}
        public WeekdayAverage(String day, double avgEffective, double avgGross) {
            this.day = day; this.avgEffective = avgEffective; this.avgGross = avgGross;
        }

        public String getDay() { return day; }
        public void setDay(String day) { this.day = day; }

        public double getAvgEffective() { return avgEffective; }
        public void setAvgEffective(double avgEffective) { this.avgEffective = avgEffective; }

        public double getAvgGross() { return avgGross; }
        public void setAvgGross(double avgGross) { this.avgGross = avgGross; }
    }

    /** Monthly aggregate data point */
    public static class MonthlyAggregate {
        private String month;
        private double avgEffective;
        private double avgGross;
        private double onTimePercent;
        private long totalEntries;

        public MonthlyAggregate() {}

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }

        public double getAvgEffective() { return avgEffective; }
        public void setAvgEffective(double avgEffective) { this.avgEffective = avgEffective; }

        public double getAvgGross() { return avgGross; }
        public void setAvgGross(double avgGross) { this.avgGross = avgGross; }

        public double getOnTimePercent() { return onTimePercent; }
        public void setOnTimePercent(double onTimePercent) { this.onTimePercent = onTimePercent; }

        public long getTotalEntries() { return totalEntries; }
        public void setTotalEntries(long totalEntries) { this.totalEntries = totalEntries; }
    }

    /** Location/work-mode analysis */
    public static class LocationAnalysis {
        private long officeCount;
        private long wfhCount;
        private long otherCount;
        private double wfhPercent;
        private List<WeeklyLocationBreakdown> weeklyBreakdown;

        public LocationAnalysis() {}

        public long getOfficeCount() { return officeCount; }
        public void setOfficeCount(long officeCount) { this.officeCount = officeCount; }

        public long getWfhCount() { return wfhCount; }
        public void setWfhCount(long wfhCount) { this.wfhCount = wfhCount; }

        public long getOtherCount() { return otherCount; }
        public void setOtherCount(long otherCount) { this.otherCount = otherCount; }

        public double getWfhPercent() { return wfhPercent; }
        public void setWfhPercent(double wfhPercent) { this.wfhPercent = wfhPercent; }

        public List<WeeklyLocationBreakdown> getWeeklyBreakdown() { return weeklyBreakdown; }
        public void setWeeklyBreakdown(List<WeeklyLocationBreakdown> weeklyBreakdown) { this.weeklyBreakdown = weeklyBreakdown; }
    }

    /** Weekly location breakdown */
    public static class WeeklyLocationBreakdown {
        private String weekLabel;
        private long office;
        private long wfh;
        private long other;

        public WeeklyLocationBreakdown() {}
        public WeeklyLocationBreakdown(String weekLabel, long office, long wfh, long other) {
            this.weekLabel = weekLabel; this.office = office; this.wfh = wfh; this.other = other;
        }

        public String getWeekLabel() { return weekLabel; }
        public void setWeekLabel(String weekLabel) { this.weekLabel = weekLabel; }

        public long getOffice() { return office; }
        public void setOffice(long office) { this.office = office; }

        public long getWfh() { return wfh; }
        public void setWfh(long wfh) { this.wfh = wfh; }

        public long getOther() { return other; }
        public void setOther(long other) { this.other = other; }
    }

    /** Department-level breakdown (org-wide view) */
    public static class DepartmentBreakdown {
        private String department;
        private long employeeCount;
        private double avgEffectiveHours;
        private double onTimePercent;
        private double latePercent;
        private long absentCount;
        private long totalEntries;

        public DepartmentBreakdown() {}

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }

        public long getEmployeeCount() { return employeeCount; }
        public void setEmployeeCount(long employeeCount) { this.employeeCount = employeeCount; }

        public double getAvgEffectiveHours() { return avgEffectiveHours; }
        public void setAvgEffectiveHours(double avgEffectiveHours) { this.avgEffectiveHours = avgEffectiveHours; }

        public double getOnTimePercent() { return onTimePercent; }
        public void setOnTimePercent(double onTimePercent) { this.onTimePercent = onTimePercent; }

        public double getLatePercent() { return latePercent; }
        public void setLatePercent(double latePercent) { this.latePercent = latePercent; }

        public long getAbsentCount() { return absentCount; }
        public void setAbsentCount(long absentCount) { this.absentCount = absentCount; }

        public long getTotalEntries() { return totalEntries; }
        public void setTotalEntries(long totalEntries) { this.totalEntries = totalEntries; }
    }

    /** Detected anomaly */
    public static class Anomaly {
        private String type;        // OVERWORK, ZERO_HOURS, CONSECUTIVE_LATE, ATTENDANCE_GAP
        private String severity;    // HIGH, MEDIUM, LOW
        private String message;
        private LocalDate date;
        private String employeeId;
        private String employeeName;

        public Anomaly() {}
        public Anomaly(String type, String severity, String message, LocalDate date, String employeeId, String employeeName) {
            this.type = type; this.severity = severity; this.message = message;
            this.date = date; this.employeeId = employeeId; this.employeeName = employeeName;
        }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    }

    /** Calendar heatmap data point */
    public static class CalendarDayData {
        private LocalDate date;
        private double effectiveHours;
        private double grossHours;
        private String status;
        private String loginTime;
        private String logoutTime;

        public CalendarDayData() {}

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public double getEffectiveHours() { return effectiveHours; }
        public void setEffectiveHours(double effectiveHours) { this.effectiveHours = effectiveHours; }

        public double getGrossHours() { return grossHours; }
        public void setGrossHours(double grossHours) { this.grossHours = grossHours; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getLoginTime() { return loginTime; }
        public void setLoginTime(String loginTime) { this.loginTime = loginTime; }

        public String getLogoutTime() { return logoutTime; }
        public void setLogoutTime(String logoutTime) { this.logoutTime = logoutTime; }
    }

    /** Overtime intelligence and fatigue risk tracking */
    public static class OvertimeIntelligence {
        private double totalOvertimeHours;
        private long fatigueDaysCount;
        private double estimatedOvertimeCost;

        public OvertimeIntelligence() {}

        public double getTotalOvertimeHours() { return totalOvertimeHours; }
        public void setTotalOvertimeHours(double totalOvertimeHours) { this.totalOvertimeHours = totalOvertimeHours; }

        public long getFatigueDaysCount() { return fatigueDaysCount; }
        public void setFatigueDaysCount(long fatigueDaysCount) { this.fatigueDaysCount = fatigueDaysCount; }

        public double getEstimatedOvertimeCost() { return estimatedOvertimeCost; }
        public void setEstimatedOvertimeCost(double estimatedOvertimeCost) { this.estimatedOvertimeCost = estimatedOvertimeCost; }
    }
}
