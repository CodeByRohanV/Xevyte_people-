package com.register.example.payload;

import java.util.List;

public class EmployeeValidationRequest {

    private List<String> employeeIds;

    public List<String> getEmployeeIds() {
        return employeeIds;
    }

    public void setEmployeeIds(List<String> employeeIds) {
        this.employeeIds = employeeIds;
    }
}
