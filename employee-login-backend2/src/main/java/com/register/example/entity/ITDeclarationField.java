package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "it_declaration_fields")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ITDeclarationField extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "card_id", nullable = false)
    private ITDeclarationCard card;

    @Column(nullable = false)
    private String fieldId; // e.g., "lic_premium"

    @Column(nullable = false)
    private String fieldLabel; // e.g., "LIC Premium"

    @Column(nullable = false, length = 50)
    private String dataType; // TEXT, NUMBER, DATE, DROPDOWN, BOOLEAN

    private String placeholder;

    private Boolean required = false;

    @Column(columnDefinition = "TEXT")
    private String validationRules; // JSON string for minLength, maxLength, min, max, regex

    @Column(columnDefinition = "TEXT")
    private String dropdownOptions; // Comma-separated or JSON list

    private Integer displayOrder = 0;
    private Double maxLimit;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ITDeclarationCard getCard() { return card; }
    public void setCard(ITDeclarationCard card) { this.card = card; }

    public String getFieldId() { return fieldId; }
    public void setFieldId(String fieldId) { this.fieldId = fieldId; }

    public String getFieldLabel() { return fieldLabel; }
    public void setFieldLabel(String fieldLabel) { this.fieldLabel = fieldLabel; }

    public String getDataType() { return dataType; }
    public void setDataType(String dataType) { this.dataType = dataType; }

    public Boolean getRequired() { return required; }
    public void setRequired(Boolean required) { this.required = required; }

    public String getValidationRules() { return validationRules; }
    public void setValidationRules(String validationRules) { this.validationRules = validationRules; }

    public String getDropdownOptions() { return dropdownOptions; }
    public void setDropdownOptions(String dropdownOptions) { this.dropdownOptions = dropdownOptions; }

    public String getPlaceholder() { return placeholder; }
    public void setPlaceholder(String placeholder) { this.placeholder = placeholder; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public Double getMaxLimit() { return maxLimit; }
    public void setMaxLimit(Double maxLimit) { this.maxLimit = maxLimit; }
}
