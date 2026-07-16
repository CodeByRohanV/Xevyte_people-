package com.register.example.repository;

import com.register.example.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByToken(String token);
    void deleteByEmployeeId(String employeeId);
    void deleteByToken(String token); // ✅ Add this
}

