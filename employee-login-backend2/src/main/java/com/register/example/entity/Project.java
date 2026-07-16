package com.register.example.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.register.example.entity.BaseEntity;

@Entity
@Table(name = "projects")
public class Project extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long projectId;

    @Column(name = "project_name", length = 100)
    private String projectName;  // NEW FIELD

    private LocalDate projectStartDate;

    private LocalDate projectEndDate;

    private Double totalEffort;

    private Double totalCost;

    
@Column(name = "manager", length = 50)
private String manager;

@Column(name = "reviewer", length = 50)
private String reviewer;

@Column(name = "hr", length = 50)
private String hr;

@Column(name = "finance", length = 50)
private String finance;

@Column(name = "admin", length = 50)
private String admin; // new field

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sow_id", nullable = false)
    @JsonBackReference
    private Sow sow;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    // Getters and Setters
    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {   // NEW
        return projectName;
    }

    public void setProjectName(String projectName) {  // NEW
        this.projectName = projectName;
    }

    public LocalDate getProjectStartDate() {
        return projectStartDate;
    }

    public void setProjectStartDate(LocalDate projectStartDate) {
        this.projectStartDate = projectStartDate;
    }

    public LocalDate getProjectEndDate() {
        return projectEndDate;
    }

    public void setProjectEndDate(LocalDate projectEndDate) {
        this.projectEndDate = projectEndDate;
    }

    public Double getTotalEffort() {
        return totalEffort;
    }

    public void setTotalEffort(Double totalEffort) {
        this.totalEffort = totalEffort;
    }

    public Double getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(Double totalCost) {
        this.totalCost = totalCost;
    }

    public String getManager() {
        return manager;
    }

    public void setManager(String manager) {
        this.manager = manager;
    }

    public String getReviewer() {
        return reviewer;
    }

    public void setReviewer(String reviewer) {
        this.reviewer = reviewer;
    }

    public String getHr() {
        return hr;
    }

    public void setHr(String hr) {
        this.hr = hr;
    }

    public String getFinance() {
        return finance;
    }

    public void setFinance(String finance) {
        this.finance = finance;
    }

    public String getAdmin() {
        return admin;
    }

    public void setAdmin(String admin) {
        this.admin = admin;
    }

    public Sow getSow() {
        return sow;
    }

    public void setSow(Sow sow) {
        this.sow = sow;
    }

    @Column(name = "tenant_project_id")
    private Long tenantProjectId;

    public Long getTenantProjectId() {
        return tenantProjectId;
    }

    public void setTenantProjectId(Long tenantProjectId) {
        this.tenantProjectId = tenantProjectId;
    }
}