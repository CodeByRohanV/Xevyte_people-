package com.register.example.dto;

public class ExpenseMetricsDTO {

    private Double totalPendingAmount;
    private Long pendingClaimCount;
    private Double totalApprovedAmount;
    private Long approvedClaimCount;
    private Long pendingTravelRequests;
    private Long approvedTravelRequests;
    private Integer averageApprovalDays;

    public ExpenseMetricsDTO() {
    }

    public ExpenseMetricsDTO(Double totalPendingAmount, Long pendingClaimCount,
                             Double totalApprovedAmount, Long approvedClaimCount,
                             Long pendingTravelRequests, Long approvedTravelRequests,
                             Integer averageApprovalDays) {
        this.totalPendingAmount = totalPendingAmount;
        this.pendingClaimCount = pendingClaimCount;
        this.totalApprovedAmount = totalApprovedAmount;
        this.approvedClaimCount = approvedClaimCount;
        this.pendingTravelRequests = pendingTravelRequests;
        this.approvedTravelRequests = approvedTravelRequests;
        this.averageApprovalDays = averageApprovalDays;
    }

    public Double getTotalPendingAmount() { return totalPendingAmount; }
    public void setTotalPendingAmount(Double totalPendingAmount) { this.totalPendingAmount = totalPendingAmount; }

    public Long getPendingClaimCount() { return pendingClaimCount; }
    public void setPendingClaimCount(Long pendingClaimCount) { this.pendingClaimCount = pendingClaimCount; }

    public Double getTotalApprovedAmount() { return totalApprovedAmount; }
    public void setTotalApprovedAmount(Double totalApprovedAmount) { this.totalApprovedAmount = totalApprovedAmount; }

    public Long getApprovedClaimCount() { return approvedClaimCount; }
    public void setApprovedClaimCount(Long approvedClaimCount) { this.approvedClaimCount = approvedClaimCount; }

    public Long getPendingTravelRequests() { return pendingTravelRequests; }
    public void setPendingTravelRequests(Long pendingTravelRequests) { this.pendingTravelRequests = pendingTravelRequests; }

    public Long getApprovedTravelRequests() { return approvedTravelRequests; }
    public void setApprovedTravelRequests(Long approvedTravelRequests) { this.approvedTravelRequests = approvedTravelRequests; }

    public Integer getAverageApprovalDays() { return averageApprovalDays; }
    public void setAverageApprovalDays(Integer averageApprovalDays) { this.averageApprovalDays = averageApprovalDays; }
}
