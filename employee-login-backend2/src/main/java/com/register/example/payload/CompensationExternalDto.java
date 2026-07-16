package com.register.example.payload;

import java.time.LocalDate;

/**
 * DTO for Compensation Details data exposed to external applications
 */
public class CompensationExternalDto {

    private Long id;
    private String employeeId;
    private Double currentFixedCtc;
    private Double currentVariablePay;
    private Double proposedFixedCtc;
    private Double proposedVariablePay;
    private LocalDate effectiveDate;
    private Integer year;
    private Double hikePercentage;
    private Double fixedHikePercentage;
    private Double variableHikePercentage;
    private Double totalProposedCtc;
    private String approvalStatus;
    private String revisionType;
    private String proposedDesignation;

    // Constructors
    public CompensationExternalDto() {
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

    public Double getCurrentFixedCtc() {
        return currentFixedCtc;
    }

    public void setCurrentFixedCtc(Double currentFixedCtc) {
        this.currentFixedCtc = currentFixedCtc;
    }

    public Double getCurrentVariablePay() {
        return currentVariablePay;
    }

    public void setCurrentVariablePay(Double currentVariablePay) {
        this.currentVariablePay = currentVariablePay;
    }

    public Double getProposedFixedCtc() {
        return proposedFixedCtc;
    }

    public void setProposedFixedCtc(Double proposedFixedCtc) {
        this.proposedFixedCtc = proposedFixedCtc;
    }

    public Double getProposedVariablePay() {
        return proposedVariablePay;
    }

    public void setProposedVariablePay(Double proposedVariablePay) {
        this.proposedVariablePay = proposedVariablePay;
    }

    public LocalDate getEffectiveDate() {
        return effectiveDate;
    }

    public void setEffectiveDate(LocalDate effectiveDate) {
        this.effectiveDate = effectiveDate;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Double getHikePercentage() {
        return hikePercentage;
    }

    public void setHikePercentage(Double hikePercentage) {
        this.hikePercentage = hikePercentage;
    }

    public Double getFixedHikePercentage() {
        return fixedHikePercentage;
    }

    public void setFixedHikePercentage(Double fixedHikePercentage) {
        this.fixedHikePercentage = fixedHikePercentage;
    }

    public Double getVariableHikePercentage() {
        return variableHikePercentage;
    }

    public void setVariableHikePercentage(Double variableHikePercentage) {
        this.variableHikePercentage = variableHikePercentage;
    }

    public Double getTotalProposedCtc() {
        return totalProposedCtc;
    }

    public void setTotalProposedCtc(Double totalProposedCtc) {
        this.totalProposedCtc = totalProposedCtc;
    }

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getRevisionType() {
        return revisionType;
    }

    public void setRevisionType(String revisionType) {
        this.revisionType = revisionType;
    }

    public String getProposedDesignation() {
        return proposedDesignation;
    }

    public void setProposedDesignation(String proposedDesignation) {
        this.proposedDesignation = proposedDesignation;
    }
}
