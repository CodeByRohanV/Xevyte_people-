package com.register.example.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "leave_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveUnifiedPolicy extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "leave_type_id")
    private Long leaveTypeId;

    @Column(name = "tenant_id", length = 100)
    private String tenantId;

    /* Policy Identification */
    private String policyName;
    private Integer priority; // 1 = Highest, 99 = Default

    /* 1. Eligibility Rules */
    @Column(name = "location", length = 50)
    private String location;

    @Column(name = "gender", length = 50)
    private String gender;

    private Double yearlyQuota; // Yearly leave quota for this policy

    /* 2. Accrual Rules */
    @Column(name = "accrual_mode", length = 50)
    private String accrualMode; // MONTHLY, QUARTERLY, etc.

    private Boolean proRata;

    @Column(name = "accrual_date_type", length = 50)
    private String accrualDateType; // FIRST_DAY, LAST_DAY, CUSTOM_DAY

    private Integer customAccrualDay;
    private LocalDate customAccrualDate;
    private Boolean negativeAllowed;
    private Integer maxNegativeBalance;

    @Column(name = "rounding_rule", length = 50)
    private String roundingRule;

    @Column(name = "fallout_leave_type", length = 50)
    private String falloutLeaveType; // Leave Type to deduct from if quota exhausted

    /* 3. Carry Forward & Lapse Rules */
    private Boolean carryForwardAllowed;
    private Integer maxCarryForwardLimit;

    @Column(name = "carry_forward_to", length = 50)
    private String carryForwardTo; // SAME, ANOTHER

    private Long targetLeaveTypeId;
    private Boolean lapseApplicable;

    @Column(name = "lapse_mode", length = 50)
    private String lapseMode; // YEAR_END, CUSTOM_DATE

    private LocalDate lapseDate;
    private LocalDate carryForwardDate;

    /* 4. Encashment Rules */
    private Boolean encashmentAllowed;

    @Column(name = "encash_eligible_candidates", length = 50)
    private String encashEligibleCandidates; // Formerly eligibleGrades

    private Integer minBalanceToRetain;
    private String encashmentFormula;

    /* 5. Policy Status */
    @Builder.Default
    private Boolean active = true; // Individual policy active/inactive status

    // --- Explicit getters/setters to ensure Lombok annotation processing issues don't break the build ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getPolicyName() { return policyName; }
    public void setPolicyName(String policyName) { this.policyName = policyName; }

    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Double getYearlyQuota() { return yearlyQuota; }
    public void setYearlyQuota(Double yearlyQuota) { this.yearlyQuota = yearlyQuota; }

    public String getAccrualMode() { return accrualMode; }
    public void setAccrualMode(String accrualMode) { this.accrualMode = accrualMode; }

    public Boolean getProRata() { return proRata; }
    public void setProRata(Boolean proRata) { this.proRata = proRata; }

    public String getAccrualDateType() { return accrualDateType; }
    public void setAccrualDateType(String accrualDateType) { this.accrualDateType = accrualDateType; }

    public Integer getCustomAccrualDay() { return customAccrualDay; }
    public void setCustomAccrualDay(Integer customAccrualDay) { this.customAccrualDay = customAccrualDay; }

    public LocalDate getCustomAccrualDate() { return customAccrualDate; }
    public void setCustomAccrualDate(LocalDate customAccrualDate) { this.customAccrualDate = customAccrualDate; }

    public Boolean getNegativeAllowed() { return negativeAllowed; }
    public void setNegativeAllowed(Boolean negativeAllowed) { this.negativeAllowed = negativeAllowed; }

    public Integer getMaxNegativeBalance() { return maxNegativeBalance; }
    public void setMaxNegativeBalance(Integer maxNegativeBalance) { this.maxNegativeBalance = maxNegativeBalance; }

    public String getRoundingRule() { return roundingRule; }
    public void setRoundingRule(String roundingRule) { this.roundingRule = roundingRule; }

    public String getFalloutLeaveType() { return falloutLeaveType; }
    public void setFalloutLeaveType(String falloutLeaveType) { this.falloutLeaveType = falloutLeaveType; }

    public Boolean getCarryForwardAllowed() { return carryForwardAllowed; }
    public void setCarryForwardAllowed(Boolean carryForwardAllowed) { this.carryForwardAllowed = carryForwardAllowed; }

    public Integer getMaxCarryForwardLimit() { return maxCarryForwardLimit; }
    public void setMaxCarryForwardLimit(Integer maxCarryForwardLimit) { this.maxCarryForwardLimit = maxCarryForwardLimit; }

    public String getCarryForwardTo() { return carryForwardTo; }
    public void setCarryForwardTo(String carryForwardTo) { this.carryForwardTo = carryForwardTo; }

    public Long getTargetLeaveTypeId() { return targetLeaveTypeId; }
    public void setTargetLeaveTypeId(Long targetLeaveTypeId) { this.targetLeaveTypeId = targetLeaveTypeId; }

    public Boolean getLapseApplicable() { return lapseApplicable; }
    public void setLapseApplicable(Boolean lapseApplicable) { this.lapseApplicable = lapseApplicable; }

    public String getLapseMode() { return lapseMode; }
    public void setLapseMode(String lapseMode) { this.lapseMode = lapseMode; }

    public LocalDate getLapseDate() { return lapseDate; }
    public void setLapseDate(LocalDate lapseDate) { this.lapseDate = lapseDate; }

    public LocalDate getCarryForwardDate() { return carryForwardDate; }
    public void setCarryForwardDate(LocalDate carryForwardDate) { this.carryForwardDate = carryForwardDate; }

    public Boolean getEncashmentAllowed() { return encashmentAllowed; }
    public void setEncashmentAllowed(Boolean encashmentAllowed) { this.encashmentAllowed = encashmentAllowed; }

    public String getEncashEligibleCandidates() { return encashEligibleCandidates; }
    public void setEncashEligibleCandidates(String encashEligibleCandidates) { this.encashEligibleCandidates = encashEligibleCandidates; }

    public Integer getMinBalanceToRetain() { return minBalanceToRetain; }
    public void setMinBalanceToRetain(Integer minBalanceToRetain) { this.minBalanceToRetain = minBalanceToRetain; }

    public String getEncashmentFormula() { return encashmentFormula; }
    public void setEncashmentFormula(String encashmentFormula) { this.encashmentFormula = encashmentFormula; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}

