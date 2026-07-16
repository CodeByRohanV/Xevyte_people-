package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "calc_components")
@EntityListeners(AuditingEntityListener.class)
public class CalcComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "structure_id", nullable = false)
    @JsonIgnore
    private CalcStructure structure;

    @Column(nullable = false)
    private String componentName;

    /**
     * Section grouping:
     *   EARNINGS  – left side of the salary table
     *   DEDUCTIONS – right side of the salary table
     */
    @Column(nullable = false)
    private String section; // EARNINGS | DEDUCTIONS

    /**
     * How the per-month value is determined:
     *   FIXED_VALUE   – admin enters a fixed number
     *   FORMULA       – expression referencing prior components in same section
     *   AS_APPLICABLE – displayed as "As applicable" (no numeric value)
     */
    @Column(nullable = false)
    private String componentType;

    /** Per-month fixed value (used when componentType = FIXED_VALUE) */
    private Double perMonthValue;

    /** Per-annum value — if null, auto-computed as perMonthValue × 12 */
    private Double perAnnumValue;

    /** Formula expression e.g. "BASIC + HRA" (used when componentType = FORMULA) */
    @Column(length = 2000)
    private String formula;

    /** Formula expression for monthly calculation (used when componentType = FORMULA) */
    @Column(length = 2000)
    private String perMonthFormula;

    /** Formula expression for annual calculation (used when componentType = FORMULA) */
    @Column(length = 2000)
    private String perAnnumFormula;

    @Column(nullable = false)
    private Integer sequenceOrder;

    /**
     * Whether this row should be visually highlighted (orange in the salary slip)
     * e.g. Monthly Total, Cost to Company, Total Deductions
     */
    @Column(nullable = false)
    private Boolean highlighted = false;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Transient computed results after execution
    @Transient
    private Double computedPerMonth;

    @Transient
    private Double computedPerAnnum;

    // ---------- getters & setters ----------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CalcStructure getStructure() { return structure; }
    public void setStructure(CalcStructure structure) { this.structure = structure; }

    public String getComponentName() { return componentName; }
    public void setComponentName(String componentName) { this.componentName = componentName; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getComponentType() { return componentType; }
    public void setComponentType(String componentType) { this.componentType = componentType; }

    public Double getPerMonthValue() { return perMonthValue; }
    public void setPerMonthValue(Double perMonthValue) { this.perMonthValue = perMonthValue; }

    public Double getPerAnnumValue() { return perAnnumValue; }
    public void setPerAnnumValue(Double perAnnumValue) { this.perAnnumValue = perAnnumValue; }

    public String getFormula() { return formula; }
    public void setFormula(String formula) { this.formula = formula; }

    public String getPerMonthFormula() { return perMonthFormula; }
    public void setPerMonthFormula(String perMonthFormula) { this.perMonthFormula = perMonthFormula; }

    public String getPerAnnumFormula() { return perAnnumFormula; }
    public void setPerAnnumFormula(String perAnnumFormula) { this.perAnnumFormula = perAnnumFormula; }

    public Integer getSequenceOrder() { return sequenceOrder; }
    public void setSequenceOrder(Integer sequenceOrder) { this.sequenceOrder = sequenceOrder; }

    public Boolean getHighlighted() { return highlighted; }
    public void setHighlighted(Boolean highlighted) { this.highlighted = highlighted != null && highlighted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Double getComputedPerMonth() { return computedPerMonth; }
    public void setComputedPerMonth(Double computedPerMonth) { this.computedPerMonth = computedPerMonth; }

    public Double getComputedPerAnnum() { return computedPerAnnum; }
    public void setComputedPerAnnum(Double computedPerAnnum) { this.computedPerAnnum = computedPerAnnum; }

    public Long getStructureId() { return structure != null ? structure.getId() : null; }

    // Legacy compatibility – maps to perMonthValue
    public Double getFixedValue() { return perMonthValue; }
    public void setFixedValue(Double v) { this.perMonthValue = v; }

    // Legacy compatibility – computedValue maps to computedPerMonth
    public Double getComputedValue() { return computedPerMonth; }
    public void setComputedValue(Double v) { this.computedPerMonth = v; }
}
