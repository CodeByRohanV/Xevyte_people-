package com.register.example.payload;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class LeavestypePolicyDTO {

    private Long id;
    private String name;
    private String unit;
    private Integer yearlyQuota;
    private Boolean sandwichRule;
    private Boolean documentRequired;
    private Integer documentThreshold;
    private Boolean halfDayAllowed;
    private String roundingRule;
    private Boolean active;
    private String status;
    private String optionalHolidays;
    private String tenantId;

    // Explicit getters/setters to guard against Lombok annotation processing failures
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Integer getYearlyQuota() { return yearlyQuota; }
    public void setYearlyQuota(Integer yearlyQuota) { this.yearlyQuota = yearlyQuota; }

    public Boolean getSandwichRule() { return sandwichRule; }
    public void setSandwichRule(Boolean sandwichRule) { this.sandwichRule = sandwichRule; }

    public Boolean getDocumentRequired() { return documentRequired; }
    public void setDocumentRequired(Boolean documentRequired) { this.documentRequired = documentRequired; }

    public Integer getDocumentThreshold() { return documentThreshold; }
    public void setDocumentThreshold(Integer documentThreshold) { this.documentThreshold = documentThreshold; }

    public Boolean getHalfDayAllowed() { return halfDayAllowed; }
    public void setHalfDayAllowed(Boolean halfDayAllowed) { this.halfDayAllowed = halfDayAllowed; }

    public String getRoundingRule() { return roundingRule; }
    public void setRoundingRule(String roundingRule) { this.roundingRule = roundingRule; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOptionalHolidays() { return optionalHolidays; }
    public void setOptionalHolidays(String optionalHolidays) { this.optionalHolidays = optionalHolidays; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}

