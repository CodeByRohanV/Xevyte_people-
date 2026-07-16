package com.register.example.dto;

public class AttendanceMetricsDTO {

    private Double averageEffectiveHours;
    private Double averageGrossHours;
    private Double onTimePercentage;
    private Long totalDaysTracked;
    private Boolean isBurnoutRisk;
    private Double trendDelta;
    private Double targetAdherence;

    public AttendanceMetricsDTO() {
    }

    public AttendanceMetricsDTO(Double averageEffectiveHours, Double averageGrossHours,
                                Double onTimePercentage, Long totalDaysTracked, Boolean isBurnoutRisk,
                                Double trendDelta, Double targetAdherence) {
        this.averageEffectiveHours = averageEffectiveHours;
        this.averageGrossHours = averageGrossHours;
        this.onTimePercentage = onTimePercentage;
        this.totalDaysTracked = totalDaysTracked;
        this.isBurnoutRisk = isBurnoutRisk;
        this.trendDelta = trendDelta;
        this.targetAdherence = targetAdherence;
    }

    public Double getAverageEffectiveHours() { return averageEffectiveHours; }
    public void setAverageEffectiveHours(Double averageEffectiveHours) { this.averageEffectiveHours = averageEffectiveHours; }

    public Double getAverageGrossHours() { return averageGrossHours; }
    public void setAverageGrossHours(Double averageGrossHours) { this.averageGrossHours = averageGrossHours; }

    public Double getOnTimePercentage() { return onTimePercentage; }
    public void setOnTimePercentage(Double onTimePercentage) { this.onTimePercentage = onTimePercentage; }

    public Long getTotalDaysTracked() { return totalDaysTracked; }
    public void setTotalDaysTracked(Long totalDaysTracked) { this.totalDaysTracked = totalDaysTracked; }

    public Boolean getIsBurnoutRisk() { return isBurnoutRisk; }
    public void setIsBurnoutRisk(Boolean isBurnoutRisk) { this.isBurnoutRisk = isBurnoutRisk; }

    public Double getTrendDelta() { return trendDelta; }
    public void setTrendDelta(Double trendDelta) { this.trendDelta = trendDelta; }

    public Double getTargetAdherence() { return targetAdherence; }
    public void setTargetAdherence(Double targetAdherence) { this.targetAdherence = targetAdherence; }
}
