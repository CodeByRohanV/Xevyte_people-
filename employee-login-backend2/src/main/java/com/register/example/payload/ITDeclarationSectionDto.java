package com.register.example.payload;

/**
 * DTO for IT Declaration Section metadata exposed to external applications
 */
public class ITDeclarationSectionDto {

    private String sectionName;
    private Double sectionMaxLimit;
    private Double totalDeclared;
    private String description;
    private Integer displayOrder;

    // Constructors
    public ITDeclarationSectionDto() {
    }

    public ITDeclarationSectionDto(String sectionName, Double sectionMaxLimit, Double totalDeclared, String description, Integer displayOrder) {
        this.sectionName = sectionName;
        this.sectionMaxLimit = sectionMaxLimit;
        this.totalDeclared = totalDeclared;
        this.description = description;
        this.displayOrder = displayOrder;
    }

    // Getters and Setters
    public String getSectionName() {
        return sectionName;
    }

    public void setSectionName(String sectionName) {
        this.sectionName = sectionName;
    }

    public Double getSectionMaxLimit() {
        return sectionMaxLimit;
    }

    public void setSectionMaxLimit(Double sectionMaxLimit) {
        this.sectionMaxLimit = sectionMaxLimit;
    }

    public Double getTotalDeclared() {
        return totalDeclared;
    }

    public void setTotalDeclared(Double totalDeclared) {
        this.totalDeclared = totalDeclared;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
