package com.register.example.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "salary_component")
public class SalaryComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

   @Column(nullable = false, unique = true, length = 50)
private String name;

@Column(nullable = false, length = 50)
private String placeholder;

@Column(nullable = false, length = 50)
private String type;

    @Column(nullable = false)
    private String calculationType;

    private BigDecimal calculationValue;

    private String sourceComponent;

    @Column(name = "sort_order")
    private Integer sortOrder;

    private String formula;

    private String section;

    private boolean isActive = true;

    private boolean showAsApplicable = false;

    // Getters and Setters
    public boolean isShowAsApplicable() {
        return showAsApplicable;
    }

    public void setShowAsApplicable(boolean showAsApplicable) {
        this.showAsApplicable = showAsApplicable;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCalculationType() {
        return calculationType;
    }

    public void setCalculationType(String calculationType) {
        this.calculationType = calculationType;
    }

    public BigDecimal getCalculationValue() {
        return calculationValue;
    }

    public void setCalculationValue(BigDecimal calculationValue) {
        this.calculationValue = calculationValue;
    }

    public String getSourceComponent() {
        return sourceComponent;
    }

    public void setSourceComponent(String sourceComponent) {
        this.sourceComponent = sourceComponent;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getFormula() {
        return formula;
    }

    public void setFormula(String formula) {
        this.formula = formula;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        this.isActive = active;
    }
}
