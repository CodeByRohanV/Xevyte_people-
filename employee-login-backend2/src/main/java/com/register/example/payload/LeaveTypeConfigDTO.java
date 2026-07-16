package com.register.example.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveTypeConfigDTO {
    private String name;
    private String unit;
    private Boolean halfDayAllowed;
    private Boolean documentRequired;
    private Integer documentThreshold;
    private Boolean sandwichRule;
    private String optionalHolidays; // ✅ For Optional Leave type
    private String falloutLeaveType; // ✅ For Spillover/Fallout logic
}
