package com.register.example.payload;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveEligibilityPreviewDTO {
    private String employeeId;
    private String employeeName;
    private Long leaveTypeId;
    private boolean eligible;
    private String message;
    private List<EligibilityCriteriaDetail> details;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EligibilityCriteriaDetail {
        private String criteria;
        private String requiredValue;
        private String employeeValue;
        private boolean matched;
    }
}
