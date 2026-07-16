package com.register.example.dto;

import java.time.LocalDateTime;

public class CalcComponentDTO {

    private Long id;
    private Long structureId;
    private String componentName;

    /** EARNINGS | DEDUCTIONS */
    private String section;

    /** FIXED_VALUE | FORMULA | AS_APPLICABLE */
    private String componentType;

    private Double perMonthValue;
    private Double perAnnumValue; // null = auto (perMonth * 12)
    private String formula;
    private String perMonthFormula;
    private String perAnnumFormula;
    private Integer sequenceOrder;
    private Boolean highlighted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Populated after calculation execution
    private Double computedPerMonth;
    private Double computedPerAnnum;
    private String displayPerMonth;  // formatted string ("As applicable" or number)
    private String displayPerAnnum;

    // ---------- getters & setters ----------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStructureId() { return structureId; }
    public void setStructureId(Long structureId) { this.structureId = structureId; }

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
    public void setHighlighted(Boolean highlighted) { this.highlighted = highlighted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Double getComputedPerMonth() { return computedPerMonth; }
    public void setComputedPerMonth(Double computedPerMonth) { this.computedPerMonth = computedPerMonth; }

    public Double getComputedPerAnnum() { return computedPerAnnum; }
    public void setComputedPerAnnum(Double computedPerAnnum) { this.computedPerAnnum = computedPerAnnum; }

    public String getDisplayPerMonth() { return displayPerMonth; }
    public void setDisplayPerMonth(String displayPerMonth) { this.displayPerMonth = displayPerMonth; }

    public String getDisplayPerAnnum() { return displayPerAnnum; }
    public void setDisplayPerAnnum(String displayPerAnnum) { this.displayPerAnnum = displayPerAnnum; }

    // Legacy compatibility
    public Double getFixedValue() { return perMonthValue; }
    public void setFixedValue(Double v) { this.perMonthValue = v; }
    public Double getComputedValue() { return computedPerMonth; }
    public void setComputedValue(Double v) { this.computedPerMonth = v; }
}
