package com.register.example.controller;

import com.register.example.entity.Applicant;
import com.register.example.service.EmailService;
import com.register.example.repository.ApplicantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/v1/emails")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private ApplicantRepository applicantRepository;

    // =====================================================
    // ✅ Endpoint to Send Onboarding Email WITH CC (AM + HR)
    // =====================================================
    @PostMapping("/send-onboarding-link")
    public ResponseEntity<Object> sendOnboardingEmail(@RequestBody Applicant applicant) {

        if (applicant.getEmail() == null || applicant.getFirstName() == null) {
            Map<String, String> response = new HashMap<>(); // Consistent JSON
            response.put("message", "⚠️ Missing required applicant details.");
            return ResponseEntity.badRequest().body(response);
        }

        String fullName = applicant.getFirstName() + " " + applicant.getLastName();

        // ✅ UPDATE TIMESTAMP ON EVERY SEND/RESEND
        applicantRepository.findByApplicantId(applicant.getApplicantId()).ifPresent(app -> {
            app.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            applicantRepository.save(app);
        });

        // ⭐ NEW — pass AM + HR IDs also
        emailService.sendOnboardingInviteEmail(
                applicant.getEmail(),
                fullName,
                applicant.getApplicantId(),
                applicant.getAmId(),     // <-- Added
                applicant.getHrId()      // <-- Added
        );

        Map<String, String> response = new HashMap<>();
        response.put("message", "✅ Onboarding email sent successfully to " + applicant.getEmail());
        return ResponseEntity.ok(response);
    }

    // =====================================================
    // ✅ Test Email Endpoint (optional)
    // =====================================================
    @GetMapping("/test")
    public ResponseEntity<String> testEmail() {
        try {
            emailService.sendOnboardingInviteEmail(
                    "your-personal-email@gmail.com",
                    "Test User",
                    "APPL-TEST-0001",
                    null,
                    null
            );
            return ResponseEntity.ok("✅ Test email triggered successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("❌ Error sending test email: " + e.getMessage());
        }
    }

    @PostMapping("/send-reupload-mail")
    public ResponseEntity<String> sendReuploadMail(@RequestBody Map<String, Object> req) {

        String applicantId = (String) req.get("applicantId");
        String applicantName = (String) req.get("applicantName");
        String email = (String) req.get("email");
        List<String> documents = (List<String>) req.get("documents");

        if (email == null || documents == null || documents.isEmpty()) {
            return ResponseEntity.badRequest().body("Missing fields");
        }

        // ✅ UPDATE TIMESTAMP ON RE-UPLOAD REQUEST
        applicantRepository.findByApplicantId(applicantId).ifPresent(app -> {
            app.setTimestamp(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            applicantRepository.save(app);
        });

        emailService.sendReuploadEmail(email, applicantName, applicantId, documents);

        return ResponseEntity.ok("Re-upload request email sent successfully!");
    }

}