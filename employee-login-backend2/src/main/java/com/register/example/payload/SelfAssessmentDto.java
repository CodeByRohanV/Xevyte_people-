package com.register.example.payload;
 
public class SelfAssessmentDto {
 
    private Long id;
    private String employeeId;
    private Long goalId; // ✅ Required to identify which goal the assessment is for
 
    private String title;
    private String description;
    private String weightage;
    private String target;
    private String selfRating;
    private String selfAssessment;
 
    // === Getters ===
    public Long getId() {
        return id;
    }
 
    public String getEmployeeId() {
        return employeeId;
    }
 
    public Long getGoalId() {
        return goalId;
    }
 
    public String getTitle() {
        return title;
    }
 
    public String getDescription() {
        return description;
    }
 
    public String getWeightage() {
        return weightage;
    }
 
    public String getTarget() {
        return target;
    }
 
    public String getSelfRating() {
        return selfRating;
    }
 
    public String getSelfAssessment() {
        return selfAssessment;
    }
 
    // === Setters ===
    public void setId(Long id) {
        this.id = id;
    }
 
    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }
 
    public void setGoalId(Long goalId) {
        this.goalId = goalId;
    }
 
    public void setTitle(String title) {
        this.title = title;
    }
 
    public void setDescription(String description) {
        this.description = description;
    }
 
    public void setWeightage(String weightage) {
        this.weightage = weightage;
    }
 
    public void setTarget(String target) {
        this.target = target;
    }
 
    public void setSelfRating(String selfRating) {
        this.selfRating = selfRating;
    }
 
    public void setSelfAssessment(String selfAssessment) {
        this.selfAssessment = selfAssessment;
    }
}
 
 
