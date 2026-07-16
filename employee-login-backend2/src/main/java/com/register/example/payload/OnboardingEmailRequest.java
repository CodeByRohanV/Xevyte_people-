package com.register.example.payload;


import lombok.Data;

@Data
public class OnboardingEmailRequest {
    private String applicantId;
    private String applicantEmail;
    private String applicantName;
}
