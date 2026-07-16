package com.register.example.payload;

import java.time.LocalDate;

public class EmployeeAllocationResponse {

    private Long projectId;
    private String projectName;
    private String customerName;

    private LocalDate startDate;
    private LocalDate endDate;

    private String employeeId;
    private String employeeFirstName;
    private String employeeLastName;

    // ✅ Manager
    private String managerId;
    private String managerFirstName;
    private String managerLastName;

    // ✅ HR
    private String hrId;
    private String hrFirstName;
    private String hrLastName;

    // ✅ Reviewer
    private String reviewerId;
    private String reviewerFirstName;
    private String reviewerLastName;

    // ✅ Finance
    private String financeId;
    private String financeFirstName;
    private String financeLastName;

    // ✅ Admin
    private String adminId;
    private String adminFirstName;
    private String adminLastName;

    private String allocationStatus;  // CURRENT / PAST / NEXT

    // ---------------- GETTERS & SETTERS ----------------

    public String getAllocationStatus() { return allocationStatus; }
    public void setAllocationStatus(String allocationStatus) { this.allocationStatus = allocationStatus; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getManagerId() { return managerId; }
    public void setManagerId(String managerId) { this.managerId = managerId; }

    public String getManagerFirstName() { return managerFirstName; }
    public void setManagerFirstName(String managerFirstName) { this.managerFirstName = managerFirstName; }

    public String getManagerLastName() { return managerLastName; }
    public void setManagerLastName(String managerLastName) { this.managerLastName = managerLastName; }

    public String getHrId() { return hrId; }
    public void setHrId(String hrId) { this.hrId = hrId; }

    public String getHrFirstName() { return hrFirstName; }
    public void setHrFirstName(String hrFirstName) { this.hrFirstName = hrFirstName; }

    public String getHrLastName() { return hrLastName; }
    public void setHrLastName(String hrLastName) { this.hrLastName = hrLastName; }

    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }

    public String getReviewerFirstName() { return reviewerFirstName; }
    public void setReviewerFirstName(String reviewerFirstName) { this.reviewerFirstName = reviewerFirstName; }

    public String getReviewerLastName() { return reviewerLastName; }
    public void setReviewerLastName(String reviewerLastName) { this.reviewerLastName = reviewerLastName; }

    public String getFinanceId() { return financeId; }
    public void setFinanceId(String financeId) { this.financeId = financeId; }

    public String getFinanceFirstName() { return financeFirstName; }
    public void setFinanceFirstName(String financeFirstName) { this.financeFirstName = financeFirstName; }

    public String getFinanceLastName() { return financeLastName; }
    public void setFinanceLastName(String financeLastName) { this.financeLastName = financeLastName; }

    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public String getAdminFirstName() { return adminFirstName; }
    public void setAdminFirstName(String adminFirstName) { this.adminFirstName = adminFirstName; }

    public String getAdminLastName() { return adminLastName; }
    public void setAdminLastName(String adminLastName) { this.adminLastName = adminLastName; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getEmployeeFirstName() { return employeeFirstName; }
    public void setEmployeeFirstName(String employeeFirstName) { this.employeeFirstName = employeeFirstName; }

    public String getEmployeeLastName() { return employeeLastName; }
    public void setEmployeeLastName(String employeeLastName) { this.employeeLastName = employeeLastName; }
}