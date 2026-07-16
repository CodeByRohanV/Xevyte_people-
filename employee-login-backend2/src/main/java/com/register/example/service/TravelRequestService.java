package com.register.example.service;

import com.register.example.entity.*;
import com.register.example.exception.ResourceNotFoundException;
import com.register.example.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TravelRequestService {

    private final TravelRequestRepository requestRepository;
    private final EmployeeRepository employeeRepository;
    private final TravelDocumentRepository travelDocumentRepository;

    @Autowired
    private AllocationRepository allocationRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.register.example.service.DelegationService delegationService;

    @Autowired
    private DelegationRepository delegationRepository;

    public TravelRequestService(TravelRequestRepository requestRepository,
            EmployeeRepository employeeRepository,
            TravelDocumentRepository travelDocumentRepository) {
        this.requestRepository = requestRepository;
        this.employeeRepository = employeeRepository;
        this.travelDocumentRepository = travelDocumentRepository;
    }

    // ================== CREATE REQUEST ==================
    @Transactional
    public TravelRequest createTravelRequest(TravelRequest request) {
        validateProjectAssignment(request.getEmployeeId());

        Employee employee = employeeRepository.findByEmployeeId(request.getEmployeeId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Employee not found with id: " + request.getEmployeeId()));

        String managerId = employee.getAssignedManagerId();
        String adminId = employee.getTravelAdmin();

        if (adminId == null || adminId.isBlank()) {
            // Fallback: Check if ANY employee has a travel admin set
            adminId = employeeRepository.findAll().stream()
                    .filter(e -> e.getTravelAdmin() != null && !e.getTravelAdmin().isBlank())
                    .map(Employee::getTravelAdmin)
                    .findFirst()
                    .orElse(null);
        }

        if (managerId == null || managerId.isBlank())
            throw new IllegalArgumentException("Employee has no assigned manager. Travel request cannot be created.");
        if (adminId == null || adminId.isBlank())
            throw new IllegalArgumentException(
                    "No Travel Admin found in the system. Please configure a Travel Admin in the Admin Access module.");

        request.setAssignedManagerId(delegationService.getEffectiveApprover(managerId, "Travel"));
        // Preserve original travel admin IDs (comma-separated) from employee configuration
        // Delegation is handled separately in notifications
        request.setTravelAdmin(adminId);
        request.setStatus("Pending For Approval");

        TravelRequest saved = requestRepository.save(request);


        // ================== NOTIFICATIONS ==================
        String msgToManager = "Travel request submitted by "
                + employee.getFirstName() + " " + employee.getLastName()
                + " (" + employee.getEmployeeId() + ")";

        sendNotification(managerId, msgToManager);
        emailService.sendEmail(getEmployeeEmail(managerId), "New Travel Request Pending Approval", msgToManager);

        return saved;
    }

    // ================== APPROVE REQUEST ==================
    @Transactional
    public TravelRequest approveRequest(Long requestId, String managerId, String remarks) {
        TravelRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        req.setStatus("Approved By Manager");
        // Preserve original travel admin IDs (comma-separated) from employee configuration
        // Don't overwrite with delegation - delegation is only for notification purposes
        req.setApprovedAt(java.time.LocalDateTime.now());

        // Record manager attribution (delegation-aware)
        final String actingManagerId = req.getAssignedManagerId(); // may be delegate
        employeeRepository.findByEmployeeId(actingManagerId).ifPresent(actor ->
            req.setManagerActorName(actor.getFirstName() + " " + actor.getLastName() + " (" + actingManagerId + ")")
        );
        // Determine original manager from employee record
        Employee requester = employeeRepository.findByEmployeeId(req.getEmployeeId()).orElse(null);
        if (requester != null) {
            String originalManagerId = requester.getAssignedManagerId();
            if (originalManagerId != null && !originalManagerId.equals(actingManagerId)) {
                req.setManagerDelegatorId(originalManagerId);
                employeeRepository.findByEmployeeId(originalManagerId).ifPresent(orig ->
                    req.setManagerDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + originalManagerId + ")")
                );
            }
        }

        Employee employee = employeeRepository.findByEmployeeId(req.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + req.getEmployeeId()));

        requestRepository.save(req);
        req.setEmployeeName(employee.getFirstName() + " " + employee.getLastName());


        // Notify Employee
        String msgToEmployee = "Your travel request has been approved by Manager.";
        sendNotification(employee.getEmployeeId(), msgToEmployee);
        emailService.sendEmail(employee.getEmail(), "Travel Request Approved by Manager", msgToEmployee);

        // Notify Admin(s) - no delegation for admin notifications
        String admins = employee.getTravelAdmin();
        String msgToAdmin = "Travel request from "
                + employee.getFirstName() + " " + employee.getLastName()
                + " (" + employee.getEmployeeId() + ") is ready for processing.";

        if (admins != null) {
            for (String adm : admins.split(",")) {
                String cleanAdm = adm.trim();
                if (!cleanAdm.isEmpty()) {
                    // Direct notification without delegation for admins
                    saveNotificationRecord(cleanAdm, msgToAdmin);
                    emailService.sendEmail(getEmployeeEmail(cleanAdm), "Travel Request Ready for Processing",
                            msgToAdmin);
                }
            }
        }

        return req;
    }

    // ================== REJECT REQUEST ==================
    @Transactional
    public TravelRequest rejectRequest(Long requestId, String managerId, String rejectedReason) {
        TravelRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        req.setStatus("Rejected");
        req.setRejectedReason(rejectedReason);
        
        // Record manager attribution (delegation-aware)
        final String actingManagerId = req.getAssignedManagerId(); // may be delegate
        employeeRepository.findByEmployeeId(actingManagerId).ifPresent(actor ->
            req.setManagerActorName(actor.getFirstName() + " " + actor.getLastName() + " (" + actingManagerId + ")")
        );
        // Determine original manager from employee record
        Employee requester = employeeRepository.findByEmployeeId(req.getEmployeeId()).orElse(null);
        if (requester != null) {
            String originalManagerId = requester.getAssignedManagerId();
            if (originalManagerId != null && !originalManagerId.equals(actingManagerId)) {
                req.setManagerDelegatorId(originalManagerId);
                employeeRepository.findByEmployeeId(originalManagerId).ifPresent(orig ->
                    req.setManagerDelegatorName(orig.getFirstName() + " " + orig.getLastName() + " (" + originalManagerId + ")")
                );
            }
        }
        
        requestRepository.save(req);


        employeeRepository.findByEmployeeId(req.getEmployeeId())

                .ifPresent(emp -> {
                    req.setEmployeeName(emp.getFirstName() + " " + emp.getLastName());

                    String msg = "Your travel request has been rejected by Manager. Reason: " + rejectedReason;
                    sendNotification(emp.getEmployeeId(), msg);
                    emailService.sendEmail(emp.getEmail(), "Travel Request Rejected by Manager", msg);
                });

        return req;
    }

    // ================== REJECT REQUEST BY ADMIN ==================
    @Transactional
    public TravelRequest rejectRequestByAdmin(Long requestId, String adminId, String rejectedReason) {
        TravelRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        req.setStatus("Rejected");
        req.setRejectedReason(rejectedReason);

        // Record admin attribution
        final String actingAdminId = adminId;
        employeeRepository.findByEmployeeId(actingAdminId).ifPresent(actor ->
            req.setAdminActorName(actor.getFirstName() + " " + actor.getLastName() + " (" + actingAdminId + ")")
        );

        requestRepository.save(req);


        employeeRepository.findByEmployeeId(req.getEmployeeId())
                .ifPresent(emp -> {
                    req.setEmployeeName(emp.getFirstName() + " " + emp.getLastName());

                    String msg = "Your travel request has been rejected by Travel Admin. Reason: " + rejectedReason;
                    sendNotification(emp.getEmployeeId(), msg);
                    emailService.sendEmail(emp.getEmail(), "Travel Request Rejected by Travel Admin", msg);
                });

        return req;
    }

    // ================== CANCEL REQUEST (Employee) ==================
    @Transactional
    public void cancelTravelRequest(Long requestId) {
        TravelRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        req.setStatus("Cancelled");
        requestRepository.save(req);

    }

    // ================== ADMIN PROCESS ==================
    @Transactional
    public TravelRequest adminProcessRequest(Long requestId, String adminId) {
        TravelRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        req.setStatus("Booked");

        // Record admin attribution (no delegation for admin approvals)
        final String actingAdminId = adminId;
        employeeRepository.findByEmployeeId(actingAdminId).ifPresent(actor ->
            req.setAdminActorName(actor.getFirstName() + " " + actor.getLastName() + " (" + actingAdminId + ")")
        );

        requestRepository.save(req);

        Employee employee = employeeRepository.findByEmployeeId(req.getEmployeeId()).orElse(null);
        if (employee != null) {
            String msg = "Your travel request has been processed by Admin.";
            sendNotification(employee.getEmployeeId(), msg);
            emailService.sendEmail(employee.getEmail(), "Travel Request Processed by Admin", msg);
        }

        return req;
    }

    // ================== ASSIGN TO ADMIN ==================
    @Transactional
    public TravelRequest assignToAdmin(Long requestId, String adminId) {
        TravelRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        req.setTravelAdmin(adminId);
        TravelRequest saved = requestRepository.save(req);


        return saved;
    }

    // ================== TRANSFER TO ADMIN ==================
    @Transactional
    public TravelRequest transferToAdmin(Long requestId, String newAdminId, String reason) {
        TravelRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        String oldAdmin = req.getTravelAdmin();
        req.setTravelAdmin(newAdminId);

        // Notify New Admin
        Employee employee = employeeRepository.findByEmployeeId(req.getEmployeeId()).orElse(null);
        String employeeName = (employee != null) ? (employee.getFirstName() + " " + employee.getLastName()) : "Unknown";
        String msg = "Travel request from " + employeeName + " has been transferred to you.";
        if (reason != null && !reason.isBlank()) {
            msg += " Reason: " + reason;
        }
        sendNotification(newAdminId, msg);
        emailService.sendEmail(getEmployeeEmail(newAdminId), "Travel Request Transferred to You", msg);


        return requestRepository.save(req);
    }

    public List<Employee> getAllTravelAdmins() {
        List<Employee> all = employeeRepository.findAll();
        Set<String> adminIds = new HashSet<>();
        for (Employee e : all) {
            String travelAdmins = e.getTravelAdmin();
            if (travelAdmins != null && !travelAdmins.isBlank()) {
                for (String id : travelAdmins.split(",")) {
                    adminIds.add(id.trim());
                }
            }
        }
        return employeeRepository.findByEmployeeIdIn(new ArrayList<>(adminIds));
    }

    // ================== UPLOAD RECEIPT ==================
    @Transactional
    public void uploadReceipt(Long requestId, MultipartFile file) throws Exception {
        TravelRequest travelRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        if (file.isEmpty())
            throw new IllegalArgumentException("Cannot upload empty file");

        TravelDocument document = new TravelDocument();
        document.setTravelRequest(travelRequest);
        document.setFileName(file.getOriginalFilename());
        document.setContentType(file.getContentType());
        document.setData(file.getBytes());

        travelDocumentRepository.save(document);
    }

    @Transactional
    public void uploadAdminPdfs(Long requestId, MultipartFile[] files) throws Exception {
        TravelRequest travelRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
        List<String> allowedTypes = Arrays.asList("application/pdf", "image/jpeg", "image/png");

        for (MultipartFile file : files) {
            if (file.isEmpty())
                throw new IllegalArgumentException("Cannot upload empty file.");
            if (!allowedTypes.contains(file.getContentType()))
                throw new IllegalArgumentException("Invalid file type: " + file.getOriginalFilename());
            if (file.getSize() > MAX_FILE_SIZE)
                throw new IllegalArgumentException("File " + file.getOriginalFilename() + " exceeds the 5MB limit.");

            TravelDocument document = new TravelDocument();
            document.setTravelRequest(travelRequest);
            document.setFileName(file.getOriginalFilename());
            document.setContentType(file.getContentType());
            document.setData(file.getBytes());

            travelDocumentRepository.save(document);
        }

        if ("Booking In Progress".equalsIgnoreCase(travelRequest.getStatus()) || "Approved By Manager".equalsIgnoreCase(travelRequest.getStatus())) {
            travelRequest.setStatus("Booked");
            requestRepository.save(travelRequest);


            Employee employee = employeeRepository.findByEmployeeId(travelRequest.getEmployeeId()).orElse(null);
            if (employee != null) {
                String msg = "Your travel request has been booked by Admin.";
                sendNotification(employee.getEmployeeId(), msg);
                emailService.sendEmail(employee.getEmail(), "Travel Request Booked", msg);
            }
        }
    }

    // ================== DOCUMENT RETRIEVAL ==================
    public List<TravelDocument> getDocumentsByRequestId(Long requestId) {
        return travelDocumentRepository.findByTravelRequestId(requestId);
    }

    public Optional<TravelDocument> getDocumentById(Long documentId) {
        return travelDocumentRepository.findById(documentId);
    }

    // ================== GET REQUEST ==================
    public TravelRequest getTravelRequestById(Long requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
    }

    // ================== NOTIFICATIONS ==================
    public List<Notification> getNotifications(String employeeId) {
        return notificationRepository.findByEmployeeId(employeeId);
    }

    public String markNotificationAsRead(Long id) {
        return notificationRepository.findById(id)
                .map(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                    return "Notification marked as read.";
                }).orElse("Notification not found.");
    }

    // ================== HELPER METHODS ==================
    private void sendNotification(String employeeId, String message) {
        if (employeeId == null || employeeId.isEmpty())
            return;
            
        // 1. Notify primary
        saveNotificationRecord(employeeId, message);

        // 2. Notify delegate if active
        try {
            String delegateId = delegationService.getActiveDelegateId(employeeId, "Travel");
            if (delegateId != null) {
                saveNotificationRecord(delegateId, "[Delegated] " + message);
            }
        } catch (Exception e) {
            System.err.println("Error notifying delegate in TravelRequestService: " + e.getMessage());
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

    private String getEmployeeEmail(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId)
                .map(Employee::getEmail)
                .orElse(null);
    }

    private void populateEmployeeNames(List<TravelRequest> requests) {
        if (requests == null || requests.isEmpty())
            return;

        Set<String> employeeIds = new HashSet<>();
        for (TravelRequest req : requests) {
            if (req.getAssignedManagerId() != null)
                employeeIds.add(req.getAssignedManagerId());
            if (req.getTravelAdmin() != null) {
                // Handle multiple admins separated by comma
                String[] admins = req.getTravelAdmin().split(",");
                for (String admin : admins) {
                    employeeIds.add(admin.trim());
                }
            }
            // Also collect requester ID if employee object is missing
            if (req.getEmployee() == null)
                employeeIds.add(req.getEmployeeId());
        }

        List<Employee> employees = employeeRepository.findByEmployeeIdIn(new ArrayList<>(employeeIds));
        Map<String, String> nameMap = employees.stream()
                .collect(Collectors.toMap(Employee::getEmployeeId,
                        e -> e.getFirstName() + " " + e.getLastName(), (a, b) -> a));

        for (TravelRequest req : requests) {
            // Requester Name
            if (req.getEmployee() != null) {
                req.setEmployeeName(req.getEmployee().getFirstName() + " " + req.getEmployee().getLastName());
            } else if (nameMap.containsKey(req.getEmployeeId())) {
                req.setEmployeeName(nameMap.get(req.getEmployeeId()));
            }

            // Manager Name
            if (nameMap.containsKey(req.getAssignedManagerId())) {
                req.setManagerName(nameMap.get(req.getAssignedManagerId()));
            }

            // Admin Name
            if (req.getTravelAdmin() != null) {
                String[] admins = req.getTravelAdmin().split(",");
                List<String> adminNames = new ArrayList<>();
                for (String admin : admins) {
                    String trimmedAdmin = admin.trim();
                    if (nameMap.containsKey(trimmedAdmin)) {
                        adminNames.add(nameMap.get(trimmedAdmin));
                    }
                }
                if (!adminNames.isEmpty()) {
                    req.setAdminName(String.join(", ", adminNames));
                }
            }
        }
    }

    // ================== GET REQUESTS ==================
    public List<TravelRequest> getRequestsByEmployee(String employeeId) {
        List<TravelRequest> requests = requestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        populateEmployeeNames(requests);
        return requests;
    }

    public List<TravelRequest> getActiveRequestsForEmployee(String employeeId) {
        List<String> activeStatuses = Arrays.asList("Pending For Approval", "Approved", "Booked",
                "Booking In Progress");
        List<TravelRequest> requests = requestRepository.findByEmployeeIdAndStatusInOrderByCreatedAtDesc(employeeId,
                activeStatuses);
        populateEmployeeNames(requests);
        return requests;
    }

    public List<TravelRequest> getPendingRequestsForManager(String managerId) {
        // 1. Get requests directly assigned to this manager
        Set<TravelRequest> allRequests = new HashSet<>(requestRepository.findByAssignedManagerIdAndStatus(managerId,
                "Pending For Approval"));

        // 2. Get active delegations for this manager (as delegate)
        List<Delegation> activeDelegations = delegationService.getActiveDelegationsForDelegate(managerId, "Travel");
        activeDelegations.addAll(delegationService.getActiveDelegationsForDelegate(managerId, "All"));

        for (Delegation delegation : activeDelegations) {
            List<TravelRequest> delegatedRequests = requestRepository.findByAssignedManagerIdAndStatus(delegation.getDelegatorId(),
                    "Pending For Approval");
            allRequests.addAll(delegatedRequests);
        }

        List<TravelRequest> resultList = new ArrayList<>(allRequests);
        populateEmployeeNames(resultList);
        return resultList;
    }

    public List<TravelRequest> getAllRequestsForManager(String managerId) {
        List<TravelRequest> requests = requestRepository.findByAssignedManagerIdOrderByCreatedAtDesc(managerId);
        populateEmployeeNames(requests);
        return requests;
    }

    public List<TravelRequest> getRequestsAssignedToAdmin(String adminId) {
        // Get requests directly assigned to this admin (no delegation for admin approvals)
        // Admin approvals work strictly based on assigned travel admin IDs
        List<TravelRequest> requests = requestRepository.findByStatusAndTravelAdmin("Approved By Manager", adminId);
        populateEmployeeNames(requests);
        return requests;
    }

    @Transactional
    public void markAsDownloaded(Long requestId) {
        TravelRequest req = getTravelRequestById(requestId);
        req.setStatus("Downloaded");
        requestRepository.save(req);
    }

    public List<TravelRequest> getFilteredTravelRequests(String employeeId, LocalDate startDate, LocalDate endDate,
            String fromLocation, String toLocation, String category,
            String modeOfTravel, String accommodationRequired,
            String advanceRequired, String status, String tenantId) {
        List<TravelRequest> requests = requestRepository
                .findAll((Specification<TravelRequest>) (root, query, criteriaBuilder) -> {
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
                    if (fromLocation != null && !fromLocation.trim().isEmpty()) {
                        predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("fromLocation")),
                                "%" + fromLocation.toLowerCase() + "%"));
                    }
                    if (toLocation != null && !toLocation.trim().isEmpty()) {
                        predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("toLocation")),
                                "%" + toLocation.toLowerCase() + "%"));
                    }
                    if (category != null && !category.trim().isEmpty() && !"All".equalsIgnoreCase(category)) {
                        predicates.add(criteriaBuilder.equal(root.get("category"), category));
                    }
                    if (modeOfTravel != null && !modeOfTravel.trim().isEmpty()
                            && !"All".equalsIgnoreCase(modeOfTravel)) {
                        predicates.add(criteriaBuilder.equal(root.get("modeOfTravel"), modeOfTravel));
                    }
                    if (accommodationRequired != null && !accommodationRequired.trim().isEmpty()
                            && !"All".equalsIgnoreCase(accommodationRequired)) {
                        predicates.add(criteriaBuilder.equal(root.get("accommodationRequired"), accommodationRequired));
                    }
                    if (advanceRequired != null && !advanceRequired.trim().isEmpty()
                            && !"All".equalsIgnoreCase(advanceRequired)) {
                        predicates.add(criteriaBuilder.equal(root.get("advanceRequired"), advanceRequired));
                    }
                    if (status != null && !status.trim().isEmpty() && !"All".equalsIgnoreCase(status)) {
                        predicates.add(criteriaBuilder.equal(root.get("status"), status));
                    }
                    if (startDate != null) {
                        predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("departureDate"), startDate));
                    }
                    if (endDate != null) {
                        predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("departureDate"), endDate));
                    }

                    return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
                });

        populateEmployeeNames(requests);
        populateEmployeeNames(requests);
        return requests;
    }


    // ================== UPDATE MANAGER FOR PENDING REQUESTS ==================
    @Transactional
    public int updatePendingRequestsManager(String employeeId, String oldManagerId, String newManagerId) {
        System.out.println("=== DEBUG: updatePendingRequestsManager called ===");
        System.out.println("EmployeeId: " + employeeId);
        System.out.println("OldManagerId: " + oldManagerId);
        System.out.println("NewManagerId: " + newManagerId);
        
        if (employeeId == null || newManagerId == null) {
            System.out.println("DEBUG: EmployeeId or NewManagerId is null, returning 0");
            return 0;
        }

        // Find all pending travel requests for this employee with the old manager
        List<TravelRequest> pendingRequests;
        if (oldManagerId != null) {
            System.out.println("DEBUG: Searching for requests with old manager: " + oldManagerId);
            pendingRequests = requestRepository.findByEmployeeIdAndAssignedManagerIdAndStatus(
                    employeeId, oldManagerId, "Pending For Approval");
        } else {
            System.out.println("DEBUG: Old manager is null, searching all pending requests for employee");
            // If oldManagerId is null, find all pending requests for the employee
            pendingRequests = requestRepository.findByEmployeeIdAndStatus(employeeId, "Pending For Approval");
        }

        System.out.println("DEBUG: Found " + pendingRequests.size() + " pending requests");
        
        if (pendingRequests.isEmpty()) {
            // Let's also check if there are any pending requests at all for this employee
            List<TravelRequest> allPending = requestRepository.findByEmployeeIdAndStatus(employeeId, "Pending For Approval");
            System.out.println("DEBUG: Total pending requests for employee: " + allPending.size());
            for (TravelRequest req : allPending) {
                System.out.println("DEBUG: Request ID: " + req.getId() + ", Current Manager: " + req.getAssignedManagerId() + ", Status: " + req.getStatus());
            }
            return 0;
        }

        // Get employee and manager names for notifications
        Employee employee = employeeRepository.findByEmployeeId(employeeId).orElse(null);
        String employeeName = (employee != null)
                ? (employee.getFirstName() + " " + employee.getLastName())
                : "Unknown";

        String oldManagerName = (oldManagerId != null) ? getEmployeeName(oldManagerId) : "None";
        String newManagerName = getEmployeeName(newManagerId);

        System.out.println("DEBUG: Updating " + pendingRequests.size() + " requests");
        
        // Update each pending request
        for (TravelRequest request : pendingRequests) {
            System.out.println("DEBUG: Before update - Request ID: " + request.getId() + 
                             ", Old Manager: " + request.getAssignedManagerId() + 
                             ", New Manager: " + newManagerId);
            
            request.setAssignedManagerId(newManagerId);
            
            System.out.println("DEBUG: After setAssignedManagerId - Request ID: " + request.getId() + 
                             ", Manager: " + request.getAssignedManagerId());
            
            TravelRequest saved = requestRepository.save(request);
            
            System.out.println("DEBUG: After save - Request ID: " + saved.getId() + 
                             ", Saved Manager: " + saved.getAssignedManagerId());

        }

        // Send notifications
        // Notify employee
        if (employee != null) {
            String msgToEmployee = "Your pending travel request(s) have been reassigned to your new manager: "
                    + newManagerName;
            sendNotification(employeeId, msgToEmployee);
            emailService.sendEmail(employee.getEmail(), "Travel Request Manager Changed", msgToEmployee);
        }

        // Notify old manager (if exists)
        if (oldManagerId != null && !oldManagerId.equals(newManagerId)) {
            String msgToOldManager = pendingRequests.size() + " pending travel request(s) from "
                    + employeeName + " (" + employeeId + ") have been reassigned to " + newManagerName
                    + " due to manager change.";
            sendNotification(oldManagerId, msgToOldManager);
            emailService.sendEmail(getEmployeeEmail(oldManagerId),
                    "Travel Requests Reassigned", msgToOldManager);
        }

        // Notify new manager
        String msgToNewManager = pendingRequests.size() + " pending travel request(s) from "
                + employeeName + " (" + employeeId + ") have been assigned to you for approval.";
        sendNotification(newManagerId, msgToNewManager);
        emailService.sendEmail(getEmployeeEmail(newManagerId),
                "New Travel Requests Assigned", msgToNewManager);

        return pendingRequests.size();
    }

    // ================== MANUAL MANAGER REASSIGNMENT (ADMIN) ==================
    @Transactional
    public int reassignRequestManager(Long requestId, String newManagerId, String reason) {
        TravelRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        // Only allow reassignment for pending requests
        if (!"Pending For Approval".equals(request.getStatus())) {
            throw new IllegalArgumentException("Cannot reassign manager for requests that are not pending. Current status: " + request.getStatus());
        }

        String oldManagerId = request.getAssignedManagerId();
        if (newManagerId.equals(oldManagerId)) {
            return 0; // No change needed
        }

        // Verify new manager exists
        if (!employeeRepository.findByEmployeeId(newManagerId).isPresent()) {
            throw new ResourceNotFoundException("New manager not found with id: " + newManagerId);
        }

        // Update the request
        request.setAssignedManagerId(newManagerId);
        requestRepository.save(request);

        // Get names for notifications
        String employeeName = getEmployeeName(request.getEmployeeId());
        String oldManagerName = getEmployeeName(oldManagerId);
        String newManagerName = getEmployeeName(newManagerId);


        // Send notifications
        Employee employee = employeeRepository.findByEmployeeId(request.getEmployeeId()).orElse(null);

        // Notify employee
        if (employee != null) {
            String msgToEmployee = "Your travel request #" + requestId + " has been reassigned to manager: " + newManagerName;
            if (reason != null && !reason.isBlank()) {
                msgToEmployee += ". Reason: " + reason;
            }
            sendNotification(request.getEmployeeId(), msgToEmployee);
            emailService.sendEmail(employee.getEmail(), "Travel Request Manager Reassigned", msgToEmployee);
        }

        // Notify old manager
        if (oldManagerId != null && !oldManagerId.equals(newManagerId)) {
            String msgToOldManager = "Travel request #" + requestId + " from " + employeeName + " has been reassigned to " + newManagerName;
            sendNotification(oldManagerId, msgToOldManager);
            emailService.sendEmail(getEmployeeEmail(oldManagerId), "Travel Request Reassigned", msgToOldManager);
        }

        // Notify new manager
        String msgToNewManager = "Travel request #" + requestId + " from " + employeeName + " has been assigned to you for approval";
        sendNotification(newManagerId, msgToNewManager);
        emailService.sendEmail(getEmployeeEmail(newManagerId), "New Travel Request Assigned", msgToNewManager);

        return 1;
    }

    // ================== DEBUG HELPER METHODS ==================
    public List<TravelRequest> getPendingRequestsForEmployee(String employeeId) {
        return requestRepository.findByEmployeeIdAndStatus(employeeId, "Pending For Approval");
    }

    private String getEmployeeName(String employeeId) {

        if (employeeId == null)
            return "Unknown";
        return employeeRepository.findByEmployeeId(employeeId)
                .map(e -> e.getFirstName() + " " + e.getLastName())
                .orElse("Unknown");
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

}
