package com.register.example.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "delegations")
public class Delegation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "delegator_id")
    private String delegatorId;

    @Column(name = "delegate_id")
    private String delegateId;

    @Column(name = "delegate_name")
    private String delegateName;

    @Column(name = "request_type")
    private String requestType;

    @Column(name = "begin_date")
    private Date beginDate;

    @Column(name = "end_date")
    private Date endDate;

    @Column(name = "reason", length = 1000)
    private String reason;

    @Column(name = "status")
    private String status = "Active";

    @Column(name = "reassign_existing")
    private Boolean reassignExisting = false;

    // Getters and Setters
    public Boolean getReassignExisting() {
        return reassignExisting;
    }

    public void setReassignExisting(Boolean reassignExisting) {
        this.reassignExisting = reassignExisting;
    }
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDelegatorId() {
        return delegatorId;
    }

    public void setDelegatorId(String delegatorId) {
        this.delegatorId = delegatorId;
    }

    public String getDelegateId() {
        return delegateId;
    }

    public void setDelegateId(String delegateId) {
        this.delegateId = delegateId;
    }

    public String getDelegateName() {
        return delegateName;
    }

    public void setDelegateName(String delegateName) {
        this.delegateName = delegateName;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public Date getBeginDate() {
        return beginDate;
    }

    public void setBeginDate(Date beginDate) {
        this.beginDate = beginDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
