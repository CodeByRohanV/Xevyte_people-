package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "notification")
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false, length = 50)
    private String employeeId;

    @Column(length = 500, nullable = false)
    private String message;

    @JsonProperty("read")
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    // ✅ CRITICAL FIX: Use DATETIME instead of TIMESTAMP
    @Column(name = "timestamp", columnDefinition = "DATETIME", nullable = false)
    private LocalDateTime timestamp;

    // ================== GETTERS & SETTERS ==================

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

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    @JsonProperty("read")
    public boolean isRead() {
        return isRead;
    }

    @JsonProperty("read")
    public void setRead(boolean isRead) {
        this.isRead = isRead;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    // ================== equals & hashCode ==================

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Notification that = (Notification) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
