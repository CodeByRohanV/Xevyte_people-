package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import com.register.example.entity.BaseEntity;

@Entity
@Table(name = "customers")
public class Customer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "msa_doc_name")
    private String msaDocName;

    @Lob
    @Column(name = "msa_doc_blob", columnDefinition = "LONGBLOB")
    private byte[] msaDocBlob;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    // Getters and Setters
    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getMsaDocName() {
        return msaDocName;
    }

    public void setMsaDocName(String msaDocName) {
        this.msaDocName = msaDocName;
    }

    public byte[] getMsaDocBlob() {
        return msaDocBlob;
    }

    public void setMsaDocBlob(byte[] msaDocBlob) {
        this.msaDocBlob = msaDocBlob;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    @Column(name = "tenant_customer_id")
    private Long tenantCustomerId;

    public Long getTenantCustomerId() {
        return tenantCustomerId;
    }

    public void setTenantCustomerId(Long tenantCustomerId) {
        this.tenantCustomerId = tenantCustomerId;
    }
}