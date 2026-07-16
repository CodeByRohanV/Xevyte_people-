package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "it_declaration_cards")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class ITDeclarationCard extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "financial_year", length = 10)
    private String financialYear;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "icon_name", length = 50)
private String iconName;// e.g., "FiDollarSign", "FiHome", etc.

    @Column(name = "is_active")
    private Boolean active = true;

    private Integer displayOrder;

    @Column(name = "multiple_allowed")
    private Boolean multipleAllowed = false;

    @Column(name = "max_entries")
    private Integer maxEntries = 1;

    @Column(name = "section_max_limit")
    private Double sectionMaxLimit;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFinancialYear() {
        return financialYear;
    }

    public void setFinancialYear(String financialYear) {
        this.financialYear = financialYear;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIconName() {
        return iconName;
    }

    public void setIconName(String iconName) {
        this.iconName = iconName;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Boolean getMultipleAllowed() {
        return multipleAllowed;
    }

    public void setMultipleAllowed(Boolean multipleAllowed) {
        this.multipleAllowed = multipleAllowed;
    }

    public Integer getMaxEntries() {
        return maxEntries;
    }

    public void setMaxEntries(Integer maxEntries) {
        this.maxEntries = maxEntries;
    }

    public Double getSectionMaxLimit() {
        return sectionMaxLimit;
    }

    public void setSectionMaxLimit(Double sectionMaxLimit) {
        this.sectionMaxLimit = sectionMaxLimit;
    }
}
