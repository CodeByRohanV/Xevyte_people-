package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "claim_draft")
public class ClaimDraft extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long expenseId;

    
@Column(name = "employee_id", length = 50)
private String employeeId;

@Column(name = "name", length = 50)
private String name;

    @JsonProperty("description")
    @Column(name = "expense_description", length = 255)
    private String expenseDescription;

@Column(name = "category", length = 50)
private String category;

    @Column(name = "amount")
    private Double amount;

    @JsonProperty("date")
    @Column(name = "expense_date")
    private LocalDate expenseDate;

    @Column(name = "business_purpose")
    private String businessPurpose;

    @Column(name = "additional_notes")
    private String additionalNotes;

    @Lob
    @Column(name = "receipt", columnDefinition = "MEDIUMBLOB")
    private byte[] receipt;

    @Column(name = "receipt_name")
    private String receiptName;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "last_saved_date")
    private Date lastSavedDate;

  
@Column(name = "claim_group_id", length = 50)
private String claimGroupId;


    // === Getters & Setters ===

    public String getClaimGroupId() {
        return claimGroupId;
    }

    public void setClaimGroupId(String claimGroupId) {
        this.claimGroupId = claimGroupId;
    }

    public Long getExpenseId() {
        return expenseId;
    }

    public void setExpenseId(Long expenseId) {
        this.expenseId = expenseId;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getExpenseDescription() {
        return expenseDescription;
    }

    public void setExpenseDescription(String expenseDescription) {
        this.expenseDescription = expenseDescription;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public void setExpenseDate(LocalDate expenseDate) {
        this.expenseDate = expenseDate;
    }

    public String getBusinessPurpose() {
        return businessPurpose;
    }

    public void setBusinessPurpose(String businessPurpose) {
        this.businessPurpose = businessPurpose;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    public byte[] getReceipt() {
        return receipt;
    }

    public void setReceipt(byte[] receipt) {
        this.receipt = receipt;
    }

    public String getReceiptName() {
        return receiptName;
    }

    public void setReceiptName(String receiptName) {
        this.receiptName = receiptName;
    }

    public Date getLastSavedDate() {
        return lastSavedDate;
    }

    public void setLastSavedDate(Date lastSavedDate) {
        this.lastSavedDate = lastSavedDate;
    }
}