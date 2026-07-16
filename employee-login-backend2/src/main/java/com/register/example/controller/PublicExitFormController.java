package com.register.example.controller;

import com.register.example.entity.Employee;
import com.register.example.entity.ExitQuestion;
import com.register.example.payload.ExitFormDto;
import com.register.example.repository.EmployeeRepository;
import com.register.example.service.ExitFormService;
import com.register.example.service.ResignationService;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/external/exit-management")
@CrossOrigin("*")
public class PublicExitFormController {

    private static final String CONST_MESSAGE = "message";
    private static final String CONST_ERROR = "error";

    private final ExitFormService exitFormService;
    private final ResignationService resignationService;
    private final EmployeeRepository employeeRepository;

    public PublicExitFormController(ExitFormService exitFormService,
                                    ResignationService resignationService,
                                    EmployeeRepository employeeRepository) {
        this.exitFormService = exitFormService;
        this.resignationService = resignationService;
        this.employeeRepository = employeeRepository;
    }

    // 1. Get Exit Questions — optionally filtered by tenant via ?employeeId=
    @GetMapping("/exit-questions")
    public ResponseEntity<Object> getExitQuestions(
            @RequestParam(required = false) String employeeId) {
        try {
            String tenantId = resolveTenantId(employeeId);
            return ResponseEntity.ok(resignationService.getExitQuestions(tenantId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to load questions.");
        }
    }

    // 2. Load feedback form using token (base64 formId:employeeId)
    //    Questions are now returned INSIDE the response, scoped to the employee's tenant
    @GetMapping("/feedback/{token}")
    public ResponseEntity<Object> getFeedbackFormByToken(@PathVariable String token) {
        try {
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            Long formId = Long.parseLong(parts[0]);
            String employeeId = parts[1];

            ExitFormDto dto = exitFormService.getFeedbackFormData(formId, employeeId);

            // Resolve tenant and load scoped questions
            String tenantId = resolveTenantId(employeeId);
            List<ExitQuestion> questions = resignationService.getExitQuestions(tenantId);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put(CONST_MESSAGE, "Feedback form loaded successfully.");
            response.put("data", dto);
            response.put("questions", questions);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(CONST_MESSAGE, "Invalid feedback token.", CONST_ERROR, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of(CONST_MESSAGE, "Failed to load feedback form.", CONST_ERROR, e.getMessage()));
        }
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/{formId}/submit-feedback")
    public ResponseEntity<Object> submitFeedback(
            @PathVariable Long formId,
            @RequestBody Map<String, Object> payload
    ) {
        try {
            // expecting payload like { "answers": { "1": "Good", "2": "5" } }
            Map<String, Object> answers = (Map<String, Object>) payload.get("answers");
            ExitFormDto updated = exitFormService.submitExitInterviewFeedback(formId, answers);
            return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Exit interview feedback submitted successfully.", "data", updated));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of(CONST_MESSAGE, "Failed to submit feedback", CONST_ERROR, e.getMessage()));
        }
    }

    // ── Helper ──────────────────────────────────────────────────────────────────
    private String resolveTenantId(String employeeId) {
        if (employeeId == null || employeeId.isBlank()) return null;
        return employeeRepository.findByEmployeeId(employeeId)
                .map(Employee::getTenantId)
                .orElse(null);
    }
}

