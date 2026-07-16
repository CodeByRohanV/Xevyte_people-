package com.register.example.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "performance_goal_template_goals")
public class PerformanceGoalTemplateGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "goal_title", nullable = false)
    private String goalTitle;

    @Column(name = "goal_description", length = 1000)
    private String goalDescription;

    @Column(name = "metric")
    private String metric;

    @Column(name = "target")
    private String target;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    @JsonBackReference("template-goals")
    private PerformanceGoalTemplate template;

    public PerformanceGoalTemplateGoal() {
        // Empty constructor required for JPA
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getGoalTitle() {
        return goalTitle;
    }

    public void setGoalTitle(String goalTitle) {
        this.goalTitle = goalTitle;
    }

    public String getGoalDescription() {
        return goalDescription;
    }

    public void setGoalDescription(String goalDescription) {
        this.goalDescription = goalDescription;
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
