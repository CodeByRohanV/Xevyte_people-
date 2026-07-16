package com.register.example.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class OnboardingAccessToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "applicant_id", length = 50)
private String applicantId;

    @Column(unique = true)
    private String token;

    @Column(name = "otp", length = 50)
private String otp;
    private LocalDateTime expiry;
    private LocalDateTime otpExpiry;

    // Getters & Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

    public LocalDateTime getExpiry() { return expiry; }
    public void setExpiry(LocalDateTime expiry) { this.expiry = expiry; }

    public LocalDateTime getOtpExpiry() { return otpExpiry; }
    public void setOtpExpiry(LocalDateTime otpExpiry) { this.otpExpiry = otpExpiry; }
}
