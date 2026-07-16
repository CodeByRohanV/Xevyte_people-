package com.register.example.payload;

import java.time.LocalDate;

public class SowCreateRequest {

    private String sowName; // ✅ New field added
    private LocalDate sowStartDate;
    private LocalDate sowEndDate;
    private int totalEffort;   // in PD (Person Days)
    private double totalCost;
    private Long customerId;

    // Getters and Setters

    public String getSowName() {
        return sowName;
    }

    public void setSowName(String sowName) {
        this.sowName = sowName;
    }

    public LocalDate getSowStartDate() {
        return sowStartDate;
    }

    public void setSowStartDate(LocalDate sowStartDate) {
        this.sowStartDate = sowStartDate;
    }

    public LocalDate getSowEndDate() {
        return sowEndDate;
    }

    public void setSowEndDate(LocalDate sowEndDate) {
        this.sowEndDate = sowEndDate;
    }

    public int getTotalEffort() {
        return totalEffort;
    }

    public void setTotalEffort(int totalEffort) {
        this.totalEffort = totalEffort;
    }

    public double getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(double totalCost) {
        this.totalCost = totalCost;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }
}
