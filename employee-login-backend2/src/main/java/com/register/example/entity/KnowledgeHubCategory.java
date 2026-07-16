package com.register.example.entity;
 
import jakarta.persistence.*;
 
@Entity
@Table(name = "knowledge_hub_category")
public class KnowledgeHubCategory {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(name = "category_key", length = 50)
    private String categoryKey;
 
    @Column(name = "category_label", length = 50)
    private String categoryLabel;
 
    @Column(name = "tenant_id")
    private String tenantId;
 
    // === Getters & Setters ===
 
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
 
    public String getCategoryKey() { return categoryKey; }
    public void setCategoryKey(String categoryKey) { this.categoryKey = categoryKey; }
 
    public String getCategoryLabel() { return categoryLabel; }
    public void setCategoryLabel(String categoryLabel) { this.categoryLabel = categoryLabel; }
 
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}
