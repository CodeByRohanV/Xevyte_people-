package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import com.register.example.entity.BaseEntity;

@Entity
@Table(name = "timesheets")
public class DailyEntry extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", length = 50)
private String employeeId;

    private LocalDate date;

    // ✅ Keep only the new fields
    @Column(name = "client_id", length = 50)
    private Long clientId;

    @Column(name = "client_name", length = 50)
    private String clientName;

    private Long projectId;

    @Column(name = "project_name", length = 50)
    private String projectName;

    @Column(name = "login_time", length = 50)
    private String loginTime;
    @Column(name = "logout_time", length = 50)
    private String logoutTime;
    private double totalHours;
    private String remarks;

    @Column(name = "work_location", length = 50)
    private String workLocation;

    @Column(name = "login_work_location", length = 50)
    private String loginWorkLocation;

    @Column(name = "logout_work_location", length = 50)
    private String logoutWorkLocation;

    @Column(name = "status", length = 50)
    private String status;

    private boolean frozen = false;

    // Getters & Setters
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
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
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

    public boolean isFrozen() {
        return frozen;
    }

    public void setFrozen(boolean frozen) {
        this.frozen = frozen;
    }

    // ✅ NEW Getters & Setters
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
}