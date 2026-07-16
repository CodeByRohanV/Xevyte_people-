package com.register.example.controller;

import com.register.example.entity.ApplicantDocuments;
import com.register.example.service.ApplicantDocumentsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/documents")
@CrossOrigin(origins = "*")
public class ApplicantDocumentsController {

    private final ApplicantDocumentsService service;

    public ApplicantDocumentsController(ApplicantDocumentsService service) {
        this.service = service;
    }

    @PostMapping("/upload/{id}")
    public ApplicantDocuments uploadDocuments(
            @PathVariable Long id,
            @RequestParam(required = false) MultipartFile offerLetter,
            @RequestParam(required = false) MultipartFile appointmentLetter,
            @RequestParam String financeId // ✅ NEW FIELD
    ) throws Exception {

        return service.uploadDocuments(id, offerLetter, appointmentLetter, financeId);
    }

    @GetMapping("/templates")
    public List<Map<String, String>> getAllTemplates() {
        return service.getAllDocuments().stream()
                .map(doc -> {
                    Map<String, String> map = new HashMap<>();
                    if (doc.getOfferLetterFileName() != null && !doc.getOfferLetterFileName().isBlank()) {
                        map.put("offerLetterFileName", doc.getOfferLetterFileName());
                    }
                    if (doc.getAppointmentLetterFileName() != null && !doc.getAppointmentLetterFileName().isBlank()) {
                        map.put("appointmentLetterFileName", doc.getAppointmentLetterFileName());
                    }
                    return map;
                })
                .toList();
    }

    @DeleteMapping("/{id}")
    public void deleteDocuments(@PathVariable Long id) {
        service.deleteDocuments(id);
    }
}
