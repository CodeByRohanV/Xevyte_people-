package com.register.example.controller;
 
import com.register.example.entity.OnboardingAccessToken;
import com.register.example.repository.ApplicantRepository;
import com.register.example.repository.OnboardingAccessTokenRepository;
import com.register.example.service.EmailService;
import com.register.example.service.AuditService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.Map;
import java.util.HashMap;
 
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class OnboardingAuthController {
 
    private static final Random RANDOM = new Random();

    private static final String CONST_ONBOARDING_AUTH = "ONBOARDING_AUTH";
    private static final String CONST_SEND_ONBOARDING_OTP = "SEND_ONBOARDING_OTP";
    private static final String CONST_ONBOARDING_OTP = "OnboardingOTP";
    private static final String CONST_APPLICANT = "APPLICANT";
    private static final String CONST_VERIFY_ONBOARDING_OTP = "VERIFY_ONBOARDING_OTP";

    private final OnboardingAccessTokenRepository tokenRepo;
    private final ApplicantRepository applicantRepo;
    private final EmailService emailService;
    private final AuditService auditService;
    private final com.register.example.security.JwtTokenProvider jwtTokenProvider;

    public OnboardingAuthController(OnboardingAccessTokenRepository tokenRepo,
                                    ApplicantRepository applicantRepo,
                                    EmailService emailService,
                                    AuditService auditService,
                                    com.register.example.security.JwtTokenProvider jwtTokenProvider) {
        this.tokenRepo = tokenRepo;
        this.applicantRepo = applicantRepo;
        this.emailService = emailService;
        this.auditService = auditService;
        this.jwtTokenProvider = jwtTokenProvider;
    }
 
    // SEND OTP ---------------------------------------------------------
    @PostMapping("/send-otp")
    public String sendOtp(@RequestParam String token, HttpServletRequest request) {

        try {
            OnboardingAccessToken record = tokenRepo.findByToken(token)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid link"));

            if (record.getExpiry().isBefore(LocalDateTime.now())) {
                auditService.logCustomAction(CONST_SEND_ONBOARDING_OTP, CONST_ONBOARDING_AUTH, CONST_ONBOARDING_OTP, null, 
                        record.getApplicantId(), CONST_APPLICANT, "Failed to send OTP - Link expired", null, null, null, request);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Link Expired");
            }

            String otp = "" + (RANDOM.nextInt(899999) + 100000);

            record.setOtp(otp);
            record.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            tokenRepo.save(record);

            String email = applicantRepo.findByApplicantId(record.getApplicantId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Applicant not found"))
                    .getEmail();

            emailService.sendEmail(email, "Your OTP Verification Code",
                     "Your OTP is: " + otp + "\n\nValid for 10 minutes.");

            // Log successful OTP send
            HashMap<String, Object> otpData = new HashMap<>();
            otpData.put("email", email);
            otpData.put("otpExpiry", record.getOtpExpiry());
            
            auditService.logCustomAction(CONST_SEND_ONBOARDING_OTP, CONST_ONBOARDING_AUTH, CONST_ONBOARDING_OTP, null, 
                    record.getApplicantId(), CONST_APPLICANT, "OTP sent successfully", null, otpData, null, request);

            return "OTP sent";
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            auditService.logCustomAction(CONST_SEND_ONBOARDING_OTP, CONST_ONBOARDING_AUTH, CONST_ONBOARDING_OTP, null, 
                    null, CONST_APPLICANT, "Failed to send OTP - Error: " + e.getMessage(), null, null, null, request);
            throw e;
        }
    }
 
    // VERIFY OTP ---------------------------------------------------------
    @PostMapping("/verify-otp")
    public org.springframework.http.ResponseEntity<Map<String, Object>> verifyOtp(@RequestParam String token,
                             @RequestParam String otp,
                             HttpServletRequest request) {

        try {
            OnboardingAccessToken record = tokenRepo.findByToken(token)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid link"));

            if (record.getOtpExpiry().isBefore(LocalDateTime.now())) {
                auditService.logCustomAction(CONST_VERIFY_ONBOARDING_OTP, CONST_ONBOARDING_AUTH, CONST_ONBOARDING_OTP, null, 
                        record.getApplicantId(), CONST_APPLICANT, "Failed to verify OTP - OTP expired", null, null, null, request);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP Expired");
            }

            if (!record.getOtp().equals(otp)) {
                auditService.logCustomAction(CONST_VERIFY_ONBOARDING_OTP, CONST_ONBOARDING_AUTH, CONST_ONBOARDING_OTP, null, 
                        record.getApplicantId(), CONST_APPLICANT, "Failed to verify OTP - Invalid OTP", null, null, null, request);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
            }

            // Log successful OTP verification
            HashMap<String, Object> verificationData = new HashMap<>();
            verificationData.put("otpExpiry", record.getOtpExpiry());
            verificationData.put("tokenExpiry", record.getExpiry());
            
            auditService.logCustomAction(CONST_VERIFY_ONBOARDING_OTP, CONST_ONBOARDING_AUTH, CONST_ONBOARDING_OTP, null, 
                    record.getApplicantId(), CONST_APPLICANT, "OTP verified successfully", null, verificationData, null, request);

            // Generate JWT for applicant
            String jwtToken = jwtTokenProvider.generateToken(record.getApplicantId());

            Map<String, Object> response = new HashMap<>();
            response.put("applicantId", record.getApplicantId());
            response.put("token", jwtToken);

            return org.springframework.http.ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            auditService.logCustomAction(CONST_VERIFY_ONBOARDING_OTP, CONST_ONBOARDING_AUTH, CONST_ONBOARDING_OTP, null, 
                    null, CONST_APPLICANT, "Failed to verify OTP - Error: " + e.getMessage(), null, null, null, request);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Verification failed");
        }
    }
}