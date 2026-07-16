package com.register.example.payload;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class LeaveEncashmentPreviewDTO {
    private String employeeId;
    private String employeeName;
    private Long leaveTypeId;
    private String leaveType;
    private double availableBalance;
    private int maxEncashableLimit;
    private double requestedDays;
    private BigDecimal monthlyGross;
    private BigDecimal perDaySalary;
    private BigDecimal finalAmount;
    private String status; // ELIGIBLE, INELIGIBLE, PARTIAL
    private String reason;
    private String formula;

    // Getters and Setters
    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public Long getLeaveTypeId() {
        return leaveTypeId;
    }

    public void setLeaveTypeId(Long leaveTypeId) {
        this.leaveTypeId = leaveTypeId;
    }

    public String getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(String leaveType) {
        this.leaveType = leaveType;
    }

    public double getAvailableBalance() {
        return availableBalance;
    }

    public void setAvailableBalance(double availableBalance) {
        this.availableBalance = availableBalance;
    }

    public int getMaxEncashableLimit() {
        return maxEncashableLimit;
    }

    public void setMaxEncashableLimit(int maxEncashableLimit) {
        this.maxEncashableLimit = maxEncashableLimit;
    }

    public double getRequestedDays() {
        return requestedDays;
    }

    public void setRequestedDays(double requestedDays) {
        this.requestedDays = requestedDays;
    }

    public BigDecimal getMonthlyGross() {
        return monthlyGross;
    }

    public void setMonthlyGross(BigDecimal monthlyGross) {
        this.monthlyGross = monthlyGross;
    }

    public BigDecimal getPerDaySalary() {
        return perDaySalary;
    }

    public void setPerDaySalary(BigDecimal perDaySalary) {
        this.perDaySalary = perDaySalary;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(BigDecimal finalAmount) {
        this.finalAmount = finalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getFormula() {
        return formula;
    }

    public void setFormula(String formula) {
        this.formula = formula;
    }
}
