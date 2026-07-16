package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "policy_acknowledgment", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "policy_id"})
})
public class PolicyAcknowledgment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private String employeeId;

    @Column(name = "policy_id", nullable = false)
    private Long policyId;

    @Column(name = "acknowledged", nullable = false)
    private Boolean acknowledged = false;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "tenant_id")
    private String tenantId;

    public PolicyAcknowledgment() {
    }

    public PolicyAcknowledgment(String employeeId, Long policyId, String tenantId) {
        this.employeeId = employeeId;
        this.policyId = policyId;
        this.tenantId = tenantId;
        this.acknowledged = true;
        this.acknowledgedAt = LocalDateTime.now();
    }

    // === Getters and Setters ===

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

    public Long getPolicyId() {
        return policyId;
    }

    public void setPolicyId(Long policyId) {
        this.policyId = policyId;
    }

    public Boolean getAcknowledged() {
        return acknowledged;
    }

    public void setAcknowledged(Boolean acknowledged) {
        this.acknowledged = acknowledged;
    }

    public LocalDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
