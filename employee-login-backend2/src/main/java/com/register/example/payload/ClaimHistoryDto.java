package com.register.example.payload;

import java.time.LocalDate;
import java.util.Date;

public class ClaimHistoryDto {

    private Long id;
    private String employeeId;
    private String name;
    private String category;
    private Double amount;
    private LocalDate expenseDate;
    private Date submittedDate;
    private String status;
    private String receiptName;
    private String expenseDescription;
    private String rejectionReason;
    private String claimGroupId;

    public ClaimHistoryDto(
            Long id,
            String employeeId,
            String name,
            String category,
            Double amount,
            LocalDate expenseDate,
            Date submittedDate,
            String status,
            String receiptName,
            String expenseDescription,
            String rejectionReason,
            String claimGroupId) {
        this.id = id;
        this.employeeId = employeeId;
        this.name = name;
        this.category = category;
        this.amount = amount;
        this.expenseDate = expenseDate;
        this.submittedDate = submittedDate;
        this.status = status;
        this.receiptName = receiptName;
        this.expenseDescription = expenseDescription;
        this.rejectionReason = rejectionReason;
        this.claimGroupId = claimGroupId;
    }

    // 👉 getters only (NO setters needed)
    public Long getId() {
        return id;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public Double getAmount() {
        return amount;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public Date getSubmittedDate() {
        return submittedDate;
    }

    public String getStatus() {
        return status;
    }

    public String getReceiptName() {
        return receiptName;
    }

    public String getExpenseDescription() {
        return expenseDescription;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public String getClaimGroupId() {
        return claimGroupId;
    }
}
