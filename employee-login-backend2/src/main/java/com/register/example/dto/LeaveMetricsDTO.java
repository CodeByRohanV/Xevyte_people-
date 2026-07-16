package com.register.example.dto;

import java.util.List;

public class LeaveMetricsDTO {

    private Double totalGranted;
    private Double totalConsumed;
    private Double totalBalance;
    private Double approvedDaysInRange;
    private String utilizationPace;
    private List<LeaveTypeBreakdown> breakdownByType;

    public LeaveMetricsDTO() {
    }

    public LeaveMetricsDTO(Double totalGranted, Double totalConsumed, Double totalBalance,
                           Double approvedDaysInRange, String utilizationPace, List<LeaveTypeBreakdown> breakdownByType) {
        this.totalGranted = totalGranted;
        this.totalConsumed = totalConsumed;
        this.totalBalance = totalBalance;
        this.approvedDaysInRange = approvedDaysInRange;
        this.utilizationPace = utilizationPace;
        this.breakdownByType = breakdownByType;
    }

    public Double getTotalGranted() { return totalGranted; }
    public void setTotalGranted(Double totalGranted) { this.totalGranted = totalGranted; }

    public Double getTotalConsumed() { return totalConsumed; }
    public void setTotalConsumed(Double totalConsumed) { this.totalConsumed = totalConsumed; }

    public Double getTotalBalance() { return totalBalance; }
    public void setTotalBalance(Double totalBalance) { this.totalBalance = totalBalance; }

    public Double getApprovedDaysInRange() { return approvedDaysInRange; }
    public void setApprovedDaysInRange(Double approvedDaysInRange) { this.approvedDaysInRange = approvedDaysInRange; }

    public String getUtilizationPace() { return utilizationPace; }
    public void setUtilizationPace(String utilizationPace) { this.utilizationPace = utilizationPace; }

    public List<LeaveTypeBreakdown> getBreakdownByType() { return breakdownByType; }
    public void setBreakdownByType(List<LeaveTypeBreakdown> breakdownByType) { this.breakdownByType = breakdownByType; }

    // Inner class for per-type breakdown
    public static class LeaveTypeBreakdown {
        private String leaveType;
        private Double granted;
        private Double consumed;
        private Double balance;

        public LeaveTypeBreakdown() {}

        public LeaveTypeBreakdown(String leaveType, Double granted, Double consumed, Double balance) {
            this.leaveType = leaveType;
            this.granted = granted;
            this.consumed = consumed;
            this.balance = balance;
        }

        public String getLeaveType() { return leaveType; }
        public void setLeaveType(String leaveType) { this.leaveType = leaveType; }

        public Double getGranted() { return granted; }
        public void setGranted(Double granted) { this.granted = granted; }

        public Double getConsumed() { return consumed; }
        public void setConsumed(Double consumed) { this.consumed = consumed; }

        public Double getBalance() { return balance; }
        public void setBalance(Double balance) { this.balance = balance; }
    }
}
