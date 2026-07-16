package com.register.example.controller;

import com.register.example.payload.ClaimHistoryDto;
import com.register.example.entity.Claim;
import com.register.example.entity.ClaimDraft;
import com.register.example.service.ClaimService;
import com.register.example.service.ClaimDraftService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.register.example.service.EmployeeService;
import com.register.example.entity.Employee;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.register.example.entity.ClaimCategory;
import com.register.example.annotation.AuditLog;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.format.annotation.DateTimeFormat;
import java.util.Date;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    @Autowired
    private ClaimService claimService;

    @Autowired
    private ClaimDraftService claimDraftService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private com.register.example.repository.DelegationRepository delegationRepository;

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
                Employee emp = employeeService.getEmployeeByEmployeeId(employeeId);
                if (emp != null) {
                    return emp.getTenantId();
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    // --- Existing Endpoints ---

    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> submitClaim(
            @RequestPart("claim") String claimJson,
            @RequestPart(value = "receiptFile", required = false) MultipartFile receiptFile) {
        try {
            if (receiptFile != null && !receiptFile.isEmpty()) {
                String contentType = receiptFile.getContentType();
                if (!List.of("application/pdf", "image/jpeg", "image/png").contains(contentType)) {
                    return ResponseEntity.badRequest().body("Invalid file type. Only PDF, JPEG, and PNG are allowed.");
                }
            }
            Claim claim = objectMapper.readValue(claimJson, Claim.class);
            Claim savedClaim = claimService.submitClaimWithReceipt(claim, receiptFile);
            return ResponseEntity.ok(savedClaim);
        } catch (IllegalArgumentException | IOException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body("Error submitting claim: " + e.getMessage());

        }
    }

    @PostMapping(value = "/submit-bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> submitBulkClaims(
            @RequestPart("claims") String claimsJson,
            @RequestPart(value = "receiptFiles", required = false) List<MultipartFile> receiptFiles) {
        try {
            List<Claim> claims = objectMapper.readValue(claimsJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Claim.class));
            List<Claim> savedClaims = claimService.submitClaimsBulk(claims, receiptFiles);
            return ResponseEntity.ok(savedClaims);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error submitting bulk claims: " + e.getMessage());
        }
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<Claim>> getClaimsForManager(@PathVariable String managerId) {
        List<Claim> claims = claimService.getClaimsForManager(managerId);
        return ResponseEntity.ok(claims);
    }

    @GetMapping("/finance/{financeId}")
    public ResponseEntity<List<Claim>> getClaimsForFinance(@PathVariable String financeId) {
        List<Claim> claims = claimService.getClaimsForFinance(financeId);
        return ResponseEntity.ok(claims);
    }

    /* 
    @GetMapping("/hr/{hrId}")
    public ResponseEntity<List<Claim>> getClaimsByHrId(@PathVariable String hrId) {
        List<Claim> claims = claimService.getClaimsByHrId(hrId);
        return ResponseEntity.ok(claims);
    }
    */

    @PostMapping("/approve/{id}")
    public ResponseEntity<String> approveClaim(@PathVariable Long id, @RequestParam String role) {
        String result = claimService.approveClaim(id, role);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reject/{id}")
    public ResponseEntity<String> rejectClaim(
            @PathVariable Long id,
            @RequestParam String role,
            @RequestParam String reason) {
        String result = claimService.rejectClaim(id, role, reason);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<String> cancelClaim(@PathVariable Long id) {
        try {
            String result = claimService.cancelClaim(id);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error cancelling claim: " + e.getMessage());
        }
    }

    @GetMapping("/status-details/{id}")
    public ResponseEntity<Map<String, Object>> getClaimStatusDetails(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.getClaimStatusDetails(id));
    }

    @GetMapping("/history/{employeeId}")
    public ResponseEntity<List<ClaimHistoryDto>> getHistory(@PathVariable String employeeId) {
        return ResponseEntity.ok(claimService.getClaimHistoryFast(employeeId));
    }

    /* 
    @PutMapping("/hr/update-status/{id}")
    public ResponseEntity<String> updateHRStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        String result = claimService.updateHRStatus(id, status);
        return ResponseEntity.ok(result);
    }
    */

    @GetMapping("/summary/{employeeId}")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable String employeeId) {
        Map<String, Object> summary = claimService.getClaimSummaryByEmployeeId(employeeId);
        return ResponseEntity.ok(summary);
    }

    // Updated /receipt endpoint to use the reusable method with a disposition
    // parameter
    @GetMapping("/receipt/{id}")
    public ResponseEntity<byte[]> getClaimReceipt(@PathVariable Long id,
            @RequestParam(value = "disposition", defaultValue = "inline") String disposition) {
        Claim claim = claimService.findById(id);
        if (claim != null) {
            return createReceiptResponse(claim.getReceipt(), claim.getReceiptName(), disposition);
        }
        return ResponseEntity.notFound().build();
    }

    // Updated /draft/receipt endpoint to use the reusable method with a disposition
    // parameter
    @GetMapping("/draft/receipt/{draftId}")
    public ResponseEntity<byte[]> getDraftReceipt(@PathVariable Long draftId,
            @RequestParam(value = "disposition", defaultValue = "inline") String disposition) {
        Optional<ClaimDraft> draftClaimOptional = claimDraftService.getDraftById(draftId);

        if (draftClaimOptional.isPresent()) {
            ClaimDraft draft = draftClaimOptional.get();
            return createReceiptResponse(draft.getReceipt(), draft.getReceiptName(), disposition);
        }
        return ResponseEntity.notFound().build();
    }

    // --- Drafts Endpoints ---

    @PostMapping(value = "/draft", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> saveDraft(
            @RequestPart("claimDraft") String claimDraftJson,
            @RequestPart(value = "receiptFile", required = false) MultipartFile receiptFile) {
        try {
            if (receiptFile != null && !receiptFile.isEmpty()) {
                String contentType = receiptFile.getContentType();
                if (!List.of("application/pdf", "image/jpeg", "image/png").contains(contentType)) {
                    return ResponseEntity.badRequest().body("Invalid file type. Only PDF, JPEG, and PNG are allowed.");
                }
            }
            ClaimDraft draftDto = objectMapper.readValue(claimDraftJson, ClaimDraft.class);
            ClaimDraft savedDraft = claimDraftService.saveClaimDraft(draftDto, receiptFile);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedDraft);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error saving draft: " + e.getMessage());
        }
    }

    @PutMapping(value = "/draft/{draftId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> updateDraft(
            @PathVariable Long draftId,
            @RequestPart("claimDraft") String claimDraftJson,
            @RequestPart(value = "receiptFile", required = false) MultipartFile receiptFile) {
        try {
            ClaimDraft draftDto = objectMapper.readValue(claimDraftJson, ClaimDraft.class);

            if (!draftId.equals(draftDto.getExpenseId())) {
                return ResponseEntity.badRequest().body("ID in path does not match ID in payload.");
            }

            ClaimDraft updatedDraft = claimDraftService.updateClaimDraft(draftDto, receiptFile);
            return ResponseEntity.ok(updatedDraft);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating draft: " + e.getMessage());
        }
    }

    @GetMapping("/draft/{draftId}")
    public ResponseEntity<ClaimDraft> getDraftForEdit(@PathVariable Long draftId) {
        Optional<ClaimDraft> draftClaimOptional = claimDraftService.getDraftById(draftId);
        return draftClaimOptional.map(claimDraft -> new ResponseEntity<>(claimDraft, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/drafts/{employeeId}")
    public ResponseEntity<List<ClaimDraft>> getEmployeeDrafts(@PathVariable String employeeId) {
        List<ClaimDraft> drafts = claimDraftService.getDrafts(employeeId);
        return ResponseEntity.ok(drafts);
    }

    @GetMapping("/draft/group/{groupId}")
    public ResponseEntity<List<ClaimDraft>> getDraftsByGroupId(@PathVariable String groupId) {
        List<ClaimDraft> drafts = claimDraftService.getDraftsByGroupId(groupId);
        return ResponseEntity.ok(drafts);
    }

    @PostMapping("/submit-draft/{draftId}")
    public ResponseEntity<Claim> submitDraftFromDraft(@PathVariable Long draftId) {
        try {
            Claim submittedClaim = claimService.submitDraft(draftId);
            return new ResponseEntity<>(submittedClaim, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/draft/delete/{id}")
    public ResponseEntity<Void> deleteDraft(@PathVariable Long id) {
        claimDraftService.deleteDraft(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/submit-draft/{draftId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Object> submitUpdatedDraft(
            @PathVariable Long draftId,
            @RequestPart("claim") String claimJson,
            @RequestPart(value = "receiptFile", required = false) MultipartFile receiptFile) {
        try {
            // Deserialize the claim JSON string into a Claim object
            Claim claim = objectMapper.readValue(claimJson, Claim.class);

            // This service method will now handle both updating the draft and submitting
            // it.
            // It will update the data first, then change its status from 'draft' to
            // 'pending'.
            Claim submittedClaim = claimService.submitUpdatedDraft(draftId, claim, receiptFile);

            // Return the newly created claim and a status of CREATED
            return new ResponseEntity<>(submittedClaim, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error submitting updated draft: " + e.getMessage());
        }
    }

    // Reusable method to create a ResponseEntity for a receipt, now with
    // disposition control
    private ResponseEntity<byte[]> createReceiptResponse(byte[] receiptData, String receiptName, String disposition) {
        if (receiptData == null || receiptName == null) {
            return ResponseEntity.notFound().build();
        }

        String fileExtension = "";
        int dotIndex = receiptName.lastIndexOf('.');
        if (dotIndex > 0) {
            fileExtension = receiptName.substring(dotIndex + 1).toLowerCase();
        }

        MediaType contentType;
        switch (fileExtension) {
            case "jpg":
            case "jpeg":
                contentType = MediaType.IMAGE_JPEG;
                break;
            case "png":
                contentType = MediaType.IMAGE_PNG;
                break;
            case "pdf":
                contentType = MediaType.APPLICATION_PDF;
                break;
            default:
                contentType = MediaType.APPLICATION_OCTET_STREAM;
                break;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(contentType);
        headers.add(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + receiptName + "\"");

        return new ResponseEntity<>(receiptData, headers, HttpStatus.OK);
    }

    private boolean isDelegationActiveOnDate(com.register.example.entity.Delegation d, java.util.Date now) {
        if (!"Active".equalsIgnoreCase(d.getStatus())) {
            return false;
        }
        java.util.Calendar cal = java.util.Calendar.getInstance();
        
        cal.setTime(d.getBeginDate());
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
        cal.set(java.util.Calendar.MINUTE, 0);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        java.util.Date startDate = cal.getTime();
        
        cal.setTime(d.getEndDate());
        cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
        cal.set(java.util.Calendar.MINUTE, 59);
        cal.set(java.util.Calendar.SECOND, 59);
        cal.set(java.util.Calendar.MILLISECOND, 999);
        java.util.Date endDate = cal.getTime();

        return !now.before(startDate) && !now.after(endDate);
    }

    private boolean isDelegationTypeValid(com.register.example.entity.Delegation d) {
        return "Claims".equalsIgnoreCase(d.getRequestType()) || "All".equalsIgnoreCase(d.getRequestType());
    }

    private void processDelegations(List<com.register.example.entity.Delegation> delegations, List<Employee> allEmployees, java.util.Date now, boolean[] roles) {
        for (com.register.example.entity.Delegation d : delegations) {
            if (!isDelegationActiveOnDate(d, now)) {
                continue;
            }
            if (!isDelegationTypeValid(d)) {
                continue;
            }
            String delegatorId = d.getDelegatorId();
            if (allEmployees.stream().anyMatch(emp -> delegatorId.equals(emp.getAssignedManagerId()))) {
                roles[0] = true;
            }
            if (allEmployees.stream().anyMatch(emp -> delegatorId.equals(emp.getAssignedFinanceId()))) {
                roles[1] = true;
            }
            if (allEmployees.stream().anyMatch(emp -> delegatorId.equals(emp.getAssignedHrId()))) {
                roles[2] = true;
            }
        }
    }

    @GetMapping("/assigned-ids/{employeeId}")
    public ResponseEntity<Map<String, Boolean>> getAssignedIds(@PathVariable String employeeId) {
        List<Employee> allEmployees = employeeService.getAllEmployees();

        boolean isManager = allEmployees.stream().anyMatch(emp -> employeeId.equals(emp.getAssignedManagerId()));
        boolean isFinance = allEmployees.stream().anyMatch(emp -> employeeId.equals(emp.getAssignedFinanceId()));
        boolean isHr = allEmployees.stream().anyMatch(emp -> employeeId.equals(emp.getAssignedHrId()));

        Employee self = allEmployees.stream()
                .filter(emp -> employeeId.equals(emp.getEmployeeId()))
                .findFirst()
                .orElse(null);

        if (self != null) {
            if (employeeId.equals(self.getAssignedManagerId()))
                isManager = true;
            if (employeeId.equals(self.getAssignedFinanceId()))
                isFinance = true;
            if (employeeId.equals(self.getAssignedHrId()))
                isHr = true;
        }

        // --- DELEGATION CHECK ---
        java.util.Date now = new java.util.Date();
        List<com.register.example.entity.Delegation> delegations = delegationRepository.findByDelegateId(employeeId);
        boolean[] roles = new boolean[]{isManager, isFinance, isHr};
        processDelegations(delegations, allEmployees, now, roles);
        isManager = roles[0];
        isFinance = roles[1];
        isHr = roles[2];

        isHr = false; // HR removed from Claims flow

        boolean canViewTasks = isManager || isFinance || isHr;

        return ResponseEntity.ok(Map.of(
                "manager", isManager,
                "finance", isFinance,
                "hr", isHr,
                "canViewTasks", canViewTasks
        ));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<ClaimCategory>> getActiveCategories() {
        String tenantId = getCurrentUserTenantId();
        return ResponseEntity.ok(claimService.getActiveCategories(tenantId));
    }

    @PostMapping("/categories")
    public ResponseEntity<Object> createCategory(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("categoryName");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Category name is required");
            }

            String tenantId = getCurrentUserTenantId();
            ClaimCategory saved = claimService.saveCategory(name, tenantId);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);

        } catch (DataIntegrityViolationException ex) {
            // because category already exists in tenant
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Category already exists. Please add a new one.");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error saving category: " + ex.getMessage());
        }
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Object> deleteCategory(@PathVariable Long id) {
        try {
            claimService.deleteCategory(id);
            return ResponseEntity.noContent().build(); // 204
        } catch (DataIntegrityViolationException e) {
            // Category already used in claims
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Category is already used in claims");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete category");
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<List<Claim>> getClaimsReport(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double amount,
            @RequestParam(required = false) Double minAmount,
            @RequestParam(required = false) Double maxAmount,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {

        String tenantId = getCurrentUserTenantId();
        List<Claim> claims = claimService.getFilteredClaims(employeeId, category, amount, minAmount, maxAmount, status,
                startDate, endDate, tenantId);
        return ResponseEntity.ok(claims);
    }
}