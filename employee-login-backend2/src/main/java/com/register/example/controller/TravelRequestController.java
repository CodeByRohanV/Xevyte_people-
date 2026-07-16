package com.register.example.controller;

import com.register.example.entity.TravelDocument;
import com.register.example.entity.TravelRequest;
import com.register.example.entity.Employee;
import com.register.example.exception.ResourceNotFoundException;
import com.register.example.service.TravelRequestService;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.format.annotation.DateTimeFormat;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/travel")
public class TravelRequestController {

    private final TravelRequestService travelRequestService;
    private final EmployeeRepository employeeRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private jakarta.servlet.http.HttpServletRequest servletRequest;

    private String getCurrentUserTenantId() {
        try {
            Object tenantIdAttr = servletRequest.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                return tenantIdAttr.toString();
            }
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null) {
                String employeeId = auth.getPrincipal().toString();
                java.util.Optional<Employee> emp = employeeRepository.findByEmployeeId(employeeId);
                if (emp.isPresent()) {
                    return emp.get().getTenantId();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public TravelRequestController(TravelRequestService travelRequestService, EmployeeRepository employeeRepository) {
        this.travelRequestService = travelRequestService;
        this.employeeRepository = employeeRepository;
    }

    // ===== ADMIN: Upload multiple files =====
    @PostMapping("/admin/upload-pdfs/{requestId}")
    public ResponseEntity<String> uploadMultipleFiles(
            @PathVariable Long requestId,
            @RequestParam("files") MultipartFile[] files) {
        try {
            // Check if the total size exceeds the limit
            long totalSize = 0;
            for (MultipartFile file : files) {
                totalSize += file.getSize();
                String contentType = file.getContentType();
                if (!List.of("application/pdf", "image/jpeg", "image/png").contains(contentType)) {
                    return ResponseEntity.badRequest()
                            .body("Invalid file type detected. Only PDF, JPEG, and PNG are allowed.");
                }
            }
            final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
            if (totalSize > MAX_FILE_SIZE) {
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                        .body("Total file size exceeds the 5MB limit. Please select smaller files.");
            }

            travelRequestService.uploadAdminPdfs(requestId, files);
            return ResponseEntity.ok("Files uploaded successfully.");
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) { // <-- Catch the specific exception
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage()); // <-- Return the clear message
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An unexpected error occurred: " + e.getMessage()); // <--
                                                                                                                 // General
                                                                                                                 // catch-all
        }
    }

    @GetMapping("/documents/{requestId}")
    public ResponseEntity<List<TravelDocument>> getDocumentsByRequestId(@PathVariable Long requestId) {
        List<TravelDocument> documents = travelRequestService.getDocumentsByRequestId(requestId);
        return ResponseEntity.ok(documents); // ✅ Always returns JSON (empty list if none)
    }

    @GetMapping("/download-document/{documentId}")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long documentId) {
        Optional<TravelDocument> documentOpt = travelRequestService.getDocumentById(documentId);

        if (documentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        TravelDocument document = documentOpt.get();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
                // Force browser to treat as generic binary instead of PDF
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(document.getData());
    }

    // ===== CREATE travel request =====
    @PostMapping("/create")
    public ResponseEntity<TravelRequest> createRequest(@RequestBody TravelRequest request) {
        TravelRequest created = travelRequestService.createTravelRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ===== MANAGER Endpoints =====
    @GetMapping("/manager/all/{managerId}")
    public ResponseEntity<List<TravelRequest>> getAllRequestsForManager(@PathVariable String managerId) {
        return ResponseEntity.ok(travelRequestService.getAllRequestsForManager(managerId));
    }

    @GetMapping("/manager/pending/{managerId}")
    public ResponseEntity<List<TravelRequest>> getPendingForManager(@PathVariable String managerId) {
        return ResponseEntity.ok(travelRequestService.getPendingRequestsForManager(managerId));
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<TravelRequest> approveRequest(
            @PathVariable Long id,
            @RequestParam String managerId,
            @RequestParam(required = false, defaultValue = "") String remarks) {
        TravelRequest updated = travelRequestService.approveRequest(id, managerId, remarks);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/reject/{id}")
    public ResponseEntity<String> rejectRequest(
            @PathVariable Long id,
            @RequestParam String managerId,
            @RequestParam(required = false, defaultValue = "") String rejectedReason) {

        if (rejectedReason == null || rejectedReason.trim().length() < 10) {
            return ResponseEntity.badRequest().body("Rejection reason must be at least 10 characters long.");
        }

        try {
            travelRequestService.rejectRequest(id, managerId, rejectedReason.trim());
            return ResponseEntity.ok("Travel request rejected successfully.");
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error rejecting request: " + e.getMessage());
        }
    }

    @PutMapping("/admin/reject/{id}")
    public ResponseEntity<String> rejectRequestByAdmin(
            @PathVariable Long id,
            @RequestParam String adminId,
            @RequestParam(required = false, defaultValue = "") String rejectedReason) {

        if (rejectedReason == null || rejectedReason.trim().length() < 10) {
            return ResponseEntity.badRequest().body("Rejection reason must be at least 10 characters long.");
        }

        try {
            travelRequestService.rejectRequestByAdmin(id, adminId, rejectedReason.trim());
            return ResponseEntity.ok("Travel request rejected by Admin successfully.");
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error rejecting request: " + e.getMessage());
        }
    }

    // ===== CANCEL REQUEST (Employee) =====
    @PutMapping("/cancel/{id}")
    public ResponseEntity<String> cancelRequest(@PathVariable Long id) {
        try {
            travelRequestService.cancelTravelRequest(id);
            return ResponseEntity.ok("Travel request cancelled successfully.");
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error cancelling request: " + e.getMessage());
        }
    }

    // ===== ADMIN: Assigned requests =====
    @GetMapping("/admin/assigned-requests/{adminId}")
    public ResponseEntity<List<TravelRequest>> getRequestsAssignedToAdmin(@PathVariable String adminId) {
        return ResponseEntity.ok(travelRequestService.getRequestsAssignedToAdmin(adminId));
    }

    @PutMapping("/admin/assign/{id}")
    public ResponseEntity<TravelRequest> assignToAdmin(@PathVariable Long id, @RequestParam String adminId) {
        return ResponseEntity.ok(travelRequestService.assignToAdmin(id, adminId));
    }

    @PutMapping("/admin/transfer/{id}")
    public ResponseEntity<TravelRequest> transferToAdmin(@PathVariable Long id, @RequestParam String adminId,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(travelRequestService.transferToAdmin(id, adminId, reason));
    }

    @GetMapping("/admin/travel-admins")
    public ResponseEntity<List<com.register.example.entity.Employee>> getAllTravelAdmins() {
        return ResponseEntity.ok(travelRequestService.getAllTravelAdmins());
    }

    // ===== EMPLOYEE: Travel requests =====
    @GetMapping("/employee/all/{employeeId}")
    public ResponseEntity<List<TravelRequest>> getAllRequestsByEmployee(@PathVariable String employeeId) {
        return ResponseEntity.ok(travelRequestService.getRequestsByEmployee(employeeId));
    }

    @GetMapping("/employee/active/{employeeId}")
    public ResponseEntity<List<TravelRequest>> getActiveRequestsByEmployee(@PathVariable String employeeId) {
        return ResponseEntity.ok(travelRequestService.getActiveRequestsForEmployee(employeeId));
    }

    // ===== MARK AS DOWNLOADED =====
    @PutMapping("/mark-downloaded/{requestId}")
    public ResponseEntity<String> markAsDownloaded(@PathVariable Long requestId) {
        try {
            travelRequestService.markAsDownloaded(requestId);
            return ResponseEntity.ok("Travel request marked as downloaded.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error marking as downloaded: " + e.getMessage());
        }
    }

    // ===== REPORTS =====
    @GetMapping("/reports")
    public ResponseEntity<List<TravelRequest>> getTravelReports(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate,
            @RequestParam(required = false) String fromLocation,
            @RequestParam(required = false) String toLocation,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String modeOfTravel,
            @RequestParam(required = false) String accommodationRequired,
            @RequestParam(required = false) String advanceRequired,
            @RequestParam(required = false) String status) {

        // Helper to convert Date to LocalDate
        java.time.LocalDate start = startDate != null ? new java.sql.Date(startDate.getTime()).toLocalDate() : null;
        java.time.LocalDate end = endDate != null ? new java.sql.Date(endDate.getTime()).toLocalDate() : null;

        String tenantId = getCurrentUserTenantId();
        List<TravelRequest> reports = travelRequestService.getFilteredTravelRequests(
                employeeId, start, end, fromLocation, toLocation, category,
                modeOfTravel, accommodationRequired, advanceRequired, status, tenantId);
        return ResponseEntity.ok(reports);
    }


    // ===== MANUAL MANAGER REASSIGNMENT (Admin Only) =====
    @PutMapping("/admin/reassign-manager/{requestId}")
    public ResponseEntity<String> reassignManager(
            @PathVariable Long requestId,
            @RequestParam String newManagerId,
            @RequestParam(required = false) String reason) {
        try {
            int updatedCount = travelRequestService.reassignRequestManager(requestId, newManagerId, reason);
            return ResponseEntity.ok("Travel request manager reassigned successfully. Updated " + updatedCount + " request(s).");
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error reassigning manager: " + e.getMessage());
        }
    }

    // ===== DEBUG ENDPOINT =====
    @GetMapping("/debug/pending-requests/{employeeId}")
    public ResponseEntity<List<TravelRequest>> debugPendingRequests(@PathVariable String employeeId) {
        try {
            List<TravelRequest> allPending = travelRequestService.getPendingRequestsForEmployee(employeeId);
            return ResponseEntity.ok(allPending);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/debug/test-reassign/{employeeId}")
    public ResponseEntity<String> testReassign(
            @PathVariable String employeeId,
            @RequestParam String newManagerId) {
        try {
            Employee employee = employeeRepository.findByEmployeeId(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            String oldManagerId = employee.getAssignedManagerId();
            
            int updatedCount = travelRequestService.updatePendingRequestsManager(employeeId, oldManagerId, newManagerId);
            return ResponseEntity.ok("Test reassign completed. Updated " + updatedCount + " requests.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}
