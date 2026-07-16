package com.register.example.payload;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class LeaveUnifiedPolicyDTO {

    private Long id;
    private Long leaveTypeId;
    private String tenantId;
    private String policyName;
    private Integer priority;
    private String location;
    private String gender;
    private Double yearlyQuota;
    private String accrualMode;
    private Boolean proRata;
    private String accrualDateType;
    private Integer customAccrualDay;
    private LocalDate customAccrualDate;
    private Boolean negativeAllowed;
    private Integer maxNegativeBalance;
    private String roundingRule;
    private String falloutLeaveType;
    private Boolean carryForwardAllowed;
    private Integer maxCarryForwardLimit;
    private String carryForwardTo;
    private Long targetLeaveTypeId;
    private Boolean lapseApplicable;
    private String lapseMode;
    private LocalDate lapseDate;
    private LocalDate carryForwardDate;
    private Boolean encashmentAllowed;
    private String encashEligibleCandidates;
    private Integer minBalanceToRetain;
    private String encashmentFormula;
    private Boolean active;
}
