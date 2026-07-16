package com.register.example.payload;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveTypeDTO {

    private Long id;
    private String name;
    private String unit;
    private Integer yearlyQuota;
    private Boolean sandwichRule;
    private Boolean documentRequired;
    private Integer documentThreshold;
    private Boolean halfDayAllowed;

    private Boolean active;
}
