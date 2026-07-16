package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "leave_types", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"type", "tenant_id"})
})
public class LeaveType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    @Column(columnDefinition = "TEXT")
    private String optionalHolidays; // Comma-separated list of optional holidays

    public LeaveType() {
    }

    public LeaveType(String type) {
        this.type = type;
    }

    public LeaveType(String type, String tenantId) {
        this.type = type;
        this.tenantId = tenantId;
    }

    public Long getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getOptionalHolidays() {
        return optionalHolidays;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setOptionalHolidays(String optionalHolidays) {
        this.optionalHolidays = optionalHolidays;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
