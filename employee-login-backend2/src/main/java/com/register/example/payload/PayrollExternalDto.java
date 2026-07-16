package com.register.example.payload;

/**
 * DTO for Payroll Management data exposed to external applications
 */
public class PayrollExternalDto {

    private Long id;
    private String employeeId;
    private String employeeName;
    private Double payableDays;
    private String payableMonth;
    private Double lopDays;

    // Constructors
    public PayrollExternalDto() {
        // Empty constructor required for deserialization
    }

    // Getters and Setters
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

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public Double getPayableDays() {
        return payableDays;
    }

    public void setPayableDays(Double payableDays) {
        this.payableDays = payableDays;
    }

    public String getPayableMonth() {
        return payableMonth;
    }

    public void setPayableMonth(String payableMonth) {
        this.payableMonth = payableMonth;
    }

    public Double getLopDays() {
        return lopDays;
    }

    public void setLopDays(Double lopDays) {
        this.lopDays = lopDays;
    }
}
