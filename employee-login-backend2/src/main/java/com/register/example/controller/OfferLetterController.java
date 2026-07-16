package com.register.example.controller;

import com.register.example.entity.Applicant;
import com.register.example.service.AppointmentLetterService;
import com.register.example.service.OfferLetterService;
import com.register.example.service.EmailService;
import com.register.example.service.ApplicantService;
import com.register.example.repository.ApplicantRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.register.example.repository.EmployeeRepository;

@RestController
@RequestMapping("/api/v1/letters")
@CrossOrigin(origins = "*")
public class OfferLetterController {

        @Value("${esign.api.url:https://signtest.scaloz.com}")
        private String esignApiUrl;

        private final OfferLetterService offerService;
        private final AppointmentLetterService appointmentService;
        private final ApplicantRepository applicantRepo;
        private final EmailService emailService;
        private final ApplicantService applicantService;
        private final EmployeeRepository employeeRepo;

        // Constructor Injection
        public OfferLetterController(OfferLetterService offerService,
                        AppointmentLetterService appointmentService,
                        ApplicantRepository applicantRepo,
                        EmailService emailService,
                        ApplicantService applicantService,
                        EmployeeRepository employeeRepo) {
                this.offerService = offerService;
                this.appointmentService = appointmentService;
                this.applicantRepo = applicantRepo;
                this.emailService = emailService;
                this.applicantService = applicantService;
                this.employeeRepo = employeeRepo;
        }

        private String getLoggedInUserName() {
                try {
                        org.springframework.security.core.Authentication auth =
                                        org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                        if (auth != null && auth.getPrincipal() != null) {
                                String empId = auth.getPrincipal().toString();
                                com.register.example.entity.Employee emp = employeeRepo.findByEmployeeId(empId).orElse(null);
                                if (emp != null) {
                                        String fullName = (emp.getFirstName() != null ? emp.getFirstName() : "") + " " +
                                                        (emp.getLastName() != null ? emp.getLastName() : "");
                                        return fullName.trim();
                                }
                        }
                } catch (Exception ignored) {}
                return null;
        }

        /**
         * Generate Offer Letter
         * GET /api/v1/letters/offer/{applicantId}/{templateName}
         */
        @GetMapping("/offer/{applicantId}/{templateName}")
        public ResponseEntity<byte[]> generateOffer(
                        @PathVariable String applicantId,
                        @PathVariable String templateName) throws Exception {

                byte[] doc = offerService.generateOfferLetter(applicantId, templateName);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                headers.setContentDispositionFormData(
                                "attachment",
                                "OfferLetter_" + applicantId + ".docx");

                return new ResponseEntity<>(doc, headers, HttpStatus.OK);

        }

        /**
         * Generate Offer Letter PDF
         * GET /api/v1/letters/offer/pdf/{applicantId}/{templateName}
         */
        @GetMapping("/offer/pdf/{applicantId}/{templateName}")
        public ResponseEntity<byte[]> generateOfferPdf(
                        @PathVariable String applicantId,
                        @PathVariable String templateName,
                        @RequestParam(required = false) Long calcTemplateId) throws Exception {

                byte[] pdf;
                if (calcTemplateId != null) {
                        pdf = offerService.generateOfferLetterPdf(applicantId, templateName, calcTemplateId);
                } else {
                        pdf = offerService.generateOfferLetterPdf(applicantId, templateName);
                }

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData(
                                "attachment",
                                "OfferLetter_" + applicantId + ".pdf");

                return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        }

        /**
         * Generate Both Offer + Appointment Letters and Email to Candidate + CC HR & AM
         * GET /api/v1/letters/sendBoth/{applicantId}/{offerFile}/{appointFile}
         */
        @GetMapping("/sendBoth/{applicantId}/{offerFile}/{appointFile}")
        public ResponseEntity<String> sendBothLetters(@PathVariable String applicantId,
                        @PathVariable String offerFile,
                        @PathVariable String appointFile) {
                try {
                        // Fetch applicant info
                        Applicant applicant = applicantRepo.findByApplicantId(applicantId)
                                        .orElseThrow(() -> new RuntimeException("Applicant not found: " + applicantId));

                        // Generate both letters
                        byte[] offerDoc = offerService.generateOfferLetter(applicantId, offerFile);
                        byte[] appointDoc = appointmentService.generateAppointmentLetter(applicantId, appointFile);

                        // Extract details for email
                        String name = (applicant.getFirstName() != null ? applicant.getFirstName() : "") + " " +
                                        (applicant.getLastName() != null ? applicant.getLastName() : "");
                        String designation = applicant.getPosition();
                        String doj = applicant.getApprovedDoj();
                        String location = applicant.getApprovedLocation();
                        String ctc = applicant.getFixedCtc();

                        // Send both letters via email — with HR & AM in CC
                        emailService.sendOfferAndAppointmentEmail(
                                        applicant.getEmail(), // candidate
                                        name.trim(),
                                        designation,
                                        doj,
                                        location,
                                        ctc,
                                        offerDoc,
                                        appointDoc,
                                        applicant.getAmId(), // AM ID
                                        applicant.getHrId(), // HR ID
                                        applicant.getTenantId(),
                                        getLoggedInUserName()
                        );

                        // <-- IMPORTANT: update status AFTER email is sent
                        applicantService.updateApplicantStatus(applicantId, "Offer Released", null);

                        return ResponseEntity.ok(
                                        "✅ Offer & Appointment letters generated, emailed and status updated to 'Offer Released'.");

                } catch (Exception e) {
                        e.printStackTrace();
                        return ResponseEntity.internalServerError()
                                        .body("❌ Failed to generate or send letters: " + e.getMessage());
                }
        }

        /**
         * Generate Both Offer + Appointment Letters (PDF) and Email
         * GET /api/v1/letters/sendBoth/pdf/{applicantId}/{offerFile}/{appointFile}
         */
        @GetMapping("/sendBoth/pdf/{applicantId}/{offerFile}/{appointFile}")
        public ResponseEntity<String> sendBothLettersPdf(@PathVariable String applicantId,
                        @PathVariable String offerFile,
                        @PathVariable String appointFile,
                        @RequestParam(required = false) Long calcTemplateId) {
                try {
                        Applicant applicant = applicantRepo.findByApplicantId(applicantId)
                                        .orElseThrow(() -> new RuntimeException("Applicant not found: " + applicantId));

                        byte[] offerDoc;
                        if (calcTemplateId != null) {
                                offerDoc = offerService.generateOfferLetterPdf(applicantId, offerFile, calcTemplateId);
                        } else {
                                offerDoc = offerService.generateOfferLetterPdf(applicantId, offerFile);
                        }
                        byte[] appointDoc;
                        if (calcTemplateId != null) {
                                appointDoc = appointmentService.generateAppointmentLetterPdf(applicantId, appointFile, calcTemplateId);
                        } else {
                                appointDoc = appointmentService.generateAppointmentLetterPdf(applicantId, appointFile);
                        }

                        String name = (applicant.getFirstName() != null ? applicant.getFirstName() : "") + " " +
                                        (applicant.getLastName() != null ? applicant.getLastName() : "");
                        String designation = applicant.getPosition();
                        String doj = applicant.getApprovedDoj();
                        String location = applicant.getApprovedLocation();
                        String ctc = applicant.getFixedCtc();

                        emailService.sendOfferAndAppointmentEmailPdf(
                                        applicant.getEmail(),
                                        name.trim(),
                                        designation,
                                        doj,
                                        location,
                                        ctc,
                                        offerDoc,
                                        appointDoc,
                                        applicant.getAmId(),
                                        applicant.getHrId(),
                                        applicant.getTenantId(),
                                        getLoggedInUserName());

                        applicantService.updateApplicantStatus(applicantId, "Offer Released", null);

                        return ResponseEntity.ok(
                                        "✅ Offer & Appointment letters generated (PDF), emailed and status updated to 'Offer Released'.");

                } catch (Exception e) {
                        e.printStackTrace();
                        return ResponseEntity.internalServerError()
                                        .body("❌ Failed to generate or send pdf letters: " + e.getMessage());
                }
        }

        @GetMapping("/sendBoth/esign/{applicantId}/{offerFile}/{appointFile}")
        public ResponseEntity<java.util.Map<String, Object>> sendBothLettersEsign(
                        @PathVariable String applicantId,
                        @PathVariable String offerFile,
                        @PathVariable String appointFile,
                        @RequestParam(required = false) Long calcTemplateId,
                        jakarta.servlet.http.HttpServletRequest httpServletRequest) {
                try {
                        @SuppressWarnings("unchecked")
                        java.util.List<String> apps = (java.util.List<String>) httpServletRequest.getAttribute("X-Tenant-Apps");
                        boolean hasEsign = apps != null && apps.stream().anyMatch(app -> 
                                app.equalsIgnoreCase("ESIGN") || app.equalsIgnoreCase("SIGN0001") || app.equalsIgnoreCase("ESIGN0001")
                        );
                        if (!hasEsign) {
                                throw new RuntimeException("eSign application is not enabled for this tenant. Found tenant apps: " + apps);
                        }

                        Applicant applicant = applicantRepo.findByApplicantId(applicantId)
                                        .orElseThrow(() -> new RuntimeException("Applicant not found: " + applicantId));

                        byte[] offerDoc;
                        if (calcTemplateId != null) {
                                offerDoc = offerService.generateOfferLetterPdf(applicantId, offerFile, calcTemplateId);
                        } else {
                                offerDoc = offerService.generateOfferLetterPdf(applicantId, offerFile);
                        }
                        byte[] appointDoc;
                        if (calcTemplateId != null) {
                                appointDoc = appointmentService.generateAppointmentLetterPdf(applicantId, appointFile, calcTemplateId);
                        } else {
                                appointDoc = appointmentService.generateAppointmentLetterPdf(applicantId, appointFile);
                        }

                        // Merge PDFs using PDFBox
                        byte[] mergedPdf;
                        try (java.io.ByteArrayOutputStream mergedOut = new java.io.ByteArrayOutputStream()) {
                                org.apache.pdfbox.multipdf.PDFMergerUtility merger = new org.apache.pdfbox.multipdf.PDFMergerUtility();
                                merger.addSource(new java.io.ByteArrayInputStream(offerDoc));
                                merger.addSource(new java.io.ByteArrayInputStream(appointDoc));
                                merger.setDestinationStream(mergedOut);
                                merger.mergeDocuments(null);
                                mergedPdf = mergedOut.toByteArray();
                        }

                        String base64Pdf = java.util.Base64.getEncoder().encodeToString(mergedPdf);

                        // Build request payload for E-Sign
                        String tenantId = applicant.getTenantId();
                        if (tenantId == null || tenantId.trim().isEmpty()) {
                                tenantId = "default";
                        } else {
                                tenantId = tenantId.toLowerCase().trim();
                        }

                        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();

                        // 1. Sync Tenant
                        try {
                                String syncTenantPayload = String.format(
                                        "{\"tenantId\":\"%s\",\"tenantName\":\"%s\"}",
                                        tenantId,
                                        tenantId.toUpperCase()
                                );
                                java.net.http.HttpRequest syncReq = java.net.http.HttpRequest.newBuilder()
                                                .uri(java.net.URI.create(esignApiUrl + "/api/external/sync-tenant"))
                                                .header("Content-Type", "application/json")
                                                .header("x-api-key", "hr_prod_key_2024_A1B2C3D4E5F6")
                                                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(syncTenantPayload))
                                                .build();
                                client.send(syncReq, java.net.http.HttpResponse.BodyHandlers.discarding());
                        } catch (Exception syncEx) {
                                System.err.println("Failed to sync tenant to E-Sign: " + syncEx.getMessage());
                        }

                        // 2. Sync User
                        try {
                                String syncUserPayload = String.format(
                                        "{\"employeeId\":\"admin_%s\",\"firstName\":\"Admin\",\"lastName\":\"User\",\"email\":\"admin_%s@xevyte.com\",\"role\":\"ADMIN\",\"tenantId\":\"%s\"}",
                                        tenantId, tenantId, tenantId
                                );
                                java.net.http.HttpRequest syncUserReq = java.net.http.HttpRequest.newBuilder()
                                                .uri(java.net.URI.create(esignApiUrl + "/api/external/sync-user"))
                                                .header("Content-Type", "application/json")
                                                .header("x-api-key", "hr_prod_key_2024_A1B2C3D4E5F6")
                                                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(syncUserPayload))
                                                .build();
                                client.send(syncUserReq, java.net.http.HttpResponse.BodyHandlers.discarding());
                        } catch (Exception syncUserEx) {
                                System.err.println("Failed to sync admin user to E-Sign: " + syncUserEx.getMessage());
                        }

                        // 3. Create request
                        String jsonPayload = String.format(
                                "{\"document\":\"%s\",\"fileName\":\"Offer_and_Appointment_Letter_%s.pdf\",\"signers\":[{\"email\":\"%s\"}]}",
                                base64Pdf,
                                applicantId,
                                applicant.getEmail()
                        );

                        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                                        .uri(java.net.URI.create(esignApiUrl + "/api/external/create-request"))
                                        .header("Content-Type", "application/json")
                                        .header("x-api-key", "hr_prod_key_2024_A1B2C3D4E5F6")
                                        .header("x-tenant-id", tenantId)
                                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                                        .build();

                        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

                        if (response.statusCode() != 200) {
                                throw new RuntimeException("E-Sign service returned status code " + response.statusCode() + ": " + response.body());
                        }

                        // Parse redirectUrl from response
                        String body = response.body();
                        String redirectUrl = "";
                        int idx = body.indexOf("\"redirectUrl\":\"");
                        if (idx != -1) {
                                int start = idx + 15;
                                int end = body.indexOf("\"", start);
                                if (end != -1) {
                                        redirectUrl = body.substring(start, end);
                                }
                        }

                        if (redirectUrl.isEmpty()) {
                                throw new RuntimeException("Failed to parse redirectUrl from E-Sign response: " + body);
                        }

                        applicantService.updateApplicantStatus(applicantId, "Offer Released", null);

                        java.util.Map<String, Object> result = new java.util.HashMap<>();
                        result.put("success", true);
                        result.put("redirectUrl", redirectUrl);

                        return ResponseEntity.ok(result);

                } catch (Exception e) {
                        e.printStackTrace();
                        java.util.Map<String, Object> errorResult = new java.util.HashMap<>();
                        errorResult.put("success", false);
                        errorResult.put("message", e.getMessage());
                        return ResponseEntity.internalServerError().body(errorResult);
                }
        }

        /**
         * Generate Offer Letter (PDF) and Email
         * GET /api/v1/letters/sendOffer/pdf/{applicantId}/{offerFile}
         */
        @GetMapping("/sendOffer/pdf/{applicantId}/{offerFile}")
        public ResponseEntity<String> sendOfferLetterPdf(@PathVariable String applicantId,
                        @PathVariable String offerFile,
                        @RequestParam(required = false) Long calcTemplateId) {
                try {
                        Applicant applicant = applicantRepo.findByApplicantId(applicantId)
                                        .orElseThrow(() -> new RuntimeException("Applicant not found: " + applicantId));

                        byte[] offerDoc;
                        if (calcTemplateId != null) {
                                offerDoc = offerService.generateOfferLetterPdf(applicantId, offerFile, calcTemplateId);
                        } else {
                                offerDoc = offerService.generateOfferLetterPdf(applicantId, offerFile);
                        }

                        String name = (applicant.getFirstName() != null ? applicant.getFirstName() : "") + " " +
                                        (applicant.getLastName() != null ? applicant.getLastName() : "");
                        String designation = applicant.getPosition();
                        String doj = applicant.getApprovedDoj();
                        String location = applicant.getApprovedLocation();
                        String ctc = applicant.getFixedCtc();

                        emailService.sendOfferLetterEmailPdf(
                                        applicant.getEmail(),
                                        name.trim(),
                                        designation,
                                        doj,
                                        location,
                                        ctc,
                                        offerDoc,
                                        applicant.getAmId(),
                                        applicant.getHrId(),
                                        applicant.getTenantId(),
                                        getLoggedInUserName());

                        applicantService.updateApplicantStatus(applicantId, "Offer Released", null);

                        return ResponseEntity.ok(
                                        "✅ Offer letter generated (PDF), emailed and status updated to 'Offer Released'.");

                } catch (Exception e) {
                        e.printStackTrace();
                        return ResponseEntity.internalServerError()
                                        .body("❌ Failed to generate or send pdf letter: " + e.getMessage());
                }
        }

        /**
         * Generate Offer Letter (PDF) and Send to eSign
         * GET /api/v1/letters/sendOffer/esign/{applicantId}/{offerFile}
         */
        @GetMapping("/sendOffer/esign/{applicantId}/{offerFile}")
        public ResponseEntity<java.util.Map<String, Object>> sendOfferLetterEsign(
                        @PathVariable String applicantId,
                        @PathVariable String offerFile,
                        @RequestParam(required = false) Long calcTemplateId,
                        jakarta.servlet.http.HttpServletRequest httpServletRequest) {
                try {
                        @SuppressWarnings("unchecked")
                        java.util.List<String> apps = (java.util.List<String>) httpServletRequest.getAttribute("X-Tenant-Apps");
                        boolean hasEsign = apps != null && apps.stream().anyMatch(app -> 
                                app.equalsIgnoreCase("ESIGN") || app.equalsIgnoreCase("SIGN0001") || app.equalsIgnoreCase("ESIGN0001")
                        );
                        if (!hasEsign) {
                                throw new RuntimeException("eSign application is not enabled for this tenant.");
                        }

                        Applicant applicant = applicantRepo.findByApplicantId(applicantId)
                                        .orElseThrow(() -> new RuntimeException("Applicant not found: " + applicantId));

                        byte[] offerDoc;
                        if (calcTemplateId != null) {
                                offerDoc = offerService.generateOfferLetterPdf(applicantId, offerFile, calcTemplateId);
                        } else {
                                offerDoc = offerService.generateOfferLetterPdf(applicantId, offerFile);
                        }

                        String base64Pdf = java.util.Base64.getEncoder().encodeToString(offerDoc);

                        // Build request payload for E-Sign
                        String tenantId = applicant.getTenantId();
                        if (tenantId == null || tenantId.trim().isEmpty()) {
                                tenantId = "default";
                        } else {
                                tenantId = tenantId.toLowerCase().trim();
                        }

                        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();

                        // 1. Sync Tenant
                        try {
                                String syncTenantPayload = String.format(
                                        "{\"tenantId\":\"%s\",\"tenantName\":\"%s\"}",
                                        tenantId,
                                        tenantId.toUpperCase()
                                );
                                java.net.http.HttpRequest syncReq = java.net.http.HttpRequest.newBuilder()
                                                .uri(java.net.URI.create(esignApiUrl + "/api/external/sync-tenant"))
                                                .header("Content-Type", "application/json")
                                                .header("x-api-key", "hr_prod_key_2024_A1B2C3D4E5F6")
                                                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(syncTenantPayload))
                                                .build();
                                client.send(syncReq, java.net.http.HttpResponse.BodyHandlers.discarding());
                        } catch (Exception syncEx) {
                                System.err.println("Failed to sync tenant to E-Sign: " + syncEx.getMessage());
                        }

                        // 2. Sync User
                        try {
                                String syncUserPayload = String.format(
                                        "{\"employeeId\":\"admin_%s\",\"firstName\":\"Admin\",\"lastName\":\"User\",\"email\":\"admin_%s@xevyte.com\",\"role\":\"ADMIN\",\"tenantId\":\"%s\"}",
                                        tenantId, tenantId, tenantId
                                );
                                java.net.http.HttpRequest syncUserReq = java.net.http.HttpRequest.newBuilder()
                                                .uri(java.net.URI.create(esignApiUrl + "/api/external/sync-user"))
                                                .header("Content-Type", "application/json")
                                                .header("x-api-key", "hr_prod_key_2024_A1B2C3D4E5F6")
                                                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(syncUserPayload))
                                                .build();
                                client.send(syncUserReq, java.net.http.HttpResponse.BodyHandlers.discarding());
                        } catch (Exception syncUserEx) {
                                System.err.println("Failed to sync admin user to E-Sign: " + syncUserEx.getMessage());
                        }

                        // 3. Create request
                        String jsonPayload = String.format(
                                "{\"document\":\"%s\",\"fileName\":\"Offer_Letter_%s.pdf\",\"signers\":[{\"email\":\"%s\"}]}",
                                base64Pdf,
                                applicantId,
                                applicant.getEmail()
                        );

                        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                                        .uri(java.net.URI.create(esignApiUrl + "/api/external/create-request"))
                                        .header("Content-Type", "application/json")
                                        .header("x-api-key", "hr_prod_key_2024_A1B2C3D4E5F6")
                                        .header("x-tenant-id", tenantId)
                                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                                        .build();

                        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

                        if (response.statusCode() != 200) {
                                throw new RuntimeException("E-Sign service returned status code " + response.statusCode() + ": " + response.body());
                        }

                        // Parse redirectUrl from response
                        String body = response.body();
                        String redirectUrl = "";
                        int idx = body.indexOf("\"redirectUrl\":\"");
                        if (idx != -1) {
                                int start = idx + 15;
                                int end = body.indexOf("\"", start);
                                if (end != -1) {
                                        redirectUrl = body.substring(start, end);
                                }
                        }

                        if (redirectUrl.isEmpty()) {
                                throw new RuntimeException("Failed to parse redirectUrl from E-Sign response: " + body);
                        }

                        applicantService.updateApplicantStatus(applicantId, "Offer Released", null);

                        java.util.Map<String, Object> result = new java.util.HashMap<>();
                        result.put("success", true);
                        result.put("redirectUrl", redirectUrl);

                        return ResponseEntity.ok(result);

                } catch (Exception e) {
                        e.printStackTrace();
                        java.util.Map<String, Object> errorResult = new java.util.HashMap<>();
                        errorResult.put("success", false);
                        errorResult.put("message", e.getMessage());
                        return ResponseEntity.internalServerError().body(errorResult);
                }
        }

        /**
         * Generate Appointment Letter (PDF) and Email
         * GET /api/v1/letters/sendAppointment/pdf/{applicantId}/{appointFile}
         */
        @GetMapping("/sendAppointment/pdf/{applicantId}/{appointFile}")
        public ResponseEntity<String> sendAppointmentLetterPdf(@PathVariable String applicantId,
                        @PathVariable String appointFile,
                        @RequestParam(required = false) Long calcTemplateId) {
                try {
                        Applicant applicant = applicantRepo.findByApplicantId(applicantId)
                                        .orElseThrow(() -> new RuntimeException("Applicant not found: " + applicantId));

                        byte[] appointDoc;
                        if (calcTemplateId != null) {
                                appointDoc = appointmentService.generateAppointmentLetterPdf(applicantId, appointFile, calcTemplateId);
                        } else {
                                appointDoc = appointmentService.generateAppointmentLetterPdf(applicantId, appointFile);
                        }

                        String name = (applicant.getFirstName() != null ? applicant.getFirstName() : "") + " " +
                                        (applicant.getLastName() != null ? applicant.getLastName() : "");
                        String designation = applicant.getPosition();
                        String doj = applicant.getApprovedDoj();
                        String location = applicant.getApprovedLocation();
                        String ctc = applicant.getFixedCtc();

                        emailService.sendAppointmentLetterEmailPdf(
                                        applicant.getEmail(),
                                        name.trim(),
                                        designation,
                                        doj,
                                        location,
                                        ctc,
                                        appointDoc,
                                        applicant.getAmId(),
                                        applicant.getHrId(),
                                        applicant.getTenantId(),
                                        getLoggedInUserName());

                        applicantService.updateApplicantStatus(applicantId, "Appointment Released", null);

                        return ResponseEntity.ok(
                                        "✅ Appointment letter generated (PDF), emailed and status updated to 'Appointment Released'.");

                } catch (Exception e) {
                        e.printStackTrace();
                        return ResponseEntity.internalServerError()
                                        .body("❌ Failed to generate or send pdf letter: " + e.getMessage());
                }
        }

        /**
         * Generate Appointment Letter (PDF) and Send to eSign
         * GET /api/v1/letters/sendAppointment/esign/{applicantId}/{appointFile}
         */
        @GetMapping("/sendAppointment/esign/{applicantId}/{appointFile}")
        public ResponseEntity<java.util.Map<String, Object>> sendAppointmentLetterEsign(
                        @PathVariable String applicantId,
                        @PathVariable String appointFile,
                        @RequestParam(required = false) Long calcTemplateId,
                        jakarta.servlet.http.HttpServletRequest httpServletRequest) {
                try {
                        @SuppressWarnings("unchecked")
                        java.util.List<String> apps = (java.util.List<String>) httpServletRequest.getAttribute("X-Tenant-Apps");
                        boolean hasEsign = apps != null && apps.stream().anyMatch(app -> 
                                app.equalsIgnoreCase("ESIGN") || app.equalsIgnoreCase("SIGN0001") || app.equalsIgnoreCase("ESIGN0001")
                        );
                        if (!hasEsign) {
                                throw new RuntimeException("eSign application is not enabled for this tenant.");
                        }

                        Applicant applicant = applicantRepo.findByApplicantId(applicantId)
                                        .orElseThrow(() -> new RuntimeException("Applicant not found: " + applicantId));

                        byte[] appointDoc;
                        if (calcTemplateId != null) {
                                appointDoc = appointmentService.generateAppointmentLetterPdf(applicantId, appointFile, calcTemplateId);
                        } else {
                                appointDoc = appointmentService.generateAppointmentLetterPdf(applicantId, appointFile);
                        }

                        String base64Pdf = java.util.Base64.getEncoder().encodeToString(appointDoc);

                        // Build request payload for E-Sign
                        String tenantId = applicant.getTenantId();
                        if (tenantId == null || tenantId.trim().isEmpty()) {
                                tenantId = "default";
                        } else {
                                tenantId = tenantId.toLowerCase().trim();
                        }

                        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();

                        // 1. Sync Tenant
                        try {
                                String syncTenantPayload = String.format(
                                        "{\"tenantId\":\"%s\",\"tenantName\":\"%s\"}",
                                        tenantId,
                                        tenantId.toUpperCase()
                                );
                                java.net.http.HttpRequest syncReq = java.net.http.HttpRequest.newBuilder()
                                                .uri(java.net.URI.create(esignApiUrl + "/api/external/sync-tenant"))
                                                .header("Content-Type", "application/json")
                                                .header("x-api-key", "hr_prod_key_2024_A1B2C3D4E5F6")
                                                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(syncTenantPayload))
                                                .build();
                                client.send(syncReq, java.net.http.HttpResponse.BodyHandlers.discarding());
                        } catch (Exception syncEx) {
                                System.err.println("Failed to sync tenant to E-Sign: " + syncEx.getMessage());
                        }

                        // 2. Sync User
                        try {
                                String syncUserPayload = String.format(
                                        "{\"employeeId\":\"admin_%s\",\"firstName\":\"Admin\",\"lastName\":\"User\",\"email\":\"admin_%s@xevyte.com\",\"role\":\"ADMIN\",\"tenantId\":\"%s\"}",
                                        tenantId, tenantId, tenantId
                                );
                                java.net.http.HttpRequest syncUserReq = java.net.http.HttpRequest.newBuilder()
                                                .uri(java.net.URI.create(esignApiUrl + "/api/external/sync-user"))
                                                .header("Content-Type", "application/json")
                                                .header("x-api-key", "hr_prod_key_2024_A1B2C3D4E5F6")
                                                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(syncUserPayload))
                                                .build();
                                client.send(syncUserReq, java.net.http.HttpResponse.BodyHandlers.discarding());
                        } catch (Exception syncUserEx) {
                                System.err.println("Failed to sync admin user to E-Sign: " + syncUserEx.getMessage());
                        }

                        // 3. Create request
                        String jsonPayload = String.format(
                                "{\"document\":\"%s\",\"fileName\":\"Appointment_Letter_%s.pdf\",\"signers\":[{\"email\":\"%s\"}]}",
                                base64Pdf,
                                applicantId,
                                applicant.getEmail()
                        );

                        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                                        .uri(java.net.URI.create(esignApiUrl + "/api/external/create-request"))
                                        .header("Content-Type", "application/json")
                                        .header("x-api-key", "hr_prod_key_2024_A1B2C3D4E5F6")
                                        .header("x-tenant-id", tenantId)
                                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                                        .build();

                        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

                        if (response.statusCode() != 200) {
                                throw new RuntimeException("E-Sign service returned status code " + response.statusCode() + ": " + response.body());
                        }

                        // Parse redirectUrl from response
                        String body = response.body();
                        String redirectUrl = "";
                        int idx = body.indexOf("\"redirectUrl\":\"");
                        if (idx != -1) {
                                int start = idx + 15;
                                int end = body.indexOf("\"", start);
                                if (end != -1) {
                                        redirectUrl = body.substring(start, end);
                                }
                        }

                        if (redirectUrl.isEmpty()) {
                                throw new RuntimeException("Failed to parse redirectUrl from E-Sign response: " + body);
                        }

                        applicantService.updateApplicantStatus(applicantId, "Appointment Released", null);

                        java.util.Map<String, Object> result = new java.util.HashMap<>();
                        result.put("success", true);
                        result.put("redirectUrl", redirectUrl);

                        return ResponseEntity.ok(result);

                } catch (Exception e) {
                        e.printStackTrace();
                        java.util.Map<String, Object> errorResult = new java.util.HashMap<>();
                        errorResult.put("success", false);
                        errorResult.put("message", e.getMessage());
                        return ResponseEntity.internalServerError().body(errorResult);
                }
        }
}
