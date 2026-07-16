package com.register.example.payload;

import lombok.Data;
import java.util.List;

@Data
public class AdminAccessRequest {
    private String roleName;
    private List<String> employeeIds;

    // Getters and Setters
    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public List<String> getEmployeeIds() {
        return employeeIds;
    }

    public void setEmployeeIds(List<String> employeeIds) {
        this.employeeIds = employeeIds;
    }
}
