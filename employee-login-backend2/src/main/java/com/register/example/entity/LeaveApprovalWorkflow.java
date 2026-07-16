package com.register.example.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "leave_approval_workflow")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveApprovalWorkflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private boolean autoApprove;

    @Column(nullable = false)
    private int totalLevels;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    /**
     * NOTE:
     * Field name is still `leaveType`
     * Column name is still `leave_type_id`
     * Actual entity is `LeavestypePolicy`
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false, unique = true)
    private LeavestypePolicy leaveType;

    // Explicit getters/setters to guard against Lombok annotation processing failures
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public boolean isAutoApprove() { return autoApprove; }
    public void setAutoApprove(boolean autoApprove) { this.autoApprove = autoApprove; }

    public int getTotalLevels() { return totalLevels; }
    public void setTotalLevels(int totalLevels) { this.totalLevels = totalLevels; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public LeavestypePolicy getLeaveType() { return leaveType; }
    public void setLeaveType(LeavestypePolicy leaveType) { this.leaveType = leaveType; }
}

