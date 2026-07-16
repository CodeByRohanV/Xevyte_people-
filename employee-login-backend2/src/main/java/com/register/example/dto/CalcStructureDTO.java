package com.register.example.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CalcStructureDTO {

    private Long id;
    private String name;
    private String description;
    private String status;
    private Boolean isTemplate;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CalcComponentDTO> components;
    private int componentCount;
    /** On create only – if set, clones components from this template ID */
    private Long templateId;
    private String tenantId;

    // ---------- getters & setters ----------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getIsTemplate() { return isTemplate; }
    public void setIsTemplate(Boolean isTemplate) { this.isTemplate = isTemplate; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<CalcComponentDTO> getComponents() { return components; }
    public void setComponents(List<CalcComponentDTO> components) { this.components = components; }

    public int getComponentCount() { return componentCount; }
    public void setComponentCount(int componentCount) { this.componentCount = componentCount; }

    public Long getTemplateId() { return templateId; }
    public void setTemplateId(Long templateId) { this.templateId = templateId; }
}
