package com.register.example.controller;

import com.register.example.payload.ExitFormDto;
import com.register.example.service.ExitFormService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/exit-forms")
public class ExitFormController {

    private static final String CONST_MESSAGE = "message";
    private static final String CONST_ERROR = "error";
    private static final String CONST_DATA = "data";

    private final ExitFormService exitFormService;

    public ExitFormController(ExitFormService exitFormService) {
        this.exitFormService = exitFormService;
    }

    @PostMapping
    public ResponseEntity<Object> createExitForm(@RequestBody ExitFormDto dto) {
        try {
            ExitFormDto saved = exitFormService.saveExitForm(dto);
            return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Exit form created successfully.", CONST_DATA, saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(CONST_MESSAGE, "Error saving exit form: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<Object> getAll() {
        List<ExitFormDto> forms = exitFormService.getAllExitForms();
        return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Fetched all exit forms successfully.", CONST_DATA, forms));
    }

    @GetMapping("/hr/{hrId}")
    public ResponseEntity<Object> getByHr(@PathVariable String hrId) {
        List<ExitFormDto> forms = exitFormService.getExitFormsByHr(hrId);
        return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Fetched exit forms for HR successfully.", CONST_DATA, forms));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<Object> getByEmployee(@PathVariable String employeeId) {
        List<ExitFormDto> forms = exitFormService.getExitFormsByEmployee(employeeId);
        return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Fetched exit forms for employee successfully.", CONST_DATA, forms));
    }

    @GetMapping("/resignation/{resignationId}")
    public ResponseEntity<Object> getByResignation(@PathVariable Long resignationId) {
        List<ExitFormDto> forms = exitFormService.getByResignation(resignationId);
        return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Fetched exit forms for resignation successfully.", CONST_DATA, forms));
    }

    @PostMapping("/{formId}/schedule-interview")
    public ResponseEntity<Object> scheduleExitInterview(
            @PathVariable Long formId,
            @RequestParam(required = false) String hrId,
            @RequestParam(required = false) String dateIso,
            @RequestParam(required = false) String interviewer,
            @RequestParam(required = false) String meetingLink,
            @RequestParam(defaultValue = "true") boolean sendEmail,
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) Long resignationId
    ) {
        try {
            ExitFormDto scheduledDto = exitFormService.scheduleExitInterview(
                    formId, hrId, dateIso, interviewer, meetingLink, sendEmail, employeeId, resignationId);
            return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Exit interview scheduled successfully.", CONST_DATA, scheduledDto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(CONST_MESSAGE, "Failed to schedule exit interview: " + e.getMessage()));
        }
    }

    // --- FINAL CLEAN endpoint for submitting dynamic feedback answers ---
    @PostMapping("/{formId}/submit-feedback")
    public ResponseEntity<Object> submitFeedback(
            @PathVariable Long formId,
            @RequestBody Map<String, Object> payload
    ) {
        try {
            // expecting payload like { "answers": { "1": "Good", "2": "5" } }
            Map<String, Object> answers = (Map<String, Object>) payload.get("answers");
            ExitFormDto updated = exitFormService.submitExitInterviewFeedback(formId, answers);
            return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Exit interview feedback submitted successfully.", CONST_DATA, updated));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of(CONST_MESSAGE, "Failed to submit feedback", CONST_ERROR, e.getMessage()));
        }
    }

    // Load feedback form using token (base64 formId:employeeId)
    @GetMapping("/feedback/{token}")
    public ResponseEntity<Object> getFeedbackFormByToken(@PathVariable String token) {
        try {
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            Long formId = Long.parseLong(parts[0]);
            String employeeId = parts[1];
            ExitFormDto dto = exitFormService.getFeedbackFormData(formId, employeeId);
            return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Feedback form loaded successfully.", CONST_DATA, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(CONST_MESSAGE, "Invalid feedback token.", CONST_ERROR, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of(CONST_MESSAGE, "Failed to load feedback form.", CONST_ERROR, e.getMessage()));
        }
    }
}
