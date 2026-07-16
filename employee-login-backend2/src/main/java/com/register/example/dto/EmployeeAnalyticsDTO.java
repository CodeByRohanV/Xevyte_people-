package com.register.example.dto;

import java.util.List;

public class EmployeeAnalyticsDTO {
    
    private Double averageHoursPerDay;
    private Double onTimePercentage;
    private List<DailyLogSummaryDTO> dailyLogs;
    private Double approvedLeaveDays;
    private Boolean isBurnoutRisk;

    // Constructors
    public EmployeeAnalyticsDTO() {
    }

    public EmployeeAnalyticsDTO(Double averageHoursPerDay, Double onTimePercentage,
                                List<DailyLogSummaryDTO> dailyLogs, Double approvedLeaveDays,
                                Boolean isBurnoutRisk) {
        this.averageHoursPerDay = averageHoursPerDay;
        this.onTimePercentage = onTimePercentage;
        this.dailyLogs = dailyLogs;
        this.approvedLeaveDays = approvedLeaveDays;
        this.isBurnoutRisk = isBurnoutRisk;
    }

    // Getters and Setters
    public Double getAverageHoursPerDay() {
        return averageHoursPerDay;
    }

    public void setAverageHoursPerDay(Double averageHoursPerDay) {
        this.averageHoursPerDay = averageHoursPerDay;
    }

    public Double getOnTimePercentage() {
        return onTimePercentage;
    }

    public void setOnTimePercentage(Double onTimePercentage) {
        this.onTimePercentage = onTimePercentage;
    }

    public List<DailyLogSummaryDTO> getDailyLogs() {
        return dailyLogs;
    }

    public void setDailyLogs(List<DailyLogSummaryDTO> dailyLogs) {
        this.dailyLogs = dailyLogs;
    }

    public Double getApprovedLeaveDays() {
        return approvedLeaveDays;
    }

    public void setApprovedLeaveDays(Double approvedLeaveDays) {
        this.approvedLeaveDays = approvedLeaveDays;
    }

    public Boolean getIsBurnoutRisk() {
        return isBurnoutRisk;
    }

    public void setIsBurnoutRisk(Boolean isBurnoutRisk) {
        this.isBurnoutRisk = isBurnoutRisk;
    }
}
