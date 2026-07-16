package com.register.example.service;

import com.register.example.entity.Ticket;
import com.register.example.entity.Employee;
import com.register.example.entity.TicketHistory;
import com.register.example.entity.Notification;
import com.register.example.entity.HelpDeskTeamAccess;
import com.register.example.entity.Category;
import com.register.example.repository.AllocationRepository;
import com.register.example.entity.Allocation;
import com.register.example.entity.Delegation;

import com.register.example.repository.TicketRepository;
import com.register.example.repository.CategoryRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.TenantRepository;
import com.register.example.repository.TicketHistoryRepository;
import com.register.example.repository.NotificationRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private com.register.example.repository.DelegationRepository delegationRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private TicketHistoryRepository historyRepo;

    @Autowired
    private NotificationRepository notificationRepository; // For in-app notifications

    @Autowired
    private HelpDeskTeamAccessService helpDeskTeamAccessService;

    @Autowired
    private CategoryRepository categoryRepo;
    // To resolve team membership

    @Autowired
    private AllocationRepository allocationRepository;

    @Autowired
    private EmailService emailService; // For sending emails

    @Autowired
    private com.register.example.service.DelegationService delegationService;

    /*
     * ===========================================================
     * SAVE HISTORY HELPER
     * ===========================================================
     */
    private void saveHistory(
            Ticket t,
            String action,
            String fromUser,
            String toUser,
            String fromTeam,
            String toTeam,
            String notes) {
        TicketHistory h = new TicketHistory();
        h.setTicketId(t.getId());
        h.setActionType(action);
        h.setFromUser(fromUser);
        h.setToUser(toUser);
        h.setFromTeam(fromTeam);
        h.setToTeam(toTeam);
        h.setNotes(notes);

        // Determine Actor Name with Delegation Attribution
        String actorId = fromUser;
        if (actorId == null) {
            actorId = toUser;
        }

        if (actorId != null) {
            final String finalActorId = actorId;
            employeeRepository.findByEmployeeId(finalActorId).ifPresent(emp -> {
                String baseName = emp.getFirstName() + " " + emp.getLastName();
                String baseNameWithId = baseName + " (" + finalActorId + ")";

                // For MANAGER_APPROVED/REJECTED, check delegation
                if ("MANAGER_APPROVED".equals(action) || "MANAGER_REJECTED".equals(action)) {
                    employeeRepository.findByEmployeeId(t.getEmployeeId()).ifPresent(requester -> {
                        String defaultMgrId = requester.getAssignedManagerId();
                        if (defaultMgrId != null && !finalActorId.equals(defaultMgrId)) {
                            employeeRepository.findByEmployeeId(defaultMgrId).ifPresent(orig -> {
                                String origNameWithId = orig.getFirstName() + " " + orig.getLastName() + " ("
                                        + defaultMgrId + ")";
                                h.setActorName(baseNameWithId + " (on behalf of " + origNameWithId + ")");
                            });
                        }
                    });
                }

                if (h.getActorName() == null) {
                    h.setActorName(baseNameWithId);
                }
            });
        }

        historyRepo.save(h);
    }

    /*
     * ===========================================================
     * NOTIFICATION HELPERS (In-app + Email)
     * ===========================================================
     */

    private void sendInAppNotification(String employeeId, String message) {
        if (employeeId == null || employeeId.trim().isEmpty())
            return;

        // 1. Notify primary
        saveNotificationRecord(employeeId, message);

        // 2. Notify delegate if active
        try {
            String delegateId = delegationService.getActiveDelegateId(employeeId, "Helpdesk");
            if (delegateId != null) {
                saveNotificationRecord(delegateId, "[Delegated] " + message);
            }
        } catch (Exception e) {
            System.err.println("Error notifying delegate in TicketService: " + e.getMessage());
        }
    }

    private void saveNotificationRecord(String employeeId, String message) {
        // Truncate message to fit database column (500 chars limit)
        String safeMessage = message;
        if (safeMessage != null && safeMessage.length() > 495) {
            safeMessage = safeMessage.substring(0, 495) + "...";
        }

        Notification n = new Notification();
        n.setEmployeeId(employeeId);
        n.setMessage(safeMessage);
        n.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        n.setRead(false);
        notificationRepository.save(n);
    }

    private void sendEmailIfPresent(String employeeId, String subject, String body) {
        if (employeeId == null || employeeId.trim().isEmpty())
            return;
        Optional<Employee> opt = employeeRepository.findByEmployeeId(employeeId);
        if (opt.isPresent()) {
            String to = opt.get().getEmail();
            if (to != null && !to.trim().isEmpty()) {
                emailService.sendEmail(to, subject, body);
            }
        }
    }

    private void sendInAppAndEmailToEmployee(String employeeId, String subject, String message) {
        sendInAppNotification(employeeId, message);
        sendEmailIfPresent(employeeId, subject, message);
    }

    private void sendInAppAndEmailToMany(List<String> employeeIds, String subject, String message) {
        if (employeeIds == null || employeeIds.isEmpty())
            return;
        for (String id : employeeIds) {
            if (id == null)
                continue;
            String tid = id.trim();
            if (tid.isEmpty())
                continue;
            sendInAppAndEmailToEmployee(tid, subject, message);
        }
    }

    /**
     * Resolve team members (employeeIds) for a team role name (e.g. "HR_TEAM",
     * "FINANCE_TEAM")
     */
    private List<String> getTeamMemberIds(String roleName) {
        List<String> out = new ArrayList<>();
        if (roleName == null)
            return out;

        HelpDeskTeamAccess access = helpDeskTeamAccessService.getTeamAccessByRoleName(roleName);
        if (access == null)
            return out;

        String ids = access.getTeamIds();
        if (ids == null || ids.trim().isEmpty())
            return out;

        String[] parts = ids.split(",");
        for (String p : parts) {
            if (p != null && !p.trim().isEmpty())
                out.add(p.trim());
        }
        return out;
    }

    private String buildSimplifiedNotification(String creatorName, String creatorId) {
        return "Incident raised by " + creatorName + " (" + creatorId + ") for your review.";
    }

    /*
     * ===========================================================
     * NORMAL TICKET SAVE
     * ===========================================================
     */
    public Ticket saveTicket(Ticket ticket, MultipartFile file) throws Exception {
        // Only set status to OPEN if it's not already set
        String status = ticket.getStatus();
        if (status == null || status.isEmpty()) {
            status = "OPEN";
            ticket.setStatus(status);
        }

        // Project Assignment Validation (skipped for drafts)
        if (!"DRAFT".equalsIgnoreCase(status)) {
            validateProjectAssignment(ticket.getEmployeeId());
        }

        // Only set ticketType to NEW_TICKET if not already set (preserve CHANGE_REQUEST
        // for drafts)
        if (ticket.getTicketType() == null || ticket.getTicketType().isEmpty()) {
            ticket.setTicketType("NEW_TICKET");
        }
        // FETCH TEAM FROM CATEGORY TABLE (DYNAMIC) - FIX IS HERE
        // FETCH TEAM FROM CATEGORY TABLE (DYNAMIC)
        // FETCH TEAM FROM CATEGORY TABLE (DYNAMIC)
        String catName = ticket.getCategory() != null ? ticket.getCategory().trim() : "";
        Category cat = resolveCategory(catName, ticket.getTicketType());

        ticket.setCategory(cat.getCategoryName()); // Save readable name

        String team = cat.getTeamName(); // dynamic team name from DB
        ticket.setTeamName(team);

        ticket.setAssignedTo(null);

        if (file != null && !file.isEmpty()) {
            ticket.setAttachmentFileName(file.getOriginalFilename());
            ticket.setAttachmentData(file.getBytes());
        }

        // POPULATE EMPLOYEE NAME
        if (ticket.getEmployeeId() != null) {
            employeeRepository.findByEmployeeId(ticket.getEmployeeId())
                    .ifPresent(emp -> ticket.setEmployeeName(emp.getFirstName() + " " + emp.getLastName()));
        }

        Ticket saved = ticketRepository.save(ticket);

        // Only create history and notifications for non-draft tickets
        if (!"DRAFT".equals(ticket.getStatus())) {
            // ⭐ HISTORY
            saveHistory(saved, "CREATED", ticket.getEmployeeId(), null, null, team, null);

            // =========================
            // NOTIFICATIONS FOR NEW TICKET (Flow 1)
            // - Notify all team members
            // - If ccToManager true -> notify assigned manager
            // =========================
            String creatorId = ticket.getEmployeeId();
            String summary = ticket.getIssueSummary() != null ? ticket.getIssueSummary() : "New ticket";

            // Fetch creator's name for better message
            String creatorName = ticket.getEmployeeName();
            if (creatorName == null && creatorId != null) {
                creatorName = employeeRepository.findByEmployeeId(creatorId)
                        .map(e -> e.getFirstName() + " " + e.getLastName())
                        .orElse("Unknown");
            }

            List<String> teamMembers = getTeamMemberIds(team);
            // UPDATED MESSAGE FORMAT (Simplified)
            String notificationMessage = buildSimplifiedNotification(creatorName, creatorId);
            String teamSubject = "Incident Raised";

            sendInAppAndEmailToMany(teamMembers, teamSubject, notificationMessage);

            if (Boolean.TRUE.equals(saved.getCcToManager()) && creatorId != null) {

                String managerId = employeeRepository.findByEmployeeId(creatorId)
                        .map(Employee::getAssignedManagerId)
                        .orElse(null);

                if (managerId != null) {
                    // Send same simplified message to manager
                    sendInAppAndEmailToEmployee(managerId, teamSubject, notificationMessage);
                }
            }
        }

        return saved;
    }

    /*
     * ===========================================================
     * CHANGE REQUEST SUBMIT
     * ===========================================================
     */
    public Ticket submitChangeRequest(
            String employeeId,
            String category,
            String subcategory,
            String issueSummary,
            String detailedDescription,
            Boolean ccToManager,
            MultipartFile file) throws Exception {

        validateProjectAssignment(employeeId);

        Employee emp = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        String managerId = emp.getAssignedManagerId();

        if (managerId == null) {
            throw new RuntimeException("No assigned manager for employee");
        }

        Ticket t = new Ticket();
        t.setEmployeeId(employeeId);
        t.setCategory(category);
        t.setSubcategory(subcategory);
        t.setIssueSummary(issueSummary);
        t.setDetailedDescription(detailedDescription);
        t.setCcToManager(ccToManager);
        t.setStatus("PENDING_MANAGER");

        t.setTicketType("CHANGE_REQUEST");

        if (file != null && !file.isEmpty()) {
            t.setAttachmentFileName(file.getOriginalFilename());
            t.setAttachmentData(file.getBytes());
        }

        t.setEmployeeName(emp.getFirstName() + " " + emp.getLastName());
        // --- STICKY DELEGATION ---
        t.setAssignedApproverId(delegationService.getEffectiveApprover(managerId, "Helpdesk"));

        Ticket saved = ticketRepository.save(t);

        // ⭐ HISTORY
        saveHistory(saved, "MANAGER_REVIEW_STARTED", null, managerId, null, null, null);

        // =========================
        // NOTIFY MANAGER ONLY (Flow 2 - initial)
        // =========================
        String mgrMsg = buildSimplifiedNotification(emp.getFirstName() + " " + emp.getLastName(), employeeId);
        String mgrSub = "Change Request — Manager Review";

        sendInAppAndEmailToEmployee(managerId, mgrSub, mgrMsg);

        return saved;
    }

    /*
     * ===========================================================
     * GET MANAGER PENDING TICKETS
     * ===========================================================
     */
    public List<Ticket> getManagerTickets(String managerId) {
        // After delegation, tickets are reassigned to the delegate (assignedApproverId
        // = delegateId)
        // So the delegate will see tickets where assignedApproverId matches their own
        // ID
        Set<Ticket> allTickets = new HashSet<>(
                ticketRepository.findByAssignedApproverIdAndStatus(managerId, "PENDING_MANAGER"));

        return allTickets.stream()
                .peek(this::enrichTicketName)
                .toList();
    }

    /*
     * ===========================================================
     * DEBUG MANAGER TICKETS - HELP DIAGNOSE ASSIGNMENT ISSUES
     * ===========================================================
     */
    public java.util.Map<String, Object> debugManagerTickets(String managerId) {
        java.util.Map<String, Object> debug = new java.util.HashMap<>();

        // 1. Find all employees assigned to this manager
        List<Employee> empList = employeeRepository.findByAssignedManagerId(managerId);
        List<String> empIds = empList.stream()
                .map(Employee::getEmployeeId)
                .toList();

        debug.put("managerId", managerId);
        debug.put("employeesUnderManager", empIds);
        debug.put("employeeCount", empIds.size());

        // 2. Find all PENDING_MANAGER tickets in the system
        List<Ticket> allPendingManagerTickets = ticketRepository.findAll().stream()
                .filter(t -> "PENDING_MANAGER".equalsIgnoreCase(t.getStatus()))
                .toList();

        debug.put("totalPendingManagerTickets", allPendingManagerTickets.size());

        // 3. Show which employees raised these tickets
        List<String> ticketRaisedBy = allPendingManagerTickets.stream()
                .map(Ticket::getEmployeeId)
                .distinct()
                .toList();

        debug.put("pendingTicketsRaisedBy", ticketRaisedBy);

        // 4. Find tickets that SHOULD show for this manager
        List<Ticket> matchingTickets = allPendingManagerTickets.stream()
                .filter(t -> empIds.contains(t.getEmployeeId()))
                .toList();

        debug.put("ticketsThatShouldShow", matchingTickets.size());

        // 5. Show detailed ticket info
        List<java.util.Map<String, Object>> ticketDetails = new ArrayList<>();
        for (Ticket t : allPendingManagerTickets) {
            java.util.Map<String, Object> ticketInfo = new java.util.HashMap<>();
            ticketInfo.put("ticketId", t.getId());
            ticketInfo.put("employeeId", t.getEmployeeId());
            ticketInfo.put("status", t.getStatus());

            // Check if this employee is under this manager
            Optional<Employee> emp = employeeRepository.findByEmployeeId(t.getEmployeeId());
            if (emp.isPresent()) {
                ticketInfo.put("employeeAssignedManagerId", emp.get().getAssignedManagerId());
                ticketInfo.put("matchesThisManager", managerId.equals(emp.get().getAssignedManagerId()));
            } else {
                ticketInfo.put("employeeFound", false);
            }

            ticketDetails.add(ticketInfo);
        }

        debug.put("allPendingTicketsDetails", ticketDetails);

        return debug;
    }

    private void enrichTicketName(Ticket t) {
        if (t.getEmployeeName() == null && t.getEmployeeId() != null) {
            employeeRepository.findByEmployeeId(t.getEmployeeId())
                    .ifPresent(emp -> t.setEmployeeName(emp.getFirstName() + " " + emp.getLastName()));
        }
    }

    /*
     * ===========================================================
     * MANAGER APPROVE
     * ===========================================================
     */
    public Ticket managerApprove(Long ticketId, String employeeId) {

        Ticket t = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // ✅ RESOLVE TEAM DYNAMCIALLY
        Category cat = resolveCategory(t.getCategory(), t.getTicketType());

        String team = cat.getTeamName();
        t.setTeamName(team);

        t.setStatus("OPEN");
        t.setTeamName(team);

        Ticket saved = ticketRepository.save(t);

        // ⭐ HISTORY - Pass employeeId for delegation attribution
        saveHistory(saved, "MANAGER_APPROVED", employeeId, null, null, team, null);

        // =========================
        // NOTIFICATIONS (Flow 2 - approved)
        // - Notify candidate (employee)
        // - Notify all team members
        // =========================
        String empId = t.getEmployeeId();
        String empMsg = "Your change request (Ticket #" + saved.getId() + ") has been approved by the manager.";
        String empSub = "Change Request Approved";
        sendInAppAndEmailToEmployee(empId, empSub, empMsg);

        List<String> teamMembers = getTeamMemberIds(team);
        String teamMsg = "Change request (Ticket #" + saved.getId() + ") approved by manager and moved to your team.";
        String teamSub = "Change Request Assigned to Team";
        sendInAppAndEmailToMany(teamMembers, teamSub, teamMsg);

        return saved;
    }

    /*
     * ===========================================================
     * MANAGER REJECT
     * ===========================================================
     */
    public Ticket managerReject(Long ticketId, String reason, String employeeId) {

        Ticket t = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        t.setStatus("REJECTED_BY_MANAGER");
        t.setRejectionReason(reason);

        Ticket saved = ticketRepository.save(t);

        // ⭐ HISTORY - Pass employeeId for delegation attribution
        saveHistory(saved, "MANAGER_REJECTED", employeeId, null, null, null, reason);

        // =========================
        // NOTIFICATIONS (Flow 2 - rejected)
        // - Notify candidate only
        // =========================
        String empId = t.getEmployeeId();
        String empMsg = "Your change request (Ticket #" + saved.getId() + ") was rejected by the manager. Reason: "
                + reason;
        String empSub = "Change Request Rejected";
        sendInAppAndEmailToEmployee(empId, empSub, empMsg);

        return saved;
    }

    /*
     * ===========================================================
     * GET MY TICKETS
     * ===========================================================
     */
    public List<Ticket> getTicketsByEmployeeId(String employeeId) {
        List<Ticket> tickets = ticketRepository.findByEmployeeId(employeeId);
        tickets.forEach(this::enrichTicketName);
        return tickets;
    }

    public Ticket getTicketById(Long id) {
        Ticket t = ticketRepository.findById(id).orElse(null);
        if (t != null)
            enrichTicketName(t);
        return t;
    }

    public List<Ticket> getAllTickets() {
        List<Ticket> tickets = ticketRepository.findAll();
        tickets.forEach(this::enrichTicketName);
        return tickets;
    }

    /*
     * ===========================================================
     * ASSIGN TO ME
     * ===========================================================
     */
    public Ticket assignTicketToUser(Long ticketId, String employeeId) {

        Ticket t = ticketRepository.findById(ticketId).orElse(null);
        if (t == null)
            return null;

        String oldUser = t.getAssignedTo();

        t.setAssignedTo(employeeId);
        t.setStatus("IN_PROGRESS");

        Ticket saved = ticketRepository.save(t);

        // ⭐ HISTORY
        saveHistory(saved, "ASSIGNED", oldUser, employeeId, t.getTeamName(), t.getTeamName(), null);

        // =========================
        // NOTIFY ASSIGNEE (Flow 3)
        // - notify the person ticket is assigned to
        // =========================
        String assigneeMsg = "Ticket #" + saved.getId() + " has been assigned to you.";
        String assigneeSub = "Ticket Assigned";
        sendInAppAndEmailToEmployee(employeeId, assigneeSub, assigneeMsg);

        enrichTicketName(saved);
        return saved;
    }

    /*
     * ===========================================================
     * UPDATE STATUS
     * ===========================================================
     */
    public Ticket updateTicketStatus(Long ticketId, String status) {

        Ticket t = ticketRepository.findById(ticketId).orElse(null);
        if (t == null)
            return null;

        t.setStatus(status);

        Ticket saved = ticketRepository.save(t);

        // ⭐ HISTORY
        saveHistory(saved, "STATUS_UPDATED", null, null, t.getTeamName(), t.getTeamName(), status);

        enrichTicketName(saved);
        return saved;
    }

    /*
     * ===========================================================
     * TEAM TICKETS
     * ===========================================================
     */
    public List<Ticket> getTicketsForTeam(String teamName) {
        return ticketRepository.findAll().stream()
                .filter(t -> "OPEN".equals(t.getStatus()) ||
                        "IN_PROGRESS".equals(t.getStatus()) ||
                        "REOPENED".equals(t.getStatus()))
                .filter(t -> t.getTeamName() != null &&
                        t.getTeamName().equalsIgnoreCase(teamName))
                .peek(this::enrichTicketName)
                .toList();
    }

    /*
     * ===========================================================
     * TRANSFER TICKET
     * ===========================================================
     */
    public Ticket transferTicket(Long ticketId, String newTeam, String reason) {

        Ticket t = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        String oldTeam = t.getTeamName();
        String oldUser = t.getAssignedTo();

        String mappedTeam = newTeam; // because teams are created dynamically now
        t.setTeamName(mappedTeam);

        t.setTeamName(mappedTeam);
        t.setStatus("OPEN");
        t.setAssignedTo(null);

        // ⭐ IMPORTANT: SAVE REASON INTO DATABASE
        t.setTransferReason(reason);
        t.setTransferredBy(oldUser);

        Ticket saved = ticketRepository.save(t);

        saveHistory(saved, "TRANSFERRED", oldUser, null, oldTeam, mappedTeam, reason);

        // =========================
        // NOTIFY NEW TEAM MEMBERS (Flow 5)
        // - notify all members of mappedTeam
        // =========================
        List<String> newTeamMembers = getTeamMemberIds(mappedTeam);
        String teamMsg = "Ticket #" + saved.getId() + " has been transferred to your team. Reason: "
                + (reason == null ? "" : reason);
        String teamSub = "Ticket Transferred to Team";
        sendInAppAndEmailToMany(newTeamMembers, teamSub, teamMsg);

        enrichTicketName(saved);
        return saved;
    }

    /*
     * ===========================================================
     * REASSIGN TICKET
     * ===========================================================
     */
    public Ticket reassignTicket(Long ticketId, String reason) {

        Ticket t = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        String oldUser = t.getAssignedTo();

        t.setStatus("OPEN");
        t.setAssignedTo(null);

        // ⭐ SAVE REASSIGN REASON
        t.setReassignReason(reason);
        t.setReassignedBy(oldUser);

        Ticket saved = ticketRepository.save(t);

        saveHistory(saved, "REASSIGNED", oldUser, null, t.getTeamName(), t.getTeamName(), reason);

        // =========================
        // NOTIFY TEAM POOL (Flow 4)
        // - notify all team members that ticket is back in pool
        // =========================
        List<String> teamMembers = getTeamMemberIds(t.getTeamName());
        String poolMsg = "Ticket #" + saved.getId() + " has been returned to the team pool by "
                + (oldUser == null ? "an assignee" : oldUser) + ". Reason: " + (reason == null ? "" : reason);
        String poolSub = "Ticket Returned to Team Pool";
        sendInAppAndEmailToMany(teamMembers, poolSub, poolMsg);

        enrichTicketName(saved);
        return saved;
    }

    /*
     * ===========================================================
     * RESOLVE TICKET
     * ===========================================================
     */
    public Ticket resolveTicket(Long ticketId, String actorId) {

        Ticket t = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        String oldUser = t.getAssignedTo();

        t.setStatus("RESOLVED");

        Ticket saved = ticketRepository.save(t);

        // ⭐ HISTORY
        // Pass actorId as fromUser to record WHO resolved it
        String finalActorId = actorId;
        if (finalActorId == null) {
            finalActorId = t.getAssignedTo(); // Fallback to current assignee if actorId not provided
        }
        saveHistory(saved, "RESOLVED", finalActorId, null, t.getTeamName(), t.getTeamName(), null);

        // =========================
        // NOTIFY CANDIDATE (Flow 6)
        // =========================
        String empId = t.getEmployeeId();
        String empMsg = "Your ticket (Ticket #" + saved.getId() + ") has been resolved.";
        String empSub = "Ticket Resolved";
        sendInAppAndEmailToEmployee(empId, empSub, empMsg);

        enrichTicketName(saved);
        return saved;
    }

    /*
     * ===========================================================
     * REOPEN TICKET
     * ===========================================================
     */
    public Ticket reopenTicket(Long ticketId, String reason) {

        Ticket t = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // DO NOT FETCH CATEGORY AGAIN (Fix)
        // Use existing teamName if already present

        String team = t.getTeamName();
        if (team == null || team.trim().isEmpty()) {
            Category cat = resolveCategory(t.getCategory(), null);
            team = cat.getTeamName();
        }

        t.setTeamName(team);
        t.setStatus("REOPENED");
        t.setAssignedTo(null);
        t.setReopenReason(reason);

        Ticket saved = ticketRepository.save(t);

        saveHistory(saved, "REOPENED", null, null, t.getTeamName(), team, reason);

        // Notify team members
        List<String> teamMembers = getTeamMemberIds(team);
        String teamMsg = "Ticket #" + saved.getId() + " has been reopened. Reason: " + (reason == null ? "" : reason);
        String teamSub = "Ticket Reopened";

        sendInAppAndEmailToMany(teamMembers, teamSub, teamMsg);

        enrichTicketName(saved);
        return saved;
    }

    public Ticket resendTicket(Long ticketId, String reason, String actorId) {
        Ticket t = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        t.setStatus("RESEND_REQUIRED");
        t.setResendReason(reason);
        t.setAssignedTo(null);

        Ticket saved = ticketRepository.save(t);
        // Pass actorId as fromUser
        String finalActorId = actorId;
        if (finalActorId == null) {
            finalActorId = t.getAssignedTo();
        }
        saveHistory(saved, "RESEND_REQUESTED", finalActorId, null, t.getTeamName(), t.getTeamName(), reason);

        // Notify employee
        String empId = t.getEmployeeId();
        String empMsg = "A resend has been requested for your ticket (Ticket #" + saved.getId() + "). Reason: "
                + reason;
        String empSub = "Resend Requested for Ticket";
        sendInAppAndEmailToEmployee(empId, empSub, empMsg);

        enrichTicketName(saved);
        return saved;
    }

    public Ticket updateResentTicket(
            Long ticketId,
            String issueSummary,
            String detailedDescription,
            MultipartFile file) throws Exception {

        Ticket t = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        validateProjectAssignment(t.getEmployeeId());

        t.setIssueSummary(issueSummary);
        t.setDetailedDescription(detailedDescription);

        if (file != null && !file.isEmpty()) {
            t.setAttachmentFileName(file.getOriginalFilename());
            t.setAttachmentData(file.getBytes());
        }

        // Determine next status based on ticket type
        if ("CHANGE_REQUEST".equals(t.getTicketType())) {
            t.setStatus("PENDING_MANAGER");
        } else {
            t.setStatus("OPEN");
        }

        Ticket saved = ticketRepository.save(t);
        saveHistory(saved, "RESUBMITTED", t.getEmployeeId(), null, null, t.getTeamName(), null);

        // Notify team or manager
        if ("CHANGE_REQUEST".equals(t.getTicketType())) {
            Employee emp = employeeRepository.findByEmployeeId(t.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            String managerId = emp.getAssignedManagerId();
            if (managerId != null) {
                String mgrMsg = "Ticket #" + saved.getId() + " has been resubmitted by " + emp.getFirstName() + " "
                        + emp.getLastName();
                sendInAppAndEmailToEmployee(managerId, "Ticket Resubmitted", mgrMsg);
            }
        } else {
            List<String> teamMembers = getTeamMemberIds(t.getTeamName());
            String teamMsg = "Ticket #" + saved.getId() + " has been resubmitted by the employee.";
            sendInAppAndEmailToMany(teamMembers, "Ticket Resubmitted", teamMsg);
        }

        enrichTicketName(saved);
        return saved;
    }

    /*
     * ===========================================================
     * CANCEL TICKET
     * ===========================================================
     */
    public Ticket cancelTicket(Long ticketId) {
        Ticket t = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        String oldStatus = t.getStatus();
        if (!"OPEN".equals(oldStatus) && !"PENDING_MANAGER".equals(oldStatus)) {
            throw new RuntimeException("Only tickets in OPEN or PENDING_MANAGER status can be cancelled.");
        }

        t.setStatus("CANCELLED");
        t.setAssignedTo(null);

        Ticket saved = ticketRepository.save(t);
        saveHistory(saved, "CANCELLED", t.getEmployeeId(), null, t.getTeamName(), t.getTeamName(), null);

        // =========================
        // NOTIFICATIONS FOR CANCELLATION
        // =========================
        String creatorName = t.getEmployeeName() != null ? t.getEmployeeName() : t.getEmployeeId();
        String subject = "Ticket Cancelled - Ticket #" + saved.getId();
        String message = "The ticket #" + saved.getId() + " (" + t.getIssueSummary() + ") has been cancelled by "
                + creatorName + ".";

        if ("PENDING_MANAGER".equals(oldStatus)) {
            // Notify manager
            employeeRepository.findByEmployeeId(t.getEmployeeId()).ifPresent(emp -> {
                String managerId = emp.getAssignedManagerId();
                if (managerId != null) {
                    sendInAppAndEmailToEmployee(managerId, subject, message);
                }
            });
        } else if ("OPEN".equals(oldStatus)) {
            // Notify team
            String teamName = t.getTeamName();
            if (teamName != null && !teamName.isEmpty()) {
                List<String> teamMembers = getTeamMemberIds(teamName);
                sendInAppAndEmailToMany(teamMembers, subject, message);
            }
        }

        enrichTicketName(saved);
        return saved;
    }

    /*
     * ===========================================================
     * NOTIFICATIONS SUPPORT FOR NotificationService
     * ===========================================================
     */

    // Return all in-app notifications for Ticket module (same as ClaimService)
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

    /*
     * ===========================================================
     * HELPDESK REPORT - FILTERED TICKETS
     * ===========================================================
     */
    public List<Ticket> getFilteredTickets(
            String employeeId,
            String ticketType,
            String category,
            String subcategory,
            String status,
            java.util.Date startDate,
            java.util.Date endDate,
            String tenantId) {
        List<Ticket> allTickets = ticketRepository.findAll();

        String tenantCode = null;
        List<String> tenantEmployeeIds = new ArrayList<>();
        if (tenantId != null && !tenantId.trim().isEmpty()) {
            try {
                if (tenantId.matches("\\d+")) {
                    java.util.Optional<com.register.example.entity.Tenant> tOpt = tenantRepository
                            .findById(Long.parseLong(tenantId));
                    if (tOpt.isPresent()) {
                        tenantCode = tOpt.get().getTenantId();
                    }
                }
            } catch (Exception ignored) {
            }

            tenantEmployeeIds = employeeRepository.findByTenantId(tenantId).stream()
                    .map(Employee::getEmployeeId).toList();
        }

        final String finalTenantCode = tenantCode;
        final List<String> finalTenantEmployeeIds = tenantEmployeeIds;

        return allTickets.stream()
                .filter(t -> {
                    if (tenantId != null && !tenantId.trim().isEmpty()) {
                        if (t.getEmployeeId() == null || !finalTenantEmployeeIds.contains(t.getEmployeeId())) {
                            return false;
                        }
                    }

                    // Filter by employee ID (support multiple comma-separated IDs)
                    if (employeeId != null && !employeeId.trim().isEmpty()) {
                        String[] empIds = employeeId.split(",");
                        boolean matchesAny = false;
                        for (String id : empIds) {
                            String trimmed = id.trim();
                            if (t.getEmployeeId() != null) {
                                String cleanEmpId = t.getEmployeeId().trim();
                                if (cleanEmpId.equalsIgnoreCase(trimmed)
                                        || (finalTenantCode != null
                                                && cleanEmpId.equalsIgnoreCase(finalTenantCode + "_" + trimmed))
                                        || (tenantId != null
                                                && cleanEmpId.equalsIgnoreCase(tenantId + "_" + trimmed))) {
                                    matchesAny = true;
                                    break;
                                }
                            }
                        }
                        if (!matchesAny)
                            return false;
                    }

                    // Filter by ticket type
                    if (ticketType != null && !ticketType.trim().isEmpty()) {
                        if (t.getTicketType() == null || !t.getTicketType().equalsIgnoreCase(ticketType)) {
                            return false;
                        }
                    }

                    // Filter by category
                    if (category != null && !category.trim().isEmpty()) {
                        if (t.getCategory() == null || !t.getCategory().equalsIgnoreCase(category)) {
                            return false;
                        }
                    }

                    // Filter by subcategory
                    if (subcategory != null && !subcategory.trim().isEmpty()) {
                        if (t.getSubcategory() == null || !t.getSubcategory().equalsIgnoreCase(subcategory)) {
                            return false;
                        }
                    }

                    // Filter by status
                    if (status != null && !status.trim().isEmpty()) {
                        if (t.getStatus() == null || !t.getStatus().equalsIgnoreCase(status)) {
                            return false;
                        }
                    }

                    // Filter by date range
                    if (startDate != null && t.getCreatedAt() != null) {
                        if (t.getCreatedAt().before(startDate)) {
                            return false;
                        }
                    }

                    if (endDate != null && t.getCreatedAt() != null) {
                        // Add one day to endDate to include the entire end date
                        java.util.Calendar cal = java.util.Calendar.getInstance();
                        cal.setTime(endDate);
                        cal.add(java.util.Calendar.DAY_OF_MONTH, 1);
                        if (t.getCreatedAt().after(cal.getTime())) {
                            return false;
                        }
                    }

                    return true;
                })
                .peek(this::enrichTicketName)
                .toList();
    }

    public java.util.Map<String, Object> getTicketStatusDetails(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId).orElseThrow(() -> new RuntimeException("Ticket not found"));
        java.util.Map<String, Object> details = new java.util.HashMap<>();

        details.put("createdAt", ticket.getCreatedAt());
        details.put("status", ticket.getStatus());

        // --- FETCH HISTORY ---
        List<TicketHistory> historyList = historyRepo.findByTicketIdOrderByTimestampAsc(ticketId);
        List<java.util.Map<String, Object>> historyDtos = new ArrayList<>();

        for (TicketHistory h : historyList) {
            java.util.Map<String, Object> dto = new java.util.HashMap<>();
            dto.put("timestamp", h.getTimestamp());
            dto.put("rawAction", h.getActionType());

            // Resolve Actor Name (Who performed the action)
            String actorName = "System";
            String actorId = null;

            // Logic to determine main actor based on action type
            if ("CREATED".equals(h.getActionType()) || "RESUBMITTED".equals(h.getActionType())) {
                actorId = h.getFromUser(); // Employee
            } else if ("MANAGER_APPROVED".equals(h.getActionType()) || "MANAGER_REJECTED".equals(h.getActionType())) {
                // For manager actions, we might not have stored the specific manager ID in
                // fromUser in early versions,
                // but usually we should. If fromUser is null, we can try to infer from
                // employee's manager.
                if (h.getFromUser() != null)
                    actorId = h.getFromUser();
                else {
                    // Fallback infer
                    Employee e = employeeRepository.findByEmployeeId(ticket.getEmployeeId()).orElse(null);
                    if (e != null)
                        actorId = e.getAssignedManagerId();
                }
            } else if ("ASSIGNED".equals(h.getActionType())) {
                // "fromUser" is usually null or the one who assigned it?
                // Actually logic in assignTicket: saveHistory(saved, "ASSIGNED", oldUser,
                // employeeId, ...);
                // So fromUser is the PREVIOUS owner. If previous owner was null (pool), then
                // who performed it?
                // In basic logic, 'ASSIGNED' usually happens when someone picks it up.
                // So the ACTOR is likely the 'toUser' (self-assignment).
                actorId = h.getToUser();
            } else if ("TRANSFERRED".equals(h.getActionType()) || "REASSIGNED".equals(h.getActionType())
                    || "RESOLVED".equals(h.getActionType()) || "CANCELLED".equals(h.getActionType())
                    || "RESEND_REQUESTED".equals(h.getActionType())) {
                actorId = h.getFromUser();

                // ⭐ Fallback for RESOLVED if fromUser is missing (for older data)
                if (actorId == null && "RESOLVED".equals(h.getActionType())) {
                    actorId = ticket.getAssignedTo();
                }
            } else if ("REOPENED".equals(h.getActionType())) {
                // Typically the employee reopens it not having fromUser explicitly set in some
                // flows?
                // check reopenTicket: saveHistory(..., null, null...) -> Wait, fromUser is null
                // there.
                // If null, it's the employee.
                actorId = ticket.getEmployeeId();
            }

            actorName = "Unknown";
            if (h.getActorName() != null) {
                actorName = h.getActorName();
            } else if (actorId != null) {
                Optional<Employee> empOpt = employeeRepository.findByEmployeeId(actorId);
                if (empOpt.isPresent()) {
                    actorName = empOpt.get().getFirstName() + " " + empOpt.get().getLastName() + " (" + actorId + ")";
                } else {
                    actorName = actorId; // Fallback to ID
                }
            }

            dto.put("actorName", actorName);

            // FORMAT ACTION STRING
            String displayAction = h.getActionType();
            String teamNameDisplay = h.getFromTeam() != null ? h.getFromTeam().replace("_", " ") : "Team";

            switch (h.getActionType()) {
                case "CREATED":
                    displayAction = "created";
                    break;
                case "MANAGER_REVIEW_STARTED":
                    displayAction = "SUBMITTED to Manager";
                    break;
                case "MANAGER_APPROVED":
                    displayAction = "APPROVED by Manager";
                    break;
                case "MANAGER_REJECTED":
                    displayAction = "REJECTED by Manager";
                    break;
                case "ASSIGNED":
                    // Point 4: "PICKED UP by Laya Desai"
                    displayAction = "PICKED UP by " + actorName;
                    break;
                case "TRANSFERRED":
                    String fromTeamVal = h.getFromTeam() != null ? h.getFromTeam().replace("_", " ") : "Team";
                    String toTeamVal = h.getToTeam() != null ? h.getToTeam().replace("_", " ") : "Team";
                    displayAction = "TRANSFERRED from " + fromTeamVal + " to " + toTeamVal;
                    break;
                case "REASSIGNED":
                    displayAction = "REASSIGNED to Pool";
                    break;
                case "RESOLVED":
                    // Point 5: "RESOLVED by teamname"
                    displayAction = "RESOLVED by " + teamNameDisplay;
                    break;
                case "REOPENED":
                    displayAction = "REOPENED by Employee";
                    break;
                case "RESEND_REQUESTED":
                    // Point 3: "RESEND REQUESTED by teamname"
                    displayAction = "RESEND REQUESTED by " + teamNameDisplay;
                    break;
                case "RESUBMITTED":
                    displayAction = "RESUBMITTED by Employee";
                    break;
                case "CANCELLED":
                    displayAction = "CANCELLED";
                    break;
                case "STATUS_UPDATED":
                    displayAction = "STATUS UPDATED to " + (h.getNotes() != null ? h.getNotes() : "New Status");
                    break;
            }

            details.put("actorName", actorName); // Put last actor in main details details for fallback

            dto.put("displayAction", displayAction);
            dto.put("notes", h.getNotes()); // ⭐ ADDING NOTES FIELD
            historyDtos.add(dto);
        }

        details.put("history", historyDtos);

        // ... Keep existing logic for current stage/approver fallback ...
        // Next Approver Role logic
        String stage = "";
        String approverName = "-";

        if ("PENDING_MANAGER".equals(ticket.getStatus())) {
            stage = "Manager Approval";
            Employee emp = employeeRepository.findByEmployeeId(ticket.getEmployeeId()).orElse(null);
            String assignedId = ticket.getAssignedApproverId();
            String defaultMgrId = (emp != null) ? emp.getAssignedManagerId() : null;

            if (assignedId != null) {
                final String finalAssignedId = assignedId;
                employeeRepository.findByEmployeeId(finalAssignedId).ifPresent(mgr -> {
                    final String name = mgr.getFirstName() + " " + mgr.getLastName();
                    if (defaultMgrId != null && !finalAssignedId.equals(defaultMgrId)) {
                        employeeRepository.findByEmployeeId(defaultMgrId).ifPresent(orig -> {
                            details.put("approverName", name + " (" + finalAssignedId + ") (on behalf of "
                                    + orig.getFirstName() + " " + orig.getLastName() + " (" + defaultMgrId + "))");
                        });
                    } else {
                        details.put("approverName", name + " (" + finalAssignedId + ")");
                    }
                });
            } else {
                details.put("approverName", "Manager Not Assigned");
            }
        } else if ("OPEN".equals(ticket.getStatus())) {
            stage = "Team Assignment";
            details.put("approverName",
                    ticket.getTeamName() != null ? ticket.getTeamName().replace("_", " ") : "Unassigned Team");
        } else if ("IN_PROGRESS".equals(ticket.getStatus())) {
            stage = "Work In Progress";
            if (ticket.getAssignedTo() != null) {
                employeeRepository.findByEmployeeId(ticket.getAssignedTo()).ifPresent(assignee -> {
                    details.put("approverName", assignee.getFirstName() + " " + assignee.getLastName());
                });
            } else {
                details.put("approverName", "Unassigned Agent");
            }
        } else if ("RESOLVED".equals(ticket.getStatus()) || "CLOSED".equals(ticket.getStatus())) {
            stage = "Resolved";
            // Use last resolver from history if available
            Optional<java.util.Map<String, Object>> lastResolve = historyDtos.stream()
                    .filter(d -> d.get("displayAction").toString().startsWith("RESOLVED by "))
                    .reduce((first, second) -> second); // get last

            if (lastResolve.isPresent()) {
                details.put("approvedAt", lastResolve.get().get("timestamp"));
                details.put("approverName", lastResolve.get().get("actorName"));
            } else {
                details.put("approvedAt", null);
                details.put("approverName", "System");
            }

        } else if ("CANCELLED".equals(ticket.getStatus())) {
            stage = "Cancelled";
            details.put("approverName", "-");
        } else {
            stage = ticket.getStatus();
            details.put("approverName", "-");
        }

        details.put("nextApproverRole", stage);
        if (!details.containsKey("approverName")) {
            details.put("approverName", approverName);
        }

        return details;
    }

    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            java.util.Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            if (empOpt.isPresent()) {
                return empOpt.get().getTenantId();
            }
        }
        return null;
    }

    private Category resolveCategory(String catName, String ticketType) {
        if (catName == null || catName.trim().isEmpty()) {
            throw new RuntimeException("Category name is missing");
        }

        String searchName = catName.trim();

        // 1. Try match (with and without ticket type)
        Category result = findCategoryInDb(searchName, ticketType);
        if (result != null)
            return result;

        // 2. Try stripping (Team: ...) and search again
        if (searchName.contains(" (Team: ")) {
            String stripped = searchName.split(" \\(Team: ")[0].trim();
            result = findCategoryInDb(stripped, ticketType);
            if (result != null)
                return result;
        }

        // 3. EXTREME FUZZY: Compare by stripping all special characters and spaces
        String extreme = searchName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        // If it had team info, also try stripping it from the extreme version
        if (searchName.contains(" (Team: ")) {
            String stripped = searchName.split(" \\(Team: ")[0].trim();
            extreme = stripped.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        }

        String tenantId = getCurrentTenantId();
        List<Category> all = (tenantId != null) ? categoryRepo.findByTenantId(tenantId) : categoryRepo.findAll();
        for (Category c : all) {
            String dbExtreme = c.getCategoryName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
            if (dbExtreme.equals(extreme)) {
                return c;
            }
        }

        throw new RuntimeException("Category configuration not found for: " + catName);
    }

    private Category findCategoryInDb(String name, String ticketType) {
        String normalized = name.trim();
        String tenantId = getCurrentTenantId();

        // Try exact match with type (if type provided)
        if (ticketType != null) {
            Optional<Category> res = categoryRepo.findByCategoryNameIgnoreCaseAndTicketTypeIgnoreCaseAndTenantId(
                    normalized,
                    ticketType, tenantId);
            if (res.isPresent())
                return res.get();
        }

        // Try match by name only
        Optional<Category> res = categoryRepo.findByCategoryNameIgnoreCaseAndTenantId(normalized, tenantId);
        if (res.isPresent())
            return res.get();

        return null;
    }

    /*
     * ===========================================================
     * REASSIGN TICKETS FROM REMOVED TEAM MEMBER
     * ===========================================================
     */
    public int reassignTicketsFromRemovedTeamMember(String oldEmployeeId, String teamName) {

        if (oldEmployeeId == null || teamName == null) {
            return 0;
        }

        // Find all tickets assigned to this employee for this team
        List<Ticket> ticketsToReassign = ticketRepository.findAll().stream()
                .filter(t -> oldEmployeeId.equals(t.getAssignedTo()))
                .filter(t -> teamName.equalsIgnoreCase(t.getTeamName()))
                .filter(t -> "IN_PROGRESS".equals(t.getStatus()) || "OPEN".equals(t.getStatus()))
                .toList();

        if (ticketsToReassign.isEmpty()) {
            return 0;
        }

        // Reassign each ticket back to the team pool
        for (Ticket t : ticketsToReassign) {
            String oldUser = t.getAssignedTo();

            t.setAssignedTo(null);
            t.setStatus("OPEN");

            ticketRepository.save(t);

            // Save history
            saveHistory(t, "TEAM_MEMBER_REMOVED", oldUser, null, teamName, teamName,
                    "Team member " + oldUser + " was removed from " + teamName);
        }

        // Notify remaining team members
        List<String> remainingTeamMembers = getTeamMemberIds(teamName);
        if (!remainingTeamMembers.isEmpty()) {
            String message = ticketsToReassign.size() + " ticket(s) have been returned to the team pool because "
                    + oldEmployeeId + " was removed from the team.";
            String subject = "Tickets Reassigned - Team Member Removed";
            sendInAppAndEmailToMany(remainingTeamMembers, subject, message);
        }

        return ticketsToReassign.size();
    }

    public void deleteTicket(Long ticketId) {
        ticketRepository.deleteById(ticketId);
    }

    // ===========================================================
    // ⭐ DRAFT METHODS
    // ===========================================================

    public Ticket saveChangeRequestDraft(
            String employeeId,
            String category,
            String subcategory,
            String issueSummary,
            String detailedDescription,
            Boolean ccToManager,
            MultipartFile attachment) {
        try {
            Ticket draft = new Ticket();
            draft.setEmployeeId(employeeId);
            draft.setCategory(category);
            draft.setSubcategory(subcategory);
            draft.setIssueSummary(issueSummary);
            draft.setDetailedDescription(detailedDescription);
            draft.setCcToManager(ccToManager);
            draft.setStatus("DRAFT");
            draft.setTicketType("CHANGE_REQUEST");

            return saveTicket(draft, attachment);
        } catch (RuntimeException e) {
            // Re-throw RuntimeException without wrapping
            throw e;
        } catch (Exception e) {
            // Wrap other exceptions but avoid duplication
            if (e.getMessage() != null && e.getMessage().startsWith("Failed to save change request draft:")) {
                throw new RuntimeException(e.getMessage(), e);
            } else {
                throw new RuntimeException("Failed to save change request draft: " + e.getMessage(), e);
            }
        }
    }

    public List<Ticket> getDraftsByEmployeeId(String employeeId) {
        return ticketRepository.findByEmployeeIdAndStatus(employeeId, "DRAFT").stream()
                .filter(t -> "NEW_TICKET".equals(t.getTicketType()) || t.getTicketType() == null)
                .toList();
    }

    public List<Ticket> getChangeRequestDraftsByEmployeeId(String employeeId) {
        return ticketRepository.findByEmployeeIdAndStatus(employeeId, "DRAFT").stream()
                .filter(t -> "CHANGE_REQUEST".equals(t.getTicketType()))
                .toList();
    }

    public void deleteDraft(Long draftId) {
        Optional<Ticket> draftOpt = ticketRepository.findById(draftId);
        if (draftOpt.isPresent()) {
            Ticket draft = draftOpt.get();
            if ("DRAFT".equals(draft.getStatus())) {
                ticketRepository.deleteById(draftId);
            } else {
                throw new RuntimeException("Ticket is not a draft");
            }
        } else {
            throw new RuntimeException("Draft not found");
        }
    }

    private void validateProjectAssignment(String employeeId) {
        if (employeeId == null)
            return;
        java.time.LocalDate today = java.time.LocalDate.now();
        List<Allocation> allocations = allocationRepository
                .findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        employeeId, today, today);

        if (allocations == null || allocations.isEmpty()) {
            throw new RuntimeException("You are not assigned to any project , please contact your manager or admin");
        }
    }

}
