package com.register.example.dto;

public class SalaryMetricsDTO {

    private Double latestNetPay;
    private Double ytdEarnings;
    private Double ytdDeductions;
    private String payPeriod;

    public SalaryMetricsDTO() {
    }

    public SalaryMetricsDTO(Double latestNetPay, Double ytdEarnings, Double ytdDeductions, String payPeriod) {
        this.latestNetPay = latestNetPay;
        this.ytdEarnings = ytdEarnings;
        this.ytdDeductions = ytdDeductions;
        this.payPeriod = payPeriod;
    }

    public Double getLatestNetPay() { return latestNetPay; }
    public void setLatestNetPay(Double latestNetPay) { this.latestNetPay = latestNetPay; }

    public Double getYtdEarnings() { return ytdEarnings; }
    public void setYtdEarnings(Double ytdEarnings) { this.ytdEarnings = ytdEarnings; }

    public Double getYtdDeductions() { return ytdDeductions; }
    public void setYtdDeductions(Double ytdDeductions) { this.ytdDeductions = ytdDeductions; }

    public String getPayPeriod() { return payPeriod; }
    public void setPayPeriod(String payPeriod) { this.payPeriod = payPeriod; }
}
