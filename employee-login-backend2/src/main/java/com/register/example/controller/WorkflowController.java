package com.register.example.controller;

import com.register.example.entity.EmployeeDocument;
import com.register.example.payload.WorkflowUploadRequest;
import com.register.example.service.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow")
public class WorkflowController {

    @Autowired
    private WorkflowService workflowService;

    /*
     * --------------------------- POST: Document Upload ---------------------------
     */
    @PostMapping("/upload")
    public ResponseEntity<String> uploadWorkflowDocument(
            @RequestParam("employeeIds") String employeeIds,
            @RequestParam("category") String category,
            @RequestParam("year") Integer year,
            @RequestParam("file") MultipartFile file) {

        try {
            WorkflowUploadRequest request = new WorkflowUploadRequest();
            request.setEmployeeIds(employeeIds);
            request.setCategory(category);
            request.setYear(year); // ⭐ IMPORTANT: set year into request
            request.setFile(file);

            workflowService.processWorkflowUpload(request);

            return ResponseEntity.ok("Document uploaded and employees notified successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Validation Error: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    /*
     * --------------------------- GET: Fetch Documents List (ALL YEARS)
     * ---------------------------
     */
    @GetMapping("/documents")
    public ResponseEntity<Object> getEmployeeDocuments(@AuthenticationPrincipal Object principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Error: User not authenticated. Please login first.");
        }

        String employeeId = principal instanceof UserDetails ? ((UserDetails) principal).getUsername() : principal.toString();
        
        try {
            List<EmployeeDocument> documents = workflowService.getDocumentsByEmployeeId(employeeId);
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching documents: " + e.getMessage());
        }
    }

    /*
     * --------------------------- Optionally: Fetch Documents by Year
     * ---------------------------
     */
    @GetMapping("/documents/by-year")
    public ResponseEntity<Object> getEmployeeDocumentsByYear(
            @AuthenticationPrincipal Object principal,
            @RequestParam("year") Integer year) {

        if (principal == null) {
            return ResponseEntity.status(401).body("User not authenticated.");
        }

        String employeeId = principal instanceof UserDetails ? ((UserDetails) principal).getUsername() : principal.toString();

        try {
            List<EmployeeDocument> documents = workflowService.getDocumentsByEmployeeIdAndYear(employeeId, year);
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching documents: " + e.getMessage());
        }
    }

    /*
     * --------------------------- GET: View Specific Document (Inline)
     * ---------------------------
     */
    @GetMapping("/document/{id}/view")
    public ResponseEntity<Resource> viewDocument(@PathVariable Long id) {
        try {
            Resource documentResource = workflowService.getDocumentFile(id);
            String filename = documentResource.getFilename() != null ? documentResource.getFilename() : "document.pdf";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/pdf"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(documentResource);

        } catch (FileNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /*
     * --------------------------- GET: Download Specific Document (Attachment)
     * ---------------------------
     */
    @GetMapping("/document/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        try {
            Resource documentResource = workflowService.getDocumentFile(id);
            String filename = documentResource.getFilename() != null ? documentResource.getFilename() : "document.pdf";

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(documentResource);

        } catch (FileNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /*
     * --------------------------- NEW: Validate Employee IDs
     * ---------------------------
     */
    @PostMapping("/validate-employee-ids")
    public ResponseEntity<Object> validateEmployeeIds(@RequestBody List<String> employeeIds) {

        try {
            if (employeeIds == null || employeeIds.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        java.util.Map.of(
                                "valid", false,
                                "message", "Employee list cannot be empty."));
            }

            java.util.Map<String, Object> result = workflowService.validateEmployeeIds(employeeIds);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    java.util.Map.of(
                            "valid", false,
                            "message", "Server error: " + e.getMessage()));
        }
    }

    /* --------------------------- DELETE: Document --------------------------- */
    @DeleteMapping("/document/{id}")
    public ResponseEntity<String> deleteDocument(@PathVariable Long id) {
        try {
            workflowService.deleteDocument(id);
            return ResponseEntity.ok("Document deleted successfully.");
        } catch (FileNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Document not found.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting document: " + e.getMessage());
        }
    }
}
