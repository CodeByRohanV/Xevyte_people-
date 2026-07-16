package com.register.example.service;

import com.register.example.entity.OnboardingAccessToken;
import com.register.example.repository.OnboardingAccessTokenRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class OnboardingTokenService {

    private final OnboardingAccessTokenRepository tokenRepo;

    public OnboardingTokenService(OnboardingAccessTokenRepository tokenRepo) {
        this.tokenRepo = tokenRepo;
    }

    // Generate token
    public String generateTokenForApplicant(String applicantId) {

        String token = UUID.randomUUID().toString().replace("-", "") +
                UUID.randomUUID().toString().replace("-", "");

        OnboardingAccessToken oat = new OnboardingAccessToken();
        oat.setApplicantId(applicantId);
        oat.setToken(token);
        oat.setExpiry(LocalDateTime.now().plusHours(24)); // 24 hours link validity

        tokenRepo.save(oat);

        return token;
    }

    public OnboardingAccessToken validateToken(String token) {
        return tokenRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid link"));
    }
}
