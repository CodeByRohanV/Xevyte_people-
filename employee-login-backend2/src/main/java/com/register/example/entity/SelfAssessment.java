package com.register.example.entity;
 
import jakarta.persistence.*;

import com.register.example.entity.BaseEntity;
 
@Entity
@Table(name = "goals_saved_selfassessment", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employeeId", "goalId"}) // ✅ Prevent duplicates
})
public class SelfAssessment extends BaseEntity {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
@Column(name = "employee_id", length = 50)
private String employeeId;

    private Long goalId; // ✅ Add this field
 
    private String title;
    private String description;
 @Column(name = "weightage", length = 50)
private String weightage;
    private String target;
   @Column(name = "self_rating", length = 50)
private String selfRating;
    @Column(name = "self_assessment", length = 500) // 👈 Add this line
    private String selfAssessment;
 
    // === Getters and Setters ===
 
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
 
    public Long getGoalId() {
        return goalId;
    }
 
    public void setGoalId(Long goalId) {
        this.goalId = goalId;
    }
 
    public String getTitle() {
        return title;
    }
 
    public void setTitle(String title) {
        this.title = title;
    }
 
    public String getDescription() {
        return description;
    }
 
    public void setDescription(String description) {
        this.description = description;
    }
 
    public String getWeightage() {
        return weightage;
    }
 
    public void setWeightage(String weightage) {
        this.weightage = weightage;
    }
 
    public String getTarget() {
        return target;
    }
 
    public void setTarget(String target) {
        this.target = target;
    }
 
    public String getSelfRating() {
        return selfRating;
    }
 
    public void setSelfRating(String selfRating) {
        this.selfRating = selfRating;
    }
 
    public String getSelfAssessment() {
        return selfAssessment;
    }
 
    public void setSelfAssessment(String selfAssessment) {
        this.selfAssessment = selfAssessment;
    }
}
