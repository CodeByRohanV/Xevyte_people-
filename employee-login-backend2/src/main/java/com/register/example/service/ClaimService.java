package com.register.example.service;

import com.register.example.entity.*;
import com.register.example.repository.*;
import com.register.example.annotation.AuditLog;

import com.register.example.payload.ClaimHistoryDto;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClaimService {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private ClaimDraftService claimDraftService;

    @Autowired
    private ClaimDraftRepository claimDraftRepository;

    @Autowired
    private ClaimCategoryRepository claimCategoryRepository;

    @Autowired
    private EmailService emailService; // added email sending service

    @Autowired
    private ClaimApprovalHistoryRepository claimApprovalHistoryRepository;

    @Autowired
    private AllocationRepository allocationRepository;

    @Autowired
    private DelegationRepository delegationRepository;

    @Autowired
    private com.register.example.service.DelegationService delegationService;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void dropClaimCategoryUniqueConstraint() {
        try {
            // Find unique constraints/indexes on claim_category for column category_name
            List<String> indexNames = entityManager.createNativeQuery(
                "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claim_category' " +
                "AND COLUMN_NAME = 'category_name' AND NON_UNIQUE = 0"
            ).getResultList();

            for (String indexName : indexNames) {
                if (!"PRIMARY".equalsIgnoreCase(indexName)) {
                    entityManager.createNativeQuery("ALTER TABLE claim_category DROP INDEX " + indexName).executeUpdate();
                    System.out.println("Successfully dropped unique index: " + indexName + " on claim_category");
                }
            }
        } catch (Exception e) {
            System.err.println("Note: Could not drop claim_category unique constraint automatically: " + e.getMessage());
        }
    }

    // ================== SUBMIT NEW CLAIM ==================

    @AuditLog(action = "SUBMIT_WITH_RECEIPT", module = "CLAIM", entityName = "Claim", 
              description = "Submitted new claim with receipt", logParameters = true, logResult = true)
    public Claim submitClaimWithReceipt(Claim claim, MultipartFile receiptFile) throws IOException {
        validateProjectAssignment(claim.getEmployeeId());

        if (receiptFile == null || receiptFile.isEmpty()) {
            throw new IllegalArgumentException("Receipt file is required.");
        }

        if (receiptFile.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Receipt file size exceeds 5MB limit");
        }
        claim.setReceipt(receiptFile.getBytes());
        claim.setReceiptName(receiptFile.getOriginalFilename());

        claim.setStatus("Pending");
        claim.setNextApprover("Manager");
        claim.setSubmittedDate(new Date());

        Optional<Employee> empOpt = employeeRepository.findByEmployeeId(claim.getEmployeeId());
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();
            claim.setName(emp.getFirstName() + " " + emp.getLastName());
            
            // --- STICKY DELEGATION ---
            claim.setAssignedManagerId(delegationService.getEffectiveApprover(emp.getAssignedManagerId(), "Claims"));
            claim.setAssignedFinanceId(delegationService.getEffectiveApprover(emp.getAssignedFinanceId(), "Claims"));
            // HR removed from flow
        }

        Claim savedClaim = claimRepository.save(claim);

        // Notify Assigned Manager
        String managerId = getAssignedManagerId(claim.getEmployeeId());
        Employee manager = employeeRepository.findByEmployeeId(managerId).orElse(null);
        Employee employee = empOpt.orElse(null);
        if (manager != null && employee != null) {
            String msg = "A new claim has been submitted by "
                    + employee.getFirstName() + " " + employee.getLastName()
                    + " (" + employee.getEmployeeId() + ") and is awaiting your approval.";

            sendNotification(managerId, msg);
            emailService.sendEmail(manager.getEmail(), "New Claim Assigned for Approval", msg);
        }

        return savedClaim;
    }

    @Transactional
    @AuditLog(action = "BULK_SUBMIT_CLAIMS", module = "CLAIM", entityName = "Claim", 
              description = "Submitted multiple claims in bulk", logParameters = true, logResult = true)
    public List<Claim> submitClaimsBulk(List<Claim> claims, List<MultipartFile> receiptFiles) throws IOException {
        if (claims != null && !claims.isEmpty()) {
            validateProjectAssignment(claims.get(0).getEmployeeId());
        }
        List<Claim> savedClaims = new ArrayList<>();
        String claimGroupId = null; // Will be set to the first claim's ID

        for (int i = 0; i < claims.size(); i++) {
            Claim claim = claims.get(i);
            MultipartFile receiptFile = (receiptFiles != null && i < receiptFiles.size()) ? receiptFiles.get(i) : null;

            if (receiptFile == null || receiptFile.isEmpty()) {
                throw new IllegalArgumentException(
                        "Receipt file is required for each claim. Please check claim: " + claim.getCategory());
            }

            if (receiptFile.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException(
                        "Receipt file size exceeds 5MB limit for claim: " + claim.getExpenseDescription());
            }

            claim.setReceipt(receiptFile.getBytes());
            claim.setReceiptName(receiptFile.getOriginalFilename());

            claim.setStatus("Pending");
            claim.setNextApprover("Manager");
            claim.setSubmittedDate(new Date());

            Optional<Employee> empOpt = employeeRepository.findByEmployeeId(claim.getEmployeeId());
            if (empOpt.isPresent()) {
                Employee emp = empOpt.get();
                claim.setName(emp.getFirstName() + " " + emp.getLastName());
                
                // --- STICKY DELEGATION ---
                claim.setAssignedManagerId(delegationService.getEffectiveApprover(emp.getAssignedManagerId(), "Claims"));
                claim.setAssignedFinanceId(delegationService.getEffectiveApprover(emp.getAssignedFinanceId(), "Claims"));
                // HR removed from flow
            }

            // Save the claim first to get its ID
            Claim savedClaim = claimRepository.save(claim);

            // Use the first claim's ID as the group ID for all claims
            if (i == 0) {
                claimGroupId = String.valueOf(savedClaim.getId());
                savedClaim.setClaimGroupId(claimGroupId);
                savedClaim = claimRepository.save(savedClaim); // Update with group ID
            } else {
                savedClaim.setClaimGroupId(claimGroupId);
                savedClaim = claimRepository.save(savedClaim); // Update with group ID
            }

            savedClaims.add(savedClaim);
        }

        // Send a single consolidated notification/email to the manager
        if (!savedClaims.isEmpty()) {
            Claim firstClaim = savedClaims.get(0);
            String employeeId = firstClaim.getEmployeeId();

            // Use the assignedManagerId already stored on the saved claim (respects delegation)
            String managerId = firstClaim.getAssignedManagerId();
            if (managerId == null || managerId.isEmpty()) {
                // Fallback: read directly from employee record
                managerId = getAssignedManagerId(employeeId);
            }

            Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            Employee employee = empOpt.orElse(null);
            Employee manager = (managerId != null && !managerId.isEmpty())
                    ? employeeRepository.findByEmployeeId(managerId).orElse(null)
                    : null;

            if (manager != null && employee != null) {
                String msg;
                if (savedClaims.size() == 1) {
                    msg = "A new claim has been submitted by "
                            + employee.getFirstName() + " " + employee.getLastName()
                            + " (" + employee.getEmployeeId() + ") and is awaiting your approval.";
                } else {
                    msg = "New claims (" + savedClaims.size() + ") have been submitted by "
                            + employee.getFirstName() + " " + employee.getLastName()
                            + " (" + employee.getEmployeeId() + ") and are awaiting your approval.";
                }

                sendNotification(managerId, msg);
                emailService.sendEmail(manager.getEmail(), "New Claim Assigned for Approval", msg);
            } else {
                System.err.println("[ClaimService] submitClaimsBulk: Could not send notification. " +
                        "employee=" + employee + ", manager=" + manager +
                        ", employeeId=" + employeeId + ", managerId=" + managerId);
            }
        }

        return savedClaims;
    }

    // ================== SUBMIT DRAFT ==================

    @Transactional
    @AuditLog(action = "SUBMIT_FROM_DRAFT", module = "CLAIM", entityName = "Claim", 
              description = "Submitted claim from draft", logParameters = true, logResult = true)
    public Claim submitDraft(Long draftId) {
        ClaimDraft draft = claimDraftService.getDraftById(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found with ID: " + draftId));

        validateProjectAssignment(draft.getEmployeeId());

        Claim claim = new Claim();
        claim.setEmployeeId(draft.getEmployeeId());
        claim.setName(draft.getName());
        claim.setExpenseDescription(draft.getExpenseDescription());
        claim.setCategory(draft.getCategory());
        claim.setAmount(draft.getAmount());
        claim.setExpenseDate(draft.getExpenseDate());
        claim.setReceipt(draft.getReceipt());
        claim.setReceiptName(draft.getReceiptName());
        claim.setStatus("Pending");
        claim.setNextApprover("Manager");
        claim.setSubmittedDate(new Date());

        // --- STICKY DELEGATION ---
        // Snapshot the approvers
        Optional<Employee> empOpt = employeeRepository.findByEmployeeId(claim.getEmployeeId());
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();
            claim.setAssignedManagerId(delegationService.getEffectiveApprover(emp.getAssignedManagerId(), "Claims"));
            claim.setAssignedFinanceId(delegationService.getEffectiveApprover(emp.getAssignedFinanceId(), "Claims"));
            // HR removed from flow
        }

        Claim savedClaim = claimRepository.save(claim);
        claimDraftService.deleteDraft(draftId);

        // Notify Assigned Manager (use delegated manager if applicable)
        String managerId = savedClaim.getAssignedManagerId();
        Employee manager = employeeRepository.findByEmployeeId(managerId).orElse(null);
        Employee emp = employeeRepository.findByEmployeeId(draft.getEmployeeId()).orElse(null);
        if (manager != null && emp != null) {
            String msg = "A new claim has been submitted by "
                    + emp.getFirstName() + " " + emp.getLastName()
                    + " (" + emp.getEmployeeId() + ") and is awaiting your approval.";

            sendNotification(managerId, msg);
            emailService.sendEmail(manager.getEmail(), "New Claim Assigned for Approval", msg);
        }

        return savedClaim;
    }

    // ================== MANAGER / FINANCE / HR CLAIM FETCH ==================
    public List<Claim> getClaimsForManager(String managerEmployeeId) {
        Set<Claim> allClaims = new HashSet<>(claimRepository.findByAssignedManagerId(managerEmployeeId));
        
        // Add delegated claims
        List<Delegation> activeDels = delegationService.getActiveDelegationsForDelegate(managerEmployeeId, "Claims");
        activeDels.addAll(delegationService.getActiveDelegationsForDelegate(managerEmployeeId, "All"));
        
        for (Delegation d : activeDels) {
            String delegatorId = d.getDelegatorId();
            if (!delegatorId.equals(managerEmployeeId)) {
                allClaims.addAll(claimRepository.findByAssignedManagerId(delegatorId));
            }
        }
        
        return new ArrayList<>(allClaims);
    }

    public List<Claim> getClaimsForFinance(String financeEmployeeId) {
        Set<Claim> allClaims = new HashSet<>(claimRepository.findByAssignedFinanceId(financeEmployeeId));
        
        // Add delegated claims
        List<Delegation> activeDels = delegationService.getActiveDelegationsForDelegate(financeEmployeeId, "Claims");
        activeDels.addAll(delegationService.getActiveDelegationsForDelegate(financeEmployeeId, "All"));
        
        for (Delegation d : activeDels) {
            String delegatorId = d.getDelegatorId();
            if (!delegatorId.equals(financeEmployeeId)) {
                allClaims.addAll(claimRepository.findByAssignedFinanceId(delegatorId));
            }
        }
        
        return new ArrayList<>(allClaims);
    }

    /* 
    public List<Claim> getClaimsByHrId(String hrEmployeeId) {
        Set<Claim> allClaims = new HashSet<>(claimRepository.findByAssignedHrId(hrEmployeeId));
        
        // Add delegated claims
        List<Delegation> activeDels = delegationService.getActiveDelegationsForDelegate(hrEmployeeId, "Claims");
        activeDels.addAll(delegationService.getActiveDelegationsForDelegate(hrEmployeeId, "All"));
        
        for (Delegation d : activeDels) {
            String delegatorId = d.getDelegatorId();
            if (!delegatorId.equals(hrEmployeeId)) {
                allClaims.addAll(claimRepository.findByAssignedHrId(delegatorId));
            }
        }
        
        return new ArrayList<>(allClaims);
    }
    */

    // ================== APPROVAL / REJECTION ==================
    @AuditLog(action = "APPROVE_CLAIM", module = "CLAIM", entityName = "Claim", 
              description = "Approved claim", logParameters = true)
    public String approveClaim(Long id, String role) {
        Claim claim = claimRepository.findById(id).orElseThrow(() -> new RuntimeException("Claim not found"));
        Employee emp = employeeRepository.findByEmployeeId(claim.getEmployeeId()).orElse(null);

        switch (role) {
            case "Manager" -> {
                claim.setStatus("Approved by Manager");
                claim.setNextApprover("Finance");
                String actingManagerId = claim.getAssignedManagerId(); // may be delegate
                String financeId = getAssignedFinanceId(claim.getEmployeeId());
                Employee finance = employeeRepository.findByEmployeeId(financeId).orElse(null);

                // Record approval history with actual actor
                recordApprovalHistory(id, "Manager", actingManagerId, "APPROVED", "Approved by Manager");

                if (finance != null && emp != null) {
                    String msgToFinance = "New claim submitted by "
                            + emp.getFirstName() + " " + emp.getLastName()
                            + " (" + emp.getEmployeeId() + ") requires your approval.";

                    sendNotification(financeId, msgToFinance);
                    emailService.sendEmail(finance.getEmail(), "Claim Assigned for Finance Approval", msgToFinance);

                    String msgToEmp = "Your claim has been approved by Manager and moved to Finance team.";
                    sendNotification(emp.getEmployeeId(), msgToEmp);
                    emailService.sendEmail(emp.getEmail(), "Claim Moved to Finance", msgToEmp);
                }
            }
            case "Finance" -> {
                claim.setStatus("Paid");
                claim.setNextApprover(null);
                String actingFinanceId = claim.getAssignedFinanceId(); // may be delegate
                String managerId = claim.getAssignedManagerId();
                Employee manager = employeeRepository.findByEmployeeId(managerId).orElse(null);

                // Record approval history as PROCESSED
                recordApprovalHistory(id, "Finance", actingFinanceId, "PROCESSED", "Processed and Paid by Finance");

                if (emp != null) {
                    String msgToEmp = "Your claim has been processed and paid by Finance.";
                    sendNotification(emp.getEmployeeId(), msgToEmp);
                    emailService.sendEmail(emp.getEmail(), "Claim Processed and Paid", msgToEmp);

                    if (manager != null) {
                        String msgToManager = "The claim submitted by "
                                + emp.getFirstName() + " " + emp.getLastName()
                                + " has been processed and paid by Finance.";
                        sendNotification(managerId, msgToManager);
                        emailService.sendEmail(manager.getEmail(), "Claim Processed and Paid", msgToManager);
                    }
                }
            }
            default -> throw new RuntimeException("Invalid role");
        }

        claimRepository.save(claim);
        return "Claim approved by " + role;
    }

    @AuditLog(action = "REJECT_CLAIM", module = "CLAIM", entityName = "Claim", 
              description = "Rejected claim", logParameters = true)
    public String rejectClaim(Long id, String role, String reason) {
        Claim claim = claimRepository.findById(id).orElseThrow(() -> new RuntimeException("Claim not found"));
        claim.setStatus("Rejected by " + role);
        claim.setNextApprover(null);
        claim.setRejectionReason(reason);
        claimRepository.save(claim);

        // Get rejector ID based on role
        String rejectorId = null;
        if ("Manager".equalsIgnoreCase(role)) {
            rejectorId = getAssignedManagerId(claim.getEmployeeId());
        } else if ("Finance".equalsIgnoreCase(role)) {
            rejectorId = getAssignedFinanceId(claim.getEmployeeId());
        /* 
        } else if ("HR".equalsIgnoreCase(role)) {
            rejectorId = getAssignedHrId(claim.getEmployeeId());
        }
        */
        }

        // Record rejection history
        recordApprovalHistory(id, role, rejectorId, "REJECTED", reason);

        Employee emp = employeeRepository.findByEmployeeId(claim.getEmployeeId()).orElse(null);
        if (emp != null) {
            String msg = "Your claim (ID: " + claim.getId() + ") has been rejected by " + role + ". Reason: " + reason;
            sendNotification(emp.getEmployeeId(), msg);
            emailService.sendEmail(emp.getEmail(), "Claim Rejected by " + role, msg);

            if ("Finance".equalsIgnoreCase(role)) {
                String managerId = claim.getAssignedManagerId();
                Employee manager = employeeRepository.findByEmployeeId(managerId).orElse(null);
                if (manager != null) {
                    String msgToManager = "The claim (ID: " + claim.getId() + ") submitted by "
                            + emp.getFirstName() + " " + emp.getLastName()
                            + " has been rejected by Finance. Reason: " + reason;
                    sendNotification(managerId, msgToManager);
                    emailService.sendEmail(manager.getEmail(), "Claim Rejected by Finance", msgToManager);
                }
            }
        }

        return "Claim rejected by " + role;
    }

    // ================== CANCEL CLAIM ==================
    @Transactional
    @AuditLog(action = "CANCEL_CLAIM", module = "CLAIM", entityName = "Claim", 
              description = "Cancelled claim", logParameters = true)
    public String cancelClaim(Long id) {
        Claim claim = claimRepository.findById(id).orElseThrow(() -> new RuntimeException("Claim not found"));

        if (!"Pending".equalsIgnoreCase(claim.getStatus())) {
            throw new RuntimeException("Only pending claims can be cancelled.");
        }

        claim.setStatus("Cancelled");
        claim.setNextApprover(null);
        claim.setUpdatedAt(LocalDateTime.now());
        claimRepository.save(claim);

        // Notify Assigned Manager
        try {
            String managerId = getAssignedManagerId(claim.getEmployeeId());
            if (managerId != null) {
                Employee manager = employeeRepository.findByEmployeeId(managerId).orElse(null);
                Employee employee = employeeRepository.findByEmployeeId(claim.getEmployeeId()).orElse(null);

                if (manager != null && employee != null) {
                    String msg = "Claim (ID: " + claim.getId() + ") has been cancelled by "
                            + employee.getFirstName() + " " + employee.getLastName()
                            + " (" + employee.getEmployeeId() + ").";

                    sendNotification(managerId, msg);
                    emailService.sendEmail(manager.getEmail(), "Claim Cancelled by Employee", msg);
                }
            }
        } catch (Exception e) {
            // Log error but don't fail cancellation
            System.err.println("Failed to send cancellation notification: " + e.getMessage());
        }

        // Record cancellation in history
        recordApprovalHistory(id, "Employee", claim.getEmployeeId(), "CANCELLED", "Claim cancelled by employee");

        return "Claim cancelled successfully";
    }

    /* 
    // ================== HR STATUS UPDATES ==================
    @AuditLog(action = "UPDATE_HR_STATUS", module = "CLAIM", entityName = "Claim", 
              description = "Updated claim HR status", logParameters = true)
    public String updateHRStatus(Long claimId, String status) {
        Claim claim = claimRepository.findById(claimId).orElseThrow(() -> new RuntimeException("Claim not found"));
        claim.setStatus(status);

        if ("Paid".equalsIgnoreCase(status)) {
            claim.setNextApprover(null);
        }

        claimRepository.save(claim);

        // Record HR status update in history
        // Use claim.getAssignedHrId() to capture the delegated HR (if any)
        String actingHrId = claim.getAssignedHrId();
        String action = status.toUpperCase().replace(" ", "_");
        recordApprovalHistory(claimId, "HR", actingHrId, action, "Status updated to: " + status);

        Employee emp = employeeRepository.findByEmployeeId(claim.getEmployeeId()).orElse(null);
        if (emp != null) {
            String msg = "Your claim (ID: " + claim.getId() + ") status updated by HR: " + status;
            sendNotification(emp.getEmployeeId(), msg);
            emailService.sendEmail(emp.getEmail(), "Claim Status Updated", msg);
        }

        return "Claim status updated to " + status;
    }
    */

    // ================== EMPLOYEE CLAIM DASHBOARD ==================
    /* 
    public List<Claim> getClaimsByHrId(String hrEmployeeId) {
        return claimRepository.findByAssignedHrIdAndNextApprover(hrEmployeeId, "HR");
    }
    */

    public List<Claim> getClaimHistoryByEmployee(String employeeId) {
        return claimRepository.findByEmployeeId(employeeId);
    }

    public Map<String, Object> getClaimSummaryByEmployeeId(String employeeId) {
        List<Claim> claims = claimRepository.findByEmployeeId(employeeId);

        // Filter out Cancelled claims from the total count
        long totalClaims = claims.stream()
                .filter(c -> !"Cancelled".equalsIgnoreCase(c.getStatus()))
                .count();
        long approved = claims.stream().filter(c -> "Paid".equalsIgnoreCase(c.getStatus())).count();
        long rejected = claims.stream().filter(c -> c.getStatus().toLowerCase().contains("rejected")).count();
        double paidAmount = claims.stream().filter(c -> "Paid".equalsIgnoreCase(c.getStatus()))
                .mapToDouble(Claim::getAmount).sum();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalClaims", totalClaims);
        summary.put("approved", approved);
        summary.put("rejected", rejected);
        summary.put("paidAmount", paidAmount);
        return summary;
    }

    // ================== NOTIFICATIONS ==================
    public List<Notification> getNotifications(String employeeId) {
        return notificationRepository.findByEmployeeId(employeeId);
    }

    public String markNotificationAsRead(Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setRead(true);
            notificationRepository.save(n);
            return "Notification marked as read.";
        }
        return "Notification not found.";
    }

    public void sendNotification(String employeeId, String message) {
        if (employeeId == null || employeeId.isEmpty())
            return;
            
        // 1. Notify the original person
        saveNotificationRecord(employeeId, message);

        // 2. Check for active delegation and notify delegate
        try {
            String delegateId = delegationService.getActiveDelegateId(employeeId, "Claims");
            if (delegateId != null) {
                saveNotificationRecord(delegateId, "[Delegated] " + message);
            }
        } catch (Exception e) {
            // Log error but don't fail the primary notification
            System.err.println("Error notifying delegate: " + e.getMessage());
        }
    }

    private void saveNotificationRecord(String employeeId, String message) {
        Notification notification = new Notification();
        notification.setEmployeeId(employeeId);
        notification.setMessage(message);
        notification.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    // ================== HELPERS ==================
    private String getAssignedManagerId(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId)
                .map(Employee::getAssignedManagerId)
                .orElse(null);
    }

    private String getAssignedFinanceId(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId)
                .map(Employee::getAssignedFinanceId)
                .orElse(null);
    }

    /* 
    private String getAssignedHrId(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId)
                .map(Employee::getAssignedHrId)
                .orElse(null);
    }
    */

    private void recordApprovalHistory(Long claimId, String approverRole, String approverId, String action,
            String remarks) {
        ClaimApprovalHistory history = new ClaimApprovalHistory();
        history.setClaimId(claimId);
        history.setApproverRole(approverRole);
        history.setApproverId(approverId);
        history.setAction(action);
        history.setActionTimestamp(LocalDateTime.now());
        history.setRemarks(remarks);

        // Get approver name if approverId is provided
        if (approverId != null) {
            claimRepository.findById(claimId).ifPresent(claim -> {
                employeeRepository.findByEmployeeId(claim.getEmployeeId()).ifPresent(requester -> {
                    // Determine the original (default) approver for this role
                    String defaultId = null;
                    if ("Manager".equalsIgnoreCase(approverRole)) defaultId = requester.getAssignedManagerId();
                    else if ("Finance".equalsIgnoreCase(approverRole)) defaultId = requester.getAssignedFinanceId();
                    // else if ("HR".equalsIgnoreCase(approverRole)) defaultId = requester.getAssignedHrId();

                    // Set actor's name with ID: "ActorName (ActorID)"
                    employeeRepository.findByEmployeeId(approverId).ifPresent(actor ->
                        history.setApproverName(actor.getFirstName() + " " + actor.getLastName() + " (" + approverId + ")")
                    );

                    // If delegated: populate delegatorId and delegatorName with ID
                    final String finalDefaultId = defaultId;
                    if (finalDefaultId != null && !approverId.equals(finalDefaultId)) {
                        history.setDelegatorId(finalDefaultId);
                        employeeRepository.findByEmployeeId(finalDefaultId).ifPresent(orig ->
                            history.setDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + finalDefaultId + ")")
                        );
                    }
                });
            });

            // Fallback if approverName still not set
            if (history.getApproverName() == null) {
                employeeRepository.findByEmployeeId(approverId).ifPresent(emp ->
                    history.setApproverName(emp.getFirstName() + " " + emp.getLastName() + " (" + approverId + ")")
                );
            }
        }

        claimApprovalHistoryRepository.save(history);
    }

    public Claim findById(Long id) {
        return claimRepository.findById(id).orElse(null);
    }

    @Transactional
    @AuditLog(action = "SUBMIT_UPDATED_DRAFT", module = "CLAIM", entityName = "Claim", 
              description = "Submitted updated draft", logParameters = true, logResult = true)
    public Claim submitUpdatedDraft(Long draftId, Claim updatedClaimData, MultipartFile receiptFile)
            throws IOException {
        ClaimDraft draft = claimDraftRepository.findById(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found with id: " + draftId));

        validateProjectAssignment(draft.getEmployeeId());

        byte[] receiptBytes = draft.getReceipt();
        String receiptName = draft.getReceiptName();

        if (receiptFile != null && !receiptFile.isEmpty()) {
            if (receiptFile.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Receipt file size exceeds 5MB limit");
            }
            receiptBytes = receiptFile.getBytes();
            receiptName = receiptFile.getOriginalFilename();
        }

        if (receiptBytes == null || receiptBytes.length == 0) {
            throw new IllegalArgumentException("Receipt file is required.");
        }

        Claim submittedClaim = new Claim();
        submittedClaim.setEmployeeId(draft.getEmployeeId());
        Employee emp2 = employeeRepository.findByEmployeeId(draft.getEmployeeId()).orElse(null);
        if (emp2 != null) {
            submittedClaim.setName(emp2.getFirstName() + " " + emp2.getLastName());
        }

        submittedClaim.setAmount(updatedClaimData.getAmount());
        submittedClaim.setCategory(updatedClaimData.getCategory());
        submittedClaim.setExpenseDescription(updatedClaimData.getExpenseDescription());
        submittedClaim.setExpenseDate(updatedClaimData.getExpenseDate());
        submittedClaim.setReceipt(receiptBytes);
        submittedClaim.setReceiptName(receiptName);
        submittedClaim.setStatus("Pending");
        submittedClaim.setNextApprover("Manager");
        submittedClaim.setSubmittedDate(new Date());

        // --- STICKY DELEGATION ---
        // Snapshot the approvers
        if (emp2 != null) {
            submittedClaim.setAssignedManagerId(delegationService.getEffectiveApprover(emp2.getAssignedManagerId(), "Claims"));
            submittedClaim.setAssignedFinanceId(delegationService.getEffectiveApprover(emp2.getAssignedFinanceId(), "Claims"));
            // HR removed from flow
        }

        Claim savedClaim = claimRepository.save(submittedClaim);
        claimDraftRepository.delete(draft);

        // Notify Assigned Manager (use delegated manager if applicable)
        String managerId = savedClaim.getAssignedManagerId();
        Employee manager = employeeRepository.findByEmployeeId(managerId).orElse(null);
        Employee emp = employeeRepository.findByEmployeeId(draft.getEmployeeId()).orElse(null);
        if (manager != null && emp != null) {
            String msg = "A new claim has been submitted by "
                    + emp.getFirstName() + " " + emp.getLastName()
                    + " (" + emp.getEmployeeId() + ") and is awaiting your approval.";

            sendNotification(managerId, msg);
            emailService.sendEmail(manager.getEmail(), "New Claim Assigned for Approval", msg);
        }

        return savedClaim;
    }

    public List<ClaimCategory> getActiveCategories(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            return claimCategoryRepository.findByActiveTrue();
        }
        return claimCategoryRepository.findByActiveTrueAndTenantIdOrActiveTrueAndTenantIdIsNull(tenantId);
    }

    @Transactional
    public ClaimCategory saveCategory(String categoryName, String tenantId) {

        String name = categoryName.trim();

        // ✅ DUPLICATE CHECK
        Optional<ClaimCategory> existing;
        if (tenantId != null && !tenantId.trim().isEmpty()) {
            existing = claimCategoryRepository.findByCategoryNameIgnoreCaseAndTenantId(name, tenantId);
        } else {
            existing = claimCategoryRepository.findByCategoryNameIgnoreCase(name);
        }

        if (existing.isPresent()) {
            throw new DataIntegrityViolationException("Category already exists");
        }

        ClaimCategory cat = new ClaimCategory();
        cat.setCategoryName(name);
        cat.setTenantId(tenantId);
        cat.setActive(true);

        return claimCategoryRepository.save(cat);
    }

    @Transactional
    public void deleteCategory(Long id) {

        if (!claimCategoryRepository.existsById(id)) {
            throw new RuntimeException("Category not found");
        }

        // ✅ PERMANENT DELETE FROM DATABASE
        claimCategoryRepository.deleteById(id);
    }

    // ================== FAST CLAIM HISTORY (DTO – NO BLOB) ==================
    public List<ClaimHistoryDto> getClaimHistoryFast(String employeeId) {
        return claimRepository.findClaimHistoryFast(employeeId);
    }

    public List<Claim> getFilteredClaims(String employeeId, String category, Double amount, Double minAmount,
            Double maxAmount, String status, Date startDate, Date endDate, String tenantId) {
        return claimRepository.findAll((Specification<Claim>) (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            String tenantCode = null;
            if (tenantId != null && !tenantId.trim().isEmpty()) {
                try {
                    if (tenantId.matches("\\d+")) {
                        java.util.Optional<com.register.example.entity.Tenant> tOpt = tenantRepository.findById(Long.parseLong(tenantId));
                        if (tOpt.isPresent()) {
                            tenantCode = tOpt.get().getTenantId();
                        }
                    }
                } catch (Exception ignored) {}

                List<Employee> tenantEmployees = employeeRepository.findByTenantId(tenantId);
                List<String> tenantEmployeeIds = tenantEmployees.stream().map(Employee::getEmployeeId).toList();
                if (tenantEmployeeIds.isEmpty()) {
                    predicates.add(criteriaBuilder.disjunction());
                } else {
                    predicates.add(root.get("employeeId").in(tenantEmployeeIds));
                }
            }

            if (employeeId != null && !employeeId.trim().isEmpty()) {
                String[] ids = employeeId.split(",");
                List<String> prefixedIds = new ArrayList<>();
                for (String id : ids) {
                    String trimmed = id.trim();
                    if (!trimmed.isEmpty()) {
                        prefixedIds.add(trimmed);
                        if (tenantCode != null) {
                            prefixedIds.add(tenantCode + "_" + trimmed);
                        }
                        if (tenantId != null) {
                            prefixedIds.add(tenantId + "_" + trimmed);
                        }
                    }
                }
                if (prefixedIds.isEmpty()) {
                    predicates.add(criteriaBuilder.disjunction());
                } else {
                    predicates.add(root.get("employeeId").in(prefixedIds));
                }
            }
            if (category != null && !category.trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("category"), category));
            }
            if (amount != null) {
                predicates.add(criteriaBuilder.equal(root.get("amount"), amount));
            }
            if (minAmount != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("amount"), minAmount));
            }
            if (maxAmount != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("amount"), maxAmount));
            }
            if (status != null && !status.trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("submittedDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("submittedDate"), endDate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        });
    }

    public Map<String, Object> getClaimStatusDetails(Long claimId) {
        Claim claim = claimRepository.findById(claimId).orElseThrow(() -> new RuntimeException("Claim not found"));
        Map<String, Object> details = new HashMap<>();

        details.put("createdAt", claim.getSubmittedDate());
        details.put("status", claim.getStatus());
        details.put("updatedAt", claim.getUpdatedAt());
        details.put("nextApproverRole", claim.getNextApprover());

        // Get approval history
        List<ClaimApprovalHistory> approvalHistory = claimApprovalHistoryRepository
                .findByClaimIdOrderByActionTimestampAsc(claimId);

        // Convert to list of maps for easier frontend consumption
        List<Map<String, Object>> historyList = new ArrayList<>();
        for (ClaimApprovalHistory history : approvalHistory) {
            Map<String, Object> historyItem = new HashMap<>();
            historyItem.put("approverRole", history.getApproverRole());
            historyItem.put("approverId", history.getApproverId());
            historyItem.put("approverName", history.getApproverName());
            historyItem.put("action", history.getAction());
            historyItem.put("actionTimestamp", history.getActionTimestamp());
            historyItem.put("remarks", history.getRemarks());
            // Delegation attribution (only set when action was performed by a delegate)
            historyItem.put("delegatorId", history.getDelegatorId());
            historyItem.put("delegatorName", history.getDelegatorName());
            historyList.add(historyItem);
        }

        details.put("approvalHistory", historyList);

        // Get current approver details if pending
        String assignedApproverId = null;
        String defaultApproverId = null;
        Employee creator = employeeRepository.findByEmployeeId(claim.getEmployeeId()).orElse(null);

        if (creator != null && claim.getNextApprover() != null) {
            if ("Manager".equalsIgnoreCase(claim.getNextApprover())) {
                assignedApproverId = claim.getAssignedManagerId();
                defaultApproverId = creator.getAssignedManagerId();
            } else if ("Finance".equalsIgnoreCase(claim.getNextApprover())) {
                assignedApproverId = claim.getAssignedFinanceId();
                defaultApproverId = creator.getAssignedFinanceId();
            }
        }

        if (assignedApproverId != null) {
            final String finalAssignedId = assignedApproverId;
            final String finalDefaultId = defaultApproverId;
            employeeRepository.findByEmployeeId(finalAssignedId).ifPresent(emp -> {
                final String name = emp.getFirstName() + " " + emp.getLastName();
                
                // Indication for delegation
                if (finalDefaultId != null && !finalAssignedId.equals(finalDefaultId)) {
                    employeeRepository.findByEmployeeId(finalDefaultId).ifPresent(orig -> {
                        details.put("approverName", name + " (" + finalAssignedId + ")(on behalf of " + orig.getFirstName() + " " + orig.getLastName() + " (" + finalDefaultId + "))");
                    });
                } else {
                    details.put("approverName", name + " (" + finalAssignedId + ")");
                }
                details.put("approverId", finalAssignedId);
            });
        }

        // If Approved/Paid/Rejected, use updatedAt
        if (claim.getStatus().toLowerCase().contains("approved") ||
                "Paid".equalsIgnoreCase(claim.getStatus()) ||
                "Initiated".equalsIgnoreCase(claim.getStatus()) ||
                claim.getStatus().toLowerCase().contains("in process")) {
            if (claim.getUpdatedAt() != null) {
                details.put("approvedAt", java.sql.Timestamp.valueOf(claim.getUpdatedAt()));
            } else {
                details.put("approvedAt", null);
            }
        }

        return details;
    }

    @Transactional
    public int updatePendingClaimsManager(String employeeId, String oldManagerId, String newManagerId) {
        if (employeeId == null || newManagerId == null) {
            return 0;
        }

        // Find all pending claims for this employee where the next approver is "Manager"
        List<Claim> pendingClaims = claimRepository.findByEmployeeId(employeeId).stream()
                .filter(c -> "Pending".equalsIgnoreCase(c.getStatus()) && "Manager".equalsIgnoreCase(c.getNextApprover()))
                .collect(Collectors.toList());

        if (pendingClaims.isEmpty()) {
            return 0;
        }

        Employee employee = employeeRepository.findByEmployeeId(employeeId).orElse(null);
        String employeeName = (employee != null) ? (employee.getFirstName() + " " + employee.getLastName()) : "Unknown";
        
        Employee newManager = employeeRepository.findByEmployeeId(newManagerId).orElse(null);
        String newManagerName = (newManager != null) ? (newManager.getFirstName() + " " + newManager.getLastName()) : "Unknown";

        int updatedCount = 0;
        for (Claim claim : pendingClaims) {
            // Claims in this system don't store the manager ID directly in the Claim entity,
            // but the NextApprover is "Manager". The logic to fetch claims for a manager
            // is based on the Employee.assignedManagerId.
            // However, we can send notifications to the new manager.
            
            String msgToNewManager = "A pending claim (ID: " + claim.getId() + ") from " + employeeName + " (" + employeeId + ") is now awaiting your approval due to manager change.";
            sendNotification(newManagerId, msgToNewManager);
            if (newManager != null && newManager.getEmail() != null) {
                emailService.sendEmail(newManager.getEmail(), "New Claim Assigned for Approval", msgToNewManager);
            }
            updatedCount++;
        }

        if (updatedCount > 0 && employee != null) {
            String msgToEmployee = "Your " + updatedCount + " pending claim(s) have been reassigned to your new manager: " + newManagerName;
            sendNotification(employeeId, msgToEmployee);
        }

        return updatedCount;
    }

    private void validateProjectAssignment(String employeeId) {
        java.time.LocalDate today = java.time.LocalDate.now();
        List<Allocation> allocations = allocationRepository
                .findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        employeeId, today, today);

        if (allocations == null || allocations.isEmpty()) {
            throw new RuntimeException("You are not assigned to any project , please contatc your manager or admin");
        }
    }

}
