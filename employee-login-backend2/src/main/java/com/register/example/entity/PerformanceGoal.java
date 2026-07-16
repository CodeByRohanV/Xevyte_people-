package com.register.example.entity;

import jakarta.persistence.*;

import java.sql.Date;
import com.register.example.entity.BaseEntity;

@Entity
@Table(name = "performance_goals")
public class PerformanceGoal extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long goalId;

    private String goalTitle;
    private String goalDescription;
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
    // ➕ New fields added
    private Integer rating;

    @Column(name = "self_assessment", length = 500) // 👈 Add this line
    private String selfAssessment;

    private Integer managerRating;
    private String managerComments;
    private String metric;
    private String target;
    @Column(name = "attributes", length = 1000)
    private String attributes;
    @Transient
    private String employeeName;

    private boolean reminder12DaysSent = false; // 12 days after start
    private boolean inProgress15DaysSent = false; // 15 days after start
    private boolean selfAssessment10DaysSent = false; // 10 days before end
    private boolean autoSubmit7DaysSent = false;

    // Goal History tracking fields
    private boolean isArchived = false; // Whether goal is archived to history
    private Date archivedDate; // Date when goal was archived
    @Column(name = "archived_half", length = 50)
private String archivedHalf;// H1 or H2 - which half year the goal belongs to

    @Column(name = "time_period", length = 100)
    private String timePeriod;

    public PerformanceGoal() {
    }

    // Getters and Setters

    public Long getGoalId() {
        return goalId;
    }

    public void setGoalId(Long goalId) {
        this.goalId = goalId;
    }

    public String getGoalTitle() {
        return goalTitle;
    }

    public void setGoalTitle(String goalTitle) {
        this.goalTitle = goalTitle;
    }

    public String getGoalDescription() {
        return goalDescription;
    }

    public void setGoalDescription(String goalDescription) {
        this.goalDescription = goalDescription;
    }

    public String getReviewerComments() {
        return reviewerComments;
    }

    public void setReviewerComments(String reviewerComments) {
        this.reviewerComments = reviewerComments;
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

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
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

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    // ➕ New Getters & Setters

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

    public String getAttributes() {
        return attributes;
    }

    public void setAttributes(String attributes) {
        this.attributes = attributes;
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
