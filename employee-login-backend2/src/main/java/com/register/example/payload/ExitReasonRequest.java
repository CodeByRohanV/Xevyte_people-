package com.register.example.payload;

import lombok.Data;

@Data
public class ExitReasonRequest {
    private String reason;
    private Integer noticePeriodDays;
}
