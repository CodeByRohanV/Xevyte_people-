package com.register.example.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "performance_goal_template_attributes")
public class PerformanceGoalTemplateAttribute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attribute_title", nullable = false)
    private String attributeTitle;

    @Column(name = "attribute_description", length = 1000)
    private String attributeDescription;

    @Column(name = "metric")
    private String metric;

    @Column(name = "target")
    private String target;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    @JsonBackReference("template-attributes")
    private PerformanceGoalTemplate template;

    public PerformanceGoalTemplateAttribute() {
        // Empty constructor required for JPA
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAttributeTitle() {
        return attributeTitle;
    }

    public void setAttributeTitle(String attributeTitle) {
        this.attributeTitle = attributeTitle;
    }

    public String getAttributeDescription() {
        return attributeDescription;
    }

    public void setAttributeDescription(String attributeDescription) {
        this.attributeDescription = attributeDescription;
    }

    public String getMetric() {
        return metric;
    }

    public void setMetric(String metric) {
        this.metric = metric;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public PerformanceGoalTemplate getTemplate() {
        return template;
    }

    public void setTemplate(PerformanceGoalTemplate template) {
        this.template = template;
    }
}
