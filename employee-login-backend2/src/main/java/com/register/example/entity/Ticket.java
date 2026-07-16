package com.register.example.entity;

import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "helpdesk_ticket")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", length = 50)
    private String employeeId;

@Column(name = "category", length = 50)
private String category;
   
   @Column(name = "subcategory", length = 50)
private String subcategory;

    @Column(length = 500)
    private String issueSummary;

    @Lob
    private String detailedDescription;

    private Boolean ccToManager = false;

    // FILE DETAILS STORED IN DATABASE
    private String attachmentFileName;

    @Lob
    @Column(name = "attachment_data", columnDefinition = "LONGBLOB")
    private byte[] attachmentData;

    @Column(name = "status", length = 50)
private String status = "OPEN";

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt = new Date();

    @Column(name = "assigned_to", length = 50)
private String assignedTo;
    // =========================
    // NEW FIELDS ADDED
    // =========================
   @Column(name = "team_name", length = 50)
private String teamName;// HR_TEAM / FINANCE_TEAM / etc.

    @Column(name = "rejection_reason")
    private String rejectionReason; // Reason provided by manager
    // New field

    @Column(name = "transfer_reason")
    private String transferReason;

    @Column(name = "reassign_reason")
    private String reassignReason;

    @Column(name = "reopen_reason")
    private String reopenReason;

    @Column(name = "resend_reason")
    private String resendReason;


@Column(name = "ticket_type", length = 50)
private String ticketType;// NEW_TICKET / CHANGE_REQUEST

  @Column(name = "employee_name", length = 50)
private String employeeName;

    // New fields for tracking WHO performed the action
@Column(name = "reassigned_by", length = 50)
private String reassignedBy;

 @Column(name = "transferred_by", length = 50)
private String transferredBy;

 @Column(name = "assigned_approver_id", length = 50)
private String assignedApproverId;

    // -------- GETTERS & SETTERS ---------
    public String getAssignedApproverId() {
        return assignedApproverId;
    }

    public void setAssignedApproverId(String assignedApproverId) {
        this.assignedApproverId = assignedApproverId;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSubcategory() {
        return subcategory;
    }

    public void setSubcategory(String subcategory) {
        this.subcategory = subcategory;
    }

    public String getIssueSummary() {
        return issueSummary;
    }

    public void setIssueSummary(String issueSummary) {
        this.issueSummary = issueSummary;
    }

    public String getDetailedDescription() {
        return detailedDescription;
    }

    public void setDetailedDescription(String detailedDescription) {
        this.detailedDescription = detailedDescription;
    }

    public Boolean getCcToManager() {
        return ccToManager;
    }

    public void setCcToManager(Boolean ccToManager) {
        this.ccToManager = ccToManager;
    }

    public String getAttachmentFileName() {
        return attachmentFileName;
    }

    public void setAttachmentFileName(String attachmentFileName) {
        this.attachmentFileName = attachmentFileName;
    }

    public byte[] getAttachmentData() {
        return attachmentData;
    }

    public void setAttachmentData(byte[] attachmentData) {
        this.attachmentData = attachmentData;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getTransferReason() {
        return transferReason;
    }

    public void setTransferReason(String transferReason) {
        this.transferReason = transferReason;
    }

    public String getReassignReason() {
        return reassignReason;
    }

    public void setReassignReason(String reassignReason) {
        this.reassignReason = reassignReason;
    }

    public String getReopenReason() {
        return reopenReason;
    }

    public void setReopenReason(String reopenReason) {
        this.reopenReason = reopenReason;
    }

    public String getResendReason() {
        return resendReason;
    }

    public void setResendReason(String resendReason) {
        this.resendReason = resendReason;
    }

    public String getTicketType() {
        return ticketType;
    }

    public void setTicketType(String ticketType) {
        this.ticketType = ticketType;
    }

    public String getReassignedBy() {
        return reassignedBy;
    }

    public void setReassignedBy(String reassignedBy) {
        this.reassignedBy = reassignedBy;
    }

    public String getTransferredBy() {
        return transferredBy;
    }

    public void setTransferredBy(String transferredBy) {
        this.transferredBy = transferredBy;
    }
}
