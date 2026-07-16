package com.register.example.payload;

/**
 * DTO for IT Declaration component metadata including max limits
 */
public class ITDeclarationComponentDto {

    private String fieldId;
    private String fieldLabel;
    private String dataType;
    private Double maxLimit;
    private Boolean required;
    private String placeholder;
    private Integer displayOrder;
    private String cardTitle;

    // Constructors
    public ITDeclarationComponentDto() {
    }

    public ITDeclarationComponentDto(String fieldId, String fieldLabel, String dataType,
                                      Double maxLimit, Boolean required, String placeholder,
                                      Integer displayOrder, String cardTitle) {
        this.fieldId = fieldId;
        this.fieldLabel = fieldLabel;
        this.dataType = dataType;
        this.maxLimit = maxLimit;
        this.required = required;
        this.placeholder = placeholder;
        this.displayOrder = displayOrder;
        this.cardTitle = cardTitle;
    }

    // Getters and Setters
    public String getFieldId() {
        return fieldId;
    }

    public void setFieldId(String fieldId) {
        this.fieldId = fieldId;
    }

    public String getFieldLabel() {
        return fieldLabel;
    }

    public void setFieldLabel(String fieldLabel) {
        this.fieldLabel = fieldLabel;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public Double getMaxLimit() {
        return maxLimit;
    }

    public void setMaxLimit(Double maxLimit) {
        this.maxLimit = maxLimit;
    }

    public Boolean getRequired() {
        return required;
    }

    public void setRequired(Boolean required) {
        this.required = required;
    }

    public String getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public String getCardTitle() {
        return cardTitle;
    }

    public void setCardTitle(String cardTitle) {
        this.cardTitle = cardTitle;
    }
}
