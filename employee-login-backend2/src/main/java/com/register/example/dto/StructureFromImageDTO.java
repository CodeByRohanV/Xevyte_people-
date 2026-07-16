package com.register.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StructureFromImageDTO {
    private String name;
    private String description;
    private String imageUrl;
    private String extractedText;
    private List<ExtractedComponentDTO> components;
    private Double confidence;
    private String processingStatus;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtractedComponentDTO {
        private String componentName;
        private String section; // EARNINGS or DEDUCTIONS
        private String componentType; // FIXED_VALUE, FORMULA, AS_APPLICABLE
        private Double perMonthValue;
        private Double perAnnumValue;
        private String formula;
        private Integer sequenceOrder;
        private Double confidence;
        private String rawText;
    }
}
