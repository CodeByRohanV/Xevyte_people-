package com.register.example.payload;

public class FinalSettlementDto {
    private Double pendingDues;
    private Double gratuityAmount;
    private Double noticePeriodRecovery;
    private Double finalAmountPaid;
    private String settlementDate;
    private String financeComments;

    // Default Constructor
    public FinalSettlementDto() {
        // Empty constructor required for deserialization
    }

    // Getters and Setters

    public Double getPendingDues() {
        return pendingDues;
    }

    public void setPendingDues(Double pendingDues) {
        this.pendingDues = pendingDues;
    }

    public Double getGratuityAmount() {
        return gratuityAmount;
    }

    public void setGratuityAmount(Double gratuityAmount) {
        this.gratuityAmount = gratuityAmount;
    }

    public Double getNoticePeriodRecovery() {
        return noticePeriodRecovery;
    }

    public void setNoticePeriodRecovery(Double noticePeriodRecovery) {
        this.noticePeriodRecovery = noticePeriodRecovery;
    }

    public Double getFinalAmountPaid() {
        return finalAmountPaid;
    }

    public void setFinalAmountPaid(Double finalAmountPaid) {
        this.finalAmountPaid = finalAmountPaid;
    }

    public String getSettlementDate() {
        return settlementDate;
    }

    public void setSettlementDate(String settlementDate) {
        this.settlementDate = settlementDate;
    }

    public String getFinanceComments() {
        return financeComments;
    }

    public void setFinanceComments(String financeComments) {
        this.financeComments = financeComments;
    }
}