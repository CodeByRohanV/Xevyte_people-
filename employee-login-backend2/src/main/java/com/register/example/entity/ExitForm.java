package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Entity
@Table(name = "exit_forms")
public class ExitForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relationship to Employee
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Employee employee;

    @Column(name = "assigned_hr_id", length = 50)
private String assignedHrId;

    @Column(name = "resignation_id")
    private Long resignationId;

    // Feedback fields
    @Column(name = "overall_experience_rating", nullable = true)
    private Integer overallExperienceRating;

    @Column(name = "reason_for_leaving_detailed", columnDefinition = "TEXT", nullable = true)
    private String reasonForLeavingDetailed;

    @Column(name = "manager_relationship_feedback", columnDefinition = "TEXT", nullable = true)
    private String managerRelationshipFeedback;

    @Column(name = "manager_relationship_rating", nullable = true)
    private Integer managerRelationshipRating;

    @Column(name = "work_environment_feedback", columnDefinition = "TEXT", nullable = true)
    private String workEnvironmentFeedback;

    @Column(name = "work_environment_rating", nullable = true)
    private Integer workEnvironmentRating;

    @Column(name = "suggestions_for_improvement", columnDefinition = "TEXT", nullable = true)
    private String suggestionsForImprovement;

    @Column(name = "recommend_xevyte", nullable = true)
    private String recommendXevyte;

    @Column(name = "any_other_comments", columnDefinition = "TEXT", nullable = true)
    private String anyOtherComments;

    // Interview scheduling/tracking
@Column(name = "exit_interview_status", length = 50, nullable = true)
private String exitInterviewStatus;// INITIATED / SCHEDULED / COMPLETED / RESCHEDULED

   @Column(name = "exit_interview_date", length = 50, nullable = true)
private String exitInterviewDate;// store ISO string

    @Column(name = "exit_interview_meeting_link", nullable = true)
    private String exitInterviewMeetingLink;

 @Column(name = "interviewer", length = 50, nullable = true)
private String interviewer;

@Column(name = "hr_scheduled_by", length = 50, nullable = true)
private String hrScheduledBy;

    @Column(name = "exit_interview_submission_date", nullable = true)
    private LocalDateTime exitInterviewSubmissionDate;

    // JSON answers stored as LONGTEXT
    @Lob
    @Column(name = "feedback_answers", columnDefinition = "LONGTEXT")
    private String feedbackAnswersJson;

    // Audit
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Lifecycle hooks
    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.overallExperienceRating == null)
            this.overallExperienceRating = 0;
        if (this.managerRelationshipRating == null)
            this.managerRelationshipRating = 0;
        if (this.workEnvironmentRating == null)
            this.workEnvironmentRating = 0;
        if (this.recommendXevyte == null)
            this.recommendXevyte = "N/A";
        if (this.exitInterviewStatus == null)
            this.exitInterviewStatus = "INITIATED";
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters / setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public String getAssignedHrId() {
        return assignedHrId;
    }

    public void setAssignedHrId(String assignedHrId) {
        this.assignedHrId = assignedHrId;
    }

    public Integer getOverallExperienceRating() {
        return overallExperienceRating;
    }

    public void setOverallExperienceRating(Integer overallExperienceRating) {
        this.overallExperienceRating = overallExperienceRating;
    }

    public String getReasonForLeavingDetailed() {
        return reasonForLeavingDetailed;
    }

    public void setReasonForLeavingDetailed(String reasonForLeavingDetailed) {
        this.reasonForLeavingDetailed = reasonForLeavingDetailed;
    }

    public String getManagerRelationshipFeedback() {
        return managerRelationshipFeedback;
    }

    public void setManagerRelationshipFeedback(String managerRelationshipFeedback) {
        this.managerRelationshipFeedback = managerRelationshipFeedback;
    }

    public Integer getManagerRelationshipRating() {
        return managerRelationshipRating;
    }

    public void setManagerRelationshipRating(Integer managerRelationshipRating) {
        this.managerRelationshipRating = managerRelationshipRating;
    }

    public String getWorkEnvironmentFeedback() {
        return workEnvironmentFeedback;
    }

    public void setWorkEnvironmentFeedback(String workEnvironmentFeedback) {
        this.workEnvironmentFeedback = workEnvironmentFeedback;
    }

    public Integer getWorkEnvironmentRating() {
        return workEnvironmentRating;
    }

    public void setWorkEnvironmentRating(Integer workEnvironmentRating) {
        this.workEnvironmentRating = workEnvironmentRating;
    }

    public String getSuggestionsForImprovement() {
        return suggestionsForImprovement;
    }

    public void setSuggestionsForImprovement(String suggestionsForImprovement) {
        this.suggestionsForImprovement = suggestionsForImprovement;
    }

    public String getRecommendXevyte() {
        return recommendXevyte;
    }

    public void setRecommendXevyte(String recommendXevyte) {
        this.recommendXevyte = recommendXevyte;
    }

    public String getAnyOtherComments() {
        return anyOtherComments;
    }

    public void setAnyOtherComments(String anyOtherComments) {
        this.anyOtherComments = anyOtherComments;
    }

    public String getExitInterviewStatus() {
        return exitInterviewStatus;
    }

    public void setExitInterviewStatus(String exitInterviewStatus) {
        this.exitInterviewStatus = exitInterviewStatus;
    }

    public String getExitInterviewDate() {
        return exitInterviewDate;
    }

    public void setExitInterviewDate(String exitInterviewDate) {
        this.exitInterviewDate = exitInterviewDate;
    }

    public String getExitInterviewMeetingLink() {
        return exitInterviewMeetingLink;
    }

    public void setExitInterviewMeetingLink(String exitInterviewMeetingLink) {
        this.exitInterviewMeetingLink = exitInterviewMeetingLink;
    }

    public String getInterviewer() {
        return interviewer;
    }

    public void setInterviewer(String interviewer) {
        this.interviewer = interviewer;
    }

    public String getHrScheduledBy() {
        return hrScheduledBy;
    }

    public void setHrScheduledBy(String hrScheduledBy) {
        this.hrScheduledBy = hrScheduledBy;
    }

    public LocalDateTime getExitInterviewSubmissionDate() {
        return exitInterviewSubmissionDate;
    }

    public void setExitInterviewSubmissionDate(LocalDateTime exitInterviewSubmissionDate) {
        this.exitInterviewSubmissionDate = exitInterviewSubmissionDate;
    }

    public String getFeedbackAnswersJson() {
        return feedbackAnswersJson;
    }

    public void setFeedbackAnswersJson(String feedbackAnswersJson) {
        this.feedbackAnswersJson = feedbackAnswersJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public Long getResignationId() {
        return resignationId;
    }

    public void setResignationId(Long resignationId) {
        this.resignationId = resignationId;
    }
}
