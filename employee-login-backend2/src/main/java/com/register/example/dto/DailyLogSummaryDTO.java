package com.register.example.dto;

import java.time.LocalDate;

public class DailyLogSummaryDTO {
    
    private LocalDate date;
    private Double effectiveHours;
    private Double grossHours;
    private String status;

    // Constructors
    public DailyLogSummaryDTO() {
    }

    public DailyLogSummaryDTO(LocalDate date, Double effectiveHours, Double grossHours, String status) {
        this.date = date;
        this.effectiveHours = effectiveHours;
        this.grossHours = grossHours;
        this.status = status;
    }

    // Getters and Setters
    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Double getEffectiveHours() {
        return effectiveHours;
    }

    public void setEffectiveHours(Double effectiveHours) {
        this.effectiveHours = effectiveHours;
    }

    public Double getGrossHours() {
        return grossHours;
    }

    public void setGrossHours(Double grossHours) {
        this.grossHours = grossHours;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
