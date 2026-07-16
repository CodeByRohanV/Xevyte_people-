package com.register.example.controller;

import java.util.*;
import java.util.stream.Collectors;
import java.util.Base64;

import com.register.example.entity.Employee;
import com.register.example.entity.GlobalSettings;
import com.register.example.entity.PasswordResetToken;
import com.register.example.payload.LoginRequest;
import com.register.example.entity.Resignation;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.PasswordResetTokenRepository;
import com.register.example.repository.ResignationRepository;
import com.register.example.repository.TenantRepository;
import com.register.example.security.JwtTokenProvider;
import com.register.example.service.AuditService;
import com.register.example.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import java.util.Base64;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final String CONST_MESSAGE = "message";
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ResignationRepository resignationRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.register.example.service.GlobalSettingsService globalSettingsService;

    @Value("${FRONTEND_URL}")
    private String frontendUrl;

    @Value("${BASE_DOMAIN:hrms.scaloz.com}")
    private String baseDomain;

    @Value("${spring.mail.username}")
    private String fromEmail;



    @GetMapping("/global-settings/{key}")
    public List<Map<String, Object>> getGlobalSettings(@PathVariable String key) {
        logger.info("Public fetch for global settings key: {}", key);
        List<GlobalSettings> settings = globalSettingsService.getAllSettingsByKey(key);
        logger.info("Found {} global settings", settings.size());
        
        return settings.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("settingKey", s.getSettingKey());
            map.put("content", s.getContent());
            if (s.getMediaData() != null) {
                map.put("mediaData", Base64.getEncoder().encodeToString(s.getMediaData()));
            }
            return map;
        }).collect(Collectors.toList());
    }

    private String getSubdomainFromRequest(HttpServletRequest request) {
        String serverName = request.getServerName();
        if (serverName == null || "localhost".equals(serverName)) return null;

        // 1. Handle local development (e.g., test.localhost)
        if (serverName.endsWith(".localhost")) {
            String[] parts = serverName.split("\\.");
            return parts[0];
        }

        // 2. Handle production domains (scaloz.com)
        if (serverName.endsWith(".scaloz.com")) {
            return extractProductionSubdomain(serverName);
        }

        return null;
    }

    private String extractProductionSubdomain(String serverName) {
        String[] parts = serverName.split("\\.");
        int scalozIndex = -1;
        for (int i = 0; i < parts.length; i++) {
            if ("scaloz".equalsIgnoreCase(parts[i])) {
                scalozIndex = i;
                break;
            }
        }

        if (scalozIndex > 0) {
            String prevPart = parts[scalozIndex - 1];
            if ("hrms".equalsIgnoreCase(prevPart) || "hrmstest".equalsIgnoreCase(prevPart)) {
                // e.g., tcs.hrmstest.scaloz.com or xevyte.hrms.scaloz.com
                if (scalozIndex > 1) {
                    return parts[scalozIndex - 2];
                }
                return null; // Just hrms.scaloz.com
            } else {
                // e.g., xevyte.scaloz.com
                return prevPart;
            }
        }
        return null;
    }


    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        // ──────────────────────────────────────────────────────────────────────
        // SSO MIGRATION: Login is now handled centrally by Scaloz IAM.
        // This endpoint is intentionally disabled. Users must authenticate via:
        //   → http://localhost:3001 (Scaloz IAM Tenant Login)
        //
        // The Scaloz IAM issues a JWT containing: tenant, role, apps, employeeId
        // HRMS validates that JWT as a Resource Server.
        //
        // To restore local login temporarily, comment out the return below.
        // ──────────────────────────────────────────────────────────────────────
        return ResponseEntity.status(HttpStatus.GONE)
                .body(Map.of(
                        CONST_MESSAGE, "Direct login is disabled. Please login via Scaloz IAM (SSO).",
                        "ssoLoginUrl", "http://localhost:3001",
                        "reason", "This HRMS is now configured as an OAuth Resource Server."
                ));
    }


    // Forgot Password - send reset email with HTML content
    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        String employeeId = request.get("employeeId");
        Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(employeeId);

        if (employeeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(CONST_MESSAGE, "Invalid Employee ID. Please verify and try again."));
        }

        Employee employee = employeeOpt.get();

        if (employee.getActive() != null && "no".equalsIgnoreCase(employee.getActive())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(CONST_MESSAGE, "Your account is inactive. Please contact your administrator."));
        }

        // Clear old tokens
        tokenRepository.deleteByEmployeeId(employeeId);

        String token = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(30);
        PasswordResetToken resetToken = new PasswordResetToken(token, employeeId, expiry);
        tokenRepository.save(resetToken);

        String tenantId = employee.getTenantId();
        com.register.example.entity.Tenant tenant = (tenantId != null) ? tenantRepository.findByTenantId(tenantId).orElse(null) : null;
        String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null) ? tenant.getTenantName() : "our company";
        String resolvedSupportEmail = (tenant != null && tenant.getAdminEmail() != null) ? tenant.getAdminEmail() : fromEmail;

        String tenantUrl = emailService.getTenantFrontendUrl(tenantId);

        String resetLink = tenantUrl + "/reset-password?token=" + token;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            try {
                helper.setFrom(fromEmail, resolvedCompanyName);
            } catch (Exception e) {
                helper.setFrom(fromEmail);
            }
            if (resolvedSupportEmail != null && !resolvedSupportEmail.isEmpty()) {
                helper.setReplyTo(resolvedSupportEmail);
            }
            helper.setTo(employee.getEmail());

            helper.setSubject("Password Reset Request for Your " + resolvedCompanyName + " Account");

            String content = ""
                    + "<p>Dear " + employee.getFirstName() + " " + employee.getLastName() + ",</p>"
                    + "<p>We received a request to reset the password for your account associated with this email address.</p>"
                    + "<p>To proceed, please click the button below to reset your password:</p>"
                    + "<p><a href=\"" + resetLink
                    + "\" style=\"display:inline-block; padding:10px 16px; background-color:#4CAF50; color:white; text-decoration:none; border-radius:5px;\">🔗 Reset Password</a></p>"
                    + "<p>(This link will be valid for the next 30 minutes.)</p>"
                    + "<p>If you did not request this change, you can safely ignore this email—your password will remain unchanged.</p>"
                    + "<p>If you have any questions or need assistance, please contact our support team at <a href=\"mailto:" + resolvedSupportEmail + "\">" + resolvedSupportEmail + "</a>.</p>"
                    + "<p>Thank you,<br>" + resolvedCompanyName + "</p>";

            helper.setText(content, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(CONST_MESSAGE,
                            "We are unable to send the reset email. Please try again later or contact HR for assistance."));
        }

        return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Password reset link sent to your email."));
    }

    // Reset Password Endpoint
    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        String confirmPassword = request.get("confirmPassword");

        String passwordPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$";

        if (!newPassword.matches(passwordPattern)) {
            return ResponseEntity.badRequest().body(Map.of(
                    CONST_MESSAGE,
                    "Your new password does not meet security requirements. Password must be at least 8 characters and include uppercase letters, numbers, and special characters."));
        }

        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty() || tokenOpt.get().getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    CONST_MESSAGE, "The password reset link is invalid or has expired. Please request a new one."));
        }

        PasswordResetToken resetToken = tokenOpt.get();
        Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(resetToken.getEmployeeId());

        if (employeeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_MESSAGE, "Employee not found."));
        }

        Employee employee = employeeOpt.get();

        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(CONST_MESSAGE, "The passwords you entered do not match. Please re-enter them."));
        }
        if (encoder.matches(newPassword, employee.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(CONST_MESSAGE,
                    "Your new password cannot be the same as your previous password. Please choose a different one."));
        }

        employee.setPassword(encoder.encode(newPassword));
        employee.setAccountLocked(false);
        employee.setFailedAttempts(0);
        employee.setMustChangePassword(false);
        employeeRepository.save(employee);

        tokenRepository.deleteByToken(token);

        return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Password reset successful."));
    }

    // Updated Change Password endpoint WITHOUT JWT
    @PostMapping("/change-password")
    @Transactional
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody Map<String, String> request) {

        String employeeId = request.get("employeeId");
        String newPassword = request.get("newPassword");

        if (employeeId == null || employeeId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(CONST_MESSAGE, "Employee ID is required."));
        }

        Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(employeeId);
        if (employeeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(CONST_MESSAGE, "Employee not found."));
        }

        Employee employee = employeeOpt.get();

        // Password validation pattern (same as frontend)
        String passwordPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$";

        if (newPassword == null || !newPassword.matches(passwordPattern)) {
            return ResponseEntity.badRequest().body(Map.of(
                    CONST_MESSAGE,
                    "Password must be at least 8 characters, include uppercase, lowercase, number, and special character."));
        }

        if (encoder.matches(newPassword, employee.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(CONST_MESSAGE,
                    "Your new password cannot be the same as your previous password. Please choose a different one."));
        }

        employee.setPassword(encoder.encode(newPassword));
        employee.setMustChangePassword(false);
        employeeRepository.save(employee);

        return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Password changed successfully"));
    }
}
