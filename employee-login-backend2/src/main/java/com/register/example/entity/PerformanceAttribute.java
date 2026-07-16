package com.register.example.entity;

import jakarta.persistence.*;
import java.sql.Date;
import com.register.example.entity.BaseEntity;

@Entity
@Table(name = "performance_attributes")
public class PerformanceAttribute extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attributeId;

    private String attributeTitle;
    private String attributeDescription;

    @Column(name = "status", length = 50)
    private String status;

    private Date startDate;
    private Date endDate;

    @Column(name = "employee_id", length = 50)
    private String employeeId;

    @Column(name = "assigned_by", length = 50)
    private String assignedBy;

    private String rejectionReason;
    private String reviewerComments;
    private Integer rating;

    @Column(name = "self_assessment", length = 500)
    private String selfAssessment;

    private Integer managerRating;
    private String managerComments;
    private String metric;
    private String target;

    @Transient
    private String employeeName;

    private boolean reminder12DaysSent = false;
    private boolean inProgress15DaysSent = false;
    private boolean selfAssessment10DaysSent = false;
    private boolean autoSubmit7DaysSent = false;

    private boolean isArchived = false;
    private Date archivedDate;

    @Column(name = "archived_half", length = 50)
    private String archivedHalf;

    @Column(name = "time_period", length = 100)
    private String timePeriod;

    public PerformanceAttribute() {
    }

    public Long getAttributeId() {
        return attributeId;
    }

    public void setAttributeId(Long attributeId) {
        this.attributeId = attributeId;
    }

    public String getAttributeTitle() {
        return attributeTitle;
    }

    public void setAttributeTitle(String attributeTitle) {
        this.attributeTitle = attributeTitle;
    }

    public String getAttributeDescription() {
        return attributeDescription;
    }

    public void setAttributeDescription(String attributeDescription) {
        this.attributeDescription = attributeDescription;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getReviewerComments() {
        return reviewerComments;
    }

    public void setReviewerComments(String reviewerComments) {
        this.reviewerComments = reviewerComments;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getSelfAssessment() {
        return selfAssessment;
    }

    public void setSelfAssessment(String selfAssessment) {
        this.selfAssessment = selfAssessment;
    }

    public Integer getManagerRating() {
        return managerRating;
    }

    public void setManagerRating(Integer managerRating) {
        this.managerRating = managerRating;
    }

    public String getManagerComments() {
        return managerComments;
    }

    public void setManagerComments(String managerComments) {
        this.managerComments = managerComments;
    }

    public String getMetric() {
        return metric;
    }

    public void setMetric(String metric) {
        this.metric = metric;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public boolean isReminder12DaysSent() {
        return reminder12DaysSent;
    }

    public void setReminder12DaysSent(boolean reminder12DaysSent) {
        this.reminder12DaysSent = reminder12DaysSent;
    }

    public boolean isInProgress15DaysSent() {
        return inProgress15DaysSent;
    }

    public void setInProgress15DaysSent(boolean inProgress15DaysSent) {
        this.inProgress15DaysSent = inProgress15DaysSent;
    }

    public boolean isSelfAssessment10DaysSent() {
        return selfAssessment10DaysSent;
    }

    public void setSelfAssessment10DaysSent(boolean selfAssessment10DaysSent) {
        this.selfAssessment10DaysSent = selfAssessment10DaysSent;
    }

    public boolean isAutoSubmit7DaysSent() {
        return autoSubmit7DaysSent;
    }

    public void setAutoSubmit7DaysSent(boolean autoSubmit7DaysSent) {
        this.autoSubmit7DaysSent = autoSubmit7DaysSent;
    }

    public boolean isArchived() {
        return isArchived;
    }

    public void setArchived(boolean archived) {
        isArchived = archived;
    }

    public Date getArchivedDate() {
        return archivedDate;
    }

    public void setArchivedDate(Date archivedDate) {
        this.archivedDate = archivedDate;
    }

    public String getArchivedHalf() {
        return archivedHalf;
    }

    public void setArchivedHalf(String archivedHalf) {
        this.archivedHalf = archivedHalf;
    }

    public String getTimePeriod() {
        return timePeriod;
    }

    public void setTimePeriod(String timePeriod) {
        this.timePeriod = timePeriod;
    }
}
