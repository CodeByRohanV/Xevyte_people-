package com.register.example.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import com.register.example.entity.BaseEntity;

@Entity
public class Sow extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sowId;

    private String sowName;
    private LocalDate sowStartDate;
    private LocalDate sowEndDate;
    private int totalEffort;   // in PD
    private double totalCost;

    private String sowDocName;

    @Lob
    private byte[] sowDocBlob;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    // Getters and Setters
    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Long getSowId() {
        return sowId;
    }

    public void setSowId(Long sowId) {
        this.sowId = sowId;
    }

    public String getSowName() {
        return sowName;
    }

    public void setSowName(String sowName) {
        this.sowName = sowName;
    }

    public LocalDate getSowStartDate() {
        return sowStartDate;
    }

    public void setSowStartDate(LocalDate sowStartDate) {
        this.sowStartDate = sowStartDate;
    }

    public LocalDate getSowEndDate() {
        return sowEndDate;
    }

    public void setSowEndDate(LocalDate sowEndDate) {
        this.sowEndDate = sowEndDate;
    }

    public int getTotalEffort() {
        return totalEffort;
    }

    public void setTotalEffort(int totalEffort) {
        this.totalEffort = totalEffort;
    }

    public double getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(double totalCost) {
        this.totalCost = totalCost;
    }

    public String getSowDocName() {
        return sowDocName;
    }

    public void setSowDocName(String sowDocName) {
        this.sowDocName = sowDocName;
    }

    public byte[] getSowDocBlob() {
        return sowDocBlob;
    }

    public void setSowDocBlob(byte[] sowDocBlob) {
        this.sowDocBlob = sowDocBlob;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    @Column(name = "tenant_sow_id")
    private Long tenantSowId;

    public Long getTenantSowId() {
        return tenantSowId;
    }

    public void setTenantSowId(Long tenantSowId) {
        this.tenantSowId = tenantSowId;
    }
}