package com.register.example.payload;

import lombok.Data;

@Data
public class LeaveAccrualPreviewDTO {
    private double baseQuantity;
    private double proRataFactor;
    private double proRataQuantity;
    private String roundingRule;
    private double finalQuantity;
    private String explanation;
}
