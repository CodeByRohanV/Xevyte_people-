package com.register.example.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "claim")
public class Claim extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

   @Column(name = "employee_id", length = 50)
private String employeeId;

@Column(name = "name", length = 50)
private String name;

    @Column(name = "expense_description", length = 255)
    private String expenseDescription;

@Column(name = "category", length = 50)
private String category;


    @Column(name = "amount")
    private Double amount;

    @Column(name = "expense_date")
    private LocalDate expenseDate; // Only date (no time)

    @Lob
    @Column(name = "receipt", columnDefinition = "MEDIUMBLOB")
    private byte[] receipt;

    @Column(name = "receipt_name")
    private String receiptName;

    @Column(name = "status", length = 50)
    private String status; // Pending, Approved, Rejected, Paid

    @Column(name = "next_approver", length = 50)
private String nextApprover;// Manager → Finance → HR

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "submitted_date")
    private Date submittedDate;

    // New fields to track reminder timestamps
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "manager_reminder_sent_at")
    private Date managerReminderSentAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "finance_reminder_sent_at")
    private Date financeReminderSentAt;

   @Column(name = "claim_group_id", length = 50)
private String claimGroupId; // Shared claim ID for bulk submissions (displayed to users)

    @Column(name = "assigned_manager_id", length = 50)
    private String assignedManagerId;

    @Column(name = "assigned_finance_id", length = 50)
    private String assignedFinanceId;

    @Column(name = "assigned_hr_id", length = 50)
    private String assignedHrId;

    // === Getters & Setters ===

    public String getAssignedManagerId() {
        return assignedManagerId;
    }

    public void setAssignedManagerId(String assignedManagerId) {
        this.assignedManagerId = assignedManagerId;
    }

    public String getAssignedFinanceId() {
        return assignedFinanceId;
    }

    public void setAssignedFinanceId(String assignedFinanceId) {
        this.assignedFinanceId = assignedFinanceId;
    }

    public String getAssignedHrId() {
        return assignedHrId;
    }

    public void setAssignedHrId(String assignedHrId) {
        this.assignedHrId = assignedHrId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNextApprover() {
        return nextApprover;
    }

    public void setNextApprover(String nextApprover) {
        this.nextApprover = nextApprover;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Date getSubmittedDate() {
        return submittedDate;
    }

    public void setSubmittedDate(Date submittedDate) {
        this.submittedDate = submittedDate;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Date getManagerReminderSentAt() {
        return managerReminderSentAt;
    }

    public void setManagerReminderSentAt(Date managerReminderSentAt) {
        this.managerReminderSentAt = managerReminderSentAt;
    }

    public Date getFinanceReminderSentAt() {
        return financeReminderSentAt;
    }

    public void setFinanceReminderSentAt(Date financeReminderSentAt) {
        this.financeReminderSentAt = financeReminderSentAt;
    }

    public String getClaimGroupId() {
        return claimGroupId;
    }

    public void setClaimGroupId(String claimGroupId) {
        this.claimGroupId = claimGroupId;
    }
}
