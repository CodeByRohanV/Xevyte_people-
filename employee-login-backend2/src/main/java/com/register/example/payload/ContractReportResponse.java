package com.register.example.payload;

import java.time.LocalDate;

public class ContractReportResponse {

    // Customer
    private String customerName;
    private LocalDate msaStartDate;
    private LocalDate msaEndDate;

    // SOW
    private String sowName;
    private LocalDate sowStartDate;
    private LocalDate sowEndDate;
    private Integer sowTotalEffort; // PD
    private Double sowTotalCost;

    // Project
    private String projectName;
    private LocalDate projectStartDate;
    private LocalDate projectEndDate;
    private Double projectTotalCost;
    private Double projectTotalEffort;

    // Project Roles (IDs)
    private String managerId;
    private String reviewerId;
    private String hrId;
    private String financeId;
    private String adminId;

    // Allocation
    private String allocatedEmployeeId;
    private LocalDate allocationStartDate;
    private LocalDate allocationEndDate;

    // Getters and Setters
    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public LocalDate getMsaStartDate() {
        return msaStartDate;
    }

    public void setMsaStartDate(LocalDate msaStartDate) {
        this.msaStartDate = msaStartDate;
    }

    public LocalDate getMsaEndDate() {
        return msaEndDate;
    }

    public void setMsaEndDate(LocalDate msaEndDate) {
        this.msaEndDate = msaEndDate;
    }

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

    public Integer getSowTotalEffort() {
        return sowTotalEffort;
    }

    public void setSowTotalEffort(Integer sowTotalEffort) {
        this.sowTotalEffort = sowTotalEffort;
    }

    public Double getSowTotalCost() {
        return sowTotalCost;
    }

    public void setSowTotalCost(Double sowTotalCost) {
        this.sowTotalCost = sowTotalCost;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public LocalDate getProjectStartDate() {
        return projectStartDate;
    }

    public void setProjectStartDate(LocalDate projectStartDate) {
        this.projectStartDate = projectStartDate;
    }

    public LocalDate getProjectEndDate() {
        return projectEndDate;
    }

    public void setProjectEndDate(LocalDate projectEndDate) {
        this.projectEndDate = projectEndDate;
    }

    public Double getProjectTotalCost() {
        return projectTotalCost;
    }

    public void setProjectTotalCost(Double projectTotalCost) {
        this.projectTotalCost = projectTotalCost;
    }

    public Double getProjectTotalEffort() {
        return projectTotalEffort;
    }

    public void setProjectTotalEffort(Double projectTotalEffort) {
        this.projectTotalEffort = projectTotalEffort;
    }

    public String getManagerId() {
        return managerId;
    }

    public void setManagerId(String managerId) {
        this.managerId = managerId;
    }

    public String getReviewerId() {
        return reviewerId;
    }

    public void setReviewerId(String reviewerId) {
        this.reviewerId = reviewerId;
    }

    public String getHrId() {
        return hrId;
    }

    public void setHrId(String hrId) {
        this.hrId = hrId;
    }

    public String getFinanceId() {
        return financeId;
    }

    public void setFinanceId(String financeId) {
        this.financeId = financeId;
    }

    public String getAdminId() {
        return adminId;
    }

    public void setAdminId(String adminId) {
        this.adminId = adminId;
    }

    public String getAllocatedEmployeeId() {
        return allocatedEmployeeId;
    }

    public void setAllocatedEmployeeId(String allocatedEmployeeId) {
        this.allocatedEmployeeId = allocatedEmployeeId;
    }

    public LocalDate getAllocationStartDate() {
        return allocationStartDate;
    }

    public void setAllocationStartDate(LocalDate allocationStartDate) {
        this.allocationStartDate = allocationStartDate;
    }

    public LocalDate getAllocationEndDate() {
        return allocationEndDate;
    }

    public void setAllocationEndDate(LocalDate allocationEndDate) {
        this.allocationEndDate = allocationEndDate;
    }
}
