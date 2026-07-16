package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "leave_balances")
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", length = 50)
    private String employeeId;

    @Column(name = "type", length = 50)
    private String type;

    private Double granted;
    private Double consumed;
    private Double balance;

    private int year;
    private int month;
    private Double lopCount;
    private Double encashedCount = 0.0;

    // ✅ NEW: Tracking for history and manual overrides
    private Double carriedForward = 0.0;
    private Double lapsed = 0.0;
    private Double manualAdjustment = 0.0; // Added for manual corrections

    // Default constructor
    public LeaveBalance() {
    }

    // Constructor with all fields
    public LeaveBalance(String employeeId, String type, Double granted, Double consumed, Double balance, int year,
            int month) {
        this.employeeId = employeeId;
        this.type = type;
        this.granted = granted;
        this.consumed = consumed;
        this.balance = balance;
        this.year = year;
        this.month = month;
    }

    public Double getLopCount() {
        return lopCount;
    }

    public void setLopCount(Double lopCount) {
        this.lopCount = lopCount;
    }

    public Double getEncashedCount() {
        return encashedCount;
    }

    public void setEncashedCount(Double encashedCount) {
        this.encashedCount = encashedCount;
    }

    public Double getCarriedForward() {
        return carriedForward;
    }

    public void setCarriedForward(Double carriedForward) {
        this.carriedForward = carriedForward;
    }

    public Double getLapsed() {
        return lapsed;
    }

    public void setLapsed(Double lapsed) {
        this.lapsed = lapsed;
    }

    public Double getManualAdjustment() {
        return manualAdjustment != null ? manualAdjustment : 0.0;
    }

    public void setManualAdjustment(Double manualAdjustment) {
        this.manualAdjustment = manualAdjustment;
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Double getGranted() {
        return granted;
    }

    public void setGranted(Double granted) {
        this.granted = granted;
    }

    public Double getConsumed() {
        return consumed;
    }

    public void setConsumed(Double consumed) {
        this.consumed = consumed;
    }

    public Double getBalance() {
        return balance;
    }

    public void setBalance(Double balance) {
        this.balance = balance;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }
}
