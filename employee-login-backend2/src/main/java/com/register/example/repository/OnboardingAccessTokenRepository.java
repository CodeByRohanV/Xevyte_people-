package com.register.example.repository;

import com.register.example.entity.OnboardingAccessToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OnboardingAccessTokenRepository 
        extends JpaRepository<OnboardingAccessToken, Long> {

    Optional<OnboardingAccessToken> findByToken(String token);
}
