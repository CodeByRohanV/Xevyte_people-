package com.register.example.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Entity
@Table(name = "department_metrics_summary")
@Data
@EqualsAndHashCode(callSuper = true)
public class DepartmentMetricsSummary extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "department", nullable = false)
    private String department;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "total_employees")
    private Integer totalEmployees = 0;

    @Column(name = "active_leaves")
    private Integer activeLeaves = 0;

    @Column(name = "open_tickets")
    private Integer openTickets = 0;

    @Column(name = "pending_approvals")
    private Integer pendingApprovals = 0;

    @Column(name = "attrition_count")
    private Integer attritionCount = 0;

    @Column(name = "sick_leaves")
    private Integer sickLeaves = 0;

    @Column(name = "casual_leaves")
    private Integer casualLeaves = 0;

    @Column(name = "earned_leaves")
    private Integer earnedLeaves = 0;

    // Advanced Enterprise Analytics Scores
    @Column(name = "flight_risk_score")
    private Integer flightRiskScore = 0; // 0-100

    @Column(name = "burnout_risk_score")
    private Integer burnoutRiskScore = 0; // 0-100

    @Column(name = "department_health_score")
    private Integer departmentHealthScore = 0; // 0-100

    @Column(name = "manager_effectiveness_score")
    private Integer managerEffectivenessScore = 0; // 0-100

    @Column(name = "workforce_health_score")
    private Integer workforceHealthScore = 0; // 0-100

    @Column(name = "leave_forecast")
    private Integer leaveForecast = 0; // Forecasted leaves for next 30 days
}
