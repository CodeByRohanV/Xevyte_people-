package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "notice_period")
public class NoticePeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "notice_period_days")
    private Integer noticePeriodDays;

    @Column(name = "tenant_id")
    private String tenantId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getNoticePeriodDays() { return noticePeriodDays; }
    public void setNoticePeriodDays(Integer days) { this.noticePeriodDays = days; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}
