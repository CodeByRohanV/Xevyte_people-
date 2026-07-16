package com.register.example.dto;

public class EmployeeSummaryDTO {
    private String employeeId;
    private String firstName;
    private String lastName;
    private String department;
    private String designation;

    public EmployeeSummaryDTO() {}

    public EmployeeSummaryDTO(String employeeId, String firstName, String lastName, String department, String designation) {
        this.employeeId = employeeId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.department = department;
        this.designation = designation;
    }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
}
