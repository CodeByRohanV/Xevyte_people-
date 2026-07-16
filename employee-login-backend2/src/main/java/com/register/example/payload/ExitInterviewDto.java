package com.register.example.payload;

public class ExitInterviewDto {
    private Integer overallExperience;
    private String reasonForLeaving;
    private String managerFeedback;
    private String workEnvironment;
    private String suggestions;
    private String recommend;
    private String otherComments;

    // Getters / Setters
    public Integer getOverallExperience() { return overallExperience; }
    public void setOverallExperience(Integer overallExperience) { this.overallExperience = overallExperience; }

    public String getReasonForLeaving() { return reasonForLeaving; }
    public void setReasonForLeaving(String reasonForLeaving) { this.reasonForLeaving = reasonForLeaving; }

    public String getManagerFeedback() { return managerFeedback; }
    public void setManagerFeedback(String managerFeedback) { this.managerFeedback = managerFeedback; }

    public String getWorkEnvironment() { return workEnvironment; }
    public void setWorkEnvironment(String workEnvironment) { this.workEnvironment = workEnvironment; }

    public String getSuggestions() { return suggestions; }
    public void setSuggestions(String suggestions) { this.suggestions = suggestions; }

    public String getRecommend() { return recommend; }
    public void setRecommend(String recommend) { this.recommend = recommend; }

    public String getOtherComments() { return otherComments; }
    public void setOtherComments(String otherComments) { this.otherComments = otherComments; }
}
