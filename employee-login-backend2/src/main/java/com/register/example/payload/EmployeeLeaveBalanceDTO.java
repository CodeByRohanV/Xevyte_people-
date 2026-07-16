package com.register.example.payload;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeLeaveBalanceDTO {
    private String type;
    private Double granted;
    private Double consumed;
    private Double balance;
    private Double encashedCount;
    private Double lopCount;

    // Policy Info for the card
    private Boolean carryForwardAllowed;
    private Double maxCarryForwardLimit;
    private String carryForwardDate;
    private Double autoEncashableExcess; // (Balance - maxCarryForwardLimit) if > 0
    private Boolean encashmentAllowed; // Whether encashment is enabled for this leave type
    private String accrualMode; // MONTHLY, QUARTERLY, YEARLY
    private String accrualDateType; // FIRST_DAY, LAST_DAY, CUSTOM_DAY

    // Explicit getters/setters to guard against Lombok annotation processing failures
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Double getGranted() { return granted; }
    public void setGranted(Double granted) { this.granted = granted; }

    public Double getConsumed() { return consumed; }
    public void setConsumed(Double consumed) { this.consumed = consumed; }

    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }

    public Double getEncashedCount() { return encashedCount; }
    public void setEncashedCount(Double encashedCount) { this.encashedCount = encashedCount; }

    public Double getLopCount() { return lopCount; }
    public void setLopCount(Double lopCount) { this.lopCount = lopCount; }

    public Boolean getCarryForwardAllowed() { return carryForwardAllowed; }
    public void setCarryForwardAllowed(Boolean carryForwardAllowed) { this.carryForwardAllowed = carryForwardAllowed; }

    public Double getMaxCarryForwardLimit() { return maxCarryForwardLimit; }
    public void setMaxCarryForwardLimit(Double maxCarryForwardLimit) { this.maxCarryForwardLimit = maxCarryForwardLimit; }

    public String getCarryForwardDate() { return carryForwardDate; }
    public void setCarryForwardDate(String carryForwardDate) { this.carryForwardDate = carryForwardDate; }

    public Double getAutoEncashableExcess() { return autoEncashableExcess; }
    public void setAutoEncashableExcess(Double autoEncashableExcess) { this.autoEncashableExcess = autoEncashableExcess; }

    public Boolean getEncashmentAllowed() { return encashmentAllowed; }
    public void setEncashmentAllowed(Boolean encashmentAllowed) { this.encashmentAllowed = encashmentAllowed; }

    public String getAccrualMode() { return accrualMode; }
    public void setAccrualMode(String accrualMode) { this.accrualMode = accrualMode; }

    public String getAccrualDateType() { return accrualDateType; }
    public void setAccrualDateType(String accrualDateType) { this.accrualDateType = accrualDateType; }
}

