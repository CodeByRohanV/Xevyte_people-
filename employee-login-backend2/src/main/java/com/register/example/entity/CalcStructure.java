package com.register.example.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "calc_structures", uniqueConstraints = {
    @UniqueConstraint(name = "uc_calcstructure_name_tenant", columnNames = {"name", "tenant_id"})
})
@EntityListeners(AuditingEntityListener.class)
public class CalcStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String status; // ACTIVE / INACTIVE

    /** When true, this structure acts as a reusable template */
    @Column(nullable = false)
    private Boolean isTemplate = false;

    @Column(nullable = false, updatable = false)
    private String createdBy;

    @Column(name = "tenant_id")
    private String tenantId;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "structure", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sequenceOrder ASC")
    private List<CalcComponent> components = new ArrayList<>();

    // ---------- constructors ----------
    public CalcStructure() {
        // Empty constructor required for JPA
    }

    // ---------- getters & setters ----------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getIsTemplate() { return isTemplate != null && isTemplate; }
    public void setIsTemplate(Boolean isTemplate) { this.isTemplate = isTemplate != null && isTemplate; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<CalcComponent> getComponents() { return components; }
    public void setComponents(List<CalcComponent> components) { this.components = components; }
}
