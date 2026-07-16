package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "claim_history")
public class ClaimApprovalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_id", nullable = false)
    private Long claimId;

   @Column(name = "approver_id", length = 50)
private String approverId;

@Column(name = "approver_name", length = 50)
private String approverName;

@Column(name = "approver_role", nullable = false, length = 50)
private String approverRole;

   @Column(name = "action", nullable = false, length = 50)
private String action;


    @Column(name = "action_timestamp", nullable = false)
    private LocalDateTime actionTimestamp;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    // Populated only when action was performed via delegation
    @Column(name = "delegator_id" , length = 50)
    private String delegatorId;

    @Column(name = "delegator_name", length = 50)
    private String delegatorName;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClaimId() {
        return claimId;
    }

    public void setClaimId(Long claimId) {
        this.claimId = claimId;
    }

    public String getApproverRole() {
        return approverRole;
    }

    public void setApproverRole(String approverRole) {
        this.approverRole = approverRole;
    }

    public String getApproverId() {
        return approverId;
    }

    public void setApproverId(String approverId) {
        this.approverId = approverId;
    }

    public String getApproverName() {
        return approverName;
    }

    public void setApproverName(String approverName) {
        this.approverName = approverName;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public LocalDateTime getActionTimestamp() {
        return actionTimestamp;
    }

    public void setActionTimestamp(LocalDateTime actionTimestamp) {
        this.actionTimestamp = actionTimestamp;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getDelegatorId() {
        return delegatorId;
    }

    public void setDelegatorId(String delegatorId) {
        this.delegatorId = delegatorId;
    }

    public String getDelegatorName() {
        return delegatorName;
    }

    public void setDelegatorName(String delegatorName) {
        this.delegatorName = delegatorName;
    }
}
