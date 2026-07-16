package com.register.example.payload;

import java.time.LocalDate;

public class FreezeRequest {
    private String managerId;
    private String employeeId;   // ✅ add employeeId
    private LocalDate startDate;
    private LocalDate endDate;

    // Getters & setters
    public String getManagerId() { return managerId; }
    public void setManagerId(String managerId) { this.managerId = managerId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
}
