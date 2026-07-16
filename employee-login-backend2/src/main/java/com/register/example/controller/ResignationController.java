package com.register.example.controller;

import com.register.example.entity.Resignation;
import com.register.example.payload.ResignationDto;
import com.register.example.service.ResignationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Collections;
import java.util.Map;
import java.time.format.DateTimeFormatter;
import com.register.example.entity.ExitQuestion;
import com.register.example.entity.ExitReason;

@RestController
@RequestMapping("/api/v1/exit-management")
@CrossOrigin("*")
public class ResignationController {

    private static final String CONST_MANAGER = "MANAGER";
    private static final String CONST_COMMENT = "comment";
    private static final String CONST_MANAGER_COMMENT = "managerComment";
    private static final String CONST_REVIEWER = "REVIEWER";
    private static final String CONST_REVIEWER_COMMENT = "reviewerComment";
    private static final String CONST_ADMIN = "ADMIN";

    private final ResignationService resignationService;

    @Autowired
    private jakarta.servlet.http.HttpServletRequest servletRequest;

    @Autowired
    private com.register.example.repository.EmployeeRepository employeeRepository;

    private String getCurrentUserTenantId() {
        try {
            Object tenantIdAttr = servletRequest.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                return tenantIdAttr.toString();
            }
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null) {
                String employeeId = auth.getPrincipal().toString();
                com.register.example.entity.Employee emp = employeeRepository.findByEmployeeId(employeeId).orElse(null);
                if (emp != null) {
                    return emp.getTenantId();
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    @Autowired
    public ResignationController(ResignationService resignationService) {
        this.resignationService = resignationService;
    }

    // ---------------- EMPLOYEE ----------------
    @PostMapping("/resignations")
    public ResponseEntity<Object> submitResignation(
            @Valid @RequestBody ResignationDto dto,
            @RequestHeader("employeeId") String employeeId,
            @RequestHeader("employeeName") String employeeName) {
        try {
            Resignation saved = resignationService.submitResignation(dto, employeeId, employeeName);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Resignation submitted. Status: " + saved.getStatus() + " | ID: " + saved.getId());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to process resignation submission.");
        }
    }

    @GetMapping("/resignations")
    public ResponseEntity<Object> getAllResignations(@RequestHeader("employeeId") String employeeId) {
        try {
            List<Resignation> allResignations = resignationService.getMyResignationHistory(employeeId);
            return ResponseEntity.ok(allResignations != null ? allResignations : Collections.emptyList());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch resignation data.");
        }
    }

    @GetMapping("/resignations/{id}")
    public ResponseEntity<Object> getResignationById(
            @PathVariable Long id,
            @RequestHeader("employeeId") String employeeId) {
        try {
            Resignation resignation = resignationService.getResignationById(id);
            if (resignation == null || !resignation.getEmployeeId().equals(employeeId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Resignation not found or access denied.");
            }
            return ResponseEntity.ok(resignation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch resignation details.");
        }
    }

    @PutMapping("/resignations/{id}")
    public ResponseEntity<Object> updateResignation(
            @PathVariable Long id,
            @Valid @RequestBody ResignationDto dto,
            @RequestHeader("employeeId") String employeeId,
            @RequestHeader("employeeName") String employeeName) {
        try {
            Resignation updated = resignationService.updateResignation(id, dto, employeeId, employeeName);
            return ResponseEntity
                    .ok("Resignation updated. Status: " + updated.getStatus() + " | ID: " + updated.getId());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to process resignation update.");
        }
    }

    @DeleteMapping("/resignations/{id}")
    public ResponseEntity<Object> deleteResignation(@PathVariable Long id) {
        try {
            resignationService.deleteResignation(id);
            return ResponseEntity.ok("Draft Resignation with ID " + id + " deleted successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete draft resignation.");
        }
    }

    // ---------------- MANAGER ----------------
    @GetMapping("/manager/pending-resignations")
    public ResponseEntity<Object> getManagerPendingResignations(@RequestHeader("managerId") String managerId) {
        try {
            List<Resignation> pending = resignationService.getAssignedResignations(CONST_MANAGER, managerId);
            return ResponseEntity.ok(pending != null ? pending : Collections.emptyList());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch manager pending resignations.");
        }
    }

    @PutMapping("/manager/resignations/{id}/approve")
    public ResponseEntity<Object> approveResignationByManager(
            @PathVariable Long id,
            @RequestHeader("managerId") String managerId,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            // ✅ Accepts both "comment" and "managerComment" keys
            String comment = "";
            if (payload != null) {
                if (payload.containsKey(CONST_COMMENT)) {
                    comment = payload.get(CONST_COMMENT);
                } else if (payload.containsKey(CONST_MANAGER_COMMENT)) {
                    comment = payload.get(CONST_MANAGER_COMMENT);
                }
            }

            Resignation updated = resignationService.approveResignation(id, CONST_MANAGER, managerId, comment);
            return ResponseEntity.ok("Resignation approved by Manager. Status: " + updated.getStatus());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/manager/resignations/{id}/reject")
    public ResponseEntity<Object> rejectResignationByManager(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            // ✅ Accepts both "comment" and "managerComment" keys
            String comment = "";
            if (payload != null) {
                if (payload.containsKey(CONST_COMMENT)) {
                    comment = payload.get(CONST_COMMENT);
                } else if (payload.containsKey(CONST_MANAGER_COMMENT)) {
                    comment = payload.get(CONST_MANAGER_COMMENT);
                }
            }

            Resignation updated = resignationService.rejectResignation(id, CONST_MANAGER, comment);
            return ResponseEntity.ok("Resignation rejected by Manager. Status: " + updated.getStatus());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ---------------- REVIEWER ----------------
    @GetMapping("/reviewer/pending-resignations")
    public ResponseEntity<Object> getReviewerPendingResignations(@RequestHeader("reviewerId") String reviewerId) {
        try {
            List<Resignation> pending = resignationService.getAssignedResignations(CONST_REVIEWER, reviewerId);
            return ResponseEntity.ok(pending != null ? pending : Collections.emptyList());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch reviewer pending resignations.");
        }
    }

    @PutMapping("/reviewer/resignations/{id}/approve")
    public ResponseEntity<Object> approveResignationByReviewer(
            @PathVariable Long id,
            @RequestHeader("reviewerId") String reviewerId,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            // ✅ Accepts both "comment" and "reviewerComment" keys
            String comment = "";
            if (payload != null) {
                if (payload.containsKey(CONST_COMMENT)) {
                    comment = payload.get(CONST_COMMENT);
                } else if (payload.containsKey(CONST_REVIEWER_COMMENT)) {
                    comment = payload.get(CONST_REVIEWER_COMMENT);
                }
            }

            Resignation updated = resignationService.approveResignation(id, CONST_REVIEWER, reviewerId, comment);
            return ResponseEntity.ok("Resignation approved by Reviewer. Status: " + updated.getStatus());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/reviewer/resignations/{id}/reject")
    public ResponseEntity<Object> rejectResignationByReviewer(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            // ✅ Accepts both "comment" and "reviewerComment" keys
            String comment = "";
            if (payload != null) {
                if (payload.containsKey(CONST_COMMENT)) {
                    comment = payload.get(CONST_COMMENT);
                } else if (payload.containsKey(CONST_REVIEWER_COMMENT)) {
                    comment = payload.get(CONST_REVIEWER_COMMENT);
                }
            }

            Resignation updated = resignationService.rejectResignation(id, CONST_REVIEWER, comment);
            return ResponseEntity.ok("Resignation rejected by Reviewer. Status: " + updated.getStatus());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ---------------- HR ----------------
    // New endpoint: HR approval (separate from clearance)
    @PutMapping("/hr/resignations/{id}/approve")
    public ResponseEntity<Object> approveResignationByHr(
            @PathVariable Long id,
            @RequestHeader("hrId") String hrId) {
        try {
            Resignation updated = resignationService.approveResignation(id, "HR", hrId);
            return ResponseEntity.ok("Resignation approved by HR. Status: " + updated.getStatus());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/hr/resignations/{id}/reject")
    public ResponseEntity<Object> rejectResignationByHr(
            @PathVariable Long id,
            @RequestHeader("hrId") String hrId) {
        try {
            Resignation updated = resignationService.rejectResignation(id, "HR", hrId);
            return ResponseEntity.ok("Resignation rejected by HR. Status: " + updated.getStatus());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ---------------- HR & ADMIN CLEARANCE ----------------
    @GetMapping("/hr/approved-resignations")
    public ResponseEntity<Object> getHRAssignedResignations(
            @RequestHeader(value = "hrId", required = false) String hrId,
            @RequestHeader(value = "adminId", required = false) String adminId) {
        try {
            String roleType = hrId != null ? "HR" : CONST_ADMIN;
            String roleId = hrId != null ? hrId : adminId;

            if (roleId == null)
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing HR or Admin identifier.");

            List<Resignation> pending = resignationService.getAssignedResignations(roleType, roleId);
            return ResponseEntity.ok(pending != null ? pending : Collections.emptyList());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch HR/Admin assigned resignations.");
        }
    }

    // ---------------- HR EDIT LWD ----------------
    @PutMapping("/hr/resignations/{id}/edit-lwd")
    public ResponseEntity<Object> editLwdByHr(
            @PathVariable("id") Long resignationId,
            @RequestHeader("hrId") String hrId,
            @RequestBody Map<String, String> payload) {
        try {
            String newLwd = payload.get("lastWorkingDay");
            String hrComments = payload.get("comments");
            Resignation updated = resignationService.editLastWorkingDayByHr(resignationId, hrId, newLwd, hrComments);
            return ResponseEntity.ok("Last Working Day updated by HR. New LWD: " + updated.getLastWorkingDay());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ---------------- MANAGER EDIT LWD ----------------
    @PutMapping("/manager/resignations/{id}/edit-lwd")
    public ResponseEntity<Object> editLwdByManager(
            @PathVariable("id") Long resignationId,
            @RequestHeader("managerId") String managerId,
            @RequestBody Map<String, String> payload) {
        try {
            String newLwd = payload.get("lastWorkingDay");
            String managerComments = payload.get("comments");
            Resignation updated = resignationService.editLastWorkingDayByManager(resignationId, managerId, newLwd, managerComments);
            return ResponseEntity.ok("Last Working Day updated by Manager. New LWD: " + updated.getLastWorkingDay());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ---------------- FINANCE ----------------
    @GetMapping("/finance/pending-resignations")
    public ResponseEntity<Object> getFinancePendingResignations(@RequestHeader("financeId") String financeId) {
        try {
            List<Resignation> pending = resignationService.getAssignedResignations("FINANCE", financeId);
            return ResponseEntity.ok(pending != null ? pending : Collections.emptyList());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch finance pending resignations.");
        }
    }

    @PostMapping("/hr/clearance/{id}")
    public ResponseEntity<Object> submitHrClearance(
            @PathVariable Long id,
            @RequestHeader("hrId") String hrId,
            @RequestBody Map<String, String> payload) {
        try {
            String newLwd = payload.get("editedLastWorkingDay");
            String comments = payload.get("hrAdditionalComments");

            // Update LWD if needed
            Resignation resignation = resignationService.getResignationById(id);

            // Only call edit LWD when HR actually changed it
            if (newLwd != null && !newLwd.isBlank()
                    && !newLwd.equals(
                            resignation.getLastWorkingDay().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")))) {

                resignation = resignationService.editLastWorkingDayByHr(id, hrId, newLwd, comments);
            }
            resignationService.markClearanceComplete(id, "HR", true, hrId);

            return ResponseEntity.ok("HR clearance submitted successfully for ID: " + id);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error submitting HR clearance: " + e.getMessage());
        }
    }

    @PostMapping("/admin/clearance/{id}")
    public ResponseEntity<Object> submitAdminClearance(
            @PathVariable Long id,
            @RequestHeader("adminId") String adminId,
            @RequestBody Map<String, String> payload) {
        try {
            String comments = payload.getOrDefault("adminAdditionalComments", "");

            // ⭐ Mark admin clearance COMPLETE using service logic
            Resignation updated = resignationService.markClearanceComplete(id, CONST_ADMIN, true, adminId);

            // ⭐ Append admin comments if any
            if (comments != null && !comments.isBlank()) {
                String prev = updated.getComments();
                String combined = (prev == null || prev.isBlank())
                        ? "Admin Comments: " + comments
                        : prev + "\nAdmin Comments: " + comments;
                updated.setComments(combined);
                resignationService.saveResignation(updated);
            }

            return ResponseEntity.ok(
                    "Admin clearance completed successfully for ID: " + id +
                            " | Status: " + updated.getStatus());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error submitting admin clearance: " + e.getMessage());
        }
    }

    @GetMapping("/document/{id}")
    public ResponseEntity<byte[]> downloadResignationDocument(@PathVariable Long id) {
        try {
            // Fetch resignation record
            Resignation resignation = resignationService.getResignationById(id);
            if (resignation == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(null);
            }

            byte[] fileData = resignation.getDocument();
            String fileName = resignation.getDocumentName();

            if (fileData == null || fileData.length == 0) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT)
                        .body(null);
            }

            // Detect MIME type (basic detection based on extension)
            String contentType = "application/octet-stream";
            if (fileName != null) {
                String lower = fileName.toLowerCase();
                if (lower.endsWith(".pdf"))
                    contentType = "application/pdf";
                else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg"))
                    contentType = "image/jpeg";
                else if (lower.endsWith(".png"))
                    contentType = "image/png";
                else if (lower.endsWith(".doc") || lower.endsWith(".docx"))
                    contentType = "application/msword";
            }

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                    .header("Access-Control-Expose-Headers", "Content-Disposition")
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .body(fileData);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/finance/final-settlement/{id}")
    public ResponseEntity<Object> submitFinanceSettlement(
            @PathVariable Long id,
            @RequestHeader("financeId") String financeId,
            @RequestBody(required = false) Map<String, Object> payload) {
        try {
            Resignation updated = resignationService.markFinanceSettlementDone(id, financeId);
            return ResponseEntity.ok("Finance settlement completed successfully for ID: " + id);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error submitting finance settlement: " + e.getMessage());
        }
    }

    @PutMapping("/admin/resignations/{id}/reject")
    public ResponseEntity<Object> rejectByAdmin(
            @PathVariable Long id,
            @RequestHeader("adminId") String adminId,
            @RequestBody Map<String, String> payload) {
        try {
            String comment = payload.getOrDefault("comment", "");
            Resignation updated = resignationService.rejectResignation(id, CONST_ADMIN, comment, adminId);
            return ResponseEntity.ok("Resignation rejected by Admin. Status: " + updated.getStatus());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/finance/resignations/{id}/reject")
    public ResponseEntity<Object> rejectResignationByFinance(
            @PathVariable Long id,
            @RequestHeader("financeId") String financeId,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            String comment = payload != null ? payload.getOrDefault("comment", "") : "";

            Resignation updated = resignationService.rejectResignation(id, "FINANCE", comment, financeId);

            return ResponseEntity.ok("Resignation rejected by Finance. Status: " + updated.getStatus());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Finance rejection failed: " + e.getMessage());
        }
    }

    @GetMapping("/admin/pending-resignations")
    public ResponseEntity<Object> getPendingResignationsForAdmin(
            @RequestHeader("adminId") String adminId) {
        try {
            List<Resignation> list = resignationService.getPendingResignationsForAdmin(adminId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to load admin pending resignations.");
        }
    }

    @PostMapping("/resignations/{id}/update-status")
    public ResponseEntity<Object> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String action = request.get("action"); // ex: "manager_reviewer_approved"
        return ResponseEntity.ok(resignationService.updateResignationStatus(id, action));
    }
    // ================= EXIT REASON APIs =====================

    // ================= EXIT REASON APIs =====================

    // ADD A NEW EXIT REASON
    @PostMapping("/exit-reasons")
    public ResponseEntity<Object> addExitReason(@RequestBody ExitReason reason) {
        try {
            if (reason.getReason() == null || reason.getReason().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Reason cannot be empty.");
            }

            String tenantId = getCurrentUserTenantId();
            reason.setTenantId(tenantId);
            // duplicate check per tenant
            List<ExitReason> existing = resignationService.getExitReasons(tenantId);
            boolean duplicate = existing.stream().anyMatch(r -> r.getReason().equalsIgnoreCase(reason.getReason().trim()));
            if (duplicate) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Exit reason already exists.");
            }

            ExitReason saved = resignationService.saveExitReason(reason);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to save reason: " + e.getMessage());
        }
    }

    // LOAD ALL ACTIVE REASONS
    @GetMapping("/exit-reasons")
    public ResponseEntity<Object> getAllReasons() {
        try {
            String tenantId = getCurrentUserTenantId();
            return ResponseEntity.ok(resignationService.getExitReasons(tenantId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to load reasons.");
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<Object> getResignationsReport(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate endDate) {
        try {
            String tenantId = getCurrentUserTenantId();
            return ResponseEntity
                    .ok(resignationService.getFilteredResignations(employeeId, status, reason, startDate, endDate, tenantId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to load report data: " + e.getMessage());
        }
    }

    // DELETE EXIT REASON
    @DeleteMapping("/exit-reasons/{id}")
    public ResponseEntity<Object> deleteExitReason(@PathVariable Long id) {
        try {
            resignationService.deleteExitReason(id);
            return ResponseEntity.ok("Exit reason deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to delete reason.");
        }
    }

    // ========== GLOBAL/EMPLOYEE NOTICE PERIOD API ==========
    @GetMapping("/notice-period")
    public ResponseEntity<Object> getNoticePeriod(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestHeader(value = "employeeId", required = false) String employeeId) {
        try {
            String resolvedEmpId = employeeId;
            if (resolvedEmpId == null || resolvedEmpId.isBlank() || resolvedEmpId.equalsIgnoreCase("undefined")) {
                org.springframework.security.core.Authentication authentication = 
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.getPrincipal() != null) {
                    resolvedEmpId = authentication.getPrincipal().toString();
                }
            }

            if (resolvedEmpId != null && !resolvedEmpId.isBlank() && !resolvedEmpId.equalsIgnoreCase("anonymousUser")) {
                java.util.Optional<com.register.example.entity.Employee> empOpt = employeeRepository.findByEmployeeId(resolvedEmpId);
                if (empOpt.isPresent()) {
                    String empNotice = empOpt.get().getNoticePeriod();
                    if (empNotice != null && !empNotice.trim().isEmpty()) {
                        String clean = empNotice.toLowerCase().trim();
                        String numStr = clean.replaceAll("[^0-9]", "");
                        if (!numStr.isEmpty()) {
                            try {
                                int val = Integer.parseInt(numStr);
                                if (clean.contains("month")) {
                                    val = val * 30; // convert months to days
                                }
                                return ResponseEntity.ok(val);
                            } catch (Exception e) {
                                // Fallback
                            }
                        }
                    }
                }
            }

            String tenantId = getCurrentUserTenantId();
            return ResponseEntity.ok(resignationService.getNoticePeriod(tenantId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to load notice period.");
        }
    }

    @PutMapping("/notice-period")
    public ResponseEntity<Object> updateNoticePeriod(
            @RequestBody Map<String, Integer> payload,
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestHeader(value = "employeeId", required = false) String employeeId) {
        try {
            Integer days = payload.get("days");
            if (days == null || days <= 0) {
                return ResponseEntity.badRequest().body("Invalid notice period value.");
            }

            String tenantId = getCurrentUserTenantId();
            Integer updated = resignationService.updateNoticePeriod(days, tenantId);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to update notice period.");
        }
    }

    // ===================== EXIT QUESTIONS APIs =========================

    @PostMapping("/exit-questions")
    public ResponseEntity<Object> addExitQuestion(@RequestBody ExitQuestion question) {
        try {
            if (question.getLabel() == null || question.getLabel().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Question label cannot be empty.");
            }
            String tenantId = getCurrentUserTenantId();
            question.setTenantId(tenantId);
            return ResponseEntity.ok(resignationService.saveExitQuestion(question));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to save question.");
        }
    }

    @GetMapping("/exit-questions")
    public ResponseEntity<Object> getExitQuestions() {
        try {
            String tenantId = getCurrentUserTenantId();
            return ResponseEntity.ok(resignationService.getExitQuestions(tenantId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to load questions.");
        }
    }

    @DeleteMapping("/exit-questions/{id}")
    public ResponseEntity<Object> deleteExitQuestion(@PathVariable Long id) {
        try {
            resignationService.deleteExitQuestion(id);
            return ResponseEntity.ok("Deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to delete question.");
        }
    }

    // ---------------- IT CLEARANCE ----------------
    @PostMapping("/it/clearance/{id}")
    public ResponseEntity<Object> submitItClearance(
            @PathVariable Long id,
            @RequestHeader("itId") String itId,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            // (Optional) you can validate 'itId' with Employee/Access service if required

            String comments = payload != null ? payload.getOrDefault("comments", "") : "";

            Resignation updated = resignationService.markClearanceComplete(id, "IT", true, itId);

            // Optionally append comments to resignation.comments
            if (comments != null && !comments.isBlank()) {
                String prev = updated.getComments();
                String combined = (prev == null || prev.isBlank())
                        ? "IT Comments: " + comments
                        : prev + "\nIT Comments: " + comments;
                updated.setComments(combined);
                resignationService.saveResignation(updated);
            }

            return ResponseEntity.ok("IT clearance submitted successfully for ID: " + id);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error submitting IT clearance: " + e.getMessage());
        }
    }

    @GetMapping("/adjust-lwd")
    public ResponseEntity<Object> adjustLwdForUi(
            @RequestParam String employeeId,
            @RequestParam String date) {
        try {
            return ResponseEntity.ok(resignationService.adjustLwdForUi(employeeId, date));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Controller error: " + e.getMessage()));
        }
    }

    @Autowired
    private com.register.example.scheduler.EmployeeExitScheduler employeeExitScheduler;

    @PostMapping("/resignations/trigger-exits")
    public ResponseEntity<Object> triggerExitsManually() {
        try {
            employeeExitScheduler.deactivateDepartedEmployees();
            return ResponseEntity.ok(Map.of("message", "Exits deactivation scheduler triggered manually. Check console logs."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

}
