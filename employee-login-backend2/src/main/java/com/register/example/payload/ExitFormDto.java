package com.register.example.payload;

import java.util.Map;

public class ExitFormDto {
    private Long id;
    private String employeeId;
    private String assignedHrId;
    private Long resignationId;

    private Integer overallExperienceRating;
    private String reasonForLeavingDetailed;
    private String managerRelationshipFeedback;
    private Integer managerRelationshipRating;
    private String workEnvironmentFeedback;
    private Integer workEnvironmentRating;
    private String suggestionsForImprovement;
    private String recommendXevyte;
    private String anyOtherComments;

    private String exitInterviewStatus;
    private String exitInterviewDate;
    private String exitInterviewMeetingLink;
    private String interviewer;

    // dynamic answers container
    private Map<String, Object> answers;

    // getters & setters
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

    public Map<String, Object> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, Object> answers) {
        this.answers = answers;
    }

    public Long getResignationId() {
        return resignationId;
    }

    public void setResignationId(Long resignationId) {
        this.resignationId = resignationId;
    }
}
