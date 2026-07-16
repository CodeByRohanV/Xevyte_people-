package com.register.example.payload;
import java.time.LocalDate;

public class LoginRequest {
    private String employeeId;
    private String password;

    public LoginRequest() {
    }

    public LoginRequest(String employeeId, String password) {
        this.employeeId = employeeId;
        this.password = password;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}