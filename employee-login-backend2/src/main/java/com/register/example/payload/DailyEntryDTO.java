package com.register.example.payload;

import java.time.LocalDate;

public class DailyEntryDTO {

    private LocalDate date;

    private Long clientId;
    private String clientName;

    private Long projectId;
    private String projectName;

    private String loginTime;
    private String logoutTime;

    private double totalHours;
    private String remarks;
    private String workLocation;
    private String loginWorkLocation;
    private String logoutWorkLocation;
    private String status;

    public String getLoginWorkLocation() {
        return loginWorkLocation;
    }

    public void setLoginWorkLocation(String loginWorkLocation) {
        this.loginWorkLocation = loginWorkLocation;
    }

    public String getLogoutWorkLocation() {
        return logoutWorkLocation;
    }

    public void setLogoutWorkLocation(String logoutWorkLocation) {
        this.logoutWorkLocation = logoutWorkLocation;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // ✅ Added fields
    private String employeeId;
    private String employeeFirstName;
    private String employeeLastName;

    private String managerId;
    private String managerFirstName;
    private String managerLastName;
    private String hrId;
    private String hrFirstName;
    private String hrLastName;

    private Long id;

    // --- Getters & Setters ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getLoginTime() {
        return loginTime;
    }

    public void setLoginTime(String loginTime) {
        this.loginTime = loginTime;
    }

    public String getLogoutTime() {
        return logoutTime;
    }

    public void setLogoutTime(String logoutTime) {
        this.logoutTime = logoutTime;
    }

    public double getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(double totalHours) {
        this.totalHours = totalHours;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getWorkLocation() {
        return workLocation;
    }

    public void setWorkLocation(String workLocation) {
        this.workLocation = workLocation;
    }

    // ✅ New Getters & Setters

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getManagerId() {
        return managerId;
    }

    public void setManagerId(String managerId) {
        this.managerId = managerId;
    }

    public String getHrId() {
        return hrId;
    }

    public void setHrId(String hrId) {
        this.hrId = hrId;
    }

    public String getEmployeeFirstName() {
        return employeeFirstName;
    }

    public void setEmployeeFirstName(String employeeFirstName) {
        this.employeeFirstName = employeeFirstName;
    }

    public String getEmployeeLastName() {
        return employeeLastName;
    }

    public void setEmployeeLastName(String employeeLastName) {
        this.employeeLastName = employeeLastName;
    }

    public String getManagerFirstName() {
        return managerFirstName;
    }

    public void setManagerFirstName(String managerFirstName) {
        this.managerFirstName = managerFirstName;
    }

    public String getManagerLastName() {
        return managerLastName;
    }

    public void setManagerLastName(String managerLastName) {
        this.managerLastName = managerLastName;
    }

    public String getHrFirstName() {
        return hrFirstName;
    }

    public void setHrFirstName(String hrFirstName) {
        this.hrFirstName = hrFirstName;
    }

    public String getHrLastName() {
        return hrLastName;
    }

    public void setHrLastName(String hrLastName) {
        this.hrLastName = hrLastName;
    }

    private boolean frozen;

    public boolean isFrozen() {
        return frozen;
    }

    public void setFrozen(boolean frozen) {
        this.frozen = frozen;
    }
}
