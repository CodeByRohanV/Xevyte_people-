package com.register.example.entity;

import jakarta.persistence.*;
import java.sql.Date;

@Entity
@Table(name = "LMS")
public class LMS extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String trainingName;
    private Date startDate;
   @Column(name = "employee_id", length = 50)
private String employeeId;
    private Date deadline;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(name = "status", length = 50)
private String status;
    private Integer progress; // 0-100
   @Column(name = "category", length = 50)
private String category; // Mandatory, Registered
   @Column(name = "assigned_by", length = 50)
private String assignedBy;

    public LMS() {
        // Empty constructor required for JPA
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTrainingName() {
        return trainingName;
    }

    public void setTrainingName(String trainingName) {
        this.trainingName = trainingName;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public Date getDeadline() {
        return deadline;
    }

    public void setDeadline(Date deadline) {
        this.deadline = deadline;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
    }
}
