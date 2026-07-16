package com.register.example.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.List;

@Entity
@Table(name = "performance_goal_templates")
public class PerformanceGoalTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_name", nullable = false)
    private String templateName;

    @Column(name = "department")
    private String department;

    /** Legacy comma-separated attributes string (kept for backward compatibility). */
    @Column(name = "attributes", length = 1000)
    private String attributes;

    @Column(name = "tenant_id")
    private String tenantId;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("template-goals")
    private List<PerformanceGoalTemplateGoal> goals;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("template-attributes")
    private List<PerformanceGoalTemplateAttribute> templateAttributes;

    // --- Getters & Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public List<PerformanceGoalTemplateGoal> getGoals() {
        return goals;
    }

    public void setGoals(List<PerformanceGoalTemplateGoal> goals) {
        this.goals = goals;
    }

    public List<PerformanceGoalTemplateAttribute> getTemplateAttributes() {
        return templateAttributes;
    }

    public void setTemplateAttributes(List<PerformanceGoalTemplateAttribute> templateAttributes) {
        this.templateAttributes = templateAttributes;
    }

    public String getAttributes() {
        return attributes;
    }

    public void setAttributes(String attributes) {
        this.attributes = attributes;
    }
}

