package com.register.example.payload;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public class LeaveRequestDTO {

    private String employeeId;

    private String type;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate startDate;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate endDate;

    private Double totalDays;
    private Boolean halfDay = false;

    private String reason;
    private String status;
    private Long leaveRequestId;
    private String existingFileName;
    private String employeeName;
    private String optionalHolidayName; // ✅ For Optional Leave type

    // Getters and Setters
    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Double getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Double totalDays) {
        this.totalDays = totalDays;
    }

    public Boolean getHalfDay() {
        return halfDay;
    }

    public void setHalfDay(Boolean halfDay) {
        this.halfDay = halfDay;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getLeaveRequestId() {
        return leaveRequestId;
    }

    public void setLeaveRequestId(Long leaveRequestId) {
        this.leaveRequestId = leaveRequestId;
    }

    public String getExistingFileName() {
        return existingFileName;
    }

    public void setExistingFileName(String existingFileName) {
        this.existingFileName = existingFileName;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getOptionalHolidayName() {
        return optionalHolidayName;
    }

    public void setOptionalHolidayName(String optionalHolidayName) {
        this.optionalHolidayName = optionalHolidayName;
    }
}
