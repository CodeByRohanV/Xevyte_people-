package com.register.example.payload;

import java.time.LocalDate;

public class ProjectCreateRequest {
    private Long sowId;
    private String projectName;   // NEW
    private LocalDate projectStartDate;
    private LocalDate projectEndDate;
    private Double totalEffort;
    private Double totalCost;
    private String manager;
    private String reviewer;
    private String hr;
    private String finance;
    private String admin;

    // Getters and setters
    public Long getSowId() { return sowId; }
    public void setSowId(Long sowId) { this.sowId = sowId; }

    public String getProjectName() {   // NEW
        return projectName;
    }

    public void setProjectName(String projectName) {  // NEW
        this.projectName = projectName;
    }

    public LocalDate getProjectStartDate() { return projectStartDate; }
    public void setProjectStartDate(LocalDate projectStartDate) { this.projectStartDate = projectStartDate; }

    public LocalDate getProjectEndDate() { return projectEndDate; }
    public void setProjectEndDate(LocalDate projectEndDate) { this.projectEndDate = projectEndDate; }

    public Double getTotalEffort() { return totalEffort; }
    public void setTotalEffort(Double totalEffort) { this.totalEffort = totalEffort; }

    public Double getTotalCost() { return totalCost; }
    public void setTotalCost(Double totalCost) { this.totalCost = totalCost; }

    public String getManager() { return manager; }
    public void setManager(String manager) { this.manager = manager; }

    public String getReviewer() { return reviewer; }
    public void setReviewer(String reviewer) { this.reviewer = reviewer; }

    public String getHr() { return hr; }
    public void setHr(String hr) { this.hr = hr; }

    public String getFinance() { return finance; }
    public void setFinance(String finance) { this.finance = finance; }

    public String getAdmin() { return admin; }
    public void setAdmin(String admin) { this.admin = admin; }
}
