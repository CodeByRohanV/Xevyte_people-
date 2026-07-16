package com.register.example.service;

import com.register.example.entity.*;
import com.register.example.repository.*;
import com.register.example.payload.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.persistence.criteria.Predicate;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final HolidayRepository holidayRepository;
    private final LeaveDraftRepository leaveDraftRepository;
    private final LeavestypePolicyRepository leavestypePolicyRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final LeaveAssignmentService leaveAssignmentService;
    private final LeaveEligibilityService eligibilityService;
    // private final LeaveApprovalWorkflowRepository workflowRepo;
    private final LeavePolicyMatcherService policyMatcher; // ✅ Added
    private final DailyEntryRepository dailyEntryRepository;
    private final PayrollManagementService payrollManagementService;

    @Autowired
    private AllocationRepository allocationRepository;

    @Autowired
    private com.register.example.service.DelegationService delegationService;

    @Autowired
    private DelegationRepository delegationRepository;

    @Autowired
    @Lazy
    private LeaveService self;

    // Formatter for dd-MM-yyyy
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    public LeaveService(LeaveRequestRepository leaveRequestRepository,
            EmployeeRepository employeeRepository,
            HolidayRepository holidayRepository,
            LeaveDraftRepository leaveDraftRepository,
            LeavestypePolicyRepository leavestypePolicyRepository,
            LeaveTypeRepository leaveTypeRepository,
            NotificationRepository notificationRepository,
            EmailService emailService,
            LeaveAssignmentService leaveAssignmentService,
            LeaveEligibilityService eligibilityService,
            // LeaveApprovalWorkflowRepository workflowRepo,
            LeavePolicyMatcherService policyMatcher,
            DailyEntryRepository dailyEntryRepository,
            PayrollManagementService payrollManagementService) { // ✅ Added

        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeRepository = employeeRepository;
        this.holidayRepository = holidayRepository;
        this.leaveDraftRepository = leaveDraftRepository;
        this.leavestypePolicyRepository = leavestypePolicyRepository;
        this.leaveTypeRepository = leaveTypeRepository;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
        this.leaveAssignmentService = leaveAssignmentService;
        this.eligibilityService = eligibilityService;
        // this.workflowRepo = workflowRepo;
        this.policyMatcher = policyMatcher; // ✅ Added
        this.dailyEntryRepository = dailyEntryRepository;
        this.payrollManagementService = payrollManagementService;
    }

    // ===== Apply Leave (Handles both with and without attachment, calculates total
    // days) =====

    public LeaveRequest applyLeave(LeaveRequestDTO dto, MultipartFile file) throws Exception {
        validateProjectAssignment(dto.getEmployeeId());

        Employee employee = employeeRepository.findByEmployeeId(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LocalDate start = dto.getStartDate();
        LocalDate end = dto.getEndDate();

        if (start == null || end == null) {
            throw new RuntimeException("Start date and End date are required.");
        }
        if (end.isBefore(start)) {
            throw new RuntimeException("End date cannot be before Start date.");
        }

        // Normalize leave type names
        String leaveType = dto.getType();
        String normalizedType = normalizeLeaveType(leaveType);

        // ✅ LOP RESTRICTION: Block LOP if Earned or Sick Leave balance exists
        if ("LOP".equalsIgnoreCase(normalizedType) || "LOSS OF PAY".equalsIgnoreCase(normalizedType)) {
            List<EmployeeLeaveBalanceDTO> balances = leaveAssignmentService
                    .getDetailedLeaveBalance(dto.getEmployeeId());

            List<String> availablePaidLeaves = balances.stream()
                    .filter(b -> {
                        String t = (b.getType() != null) ? b.getType().toUpperCase() : "";
                        // Check for Earned/Privilege and Sick/SL types
                        return (t.contains("EARNED") || t.contains("PRIVILEGE") || t.equals("EL") || t.equals("PL") ||
                                t.contains("SICK") || t.equals("SL"));
                    })
                    .filter(b -> b.getBalance() > 0)
                    .map(EmployeeLeaveBalanceDTO::getType)
                    .collect(Collectors.toList());

            if (!availablePaidLeaves.isEmpty()) {
                String types = String.join(", ", availablePaidLeaves);
                throw new RuntimeException("You cannot apply for Loss of Pay (LOP) while you still have " +
                        types + " balance available.");
            }
        }

        Double totalDays;

        totalDays = calculateLeaveDuration(dto.getEmployeeId(), start, end, normalizedType);

        // Adjust for half-day
        if (dto.getHalfDay() != null && dto.getHalfDay()) {
            if (start.equals(end)) {
                totalDays = 0.5;
            } else {
                throw new RuntimeException("Half-day leave can only be applied for a single day.");
            }
        }

        // Enforce document requirement and check eligibility
        Optional<LeavestypePolicy> policyOpt = leavestypePolicyRepository.findByName(normalizedType).stream()
                .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()) && Boolean.TRUE.equals(p.getActive()))
                .findFirst();
        if (policyOpt.isPresent()) {
            LeavestypePolicy policy = policyOpt.get();

            // ✅ CHECK 1: Active/Approved Status
            if (policy.getActive() == null || !policy.getActive() || !"APPROVED".equalsIgnoreCase(policy.getStatus())) {
                throw new RuntimeException("Leave type '" + normalizedType
                        + "' is currently not active or not approved. Please contact HR.");
            }

            // ✅ CHECK 2: Half Day Restriction
            if (dto.getHalfDay() != null && dto.getHalfDay()
                    && (policy.getHalfDayAllowed() == null || !policy.getHalfDayAllowed())) {
                throw new RuntimeException("Half-day leave is not allowed for " + normalizedType);
            }

            // ✅ CHECK 3: Eligibility Rules
            eligibilityService.checkEligibility(employee, policy.getId());

            // ✅ CHECK 3.5: Menstrual Leave Restriction - Only 1 per month and strictly 1 day
            if (normalizedType != null && normalizedType.toLowerCase().contains("menstrual")) {
                if (!start.equals(end)) {
                    throw new RuntimeException("Menstrual Leave can only be applied for exactly 1 day.");
                }
                LocalDate today = LocalDate.now();
                int currentMonth = today.getMonthValue();
                int currentYear = today.getYear();
                int requestMonth = start.getMonthValue();
                int requestYear = start.getYear();

                // ✅ Check if trying to apply for future month
                if (requestYear > currentYear || (requestYear == currentYear && requestMonth > currentMonth)) {
                    throw new RuntimeException("Menstrual Leave can only be applied for the current month. "
                            + "You cannot apply for future months. Current month: " + today.getMonth() + " "
                            + currentYear);
                }

                List<LeaveRequest> existingMenstrualLeaves = leaveRequestRepository.findByEmployeeIdAndType(
                        dto.getEmployeeId(),
                        normalizedType);

                boolean hasActiveLeaveThisMonth = existingMenstrualLeaves.stream()
                        .filter(leave -> {
                            String status = leave.getStatus();
                            // Only count APPROVED or PENDING leaves
                            return "APPROVED".equalsIgnoreCase(status) || "PENDING".equalsIgnoreCase(status)
                                    || status != null && status.toUpperCase().startsWith("PENDING");
                        })
                        .anyMatch(leave -> {
                            LocalDate leaveStart = leave.getStartDate();
                            return leaveStart != null
                                    && leaveStart.getMonthValue() == requestMonth
                                    && leaveStart.getYear() == requestYear;
                        });

                if (hasActiveLeaveThisMonth) {
                    throw new RuntimeException("You can only apply for 1 Menstrual Leave per month. "
                            + "You already have an active application for " + start.getMonth() + " " + requestYear
                            + ".");
                }
            }

            // ✅ CHECK 4: Document Requirement
            if (policy.getDocumentRequired() != null && policy.getDocumentRequired()) {
                int threshold = policy.getDocumentThreshold() != null ? policy.getDocumentThreshold() : 0;
                if (totalDays >= threshold && (file == null || file.isEmpty())) {
                    throw new RuntimeException("Document is required for " + normalizedType + " applied for "
                            + threshold + " or more days.");
                }
            }
        }

        if (totalDays <= 0) {
            throw new RuntimeException("Selected date range results in zero days.");
        }

        // ✅ VALIDATE BALANCE (Negative Rules)
        leaveAssignmentService.validateLeaveApplication(dto.getEmployeeId(), normalizedType, totalDays);

        LeaveRequest leave = new LeaveRequest();
        leave.setEmployeeId(dto.getEmployeeId());
        leave.setStartDate(start);
        leave.setEndDate(end);

        leave.setType(normalizedType);
        leave.setTotalDays(totalDays);
        if (dto.getHalfDay() != null) {
            leave.setHalfDay(dto.getHalfDay()); // Ensure LeaveRequest has halfDay field
        }
        // ✅ Store optional holiday name if provided and check for duplicates
        if (dto.getOptionalHolidayName() != null && !dto.getOptionalHolidayName().isEmpty()) {
            List<String> usedHolidays = getUsedOptionalHolidays(dto.getEmployeeId());
            if (usedHolidays.contains(dto.getOptionalHolidayName())) {
                throw new RuntimeException(
                        "You have already used or applied for the optional holiday: " + dto.getOptionalHolidayName());
            }
            leave.setOptionalHolidayName(dto.getOptionalHolidayName());
        }
        leave.setReason(dto.getReason());
        leave.setCreatedDate(LocalDateTime.now());

        // ⚠️ Check for Balance Usage Breakdown (Popup)
        try {
            String warnMsg = leaveAssignmentService.calculateSimulationWarning(dto.getEmployeeId(), normalizedType,
                    totalDays);
            if (warnMsg != null && !warnMsg.isEmpty()) {
                leave.setWarningMessage("Leave submitted using: " + warnMsg);
            }
        } catch (Exception e) {
            System.err.println("Failed to calculate warning: " + e.getMessage());
        }

        // Default to Manager approval as custom workflow levels are decommissioned
        leave.setStatus("Pending");
        leave.setCurrentLevel(0);
        leave.setPendingApprovers(delegationService.getEffectiveApprover(employee.getAssignedManagerId(), "Leaves"));
        leave.setAssignedHrId(delegationService.getEffectiveApprover(employee.getAssignedHrId(), "Leaves"));

        // =====================================================================

        if (file != null && !file.isEmpty()) {
            validateFile(file);
            leave.setAttachment(file.getBytes());
            leave.setFileName(file.getOriginalFilename());
            leave.setFileType(file.getContentType());
        }

        LeaveRequest savedLeave = leaveRequestRepository.save(leave);

        // Deduct leaves immediately if auto-approved
        if ("Approved".equals(savedLeave.getStatus())) {
            self.deductLeaves(savedLeave);
        }

        // =================== 🔔 Notification + Email Logic ===================
        String approversRaw = savedLeave.getPendingApprovers();
        if (approversRaw != null) {
            String[] approverIds = approversRaw.split(",");
            for (String approverId : approverIds) {
                Employee approver = employeeRepository.findByEmployeeId(approverId.trim()).orElse(null);
                if (approver != null) {
                    String employeeFullName = employee.getFirstName() + " " + employee.getLastName();
                    String msg = "New leave request submitted by " + employeeFullName +
                            " (" + employee.getEmployeeId() + ") from " + start.format(dateFormatter) +
                            " to " + end.format(dateFormatter) + " (" + totalDays + " days). Level: "
                            + savedLeave.getCurrentLevel();

                    sendNotification(approverId.trim(), msg);
                    emailService.sendEmail(approver.getEmail(), "New Leave Request Action Required", msg);
                }
            }
        } else if (savedLeave.getIsAutoApproved()) {
            // Auto-approved case: Notify employee
            String msg = "Your leave request for " + normalizedType + " from " + start.format(dateFormatter) +
                    " to " + end.format(dateFormatter) + " has been AUTO-APPROVED.";
            sendNotification(employee.getEmployeeId(), msg);
            emailService.sendEmail(employee.getEmail(), "Leave Auto-Approved", msg);
        }

        return savedLeave;
    }

    // // =================== Helper for Working Days ===================
    // private int calculateWorkingDays(LocalDate start, LocalDate end) {
    // Set<LocalDate> holidays = holidayRepository.findAll().stream()
    // .map(Holiday::getDate)
    // .collect(Collectors.toSet());
    //
    // int workingDays = 0;
    // for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
    // if (date.getDayOfWeek() != DayOfWeek.SATURDAY &&
    // date.getDayOfWeek() != DayOfWeek.SUNDAY &&
    // !holidays.contains(date)) {
    // workingDays++;
    // }
    // }
    // return workingDays;
    // }

    private void validateFile(MultipartFile file) {
        String contentType = file.getContentType();
        long maxSize = 5 * 1024 * 1024; // 5MB

        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds 5MB limit.");
        }

        if (contentType == null) {
            throw new RuntimeException("File type could not be detected.");
        }

        contentType = contentType.toLowerCase();

        Set<String> allowedTypes = Set.of(
                "application/pdf",
                "image/png",
                "image/x-png",
                "image/jpg",
                "image/jpeg",
                "image/pjpeg");

        if (!allowedTypes.contains(contentType)) {
            throw new RuntimeException("Invalid file type. Only PDF, PNG, JPG, JPEG allowed.");
        }
    }

    // =================== 🔔 Notification Helpers ===================
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

    private void sendNotification(String employeeId, String message) {
        if (employeeId == null || employeeId.isEmpty())
            return;
        
        // 1. Notify primary
        saveNotificationRecord(employeeId, message);

        // 2. Notify delegate if active
        try {
            String delegateId = delegationService.getActiveDelegateId(employeeId, "Leaves");
            if (delegateId != null) {
                saveNotificationRecord(delegateId, "[Delegated] " + message);
            }
        } catch (Exception e) {
            System.err.println("Error notifying delegate in LeaveService: " + e.getMessage());
        }
    }

    private void saveNotificationRecord(String employeeId, String message) {
        Notification n = new Notification();
        n.setEmployeeId(employeeId);
        n.setMessage(message);
        n.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        n.setRead(false);
        notificationRepository.save(n);
    }

    @Transactional
    public LeaveRequest takeAction(LeaveActionDTO dto) {
        LeaveRequest leave = leaveRequestRepository.findById(dto.getLeaveRequestId())
                .orElseThrow(() -> new RuntimeException("Leave Request not found"));

        Employee employee = employeeRepository.findByEmployeeId(leave.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        String pendingRaw = leave.getPendingApprovers();
        boolean isAuthorized = false;
        if (pendingRaw != null) {
            List<String> allowedIds = Arrays.asList(pendingRaw.split(","));
            isAuthorized = allowedIds.contains(dto.getApproverId());
        }

        // Fallback for requests without workflow (legacy)
        if (!isAuthorized && leave.getCurrentLevel() == 0 && "Pending".equalsIgnoreCase(leave.getStatus())) {
            String managerId = employee.getAssignedManagerId();
            if (managerId != null && managerId.equals(dto.getApproverId())) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            // HR Settlement Authorization: If already approved, check if searcher is the
            // assigned HR
            if ("Approved".equalsIgnoreCase(leave.getStatus())) {
                String hrId = employee.getAssignedHrId();
                if (hrId != null && hrId.equals(dto.getApproverId())) {
                    isAuthorized = true;
                }
            }
        }

        if (!isAuthorized) {
            throw new RuntimeException("You are not authorized to take action on this request at the current level.");
        }

        Employee actioner = employeeRepository.findByEmployeeId(dto.getApproverId()).orElse(null);
        String baseName = (actioner != null) ? actioner.getFirstName() + " " + actioner.getLastName() : "Approver";
        
        // Determine delegation attribution for storage
        String storageName = baseName;
        if (employee != null && actioner != null) {
            String defaultMgrId = employee.getAssignedManagerId();
            String defaultHrId = employee.getAssignedHrId();
            
            String actingForId = null;
            if (dto.getApproverId().equals(defaultMgrId)) actingForId = null; // No delegation
            else if (dto.getApproverId().equals(defaultHrId)) actingForId = null; // No delegation
            else {
                // If it's not the default manager or HR, it might be a delegate
                // For Leaves, we usually assume they act for the Manager unless they are HR
                actingForId = defaultMgrId; 
            }
            
            if (actingForId != null && !dto.getApproverId().equals(actingForId)) {
                Employee orig = employeeRepository.findByEmployeeId(actingForId).orElse(null);
                if (orig != null) {
                    storageName = baseName + " (" + dto.getApproverId() + ") (on behalf of " + orig.getFirstName() + " " + orig.getLastName() + " (" + actingForId + "))";
                }
            } else {
                storageName = baseName + " (" + dto.getApproverId() + ")";
            }
        }
        leave.setApproverName(storageName);
        leave.setAssignedApproverId(dto.getApproverId()); // ✅ Store the actual actioner's ID
        final String actionerName = storageName;

        if ("REJECT".equalsIgnoreCase(dto.getAction())) {
            leave.setStatus("Rejected");
            leave.setRejectionReason(dto.getRemarks());
            leave.setPendingApprovers(null);

            String msg = "Your leave request for " + leave.getType() + " was REJECTED by " + actionerName + ". Reason: "
                    + dto.getRemarks();
            sendNotification(leave.getEmployeeId(), msg);
            emailService.sendEmail(employee.getEmail(), "Leave Request Rejected", msg);
            return leaveRequestRepository.save(leave);
        }

        if ("APPROVE".equalsIgnoreCase(dto.getAction())) {
            // HR Settlement Case
            if ("Approved".equalsIgnoreCase(leave.getStatus())) {
                leave.setStatus("Settled");
                // No double deduction! Finalize the state.
                String msg = "Your leave request for " + leave.getType() + " has been finalized and SETTLED by HR "
                        + actionerName + ".";
                sendNotification(leave.getEmployeeId(), msg);
                return leaveRequestRepository.save(leave);
            }

            // Normal workflow progression
            Optional<LeavestypePolicy> policyOpt = leavestypePolicyRepository.findByName(leave.getType()).stream()
                    .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()) && Boolean.TRUE.equals(p.getActive()))
                    .findFirst();
            // Default to Fully Approved as custom workflow levels are decommissioned
            finalizeApproval(leave, employee, actionerName);

        }

        return leaveRequestRepository.save(leave);
    }

    private void finalizeApproval(LeaveRequest leave, Employee employee, String lastApproverName) {
        System.out.println(
                "🟢 finalizeApproval called for leave ID: " + leave.getId() + ", employeeId: " + leave.getEmployeeId());

        leave.setStatus("Approved");
        leave.setPendingApprovers(null);
        leave.setRejectionReason(null);

        System.out.println("🟢 Calling deductLeaves for: " + leave.getType() + ", " + leave.getTotalDays() + " days");
        self.deductLeaves(leave);

        String msg = "Your leave request for " + leave.getType() + " from " +
                leave.getStartDate().format(dateFormatter) + " to " +
                leave.getEndDate().format(dateFormatter) + " has been FULLY APPROVED.";
        sendNotification(leave.getEmployeeId(), msg);
        emailService.sendEmail(employee.getEmail(), "Leave Request Approved", msg);

        // Also notify HR if applicable
        String hrId = employee.getAssignedHrId();
        if (hrId != null) {
            String hrMsg = "Leave request of " + employee.getFirstName() + " " + employee.getLastName()
                    + " has been fully approved.";
            sendNotification(hrId, hrMsg);
        }

        System.out.println("✅ finalizeApproval completed");

        // ✅ Update DailyEntry for leave dates
        updateDailyEntriesForLeave(leave);
    }

    private void updateDailyEntriesForLeave(LeaveRequest leave) {
        LocalDate start = leave.getStartDate();
        LocalDate end = leave.getEndDate();
        String employeeId = leave.getEmployeeId();

        // Fetch policy to check for Sandwich Rule
        Optional<LeavestypePolicy> policyOpt = leavestypePolicyRepository.findByName(leave.getType()).stream()
                .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()))
                .findFirst();
        boolean applySandwich = policyOpt.map(LeavestypePolicy::getSandwichRule).orElse(false);

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            Optional<DailyEntry> entryOpt = dailyEntryRepository.findByEmployeeIdAndDate(employeeId, date);
            if (entryOpt.isPresent()) {
                DailyEntry entry = entryOpt.get();
                entry.setTotalHours(0.0);

                DayOfWeek dow = date.getDayOfWeek();
                boolean isWeekend = (dow.equals(DayOfWeek.SATURDAY) || dow.equals(DayOfWeek.SUNDAY));

                // If NO sandwich rule and it IS a weekend -> Show 'Weekend'
                if (!applySandwich && isWeekend) {
                    entry.setRemarks("Weekend");
                } else {
                    // Otherwise (Sandwich rule applies OR it's a weekday) -> Show Leave Type
                    entry.setRemarks(leave.getType());
                }

                entry.setClientName("");
                entry.setProjectName("");
                entry.setLoginTime("");
                entry.setLogoutTime("");
                entry.setClientId(null);
                entry.setProjectId(null);
                entry.setFrozen(true); // ✅ Mark as frozen because approved leave is final
                dailyEntryRepository.save(entry);
            } else {
                // ✅ If entry missing, CREATE a new one so Payroll picks it up
                DailyEntry entry = new DailyEntry();
                entry.setEmployeeId(employeeId);
                entry.setDate(date);
                entry.setTotalHours(0.0);

                DayOfWeek dow = date.getDayOfWeek();
                boolean isWeekend = (dow.equals(DayOfWeek.SATURDAY) || dow.equals(DayOfWeek.SUNDAY));

                if (!applySandwich && isWeekend) {
                    entry.setRemarks("Weekend");
                } else {
                    entry.setRemarks(leave.getType());
                }

                entry.setFrozen(true); // ✅ Mark as frozen because approved leave is final
                dailyEntryRepository.save(entry);
            }
        }
        // ✅ Trigger payroll update for all months in the leave range
        LocalDate monthIter = start.withDayOfMonth(1);
        while (!monthIter.isAfter(end)) {
            payrollManagementService.calculateAndSavePayroll(employeeId, monthIter);
            monthIter = monthIter.plusMonths(1);
        }
    }

    @Transactional
    public void deductLeaves(LeaveRequest leaveRequest) {
        System.out.println("🟢 deductLeaves wrapper called: leaveId=" + leaveRequest.getId() + ", type="
                + leaveRequest.getType() + ", days=" + leaveRequest.getTotalDays());
        leaveAssignmentService.deductLeaves(leaveRequest.getEmployeeId(), leaveRequest.getType(),
                leaveRequest.getTotalDays());
        System.out.println("✅ deductLeaves wrapper completed");
    }

    public Map<String, Double> getLeaveBalance(String employeeId) {
        return leaveAssignmentService.getLeaveBalance(employeeId);
    }

    public List<LeaveRequest> getEmployeeLeaves(String employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId);
    }

    public List<LeaveRequest> getManagerLeaves(String managerId) {
        Set<LeaveRequest> allLeaves = new HashSet<>(leaveRequestRepository.findByPendingApproversContaining(managerId));
        
        // Add delegated leaves
        List<Delegation> activeDels = delegationService.getActiveDelegationsForDelegate(managerId, "Leaves");
        activeDels.addAll(delegationService.getActiveDelegationsForDelegate(managerId, "All"));
        
        for (Delegation d : activeDels) {
            String delegatorId = d.getDelegatorId();
            if (!delegatorId.equals(managerId)) {
                allLeaves.addAll(leaveRequestRepository.findByPendingApproversContaining(delegatorId));
            }
        }
        
        return allLeaves.stream()
                .filter(l -> l.getStatus() != null && (l.getStatus().equalsIgnoreCase("Pending")
                        || l.getStatus().toLowerCase().startsWith("pending level")))
                .collect(Collectors.toList());
    }

    public List<LeaveRequest> getHrLeaves(String hrId) {
        Set<LeaveRequest> allLeaves = new HashSet<>(leaveRequestRepository.findByAssignedHrIdAndStatus(hrId, "Approved"));
        
        // Add delegated leaves
        List<Delegation> activeDels = delegationService.getActiveDelegationsForDelegate(hrId, "Leaves");
        activeDels.addAll(delegationService.getActiveDelegationsForDelegate(hrId, "All"));
        
        for (Delegation d : activeDels) {
            String delegatorId = d.getDelegatorId();
            if (!delegatorId.equals(hrId)) {
                allLeaves.addAll(leaveRequestRepository.findByAssignedHrIdAndStatus(delegatorId, "Approved"));
            }
        }
        
        return new ArrayList<>(allLeaves);
    }

    public Resource getLeaveDocument(Long leaveRequestId) throws IOException {
        LeaveRequest leave = leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        byte[] fileData = leave.getAttachment();
        if (fileData == null || fileData.length == 0) {
            return null;
        }

        String fileName = leave.getFileName();
        if (fileName == null || fileName.trim().isEmpty()) {
            fileName = "leave_document_" + leaveRequestId;
        }

        String finalFileName = fileName;
        return new ByteArrayResource(fileData) {
            @Override
            public String getFilename() {
                return finalFileName;
            }
        };
    }

    public Map<LocalDate, String> getApprovedLeaveDates(String employeeId) {
        List<LeaveRequest> approvedLeaves = leaveRequestRepository.findByEmployeeIdAndStatus(employeeId, "Approved");
        Map<LocalDate, String> approvedDates = new HashMap<>();

        for (LeaveRequest leave : approvedLeaves) {
            LocalDate s = leave.getStartDate();
            LocalDate e = leave.getEndDate();
            if (s == null || e == null)
                continue;

            // Check Policy for Sandwich Logic
            Optional<LeavestypePolicy> policyOpt = leavestypePolicyRepository.findByName(leave.getType()).stream()
                    .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()))
                    .findFirst();
            boolean applySandwich = policyOpt.map(LeavestypePolicy::getSandwichRule).orElse(false);

            long days = ChronoUnit.DAYS.between(s, e) + 1;
            for (int i = 0; i < days; i++) {
                LocalDate date = s.plusDays(i);

                boolean isWeekend = (date.getDayOfWeek().equals(DayOfWeek.SATURDAY)
                        || date.getDayOfWeek().equals(DayOfWeek.SUNDAY));

                // If NO sandwich rule and it IS a weekend -> do NOT mark as leave
                if (!applySandwich && isWeekend) {
                    continue;
                }

                approvedDates.put(date, leave.getType());
            }
        }
        return approvedDates;
    }

    @Transactional
    public LeaveRequest submitDraftWithDto(Long draftId, LeaveRequestDTO dto, MultipartFile document) throws Exception {
        LeaveDraft draft = leaveDraftRepository.findById(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found with ID: " + draftId));

        validateProjectAssignment(draft.getEmployeeId());

        Employee employee = employeeRepository.findByEmployeeId(draft.getEmployeeId()).orElse(null);

        LeaveRequest leaveRequest = new LeaveRequest();

        // Update fields: prefer DTO values if present, else draft values
        leaveRequest.setEmployeeId(draft.getEmployeeId());
        LocalDate startDate = dto.getStartDate() != null ? dto.getStartDate() : draft.getStartDate();
        LocalDate endDate = dto.getEndDate() != null ? dto.getEndDate() : draft.getEndDate();
        String type = dto.getType() != null ? dto.getType() : draft.getType();

        // Normalize type for calculation logic
        String normalizedType = normalizeLeaveType(type);

        leaveRequest.setStartDate(startDate);

        // ✅ LOP RESTRICTION FOR DRAFTS
        if ("LOP".equalsIgnoreCase(normalizedType) || "LOSS OF PAY".equalsIgnoreCase(normalizedType)) {
            List<EmployeeLeaveBalanceDTO> balances = leaveAssignmentService
                    .getDetailedLeaveBalance(draft.getEmployeeId());

            List<String> availablePaidLeaves = balances.stream()
                    .filter(b -> {
                        String t = (b.getType() != null) ? b.getType().toUpperCase() : "";
                        return (t.contains("EARNED") || t.contains("PRIVILEGE") || t.equals("EL") || t.equals("PL") ||
                                t.contains("SICK") || t.equals("SL"));
                    })
                    .filter(b -> b.getBalance() > 0)
                    .map(EmployeeLeaveBalanceDTO::getType)
                    .collect(Collectors.toList());

            if (!availablePaidLeaves.isEmpty()) {
                String types = String.join(", ", availablePaidLeaves);
                throw new RuntimeException("You cannot apply for Loss of Pay (LOP) while you still have " +
                        types + " balance available.");
            }
        }
        leaveRequest.setEndDate(endDate);
        leaveRequest.setType(normalizedType);
        leaveRequest.setReason(dto.getReason() != null ? dto.getReason() : draft.getReason());

        leaveRequest.setCreatedDate(LocalDateTime.now());
        leaveRequest.setStatus("Pending");
        leaveRequest.setCurrentLevel(0);

        // --- STICKY DELEGATION ---
        // Snapshot the approvers
        if (employee != null) {
            leaveRequest.setPendingApprovers(delegationService.getEffectiveApprover(employee.getAssignedManagerId(), "Leaves"));
            leaveRequest.setAssignedHrId(delegationService.getEffectiveApprover(employee.getAssignedHrId(), "Leaves"));
        }

        // ✅ Store optional holiday name if provided and check for duplicates
        if (dto.getOptionalHolidayName() != null && !dto.getOptionalHolidayName().isEmpty()) {
            List<String> usedHolidays = getUsedOptionalHolidays(draft.getEmployeeId());
            if (usedHolidays.contains(dto.getOptionalHolidayName())) {
                throw new RuntimeException(
                        "You have already used or applied for the optional holiday: " + dto.getOptionalHolidayName());
            }
            leaveRequest.setOptionalHolidayName(dto.getOptionalHolidayName());
        }

        Double totalDays;

        // 🎯 MODIFICATION START 🎯
        totalDays = calculateLeaveDuration(draft.getEmployeeId(), startDate, endDate, normalizedType);
        // 🎯 MODIFICATION END 🎯

        // ✅ Enforce policy validations for drafts
        Optional<LeavestypePolicy> policyOpt = leavestypePolicyRepository.findByName(normalizedType).stream()
                .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()) && Boolean.TRUE.equals(p.getActive()))
                .findFirst();
        if (policyOpt.isPresent()) {
            LeavestypePolicy policy = policyOpt.get();

            if (policy.getActive() == null || !policy.getActive() || !"APPROVED".equalsIgnoreCase(policy.getStatus())) {
                throw new RuntimeException("Leave type '" + normalizedType + "' is currently not active or not approved. Please contact HR.");
            }

            if (dto.getHalfDay() != null && dto.getHalfDay() && (policy.getHalfDayAllowed() == null || !policy.getHalfDayAllowed())) {
                throw new RuntimeException("Half-day leave is not allowed for " + normalizedType);
            }

            if (employee != null) {
                eligibilityService.checkEligibility(employee, policy.getId());
            }

            if (normalizedType != null && normalizedType.toLowerCase().contains("menstrual")) {
                if (!startDate.equals(endDate)) {
                    throw new RuntimeException("Menstrual Leave can only be applied for exactly 1 day.");
                }

                LocalDate today = LocalDate.now();
                int currentMonth = today.getMonthValue();
                int currentYear = today.getYear();
                int requestMonth = startDate.getMonthValue();
                int requestYear = startDate.getYear();

                if (requestYear > currentYear || (requestYear == currentYear && requestMonth > currentMonth)) {
                    throw new RuntimeException("Menstrual Leave can only be applied for the current month. You cannot apply for future months.");
                }

                List<LeaveRequest> existingMenstrualLeaves = leaveRequestRepository.findByEmployeeIdAndType(draft.getEmployeeId(), normalizedType);
                boolean hasActiveLeaveThisMonth = existingMenstrualLeaves.stream()
                        .filter(leave -> {
                            String status = leave.getStatus();
                            return "APPROVED".equalsIgnoreCase(status) || "PENDING".equalsIgnoreCase(status) || (status != null && status.toUpperCase().startsWith("PENDING"));
                        })
                        .anyMatch(leave -> {
                            LocalDate leaveStart = leave.getStartDate();
                            return leaveStart != null && leaveStart.getMonthValue() == requestMonth && leaveStart.getYear() == requestYear;
                        });

                if (hasActiveLeaveThisMonth) {
                    throw new RuntimeException("You can only apply for 1 Menstrual Leave per month.");
                }
            }

            if (policy.getDocumentRequired() != null && policy.getDocumentRequired()) {
                int threshold = policy.getDocumentThreshold() != null ? policy.getDocumentThreshold() : 0;
                if (totalDays >= threshold && (document == null || document.isEmpty()) && (dto.getExistingFileName() == null || dto.getExistingFileName().isEmpty()) && (draft.getFileName() == null || draft.getFileName().isEmpty())) {
                    throw new RuntimeException("Document is required for " + normalizedType + " applied for " + threshold + " or more days.");
                }
            }
        }

        if (totalDays <= 0) {
            throw new RuntimeException("Selected date range results in zero days.");
        }

        leaveRequest.setTotalDays(totalDays);

        // ✅ VALIDATE BALANCE
        leaveAssignmentService.validateLeaveApplication(draft.getEmployeeId(), normalizedType, totalDays);

        // File logic: new file uploaded takes priority
        if (document != null && !document.isEmpty()) {
            validateFile(document);
            leaveRequest.setAttachment(document.getBytes());
            leaveRequest.setFileName(document.getOriginalFilename());
            leaveRequest.setFileType(document.getContentType());
        } else if (dto.getExistingFileName() != null && dto.getExistingFileName().equals(draft.getFileName())) {
            // Use existing file from draft if requested and matches
            leaveRequest.setAttachment(draft.getDocument());
            leaveRequest.setFileName(draft.getFileName());
            leaveRequest.setFileType(draft.getFileType());
        } else {
            // No file
            leaveRequest.setAttachment(null);
            leaveRequest.setFileName(null);
            leaveRequest.setFileType(null);
        }

        LeaveRequest submittedLeave = leaveRequestRepository.save(leaveRequest);
        leaveDraftRepository.delete(draft);

        // Deduct leaves immediately if auto-approved
        if ("Approved".equals(submittedLeave.getStatus())) {
            self.deductLeaves(submittedLeave);
        }

        // =================== 🔔 Notification + Email Logic ===================
        String approversRaw = submittedLeave.getPendingApprovers();
        if (approversRaw != null) {
            String[] approverIds = approversRaw.split(",");
            for (String approverId : approverIds) {
                Employee approver = employeeRepository.findByEmployeeId(approverId.trim()).orElse(null);
                if (approver != null) {
                    String employeeFullName = employee != null ? employee.getFirstName() + " " + employee.getLastName() : "Employee";
                    String msg = "New leave request submitted by " + employeeFullName +
                            " (" + draft.getEmployeeId() + ") from " + startDate.format(dateFormatter) +
                            " to " + endDate.format(dateFormatter) + " (" + totalDays + " days).";

                    sendNotification(approverId.trim(), msg);
                    emailService.sendEmail(approver.getEmail(), "New Leave Request Action Required", msg);
                }
            }
        }

        return submittedLeave;
    }

    @Transactional
    public void cancelLeave(Long id) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found with ID: " + id));

        if ("Cancelled".equalsIgnoreCase(leave.getStatus())) {
            throw new RuntimeException("Leave request is already cancelled.");
        }

        // Fetch employee to get manager ID and name details
        Employee employee = employeeRepository.findByEmployeeId(leave.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        String oldStatus = leave.getStatus();

        // 🟢 NEW LOGIC: If the leave was already Approved or Settled, we must refund
        // the days
        if ("Approved".equalsIgnoreCase(oldStatus) || "Settled".equalsIgnoreCase(oldStatus)) {
            System.out.println("🔄 Restoring " + leave.getTotalDays() + " days for " + leave.getType());
            leaveAssignmentService.restoreLeaves(
                    leave.getEmployeeId(),
                    leave.getType(),
                    leave.getTotalDays());

            // 🟢 Reset DailyEntries and update Payroll
            resetDailyEntriesAfterCancellation(leave);
        }

        leave.setStatus("Cancelled");
        leave.setPendingApprovers(null);
        leave.setCurrentLevel(0);
        leave.setUpdatedAt(LocalDateTime.now());
        leaveRequestRepository.save(leave);

        // =========================
        // NOTIFY MANAGER OF CANCELLATION
        // =========================
        String managerId = employee.getAssignedManagerId();
        if (managerId != null && !managerId.isEmpty()) {
            String employeeFullName = employee.getFirstName() + " " + employee.getLastName();
            String message = "Leave request of " + employeeFullName + " (" + employee.getEmployeeId() + ") for " +
                    leave.getType() + " from " + leave.getStartDate().format(dateFormatter) +
                    " to " + leave.getEndDate().format(dateFormatter) + " (" + leave.getTotalDays()
                    + " days) has been CANCELLED.";

            // Send In-App Notification
            sendNotification(managerId, message);

            // Send Email Notification
            employeeRepository.findByEmployeeId(managerId).ifPresent(mgr -> {
                if (mgr.getEmail() != null && !mgr.getEmail().trim().isEmpty()) {
                    emailService.sendEmail(mgr.getEmail(), "Leave Request Cancelled", message);
                }
            });
        }
    }

    private void resetDailyEntriesAfterCancellation(LeaveRequest leave) {
        LocalDate start = leave.getStartDate();
        LocalDate end = leave.getEndDate();
        String employeeId = leave.getEmployeeId();

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            Optional<DailyEntry> entryOpt = dailyEntryRepository.findByEmployeeIdAndDate(employeeId, date);
            if (entryOpt.isPresent()) {
                DailyEntry entry = entryOpt.get();
                // If the remarks matched the leave type (or was Weekend), reset it
                if (leave.getType().equalsIgnoreCase(entry.getRemarks())
                        || "Weekend".equalsIgnoreCase(entry.getRemarks())) {
                    entry.setRemarks(""); // Or logic to restore "Weekend" if it was original
                    // Actually, if it's a weekend, we might want to keep it as "Weekend" if not
                    // sandwich
                    DayOfWeek dow = date.getDayOfWeek();
                    if (dow.equals(DayOfWeek.SATURDAY) || dow.equals(DayOfWeek.SUNDAY)) {
                        entry.setRemarks("Weekend");
                    }
                    dailyEntryRepository.save(entry);
                }
            }
        }

        // Recalculate payroll for all months in range
        LocalDate monthIter = start.withDayOfMonth(1);
        while (!monthIter.isAfter(end)) {
            payrollManagementService.calculateAndSavePayroll(employeeId, monthIter);
            monthIter = monthIter.plusMonths(1);
        }
    }

    // @Transactional
    // public void cancelLeave(Long id) {
    // LeaveRequest leave = leaveRequestRepository.findById(id)
    // .orElseThrow(() -> new RuntimeException("Leave request not found with ID: " +
    // id));
    //
    // if ("Cancelled".equalsIgnoreCase(leave.getStatus())) {
    // throw new RuntimeException("Leave request is already cancelled.");
    // }
    //
    // leave.setStatus("Cancelled");
    // leaveRequestRepository.save(leave);
    // }

    // public LeaveDraft saveDraft(LeaveDraft leaveDraft) {
    // return leaveDraftRepository.save(leaveDraft);
    // }

    public LeaveDraft saveDraft(LeaveDraft leaveDraft) {
        String leaveType = leaveDraft.getType();
        String normalizedType = normalizeLeaveType(leaveType);

        leaveDraft.setType(normalizedType);

        if (leaveDraft.getStartDate() != null && leaveDraft.getEndDate() != null) {
            Double totalDays; // ✅ Now a Double
            if ("Maternity Leave".equals(normalizedType) || "Paternity Leave".equals(normalizedType)) {
                // Calculate calendar days
                totalDays = (double) (ChronoUnit.DAYS.between(leaveDraft.getStartDate(), leaveDraft.getEndDate()) + 1);
            } else {
                totalDays = calculateLeaveDuration(leaveDraft.getEmployeeId(), leaveDraft.getStartDate(),
                        leaveDraft.getEndDate(),
                        normalizedType);
            }
            // Calls setTotalDays(Double)
            leaveDraft.setTotalDays(totalDays);
        }

        return leaveDraftRepository.save(leaveDraft);
    }

    public List<LeaveDraft> getDraftByEmployeeId(String employeeId) {
        return leaveDraftRepository.findByEmployeeId(employeeId);
    }

    public void deleteDraft(Long id) {
        leaveDraftRepository.deleteById(id);
    }

    private double calculateLeaveDuration(String employeeId, LocalDate start, LocalDate end, String normalizedType) {
        if (start == null || end == null) {
            throw new RuntimeException("Start date and End date are required.");
        }
        if (end.isBefore(start)) {
            throw new RuntimeException("End date cannot be before Start date.");
        }

        if ("Maternity Leave".equals(normalizedType) || "Paternity Leave".equals(normalizedType)) {
            double days = (double) (ChronoUnit.DAYS.between(start, end) + 1);
            Optional<LeavestypePolicy> policyOpt = leavestypePolicyRepository.findByName(normalizedType).stream()
                    .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()))
                    .findFirst();
            if (policyOpt.isPresent()) {
                return roundLeave(days, policyOpt.get().getRoundingRule());
            }
            return days;
        }

        // Fetch employee to check location
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Optional<LeavestypePolicy> policyOpt = leavestypePolicyRepository.findByNameAndStatus(normalizedType,
                "APPROVED");

        boolean applySandwich = policyOpt.map(LeavestypePolicy::getSandwichRule).orElse(false);
        String roundingRule = policyOpt.map(LeavestypePolicy::getRoundingRule).orElse("NONE");

        List<Holiday> holidays = holidayRepository.findByDateBetween(start, end);
        Set<LocalDate> mandatoryHolidayDates = holidays.stream()
                // ✅ Filter by Employee Location
                .filter(h -> h.getLocation() != null && h.getLocation().equalsIgnoreCase(employee.getWorkLocation()))
                .filter(h -> h.getHoliday() == null || !h.getHoliday().toLowerCase().contains("(optional)"))
                .map(Holiday::getDate)
                .collect(Collectors.toSet());

        // Get occupied dates (Approved or Pending leaves)
        Set<LocalDate> occupiedDates = getOccupiedDates(employeeId);

        double count = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            // Exclude occupied dates ALWAYS
            if (occupiedDates.contains(d)) {
                continue;
            }

            // Exclude holidays ALWAYS
            if (mandatoryHolidayDates.contains(d)) {
                continue;
            }

            if (applySandwich) {
                count++;
            } else {
                DayOfWeek dow = d.getDayOfWeek();
                if (dow.equals(DayOfWeek.SATURDAY) || dow.equals(DayOfWeek.SUNDAY))
                    continue;
                count++;
            }
        }

        if (count == 0) {
            return 0.0;
        }

        return roundLeave(count, roundingRule);
    }

    private Set<LocalDate> getOccupiedDates(String employeeId) {
        if (employeeId == null)
            return Collections.emptySet();
        List<LeaveRequest> leaves = leaveRequestRepository.findByEmployeeId(employeeId);
        return leaves.stream()
                .filter(l -> {
                    String s = (l.getStatus() != null) ? l.getStatus().toUpperCase() : "";
                    return s.startsWith("PENDING") || s.equals("APPROVED");
                })
                .flatMap(l -> {
                    List<LocalDate> dates = new ArrayList<>();
                    LocalDate s = l.getStartDate();
                    LocalDate e = l.getEndDate();
                    if (s != null && e != null) {
                        for (LocalDate d = s; !d.isAfter(e); d = d.plusDays(1)) {
                            dates.add(d);
                        }
                    }
                    return dates.stream();
                })
                .collect(Collectors.toSet());
    }

    private double roundLeave(double value, String rule) {
        return com.register.example.util.LeaveRoundingUtil.applyRoundingRule(value, rule);
    }

    @Transactional
    public LeaveRequest submitDraft(Long draftId, LeaveRequestDTO dto) throws Exception {
        LeaveDraft draft = leaveDraftRepository.findById(draftId)
                .orElseThrow(() -> new IllegalArgumentException("Draft not found with ID: " + draftId));

        LeaveRequest leaveRequest = new LeaveRequest();

        leaveRequest.setEmployeeId(draft.getEmployeeId());
        Employee employee = employeeRepository.findByEmployeeId(draft.getEmployeeId())
                .orElseThrow(
                        () -> new IllegalArgumentException("Employee not found with ID: " + draft.getEmployeeId()));
        leaveRequest.setEmployeeName(employee.getFirstName() + " " + employee.getLastName());

        LocalDate startDate = dto.getStartDate() != null ? dto.getStartDate() : draft.getStartDate();
        LocalDate endDate = dto.getEndDate() != null ? dto.getEndDate() : draft.getEndDate();
        String type = dto.getType() != null ? dto.getType() : draft.getType();

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and End date must be provided.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date.");
        }

        // Normalize type for calculation logic
        String normalizedType = normalizeLeaveType(type);

        leaveRequest.setStartDate(startDate);
        leaveRequest.setEndDate(endDate);
        leaveRequest.setType(normalizedType);
        leaveRequest.setReason(dto.getReason() != null ? dto.getReason() : draft.getReason());

        leaveRequest.setCreatedDate(LocalDateTime.now());

        // Default to Manager approval as custom workflow levels are decommissioned
        leaveRequest.setStatus("Pending");
        leaveRequest.setCurrentLevel(0);
        leaveRequest.setPendingApprovers(delegationService.getEffectiveApprover(employee.getAssignedManagerId(), "Leaves"));
        leaveRequest.setAssignedHrId(delegationService.getEffectiveApprover(employee.getAssignedHrId(), "Leaves"));

        // =====================================================================

        // ✅ Store optional holiday name if provided and check for duplicates
        if (dto.getOptionalHolidayName() != null && !dto.getOptionalHolidayName().isEmpty()) {
            List<String> usedHolidays = getUsedOptionalHolidays(draft.getEmployeeId());
            if (usedHolidays.contains(dto.getOptionalHolidayName())) {
                throw new RuntimeException(
                        "You have already used or applied for the optional holiday: " + dto.getOptionalHolidayName());
            }
            leaveRequest.setOptionalHolidayName(dto.getOptionalHolidayName());
        }

        Double totalDays;

        // 🎯 MODIFICATION START 🎯
        totalDays = calculateLeaveDuration(draft.getEmployeeId(), startDate, endDate, normalizedType);
        // 🎯 MODIFICATION END 🎯

        leaveRequest.setTotalDays(totalDays);

        // ✅ VALIDATE BALANCE
        leaveAssignmentService.validateLeaveApplication(draft.getEmployeeId(), normalizedType, totalDays);

        if (dto.getExistingFileName() != null
                && dto.getExistingFileName().equals(draft.getFileName())
                && draft.getDocument() != null) {
            leaveRequest.setAttachment(draft.getDocument());
            leaveRequest.setFileName(draft.getFileName());
            leaveRequest.setFileType(draft.getFileType());
        } else {
            leaveRequest.setAttachment(null);
            leaveRequest.setFileName(null);
            leaveRequest.setFileType(null);
        }

        LeaveRequest submittedLeave = leaveRequestRepository.save(leaveRequest);

        // Deduct leaves immediately if auto-approved
        if ("Approved".equals(submittedLeave.getStatus())) {
            self.deductLeaves(submittedLeave);
        }

        // =================== 🔔 Notification + Email Logic ===================
        String approversRaw = submittedLeave.getPendingApprovers();
        if (approversRaw != null) {
            String[] approverIds = approversRaw.split(",");
            for (String approverId : approverIds) {
                Employee approver = employeeRepository.findByEmployeeId(approverId.trim()).orElse(null);
                if (approver != null) {
                    String employeeFullName = employee.getFirstName() + " " + employee.getLastName();
                    String msg = "New leave request submitted (ex-draft) by " + employeeFullName +
                            " (" + employee.getEmployeeId() + ") from " + startDate.format(dateFormatter) +
                            " to " + endDate.format(dateFormatter) + " (" + totalDays + " days). Level: "
                            + submittedLeave.getCurrentLevel();

                    sendNotification(approverId.trim(), msg);
                    if (approver.getEmail() != null && !approver.getEmail().isEmpty()) {
                        emailService.sendEmail(approver.getEmail(), "New Leave Request Action Required", msg);
                    }
                }
            }
        } else if (submittedLeave.getIsAutoApproved() != null && submittedLeave.getIsAutoApproved()) {
            // Auto-approved case: Notify employee
            String msg = "Your leave request for " + normalizedType + " from " + startDate.format(dateFormatter) +
                    " to " + endDate.format(dateFormatter) + " has been AUTO-APPROVED.";
            sendNotification(employee.getEmployeeId(), msg);
            emailService.sendEmail(employee.getEmail(), "Leave Auto-Approved", msg);
        }

        leaveDraftRepository.delete(draft);

        return submittedLeave;
    }

    public LeaveRequest applyLeaveWithExistingFile(LeaveRequestDTO dto, String existingFileName) throws Exception {
        LocalDate start = dto.getStartDate();
        LocalDate end = dto.getEndDate();

        if (start == null || end == null) {
            throw new RuntimeException("Start date and End date are required.");
        }
        if (end.isBefore(start)) {
            throw new RuntimeException("End date cannot be before Start date.");
        }

        // Normalize leave type names
        String leaveType = dto.getType();
        String normalizedType = normalizeLeaveType(leaveType);

        Double totalDays;
        // 🎯 MODIFICATION START 🎯
        totalDays = calculateLeaveDuration(dto.getEmployeeId(), start, end, normalizedType);
        // 🎯 MODIFICATION END 🎯

        LeaveRequest leave = new LeaveRequest();
        leave.setEmployeeId(dto.getEmployeeId());
        leave.setStartDate(start);
        leave.setEndDate(end);

        leave.setType(normalizedType);
        leave.setTotalDays(totalDays);

        // ✅ VALIDATE BALANCE
        leaveAssignmentService.validateLeaveApplication(dto.getEmployeeId(), normalizedType, totalDays);

        leave.setReason(dto.getReason());
        leave.setStatus("Pending");
        leave.setCreatedDate(LocalDateTime.now());

        // ✅ Store optional holiday name if provided and check for duplicates
        if (dto.getOptionalHolidayName() != null && !dto.getOptionalHolidayName().isEmpty()) {
            List<String> usedHolidays = getUsedOptionalHolidays(dto.getEmployeeId());
            if (usedHolidays.contains(dto.getOptionalHolidayName())) {
                throw new RuntimeException(
                        "You have already used or applied for the optional holiday: " + dto.getOptionalHolidayName());
            }
            leave.setOptionalHolidayName(dto.getOptionalHolidayName());
        }

        // Retrieve the attachment from drafts by employee and filename
        List<LeaveDraft> drafts = leaveDraftRepository.findByEmployeeId(dto.getEmployeeId());
        Optional<LeaveDraft> matchingDraft = drafts.stream()
                .filter(d -> existingFileName != null && existingFileName.equals(d.getFileName()))
                .findFirst();

        if (matchingDraft.isPresent()) {
            LeaveDraft draft = matchingDraft.get();
            leave.setAttachment(draft.getDocument());
            leave.setFileName(draft.getFileName());
            leave.setFileType(draft.getFileType());
        } else {
            throw new RuntimeException("No matching draft found with the specified file name.");
        }

        return leaveRequestRepository.save(leave);
    }

    @Transactional
    public LeaveDraft updateDraft(Long draftId, LeaveDraft updatedDraft, MultipartFile document) throws IOException {
        LeaveDraft existingDraft = leaveDraftRepository.findById(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found with ID: " + draftId));

        // Update the draft fields
        existingDraft.setReason(updatedDraft.getReason());

        // --- START Normalization for Update ---
        String newType = updatedDraft.getType();
        String normalizedType = normalizeLeaveType(newType);
        existingDraft.setType(normalizedType); // Set the normalized type
        // --- END Normalization for Update ---

        existingDraft.setStartDate(updatedDraft.getStartDate());
        existingDraft.setEndDate(updatedDraft.getEndDate());

        // Recalculate total days since dates or type may have changed
        if (existingDraft.getStartDate() != null && existingDraft.getEndDate() != null) {
            Double totalDays;
            if ("Maternity Leave".equals(normalizedType) || "Paternity Leave".equals(normalizedType)) {
                totalDays = (double) (ChronoUnit.DAYS.between(existingDraft.getStartDate(), existingDraft.getEndDate())
                        + 1);
            } else {
                totalDays = calculateLeaveDuration(existingDraft.getEmployeeId(), existingDraft.getStartDate(),
                        existingDraft.getEndDate(),
                        normalizedType);
            }
            existingDraft.setTotalDays(totalDays);
        }

        // Handle file update (logic remains the same)
        if (document != null && !document.isEmpty()) {
            validateFile(document);
            existingDraft.setDocument(document.getBytes());
            existingDraft.setFileName(document.getOriginalFilename());
            existingDraft.setFileType(document.getContentType());
        } else if (updatedDraft.getDocument() == null && existingDraft.getDocument() != null) {
            // If the front end indicates the file was removed
            existingDraft.setDocument(null);
            existingDraft.setFileName(null);
            existingDraft.setFileType(null);
        }

        return leaveDraftRepository.save(existingDraft);
    }

    public String getEmployeeNameById(String employeeId) {
        // 1. Use the injected EmployeeRepository to find the Employee entity
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElse(null); // Return null if the employee is not found

        if (employee == null) {
            return null;
        }

        return employee.getFirstName() + " " + employee.getLastName();

    }

    /**
     * ✅ UPDATED: Get all ACTIVE leave types from LeavestypePolicy (For Dropdown
     * primarily)
     */
    public List<String> getAllLeaveTypes() {
        return leavestypePolicyRepository.findByStatus("APPROVED")
                .stream()
                .filter(policy -> policy.getActive() != null && policy.getActive()) // Only active types
                .map(policy -> policy.getName())
                .toList();
    }

    /**
     * ✅ NEW: Get active leave types with CONFIGURATION (For Half-Day logic etc.)
     */
    public List<com.register.example.payload.LeaveTypeConfigDTO> getActiveLeaveTypesConfigs(String employeeId) {
        Employee employee = (employeeId != null) ? employeeRepository.findByEmployeeId(employeeId).orElse(null) : null;
        List<LeavestypePolicy> approvedPolicies = leavestypePolicyRepository.findByStatus("APPROVED");

        System.out.println("DEBUG: Found " + approvedPolicies.size() + " APPROVED policies: " +
                approvedPolicies.stream().map(p -> p.getName() + "(Active:" + p.getActive() + ")").toList());

        return approvedPolicies
                .stream()
                // ✅ Filter 1: Check if leave type itself is active
                .filter(policy -> policy.getActive() != null && policy.getActive())
                // ✅ Filter 2: Check if employee is eligible
                .filter(policy -> {
                    if (employee == null)
                        return true;
                    return eligibilityService.isEligible(employee, policy.getId());
                })
                // ✅ Filter 3: Check if the matched policy for this employee is active
                .filter(policy -> {
                    if (employee == null)
                        return true;

                    // Find the matching unified policy for this employee
                    java.util.Optional<LeaveUnifiedPolicy> matchedPolicy = policyMatcher.findMatchingPolicy(employee,
                            policy.getId());

                    // If no policy found, exclude this leave type
                    if (matchedPolicy.isEmpty()) {
                        System.out.println("DEBUG: No matching policy found for employee " + employeeId +
                                " and leave type " + policy.getName());
                        return false;
                    }

                    // Check if the matched policy is active (default to true if null)
                    boolean isPolicyActive = matchedPolicy.get().getActive() == null || matchedPolicy.get().getActive();

                    System.out.println("DEBUG: Leave type " + policy.getName() +
                            " - Matched policy active status: " + isPolicyActive);

                    return isPolicyActive;
                })
                .map(policy -> {
                    // ✅ Fetch optionalHolidays from LeaveType table
                    String currentTenant = policy.getTenantId() != null ? policy.getTenantId() : 
                                           (employee != null ? employee.getTenantId() : getCurrentTenantId());
                    String optionalHolidays = leaveTypeRepository.findByTypeAndTenantId(policy.getName(), currentTenant)
                            .map(LeaveType::getOptionalHolidays)
                            .orElse(null);

                    // ✅ Fetch Fallout Leave Type from Unified Policy
                    String falloutLeaveType = null;
                    if (employee != null) {
                        falloutLeaveType = policyMatcher.findMatchingPolicy(employee, policy.getId())
                                .map(LeaveUnifiedPolicy::getFalloutLeaveType)
                                .orElse(null);
                    }

                    return com.register.example.payload.LeaveTypeConfigDTO.builder()
                            .name(policy.getName())
                            .unit(policy.getUnit())
                            .halfDayAllowed(policy.getHalfDayAllowed())
                            .documentRequired(policy.getDocumentRequired())
                            .documentThreshold(policy.getDocumentThreshold())
                            .sandwichRule(policy.getSandwichRule())
                            .optionalHolidays(optionalHolidays) // ✅ Include optional holidays
                            .falloutLeaveType(falloutLeaveType) // ✅ Include fallout leave type
                            .build();
                })
                .toList();
    }

    // Add leave type
    public void addLeaveType(String type) {
        if (type == null || type.trim().isEmpty()) {
            throw new RuntimeException("Leave type cannot be empty");
        }

        String tenantId = getCurrentTenantId();

        leaveTypeRepository.findByTypeAndTenantId(type.trim(), tenantId)
                .ifPresent(t -> {
                    throw new RuntimeException("Leave type already exists");
                });

        LeaveType newType = new LeaveType(type.trim(), tenantId);
        leaveTypeRepository.save(newType);
    }

    public Employee getEmployeeById(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId).orElse(null);
    }

    /**
     * Get list of optional holiday names that have been used (approved) by the
     * employee
     */
    public List<String> getUsedOptionalHolidays(String employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId)
                .stream()
                .filter(leave -> !"Rejected".equalsIgnoreCase(leave.getStatus())
                        && !"Cancelled".equalsIgnoreCase(leave.getStatus()))
                .filter(leave -> leave.getOptionalHolidayName() != null && !leave.getOptionalHolidayName().isEmpty())
                .map(LeaveRequest::getOptionalHolidayName)
                .distinct()
                .toList();
    }

    /**
     * ✅ NEW: Calculate leave days with detailed transparency
     * Provides breakdown of calculation for admin/employee preview
     */
    public LeaveCalculationDetailsDTO calculateLeaveWithDetails(
            String employeeId, LocalDate start, LocalDate end, String leaveType, Boolean isHalfDay) {

        if (start == null || end == null) {
            throw new RuntimeException("Start date and End date are required.");
        }
        if (end.isBefore(start)) {
            throw new RuntimeException("End date cannot be before Start date.");
        }

        // Normalize leave type
        String normalizedType = normalizeLeaveType(leaveType);

        // Calculate calendar days
        int calendarDays = (int) (ChronoUnit.DAYS.between(start, end) + 1);

        // Get policy
        Optional<LeavestypePolicy> policyOpt = leavestypePolicyRepository.findByName(normalizedType).stream()
                .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()))
                .findFirst();
        boolean applySandwich = policyOpt.map(LeavestypePolicy::getSandwichRule).orElse(false);
        String unit = policyOpt.map(LeavestypePolicy::getUnit).orElse("FULL_DAY");
        String roundingRule = policyOpt.map(LeavestypePolicy::getRoundingRule).orElse("NONE");

        // Get holidays
        List<Holiday> holidays = holidayRepository.findByDateBetween(start, end);
        Set<LocalDate> mandatoryHolidayDates = holidays.stream()
                .filter(h -> h.getHoliday() == null || !h.getHoliday().toLowerCase().contains("(optional)"))
                .map(Holiday::getDate)
                .collect(Collectors.toSet());

        // Count weekends and holidays
        int weekendDays = 0;
        int holidayDays = 0;
        int workingDays = 0;

        // Get occupied dates
        Set<LocalDate> occupiedDates = getOccupiedDates(employeeId);

        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            DayOfWeek dow = d.getDayOfWeek();
            boolean isWeekend = (dow.equals(DayOfWeek.SATURDAY) || dow.equals(DayOfWeek.SUNDAY));
            boolean isMandatoryHoliday = mandatoryHolidayDates.contains(d);
            boolean isOccupied = occupiedDates.contains(d);

            if (isWeekend)
                weekendDays++;
            if (isMandatoryHoliday)
                holidayDays++;

            // If occupied or holiday, always skip from working days
            if (isOccupied || isMandatoryHoliday) {
                continue;
            }

            if (applySandwich) {
                workingDays++;
            } else {
                if (!isWeekend) {
                    workingDays++;
                }
            }
        }

        // Calculate total days
        Double totalDays;
        String calculationMethod;

        if ("Maternity Leave".equals(normalizedType)) {
            totalDays = (double) calendarDays;
            calculationMethod = "CALENDAR_DAYS";
        } else {
            totalDays = roundLeave((double) workingDays, roundingRule);
            calculationMethod = applySandwich ? "SANDWICH_RULE" : "WORKING_DAYS";
        }

        // Apply half-day if applicable
        boolean halfDayApplied = false;
        if (isHalfDay != null && isHalfDay && start.equals(end)) {
            totalDays = 0.5;
            halfDayApplied = true;
        }

        // Build DTO
        LeaveCalculationDetailsDTO details = LeaveCalculationDetailsDTO
                .builder()
                .startDate(start)
                .endDate(end)
                .calendarDays(calendarDays)
                .weekendDays(weekendDays)
                .holidayDays(holidayDays)
                .workingDays(workingDays)
                .totalDays(totalDays)
                .sandwichRuleApplied(applySandwich)
                .halfDayApplied(halfDayApplied)
                .leaveUnit(unit)
                .calculationMethod(calculationMethod)
                .build();

        details.setExplanation(details.generateExplanation());
        return details;
    }

    private String normalizeLeaveType(String rawType) {
        if (rawType == null)
            return null;

        // 1. Check if the type exists exactly as provided (Dynamic Policies)
        Optional<LeavestypePolicy> policy = leavestypePolicyRepository.findByName(rawType).stream()
                .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()))
                .findFirst();
        if (policy.isPresent()) {
            return policy.get().getName();
        }

        // 2. Fallback to legacy normalization rules
        if ("Casual".equalsIgnoreCase(rawType)) {
            return "Casual Leave";
        } else if ("Sick".equalsIgnoreCase(rawType)) {
            return "Sick Leave";
        } else if ("Maternity".equalsIgnoreCase(rawType)) {
            return "Maternity Leave";
        } else if ("Paternity".equalsIgnoreCase(rawType)) {
            return "Paternity Leave";
        }

        // 3. Default to raw type
        return rawType;
    }

    public List<LeaveRequest> getFilteredLeaves(String employeeId, String leaveType, String status, LocalDate fromDate,
            LocalDate toDate) {
        String currentTenantId = getCurrentTenantId();
        List<LeaveRequest> leaves = leaveRequestRepository
                .findAll((Specification<LeaveRequest>) (root, query, criteriaBuilder) -> {
                    List<Predicate> predicates = new ArrayList<>();

                    if (currentTenantId != null && !currentTenantId.isEmpty()) {
                        List<String> tenantEmployeeIds = employeeRepository.findByTenantId(currentTenantId).stream()
                                .map(Employee::getEmployeeId)
                                .toList();
                        if (tenantEmployeeIds.isEmpty()) {
                            predicates.add(criteriaBuilder.disjunction());
                        } else {
                            predicates.add(root.get("employeeId").in(tenantEmployeeIds));
                        }
                    }
                    if (employeeId != null && !employeeId.trim().isEmpty()) {
                        String[] ids = employeeId.split(",");
                        if (ids.length > 1) {
                            List<String> idList = Arrays.stream(ids).map(String::trim).filter(s -> !s.isEmpty())
                                    .toList();
                            predicates.add(root.get("employeeId").in(idList));
                        } else {
                            predicates.add(criteriaBuilder.equal(root.get("employeeId"), employeeId.trim()));
                        }
                    }
                    if (leaveType != null && !leaveType.trim().isEmpty()) {
                        predicates.add(criteriaBuilder.equal(root.get("type"), leaveType));
                    }
                    if (status != null && !status.trim().isEmpty()) {
                        predicates.add(criteriaBuilder.equal(root.get("status"), status));
                    }
                    if (fromDate != null && toDate != null) {
                        // Overlapping range logic: leave_start_date <= filter_end_date AND leave_end_date >= filter_start_date
                        predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startDate"), toDate));
                        predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("endDate"), fromDate));
                    } else if (fromDate != null) {
                        // If only fromDate is provided, find leaves that end on or after fromDate
                        predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("endDate"), fromDate));
                    } else if (toDate != null) {
                        // If only toDate is provided, find leaves that start on or before toDate
                        predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startDate"), toDate));
                    }

                    return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
                });
        leaves.forEach(l -> {
            if (l.getEmployeeName() == null || l.getEmployeeName().isEmpty()) {
                employeeRepository.findByEmployeeId(l.getEmployeeId())
                        .ifPresent(e -> l.setEmployeeName(e.getFirstName() + " " + e.getLastName()));
            }
        });
        return leaves;
    }

    public Map<String, Object> getLeaveStatusDetails(Long leaveId) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave Request not found"));
        Map<String, Object> details = new HashMap<>();

        details.put("createdAt", leave.getCreatedDate());
        details.put("status", leave.getStatus());
        details.put("updatedAt", leave.getUpdatedAt());

        Employee creator = employeeRepository.findByEmployeeId(leave.getEmployeeId()).orElse(null);
        if (creator != null) {
            details.put("managerId", creator.getAssignedManagerId());
            details.put("hrId", creator.getAssignedHrId());
            System.out.println("DEBUG: getLeaveStatusDetails - leaveId: " + leaveId + ", creator: " + leave.getEmployeeId() + ", managerId: " + creator.getAssignedManagerId());
        } else {
            System.out.println("DEBUG: getLeaveStatusDetails - creator not found for employeeId: " + leave.getEmployeeId());
        }

        // Determine Next Approver Role and Name if Pending
        String pendingApprovers = leave.getPendingApprovers();
        if (pendingApprovers != null && !pendingApprovers.isEmpty()) {
            // usually comma separated, take first
            String[] ids = pendingApprovers.split(",");
            String firstApproverId = ids[0].trim();

            Employee approver = employeeRepository.findByEmployeeId(firstApproverId).orElse(null);

            if (approver != null) {
                final String name = approver.getFirstName() + " " + approver.getLastName();
                
                // Indication for delegation
                String defaultApproverId = null;
                if (creator != null) {
                    // Try to determine which role the firstApproverId is acting for
                    if (firstApproverId.equals(creator.getAssignedManagerId())) {
                        defaultApproverId = creator.getAssignedManagerId();
                    } else if (firstApproverId.equals(creator.getAssignedHrId())) {
                        defaultApproverId = creator.getAssignedHrId();
                    } else {
                        // If it's not the default manager or HR, it's likely a delegate or assigned from pool
                        // In Leave's case, we often use the reporting manager as the baseline.
                        defaultApproverId = creator.getAssignedManagerId();
                    }
                }

                if (defaultApproverId != null && !firstApproverId.equals(defaultApproverId)) {
                    final String finalFirstApproverId = firstApproverId;
                    final String finalDefaultApproverId = defaultApproverId;
                    employeeRepository.findByEmployeeId(defaultApproverId).ifPresent(orig -> {
                        details.put("approverName", name + " (" + finalFirstApproverId + ") (on behalf of "
                                + orig.getFirstName() + " " + orig.getLastName()
                                + " (" + finalDefaultApproverId + "))");
                    });
                } else {
                    details.put("approverName", name + " (" + firstApproverId + ")");
                }
                details.put("approverId", firstApproverId);
            }

            // Infer Role
            if (creator != null) {
                if (firstApproverId.equals(creator.getAssignedManagerId())) {
                    details.put("nextApproverRole", "Manager");
                } else if (firstApproverId.equals(creator.getAssignedHrId())) {
                    details.put("nextApproverRole", "HR");
                } else if (firstApproverId.equals(creator.getAssignedFinanceId())) {
                    details.put("nextApproverRole", "Finance");
                } else {
                    if (leave.getCurrentLevel() != null) {
                        if (leave.getCurrentLevel() == 0 || leave.getCurrentLevel() == 1) {
                            details.put("nextApproverRole", "Manager");
                        } else {
                            details.put("nextApproverRole", "Approver (Level " + leave.getCurrentLevel() + ")");
                        }
                    } else {
                        details.put("nextApproverRole", "Approver");
                    }
                }
            } else {
                details.put("nextApproverRole", "Approver");
            }
        } else {
            details.put("nextApproverRole", null);
            details.put("approverName", null);
        }

        // If Approved/Rejected/Settled, set approvedAt and approverName
        if ("Approved".equalsIgnoreCase(leave.getStatus()) ||
                "Settled".equalsIgnoreCase(leave.getStatus()) ||
                "Rejected".equalsIgnoreCase(leave.getStatus())) {

            if (leave.getUpdatedAt() != null) {
                details.put("approvedAt", java.sql.Timestamp.valueOf(leave.getUpdatedAt()));
            } else {
                details.put("approvedAt", null);
            }
            // Use stored approverName if available
            if (leave.getApproverName() != null) {
                String storedName = leave.getApproverName();
                String storedId = leave.getAssignedApproverId();
                String originalManagerId = (creator != null) ? creator.getAssignedManagerId() : null;

                if (storedName.contains("(on behalf of")) {
                    int onBehalfIdx = storedName.indexOf("(on behalf of");
                    String basePartBefore = storedName.substring(0, onBehalfIdx).trim();
                    String onBehalfPart = storedName.substring(onBehalfIdx).trim();

                    // Ensure original manager ID is in the onBehalfPart
                    if (originalManagerId != null && !onBehalfPart.contains(originalManagerId)) {
                        if (onBehalfPart.endsWith(")")) {
                            onBehalfPart = onBehalfPart.substring(0, onBehalfPart.length() - 1).trim()
                                    + " (" + originalManagerId + "))";
                        } else {
                            onBehalfPart = onBehalfPart.trim() + " (" + originalManagerId + ")";
                        }
                    }

                    // Case 1: Delegate ID not yet embedded
                    if (storedId != null && !basePartBefore.contains(storedId)) {
                        storedName = basePartBefore + " (" + storedId + ") " + onBehalfPart;
                    } else {
                        // Case 2: Delegate ID already embedded or not available, just update onBehalfPart
                        storedName = basePartBefore + " " + onBehalfPart;
                    }
                }
                details.put("approverName", storedName);
            }
            // ✅ Return stored approverId if available
            if (leave.getAssignedApproverId() != null) {
                details.put("approverId", leave.getAssignedApproverId());
            }
        }

        return details;
    }

    @Transactional
    public int updatePendingLeavesManager(String employeeId, String oldManagerId, String newManagerId) {
        if (employeeId == null || newManagerId == null) {
            return 0;
        }

        // Find all pending leave requests for this employee
        List<LeaveRequest> pendingRequests = leaveRequestRepository.findByEmployeeId(employeeId).stream()
                .filter(l -> l.getStatus() != null && l.getStatus().equalsIgnoreCase("Pending"))
                .collect(Collectors.toList());

        if (pendingRequests.isEmpty()) {
            return 0;
        }

        Employee employee = employeeRepository.findByEmployeeId(employeeId).orElse(null);
        String employeeName = (employee != null) ? (employee.getFirstName() + " " + employee.getLastName()) : "Unknown";
        String newManagerName = getEmployeeNameById(newManagerId);

        int updatedCount = 0;
        for (LeaveRequest leave : pendingRequests) {
            // Update pendingApprovers if it matches oldManagerId or is null/empty (fallback to current manager)
            String currentApprovers = leave.getPendingApprovers();
            if (currentApprovers == null || currentApprovers.isEmpty() || (oldManagerId != null && currentApprovers.contains(oldManagerId))) {
                leave.setPendingApprovers(newManagerId);
                leaveRequestRepository.save(leave);
                updatedCount++;
            }
        }

        if (updatedCount > 0 && employee != null) {
            // Notifications
            String msgToEmployee = "Your pending leave request(s) have been reassigned to your new manager: " + newManagerName;
            sendNotification(employeeId, msgToEmployee);

            String msgToNewManager = updatedCount + " pending leave request(s) from " + employeeName + " (" + employeeId + ") have been assigned to you for approval.";
            sendNotification(newManagerId, msgToNewManager);
            
            Employee newManager = employeeRepository.findByEmployeeId(newManagerId).orElse(null);
            if (newManager != null && newManager.getEmail() != null) {
                emailService.sendEmail(newManager.getEmail(), "New Leave Requests Assigned", msgToNewManager);
            }
        }

        return updatedCount;
    }

    private void validateProjectAssignment(String employeeId) {
        java.time.LocalDate today = java.time.LocalDate.now();
        List<Allocation> allocations = allocationRepository
                .findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        employeeId, today, today);

        if (allocations == null || allocations.isEmpty()) {
            throw new RuntimeException("You are not assigned to any project , please contact your manager or admin");
        }
    }

    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            java.util.Optional<com.register.example.entity.Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            if (empOpt.isPresent()) {
                return empOpt.get().getTenantId();
            }
        }
        return null;
    }

}
