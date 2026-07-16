package com.register.example.controller;

import com.register.example.entity.Ticket;
import com.register.example.service.TicketService;
import com.register.example.service.HelpDeskTeamAccessService;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.TenantRepository;

import java.util.List;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private HelpDeskTeamAccessService helpDeskTeamAccessService;

    @Autowired
    private EmployeeRepository employeeRepository;

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
                java.util.Optional<com.register.example.entity.Employee> emp = employeeRepository.findByEmployeeId(employeeId);
                if (emp.isPresent()) {
                    return emp.get().getTenantId();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    // ===========================================================
    // EXISTING SUBMIT API (UNCHANGED)
    // ===========================================================
    @PostMapping("/submit")
    public ResponseEntity<Object> submitTicket(
            @RequestParam(required = false) String employeeId,
            @RequestParam String category,
            @RequestParam String subcategory,
            @RequestParam String issueSummary,
            @RequestParam String detailedDescription,
            @RequestParam(defaultValue = "false") Boolean ccToManager,
            @RequestParam(required = false) MultipartFile attachment) {
        try {
            Ticket t = new Ticket();
            t.setEmployeeId(employeeId);
            t.setCategory(category);
            t.setSubcategory(subcategory);
            t.setIssueSummary(issueSummary);
            t.setDetailedDescription(detailedDescription);
            t.setCcToManager(ccToManager);

            Ticket saved = ticketService.saveTicket(t, attachment);

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to submit ticket: " + ex.getMessage());
        }
    }

    // ===========================================================
    // ⭐ NEW API - CHANGE REQUEST SUBMISSION
    // ===========================================================
    @PostMapping("/change-request/submit")
    public ResponseEntity<Object> submitChangeRequest(
            @RequestParam String employeeId,
            @RequestParam String category,
            @RequestParam String subcategory,
            @RequestParam String issueSummary,
            @RequestParam String detailedDescription,
            @RequestParam(defaultValue = "false") Boolean ccToManager,
            @RequestParam(required = false) MultipartFile attachment) {
        try {
            Ticket saved = ticketService.submitChangeRequest(
                    employeeId,
                    category,
                    subcategory,
                    issueSummary,
                    detailedDescription,
                    ccToManager,
                    attachment);

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to submit change request: " + e.getMessage());
        }
    }

    // ===========================================================
    // EXISTING MY TICKETS API
    // ===========================================================
    @GetMapping("/my-tickets/{employeeId}")
    public ResponseEntity<Object> getMyTickets(@PathVariable String employeeId) {
        return ResponseEntity.ok(ticketService.getTicketsByEmployeeId(employeeId));
    }

    @GetMapping("/download/{ticketId}")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Long ticketId) {
        Ticket ticket = ticketService.getTicketById(ticketId);

        if (ticket == null || ticket.getAttachmentData() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null);
        }

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + ticket.getAttachmentFileName() + "\"")
                .body(ticket.getAttachmentData());
    }

    @GetMapping("/all")
    public ResponseEntity<Object> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @PutMapping("/assign/{ticketId}/{employeeId}")
    public ResponseEntity<Object> assignTicket(
            @PathVariable Long ticketId,
            @PathVariable String employeeId) {

        Ticket updated = ticketService.assignTicketToUser(ticketId, employeeId);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/update-status/{ticketId}")
    public ResponseEntity<Object> updateTicketStatus(
            @PathVariable Long ticketId,
            @RequestParam String status) {

        Ticket updated = ticketService.updateTicketStatus(ticketId, status);

        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Ticket not found");
        }

        return ResponseEntity.ok(updated);
    }

    @GetMapping("/team-tickets")
    public List<Ticket> getTeamTickets(
            @RequestHeader("employeeId") String employeeId) {

        List<String> teams = helpDeskTeamAccessService.getTeamsForEmployee(employeeId);

        List<Ticket> allTickets = new ArrayList<>();

        for (String team : teams) {
            List<Ticket> teamTickets = ticketService.getTicketsForTeam(team);
            allTickets.addAll(teamTickets);
        }

        // avoid duplicates and filter out PENDING_MANAGER tickets
        return allTickets.stream()
                .distinct()
                .filter(t -> "OPEN".equalsIgnoreCase(t.getStatus()) ||
                        "IN_PROGRESS".equalsIgnoreCase(t.getStatus()) ||
                        "REOPENED".equalsIgnoreCase(t.getStatus()) ||
                        "RESOLVED".equalsIgnoreCase(t.getStatus()))
                .toList();
    }

    // ===========================================================
    // ⭐ NEW API - MANAGER APPROVE
    // ===========================================================
    @PutMapping("/manager/approve/{ticketId}")
    public ResponseEntity<Object> approveByManager(
            @PathVariable Long ticketId,
            @RequestHeader(value = "employeeId", required = false) String employeeId) {
        try {
            return ResponseEntity.ok(ticketService.managerApprove(ticketId, employeeId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    // ===========================================================
    // ⭐ NEW API - MANAGER REJECT
    // ===========================================================
    @PutMapping("/manager/reject/{ticketId}")
    public ResponseEntity<Object> rejectByManager(
            @PathVariable Long ticketId,
            @RequestParam String reason,
            @RequestHeader(value = "employeeId", required = false) String employeeId) {

        try {
            return ResponseEntity.ok(ticketService.managerReject(ticketId, reason, employeeId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    // ===========================================================
    // ⭐ NEW API - FETCH TICKETS FOR MANAGER (PENDING_MANAGER)
    // ===========================================================
    @GetMapping("/manager/{managerId}")
    public ResponseEntity<Object> getTicketsForManager(@PathVariable String managerId) {
        try {
            List<Ticket> list = ticketService.getManagerTickets(managerId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error loading manager tickets: " + e.getMessage());
        }
    }

    // ===========================================================
    // ⭐ DEBUG API - CHECK MANAGER ASSIGNMENTS
    // ===========================================================
    @GetMapping("/manager/{managerId}/debug")
    public ResponseEntity<Object> debugManagerAssignments(@PathVariable String managerId) {
        try {
            java.util.Map<String, Object> debug = ticketService.debugManagerTickets(managerId);
            return ResponseEntity.ok(debug);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // ===========================================================
    // ⭐ TRANSFER TICKET TO ANOTHER TEAM
    // ===========================================================
    @PutMapping("/transfer/{ticketId}")
    public ResponseEntity<Object> transferTicket(
            @PathVariable Long ticketId,
            @RequestBody TransferRequest req) {
        try {
            Ticket updated = ticketService.transferTicket(ticketId, req.getTeam(), req.getReason());
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    static class TransferRequest {
        private String team;
        private String reason;

        public String getTeam() {
            return team;
        }

        public void setTeam(String team) {
            this.team = team;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    // ===========================================================
    // ⭐ REASSIGN TICKET API
    // ===========================================================
    @PutMapping("/reassign/{ticketId}")
    public ResponseEntity<Object> reassignTicket(
            @PathVariable Long ticketId,
            @RequestBody ReassignRequest req) {
        try {
            Ticket updated = ticketService.reassignTicket(ticketId, req.getReason());
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    static class ReassignRequest {
        private String reason;

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    // ===========================================================
    // ⭐ RESOLVE TICKET API
    // ===========================================================
    @PutMapping("/resolve/{ticketId}")
    public ResponseEntity<Object> resolveTicket(
            @PathVariable Long ticketId,
            @RequestHeader(value = "employeeId", required = false) String employeeId) {
        try {
            Ticket updated = ticketService.resolveTicket(ticketId, employeeId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    // ===========================================================
    // ⭐ REOPEN TICKET API
    // ===========================================================
    @PutMapping("/reopen/{ticketId}")
    public ResponseEntity<Object> reopenTicket(
            @PathVariable Long ticketId,
            @RequestBody ReopenRequest req) {
        try {
            Ticket updated = ticketService.reopenTicket(ticketId, req.getReason());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    // ===========================================================
    // ⭐ RESEND TICKET API
    // ===========================================================
    @PutMapping("/resend/{ticketId}")
    public ResponseEntity<Object> resendTicket(
            @PathVariable Long ticketId,
            @RequestParam String reason,
            @RequestHeader(value = "employeeId", required = false) String employeeId) {
        try {
            Ticket updated = ticketService.resendTicket(ticketId, reason, employeeId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    @PutMapping("/resubmit/{ticketId}")
    public ResponseEntity<Object> resubmitTicket(
            @PathVariable Long ticketId,
            @RequestParam String issueSummary,
            @RequestParam String detailedDescription,
            @RequestParam(required = false) MultipartFile attachment) {
        try {
            Ticket updated = ticketService.updateResentTicket(ticketId, issueSummary, detailedDescription, attachment);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    static class ReopenRequest {
        private String reason;

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    // ===========================================================
    // ⭐ CANCEL TICKET API
    // ===========================================================
    @PutMapping("/cancel/{ticketId}")
    public ResponseEntity<Object> cancelTicket(@PathVariable Long ticketId) {
        try {
            Ticket updated = ticketService.cancelTicket(ticketId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error cancelling ticket: " + e.getMessage());
        }
    }

    // ===========================================================
    // ⭐ HELPDESK REPORT API
    // ===========================================================
    @GetMapping("/reports")
    public ResponseEntity<Object> getHelpdeskReport(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String ticketType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String subcategory,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            java.util.Date parsedStartDate = null;
            java.util.Date parsedEndDate = null;

            // Parse dates if provided
            if (startDate != null && !startDate.trim().isEmpty()) {
                parsedStartDate = new java.text.SimpleDateFormat("yyyy-MM-dd").parse(startDate);
            }
            if (endDate != null && !endDate.trim().isEmpty()) {
                parsedEndDate = new java.text.SimpleDateFormat("yyyy-MM-dd").parse(endDate);
            }

            String tenantId = getCurrentUserTenantId();
            List<Ticket> filteredTickets = ticketService.getFilteredTickets(
                    employeeId,
                    ticketType,
                    category,
                    subcategory,
                    status,
                    parsedStartDate,
                    parsedEndDate,
                    tenantId);

            return ResponseEntity.ok(filteredTickets);
        } catch (Exception e) {

            return ResponseEntity.status(500).body("Error generating report: " + e.getMessage());
        }
    }

    @GetMapping("/status-details/{ticketId}")
    public ResponseEntity<java.util.Map<String, Object>> getTicketStatusDetails(@PathVariable Long ticketId) {
        return ResponseEntity.ok(ticketService.getTicketStatusDetails(ticketId));
    }

    // ===========================================================
    // ⭐ DRAFT APIS
    // ===========================================================
    
    @PostMapping("/draft")
    public ResponseEntity<Object> saveDraft(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String subcategory,
            @RequestParam(required = false) String issueSummary,
            @RequestParam(required = false) String detailedDescription,
            @RequestParam(defaultValue = "false") Boolean ccToManager,
            @RequestParam(required = false) String ticketType,
            @RequestParam(required = false) MultipartFile attachment) {
        try {
            Ticket draft = new Ticket();
            draft.setEmployeeId(employeeId);
            draft.setCategory(category);
            draft.setSubcategory(subcategory);
            draft.setIssueSummary(issueSummary);
            draft.setDetailedDescription(detailedDescription);
            draft.setCcToManager(ccToManager);
            draft.setStatus("DRAFT");
            if (ticketType != null) {
                draft.setTicketType(ticketType);
            }

            Ticket saved = ticketService.saveTicket(draft, attachment);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to save draft: " + ex.getMessage());
        }
    }

    @PostMapping("/change-request/draft")
    public ResponseEntity<Object> saveChangeRequestDraft(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String subcategory,
            @RequestParam(required = false) String issueSummary,
            @RequestParam(required = false) String detailedDescription,
            @RequestParam(defaultValue = "false") Boolean ccToManager,
            @RequestParam(required = false) MultipartFile attachment) {
        try {
            Ticket draft = ticketService.saveChangeRequestDraft(
                    employeeId,
                    category,
                    subcategory,
                    issueSummary,
                    detailedDescription,
                    ccToManager,
                    attachment);

            return ResponseEntity.status(HttpStatus.CREATED).body(draft);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to save change request draft: " + e.getMessage());
        }
    }

    @GetMapping("/drafts/{employeeId}")
    public ResponseEntity<Object> getDrafts(@PathVariable String employeeId) {
        try {
            List<Ticket> drafts = ticketService.getDraftsByEmployeeId(employeeId);
            return ResponseEntity.ok(drafts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch drafts: " + e.getMessage());
        }
    }

    @GetMapping("/change-request/drafts/{employeeId}")
    public ResponseEntity<Object> getChangeRequestDrafts(@PathVariable String employeeId) {
        try {
            List<Ticket> drafts = ticketService.getChangeRequestDraftsByEmployeeId(employeeId);
            return ResponseEntity.ok(drafts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch change request drafts: " + e.getMessage());
        }
    }

    @DeleteMapping("/draft/{draftId}")
    public ResponseEntity<Object> deleteDraft(@PathVariable Long draftId) {
        try {
            ticketService.deleteDraft(draftId);
            return ResponseEntity.ok("Draft deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete draft: " + e.getMessage());
        }
    }

    @DeleteMapping("/change-request/draft/{draftId}")
    public ResponseEntity<Object> deleteChangeRequestDraft(@PathVariable Long draftId) {
        try {
            ticketService.deleteDraft(draftId);
            return ResponseEntity.ok("Change request draft deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete change request draft: " + e.getMessage());
        }
    }

}
