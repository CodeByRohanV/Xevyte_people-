package com.register.example.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.register.example.entity.Applicant;
import com.register.example.payload.ApplicantRequest;
import com.register.example.repository.ApplicantRepository;
import com.register.example.service.ApplicantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*; // ✅ Needed for Map, List, Optional

@RestController
@RequestMapping("/api/v1/applicants")
public class ApplicantController {

    private final ApplicantService applicantService;
    private final ApplicantRepository applicantRepository;
    private final com.register.example.repository.EmployeeRepository employeeRepository;
    private final jakarta.servlet.http.HttpServletRequest request;

    public ApplicantController(
            ApplicantService applicantService,
            ApplicantRepository applicantRepository,
            com.register.example.repository.EmployeeRepository employeeRepository,
            jakarta.servlet.http.HttpServletRequest request) {
        this.applicantService = applicantService;
        this.applicantRepository = applicantRepository;
        this.employeeRepository = employeeRepository;
        this.request = request;
    }

    private String getCurrentUserTenantId() {
        try {
            Object tenantIdAttr = request.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                return tenantIdAttr.toString();
            }
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null) {
                String employeeId = auth.getPrincipal().toString();
                java.util.Optional<com.register.example.entity.Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
                if (empOpt.isPresent()) {
                    return empOpt.get().getTenantId();
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    // =====================================================
    // ✅ Step 1: Create Applicant
    // =====================================================
    @PostMapping
    public ResponseEntity<Object> createApplicant(@RequestBody ApplicantRequest request) {
        try {
            Applicant saved = applicantService.createApplicant(request);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage() != null ? e.getMessage() : "An unexpected error occurred");
            return ResponseEntity.status(500).body(response);
        }
    }

    // =====================================================
    // ✅ Step 2: Get All Applicants
    // =====================================================
    @GetMapping
    public ResponseEntity<List<Applicant>> getAllApplicants() {
        return ResponseEntity.ok(applicantService.getAllApplicants());
    }

    // =====================================================
    // ✅ Step 3: Save Full Onboarding Data (From OnboardingFull.js)
    // =====================================================
    @PostMapping("/{applicantId}/onboarding")
    public ResponseEntity<String> saveOnboardingData(
            @PathVariable String applicantId,
            @RequestBody Map<String, Object> onboardingData) {

        try {
            Optional<Applicant> opt = applicantRepository.findByApplicantId(applicantId);
            if (opt.isEmpty()) {
                return ResponseEntity.badRequest().body("❌ Applicant not found!");
            }

            Applicant applicant = opt.get();

            ObjectMapper mapper = new ObjectMapper();
            String jsonData = mapper.writeValueAsString(onboardingData);

            applicant.setOnboardingData(jsonData);
            applicant.setStatus("Onboarding In Progress");

            applicantRepository.save(applicant);

            return ResponseEntity.ok("✅ Onboarding details saved successfully for " + applicantId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("❌ Error saving onboarding data: " + e.getMessage());
        }
    }

    @GetMapping("/{applicantId}")
    public ResponseEntity<Object> getApplicantByApplicantId(@PathVariable String applicantId) {
        return applicantRepository.findByApplicantId(applicantId)
                .<ResponseEntity<Object>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("❌ Applicant not found with ID: " + applicantId));
    }

    @PostMapping("/approve")
    public ResponseEntity<Applicant> approveCandidate(@RequestBody ApplicantRequest request) {
        return ResponseEntity.ok(applicantService.approveCandidate(request));
    }

    @PutMapping("/revision-pending/{applicantId}")
    public ResponseEntity<Applicant> markRevisionPending(
            @PathVariable String applicantId,
            @RequestBody Map<String, String> body) {

        String reason = body.get("reason"); // ✅ read reason

        Applicant updated = applicantService.markRevisionPending(applicantId, reason);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/approve-finance/{applicantId}")
    public ResponseEntity<Applicant> approveByFinance(@PathVariable String applicantId) {
        Applicant updated = applicantService.approveByFinance(applicantId);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/status/{applicantId}")
    public ResponseEntity<String> updateApplicantStatus(
            @PathVariable String applicantId,
            @RequestParam String status,
            @RequestParam(required = false) String reason) { // ⬅ Added

        try {
            applicantService.updateApplicantStatus(applicantId, status, reason); // ⬅ pass reason
            return ResponseEntity.ok("✅ Status updated to: " + status);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("❌ Error updating applicant status: " + e.getMessage());
        }
    }

    @PostMapping("/upload/{applicantId}")
    public ResponseEntity<String> uploadSignedDocs(
            @PathVariable String applicantId,
            @RequestParam(value = "offerLetter", required = false) MultipartFile offerLetter,
            @RequestParam(value = "appointmentLetter", required = false) MultipartFile appointmentLetter,
            @RequestParam(value = "document3", required = false) MultipartFile document3) {
        try {
            String result = applicantService.uploadSignedDocuments(
                    applicantId, offerLetter, appointmentLetter, document3);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("❌ Error uploading documents: " + e.getMessage());
        }
    }

    @GetMapping("/accepted")
    public List<Map<String, String>> getAcceptedApplicants() {
        String tenantId = getCurrentUserTenantId();
        List<Applicant> list;
        if (tenantId != null && !tenantId.isEmpty()) {
            list = applicantRepository.findByStatusAndTenantId("Accepted", tenantId);
        } else {
            list = applicantRepository.findByStatus("Accepted");
        }

        List<Map<String, String>> result = new ArrayList<>();

        for (Applicant applicant : list) {
            Map<String, String> map = new HashMap<>();
            map.put("applicantId", applicant.getApplicantId());
            map.put("fullName", applicant.getFirstName() + " " + applicant.getLastName());
            result.add(map);
        }

        return result;
    }

    @PutMapping("/reject-documents/{applicantId}")
    public ResponseEntity<Applicant> rejectDocuments(
            @PathVariable String applicantId,
            @RequestBody Map<String, Object> body) {

        List<String> rejectedDocs = (List<String>) body.get("rejectedDocuments");

        Applicant app = applicantRepository.findByApplicantId(applicantId)
                .orElseThrow(() -> new RuntimeException("Applicant not found"));

        app.setStatus("Re-Upload Needed");
        app.setRejectedDocuments(rejectedDocs);

        applicantRepository.save(app);

        return ResponseEntity.ok(app);
    }

    @GetMapping("/reports")
    public ResponseEntity<List<Applicant>> getFilteredReports(
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String client,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(applicantService.getFilteredApplicants(position, client, status, startDate, endDate));
    }

    @GetMapping("/clients")
    public ResponseEntity<List<String>> getClients() {
        return ResponseEntity.ok(applicantService.getDistinctClients());
    }

    @GetMapping("/positions")
    public ResponseEntity<List<String>> getPositions() {
        return ResponseEntity.ok(applicantService.getDistinctPositions());
    }

    @GetMapping("/statuses")
    public ResponseEntity<List<String>> getStatuses() {
        return ResponseEntity.ok(applicantService.getDistinctStatuses());
    }
}