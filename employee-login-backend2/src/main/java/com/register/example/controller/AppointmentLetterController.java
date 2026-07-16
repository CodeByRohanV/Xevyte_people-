package com.register.example.controller;

import com.register.example.service.AppointmentLetterService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/letters")
@CrossOrigin(origins = "*")
public class AppointmentLetterController {

    private final AppointmentLetterService service;

    public AppointmentLetterController(AppointmentLetterService service) {
        this.service = service;
    }

    /**
     * Generate a filled appointment letter using the selected template.
     * Example:
     * GET /api/v1/letters/appointment/2025110001/Appointment%20letter%20Format.docx
     */
    @GetMapping("/appointment/{applicantId}/{templateName}")
    public ResponseEntity<?> generateAppointment(
            @PathVariable String applicantId,
            @PathVariable String templateName,
            @RequestParam(required = false) Long calcTemplateId) {
        try {
            byte[] doc;
            if (calcTemplateId != null) {
                doc = service.generateAppointmentLetter(applicantId, templateName, calcTemplateId);
            } else {
                doc = service.generateAppointmentLetter(applicantId, templateName);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData(
                    "attachment",
                    "AppointmentLetter_" + applicantId + ".docx");

            return new ResponseEntity<>(doc, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating appointment letter: " + e.getMessage());
        }
    }

    /**
     * Generate Appointment Letter PDF
     * GET /api/v1/letters/appointment/pdf/{applicantId}/{templateName}
     */
    @GetMapping("/appointment/pdf/{applicantId}/{templateName}")
    public ResponseEntity<?> generateAppointmentPdf(
            @PathVariable String applicantId,
            @PathVariable String templateName,
            @RequestParam(required = false) Long calcTemplateId) {
        try {
            byte[] pdf;

            System.out.println("ApplicantId = " + applicantId);
            System.out.println("TemplateName = " + templateName);
            System.out.println("CalcTemplateId = " + calcTemplateId);

            if (calcTemplateId != null) {
                pdf = service.generateAppointmentLetterPdf(
                        applicantId,
                        templateName,
                        calcTemplateId);
            } else {
                pdf = service.generateAppointmentLetterPdf(
                        applicantId,
                        templateName);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData(
                    "attachment",
                    "AppointmentLetter_" + applicantId + ".pdf");

            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating appointment letter PDF: " + e.getMessage());
        }
    }
}
