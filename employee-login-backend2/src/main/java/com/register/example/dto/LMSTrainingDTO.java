package com.register.example.dto;

import java.sql.Date;

public class LMSTrainingDTO {
    private Long id;
    private String trainingName;
    private String employeeId;
    private String employeeName;
    private Date startDate;
    private Date deadline;
    private String status;
    private String category;
    private String description;

    public LMSTrainingDTO() {}

    public LMSTrainingDTO(Long id, String trainingName, String employeeId, String employeeName, Date startDate, Date deadline, String status, String category, String description) {
        this.id = id;
        this.trainingName = trainingName;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.startDate = startDate;
        this.deadline = deadline;
        this.status = status;
        this.category = category;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTrainingName() { return trainingName; }
    public void setTrainingName(String trainingName) { this.trainingName = trainingName; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public Date getStartDate() { return startDate; }
    public void setStartDate(Date startDate) { this.startDate = startDate; }
    public Date getDeadline() { return deadline; }
    public void setDeadline(Date deadline) { this.deadline = deadline; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
