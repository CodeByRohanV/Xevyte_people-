package com.register.example.payload;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO for IT Declaration data exposed to external applications
 */
public class ITDeclarationExternalDto {

    private String employeeId;
    private String financialYear;
    private String status;
    private String taxRegime;
    private LocalDateTime submissionDate;
    private Map<String, String> declarationData;
    private List<ITDeclarationComponentDto> componentMetadata;
    private List<ITDeclarationSectionDto> sectionMetadata;

    // Constructors
    public ITDeclarationExternalDto() {
        // Empty constructor required for deserialization
    }

    // Getters and Setters
    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getFinancialYear() {
        return financialYear;
    }

    public void setFinancialYear(String financialYear) {
        this.financialYear = financialYear;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTaxRegime() {
        return taxRegime;
    }

    public void setTaxRegime(String taxRegime) {
        this.taxRegime = taxRegime;
    }

    public LocalDateTime getSubmissionDate() {
        return submissionDate;
    }

    public void setSubmissionDate(LocalDateTime submissionDate) {
        this.submissionDate = submissionDate;
    }

    public Map<String, String> getDeclarationData() {
        return declarationData;
    }

    public void setDeclarationData(Map<String, String> declarationData) {
        this.declarationData = declarationData;
    }

    public List<ITDeclarationComponentDto> getComponentMetadata() {
        return componentMetadata;
    }

    public void setComponentMetadata(List<ITDeclarationComponentDto> componentMetadata) {
        this.componentMetadata = componentMetadata;
    }

    public List<ITDeclarationSectionDto> getSectionMetadata() {
        return sectionMetadata;
    }

    public void setSectionMetadata(List<ITDeclarationSectionDto> sectionMetadata) {
        this.sectionMetadata = sectionMetadata;
    }
}
