package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "payroll_management")
public class PayrollManagement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

   @Column(name = "employee_id", length = 50)
private String employeeId;

@Column(name = "employee_name", length = 50)
private String employeeName;

    @Column(name = "payable_days")
    private Double payableDays;

   @Column(name = "payable_month", length = 50)
private String payableMonth;

    @Column(name = "lop_days")
    private Double lopDays;

    public PayrollManagement() {
        // Empty constructor required for JPA
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
