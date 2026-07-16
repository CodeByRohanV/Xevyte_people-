package com.register.example.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "grievance_admin")
public class AdminAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

  @Column(name = "role_name", length = 50)
private String roleName;  // ADMIN or SUPER_ADMIN

    @Column(length = 2000)
    private String employeeIds;  // comma-separated string

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getEmployeeIds() {
        return employeeIds;
    }

    public void setEmployeeIds(String employeeIds) {
        this.employeeIds = employeeIds;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
