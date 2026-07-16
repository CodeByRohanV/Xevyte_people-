package com.register.example.entity;
 
import jakarta.persistence.*;
 
@Entity
@Table(name = "tenant")
public class Tenant extends BaseEntity {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(name = "tenant_id", unique = true, nullable = false, length = 100)
    private String tenantId;
 
    @Column(name = "tenant_name", nullable = false, length = 200)
    private String tenantName;
 
    @Column(name = "admin_email", length = 255)
    private String adminEmail;
 
    public Long getId() {
        return id;
    }
 
    public void setId(Long id) {
        this.id = id;
    }
 
    public String getTenantId() {
        return tenantId;
    }
 
    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
 
    public String getTenantName() {
        return tenantName;
    }
 
    public void setTenantName(String tenantName) {
        this.tenantName = tenantName;
    }

    public String getAdminEmail() {
        return adminEmail;
    }

    public void setAdminEmail(String adminEmail) {
        this.adminEmail = adminEmail;
    }
}