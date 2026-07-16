package com.register.example.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.register.example.entity.BaseEntity;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", length = 50)
private String employeeId;

@Column(name = "employee_name", length = 50)
private String employeeName;

   @Column(name = "type", length = 50)
private String type;

    // ✅ Changed to LocalDate
    private LocalDate startDate;

    // ✅ Changed to LocalDate
    private LocalDate endDate;

    private Double totalDays;
    private String reason;
   
@Column(name = "status", length = 50)
private String status;
    private String rejectionReason;
    private Boolean halfDay;

    // ✅ Changed to LocalDateTime
    private LocalDateTime createdDate = LocalDateTime.now();

    // New fields for file upload
    @Lob
    @Column(name = "attachment", columnDefinition = "LONGBLOB")
    private byte[] attachment;

    private String fileName;
    private String fileType;

    // Multi-level approval fields
    private Integer currentLevel = 0;
    private String pendingApprovers; // Comma-separated or snapshot of IDs
    private Boolean isAutoApproved = false;

    // Optional holiday selection (for Optional Leave type only)
  
@Column(name = "optional_holiday_name", length = 50)
private String optionalHolidayName;

  @Column(name = "assigned_approver_id", length = 50)
private String assignedApproverId;

@Column(name = "assigned_hr_id", length = 50)
private String assignedHrId;

@Column(name = "approver_name", length = 50)
private String approverName;// Stores name + delegation info upon action

    // Getters & Setters
    public String getApproverName() {
        return approverName;
    }

    public void setApproverName(String approverName) {
        this.approverName = approverName;
    }
    public String getAssignedApproverId() {
        return assignedApproverId;
    }

    public void setAssignedApproverId(String assignedApproverId) {
        this.assignedApproverId = assignedApproverId;
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

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    // ✅ Updated getter and setter to use LocalDate
    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    // ✅ Updated getter and setter to use LocalDate
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

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    // ✅ Updated getter and setter to use LocalDateTime
    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public byte[] getAttachment() {
        return attachment;
    }

    public void setAttachment(byte[] attachment) {
        this.attachment = attachment;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Boolean getHalfDay() {
        return halfDay;
    }

    public void setHalfDay(Boolean halfDay) {
        this.halfDay = halfDay;
    }

    public Integer getCurrentLevel() {
        return currentLevel;
    }

    public void setCurrentLevel(Integer currentLevel) {
        this.currentLevel = currentLevel;
    }

    public String getPendingApprovers() {
        return pendingApprovers;
    }

    public void setPendingApprovers(String pendingApprovers) {
        this.pendingApprovers = pendingApprovers;
    }

    public Boolean getIsAutoApproved() {
        return isAutoApproved;
    }

    public void setIsAutoApproved(Boolean isAutoApproved) {
        this.isAutoApproved = isAutoApproved;
    }

    public String getOptionalHolidayName() {
        return optionalHolidayName;
    }

    public void setOptionalHolidayName(String optionalHolidayName) {
        this.optionalHolidayName = optionalHolidayName;
    }

    @Transient
    private String warningMessage;

    public String getWarningMessage() {
        return warningMessage;
    }

    public void setWarningMessage(String warningMessage) {
        this.warningMessage = warningMessage;
    }
}