package com.register.example.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import com.register.example.entity.BaseEntity;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token", nullable = false, unique = true)
    private String token;

    @Column(name = "employee_id", nullable = false, length = 50)
    private String employeeId;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    public PasswordResetToken() {
    }

    public PasswordResetToken(String token, String employeeId, LocalDateTime expiryDate) {
        this.token = token;
        this.employeeId = employeeId;
        this.expiryDate = expiryDate;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }
}