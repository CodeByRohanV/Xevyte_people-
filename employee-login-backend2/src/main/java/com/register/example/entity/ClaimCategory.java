package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "claim_category")
public class ClaimCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String categoryName;

    @Column(name = "tenant_id")
    private String tenantId;

    @Column(nullable = false)
    private boolean active = true;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
