package com.register.example.controller;

import com.register.example.entity.Allocation;
import com.register.example.entity.Employee;
import com.register.example.entity.Project;
import com.register.example.payload.AllocationCreateRequest;
import com.register.example.payload.AllocationBulkRequest;
import com.register.example.payload.ContractReportResponse;
import com.register.example.payload.EmployeeAllocationResponse;
import com.register.example.repository.AllocationRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.ProjectRepository;
import com.register.example.service.AuditService;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/allocations")
@CrossOrigin(origins = "*")
public class AllocationController {

    private static final String CONST_EMPLOYEE_ID = "employeeId";
    private static final String CONST_PROJECT_ID = "projectId";
    private static final String CONST_PROJECT = "project";
    private static final String CONST_CUSTOMER_ID = "customerId";
    private static final String CONST_START_DATE = "startDate";
    private static final String CONST_END_DATE = "endDate";
    private static final String CONST_MANAGER_ID = "managerId";
    private static final String CONST_REVIEWER_ID = "reviewerId";
    private static final String CONST_FINANCE_ID = "financeId";
    private static final String CONST_ADMIN_ID = "adminId";
    private static final String CONST_CURRENT = "CURRENT";
    private static final String CONST_ALLOCATION = "ALLOCATION";
    private static final String CONST_SYSTEM = "SYSTEM";
    private static final String CONST_CREATE_ALLOCATION = "CREATE_ALLOCATION";
    private static final String CONST_ALLOCATION_LITERAL = "Allocation";
    private static final String CONST_EMPLOYEE = "EMPLOYEE";
    private static final String CONST_BULK_ALLOCATION = "BulkAllocation";
    private static final String CONST_BULK_CREATE_ALLOCATIONS = "BULK_CREATE_ALLOCATIONS";
    private static final String CONST_EMPLOYEE_LITERAL = "Employee";
    private static final String CONST_VIEW_EMPLOYEE_ALLOCATIONS = "VIEW_EMPLOYEE_ALLOCATIONS";
    private static final String CONST_VIEWED = "Viewed ";
    private static final String CONST_MANAGER_LITERAL = "Manager";
    private static final String CONST_MANAGER = "MANAGER";
    private static final String CONST_VIEW_MANAGER_ALLOCATIONS = "VIEW_MANAGER_ALLOCATIONS";
    private static final String CONST_PROJECT_NAME = "projectName";
    private static final String CONST_ALLOCATION_STATUS = "allocationStatus";
    private static final String CONST_CUSTOMER_NAME = "customerName";

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AllocationController.class);

    private final AllocationRepository allocationRepository;
    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final jakarta.servlet.http.HttpServletRequest request;
    private final com.register.example.service.TravelRequestService travelRequestService;
    private final com.register.example.service.LeaveService leaveService;
    private final com.register.example.service.ClaimService claimService;
    private final AuditService auditService;
    private final com.register.example.service.EmployeeService employeeService;

    public AllocationController(
            AllocationRepository allocationRepository,
            EmployeeRepository employeeRepository,
            ProjectRepository projectRepository,
            jakarta.servlet.http.HttpServletRequest request,
            com.register.example.service.TravelRequestService travelRequestService,
            com.register.example.service.LeaveService leaveService,
            com.register.example.service.ClaimService claimService,
            AuditService auditService,
            com.register.example.service.EmployeeService employeeService) {
        this.allocationRepository = allocationRepository;
        this.employeeRepository = employeeRepository;
        this.projectRepository = projectRepository;
        this.request = request;
        this.travelRequestService = travelRequestService;
        this.leaveService = leaveService;
        this.claimService = claimService;
        this.auditService = auditService;
        this.employeeService = employeeService;
    }

    private String getCurrentUserTenantId() {
        try {
            Object tenantIdAttr = request.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                return tenantIdAttr.toString();
            }
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null) {
                String employeeId = auth.getPrincipal().toString();
                java.util.Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
                if (empOpt.isPresent()) {
                    return empOpt.get().getTenantId();
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    @GetMapping("/fetch-reports")
    public ResponseEntity<List<EmployeeAllocationResponse>> getAllocationReport(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String managerId,
            @RequestParam(required = false) String hrId,
            @RequestParam(required = false) String reviewerId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate toDate,
            HttpServletRequest request) {

        AllocationReportFilter filter = new AllocationReportFilter();
        filter.employeeId = employeeId;
        filter.customerId = customerId;
        filter.projectId = projectId;
        filter.managerId = managerId;
        filter.hrId = hrId;
        filter.reviewerId = reviewerId;
        filter.startDate = startDate;
        filter.endDate = endDate;
        filter.fromDate = fromDate;
        filter.toDate = toDate;

        List<Allocation> results = allocationRepository.findAll(buildAllocationSpecification(filter));

        List<EmployeeAllocationResponse> responseList = new ArrayList<>();
        LocalDate today = LocalDate.now(java.time.ZoneId.systemDefault());

        for (Allocation alloc : results) {
            responseList.add(convertToAllocationResponse(alloc, today));
        }

        logAllocationReportAudit(filter, request);

        return ResponseEntity.ok(responseList);
    }

    private Specification<Allocation> buildAllocationSpecification(AllocationReportFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            String tenantId = getCurrentUserTenantId();
            if (tenantId != null && !tenantId.trim().isEmpty()) {
                predicates.add(cb.like(root.get(CONST_EMPLOYEE_ID), tenantId + "_%"));
            }

            addEmployeePredicate(predicates, root, cb, filter.employeeId);
            addProjectOrCustomerPredicate(predicates, root, cb, filter.projectId, filter.customerId);
            addRolePredicates(predicates, root, cb, filter.managerId, filter.hrId, filter.reviewerId);
            addDatePredicates(predicates, root, cb, filter.startDate, filter.endDate, filter.fromDate, filter.toDate);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private EmployeeAllocationResponse convertToAllocationResponse(Allocation alloc, LocalDate today) {
        EmployeeAllocationResponse dto = new EmployeeAllocationResponse();
        dto.setEmployeeId(alloc.getEmployeeId());
        dto.setProjectId(alloc.getProjectId());
        dto.setStartDate(alloc.getStartDate());
        dto.setEndDate(alloc.getEndDate());

        projectRepository.findById(alloc.getProjectId()).ifPresent(p -> {
            dto.setProjectName(p.getProjectName());
            if (p.getSow() != null && p.getSow().getCustomer() != null) {
                dto.setCustomerName(p.getSow().getCustomer().getCustomerName());
            }
        });

        employeeRepository.findByEmployeeId(alloc.getEmployeeId()).ifPresent(e -> {
            dto.setEmployeeFirstName(e.getFirstName());
            dto.setEmployeeLastName(e.getLastName());
        });

        // Use dynamic approval details based on the allocation's project
        Map<String, String> approvalDetails = employeeService.getEmployeeApprovalDetailsForAllocation(alloc);

        dto.setManagerId(approvalDetails.get(CONST_MANAGER_ID));
        dto.setHrId(approvalDetails.get("hrId"));
        dto.setReviewerId(approvalDetails.get(CONST_REVIEWER_ID));
        dto.setFinanceId(approvalDetails.get(CONST_FINANCE_ID));
        dto.setAdminId(approvalDetails.get(CONST_ADMIN_ID));

        // Populate manager/hr/reviewer names if possible
        if (dto.getManagerId() != null) {
            employeeRepository.findByEmployeeId(dto.getManagerId()).ifPresent(m -> {
                dto.setManagerFirstName(m.getFirstName());
                dto.setManagerLastName(m.getLastName());
            });
        }
        if (dto.getHrId() != null) {
            employeeRepository.findByEmployeeId(dto.getHrId()).ifPresent(h -> {
                dto.setHrFirstName(h.getFirstName());
                dto.setHrLastName(h.getLastName());
            });
        }
        if (dto.getReviewerId() != null) {
            employeeRepository.findByEmployeeId(dto.getReviewerId()).ifPresent(r -> {
                dto.setReviewerFirstName(r.getFirstName());
                dto.setReviewerLastName(r.getLastName());
            });
        }

        if (alloc.getEndDate().isBefore(today)) {
            dto.setAllocationStatus("PAST");
        } else if (alloc.getStartDate().isAfter(today)) {
            dto.setAllocationStatus("NEXT");
        } else {
            dto.setAllocationStatus(CONST_CURRENT);
        }

        return dto;
    }

    private void addEmployeePredicate(List<Predicate> predicates, jakarta.persistence.criteria.Root<Allocation> root,
            jakarta.persistence.criteria.CriteriaBuilder cb, String employeeId) {
        if (employeeId != null && !employeeId.trim().isEmpty()) {
            String[] ids = employeeId.split(",");
            if (ids.length > 1) {
                List<String> idList = Arrays.stream(ids).map(String::trim).filter(s -> !s.isEmpty()).toList();
                predicates.add(root.get(CONST_EMPLOYEE_ID).in(idList));
            } else {
                predicates.add(cb.equal(root.get(CONST_EMPLOYEE_ID), employeeId.trim()));
            }
        }
    }

    private void addProjectOrCustomerPredicate(List<Predicate> predicates,
            jakarta.persistence.criteria.Root<Allocation> root, jakarta.persistence.criteria.CriteriaBuilder cb,
            Long projectId, Long customerId) {
        if (projectId != null) {
            predicates.add(cb.equal(root.get(CONST_PROJECT).get(CONST_PROJECT_ID), projectId));
        } else if (customerId != null) {
            predicates.add(
                    cb.equal(root.get(CONST_PROJECT).get("sow").get("customer").get(CONST_CUSTOMER_ID), customerId));
        }
    }

    private void addRolePredicates(List<Predicate> predicates, jakarta.persistence.criteria.Root<Allocation> root,
            jakarta.persistence.criteria.CriteriaBuilder cb, String managerId, String hrId, String reviewerId) {
        if (managerId != null && !managerId.trim().isEmpty()) {
            predicates.add(cb.equal(root.get(CONST_PROJECT).get("manager"), managerId.trim()));
        }
        if (hrId != null && !hrId.trim().isEmpty()) {
            predicates.add(cb.equal(root.get(CONST_PROJECT).get("hr"), hrId.trim()));
        }
        if (reviewerId != null && !reviewerId.trim().isEmpty()) {
            predicates.add(cb.equal(root.get(CONST_PROJECT).get("reviewer"), reviewerId.trim()));
        }
    }

    private void addDatePredicates(List<Predicate> predicates, jakarta.persistence.criteria.Root<Allocation> root,
            jakarta.persistence.criteria.CriteriaBuilder cb, LocalDate startDate, LocalDate endDate, LocalDate fromDate,
            LocalDate toDate) {
        if (startDate != null) {
            predicates.add(cb.equal(root.get(CONST_START_DATE), startDate));
        }
        if (endDate != null) {
            predicates.add(cb.equal(root.get(CONST_END_DATE), endDate));
        }
        if (fromDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get(CONST_END_DATE), fromDate));
        }
        if (toDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get(CONST_START_DATE), toDate));
        }
    }

    private void logAllocationReportAudit(AllocationReportFilter filter, HttpServletRequest request) {
        Map<String, Object> searchParams = new HashMap<>();
        if (filter.employeeId != null)
            searchParams.put(CONST_EMPLOYEE_ID, filter.employeeId);
        if (filter.customerId != null)
            searchParams.put(CONST_CUSTOMER_ID, filter.customerId);
        if (filter.projectId != null)
            searchParams.put(CONST_PROJECT_ID, filter.projectId);
        if (filter.managerId != null)
            searchParams.put(CONST_MANAGER_ID, filter.managerId);
        if (filter.hrId != null)
            searchParams.put("hrId", filter.hrId);
        if (filter.reviewerId != null)
            searchParams.put(CONST_REVIEWER_ID, filter.reviewerId);
        if (filter.startDate != null)
            searchParams.put(CONST_START_DATE, filter.startDate);
        if (filter.endDate != null)
            searchParams.put(CONST_END_DATE, filter.endDate);
        if (filter.fromDate != null)
            searchParams.put("fromDate", filter.fromDate);
        if (filter.toDate != null)
            searchParams.put("toDate", filter.toDate);

        auditService.logCustomAction("VIEW_ALLOCATION_REPORT", CONST_ALLOCATION, "Report", null, null, CONST_SYSTEM,
                "Allocation report accessed with filters: " + searchParams.toString(), null, null, null, request);
    }

    // ✅ Get all allocations for a given project
    @GetMapping("/project/{projectId}")
    public List<Allocation> getAllocationsByProject(@PathVariable Long projectId, HttpServletRequest request) {
        try {
            String tenantId = getCurrentUserTenantId();
            List<Allocation> list;
            if (tenantId != null && !tenantId.isEmpty()) {
                list = allocationRepository.findByProjectProjectIdAndTenantId(projectId, tenantId);
            } else {
                list = allocationRepository.findByProjectProjectId(projectId);
            }
            list.forEach(this::enrichAllocation);

            auditService.logCustomAction("VIEW_PROJECT_ALLOCATIONS", CONST_ALLOCATION, "Project", projectId, null,
                    CONST_SYSTEM,
                    "Viewed allocations for project ID: " + projectId, null, null, null, request);

            return list;
        } catch (Exception e) {
            auditService.logCustomAction("VIEW_PROJECT_ALLOCATIONS", CONST_ALLOCATION, "Project", projectId, null,
                    CONST_SYSTEM,
                    "Failed to view allocations for project ID: " + projectId + " - Error: " + e.getMessage(), null,
                    null, null, request);
            throw e;
        }
    }

    private String getDisplayEmployeeId(String id) {
        if (id == null)
            return "";
        if (id.contains("_")) {
            return id.substring(id.lastIndexOf("_") + 1);
        }
        if (id.contains("-")) {
            return id.substring(id.lastIndexOf("-") + 1);
        }
        return id;
    }

    // ✅ Create Single Allocation
    @PostMapping
    public Allocation createAllocation(@RequestBody AllocationCreateRequest request, HttpServletRequest httpRequest) {
        try {
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(
                            () -> new IllegalArgumentException("Project not found with ID: " + request.getProjectId()));

            String tenantId = getCurrentUserTenantId();
            if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(project.getTenantId())) {
                throw new IllegalArgumentException("Access denied to this project");
            }

            if (project.getProjectEndDate() != null
                    && project.getProjectEndDate().isBefore(LocalDate.now(java.time.ZoneId.systemDefault()))) {
                auditService.logCustomAction(CONST_CREATE_ALLOCATION, CONST_ALLOCATION, CONST_ALLOCATION_LITERAL, null,
                        request.getEmployeeId(), CONST_EMPLOYEE,
                        "Failed to create allocation - Project expired: " + project.getProjectEndDate(), null, null,
                        null, httpRequest);
                throw new IllegalArgumentException(
                        "Cannot allocate to an expired project. Project ended on: " + project.getProjectEndDate());
            }

            if (request.getEmployeeId() == null || request.getEmployeeId().isEmpty()) {
                auditService.logCustomAction(CONST_CREATE_ALLOCATION, CONST_ALLOCATION, CONST_ALLOCATION_LITERAL, null,
                        null, CONST_EMPLOYEE,
                        "Failed to create allocation - Employee ID is null or empty", null, null, null, httpRequest);
                throw new IllegalArgumentException("Employee ID must not be null or empty");
            }

            Employee employee = employeeRepository.findByEmployeeId(request.getEmployeeId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Employee ID " + getDisplayEmployeeId(request.getEmployeeId())
                                    + " is not existing in Database. Try to add a valid ID."));

            if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(employee.getTenantId())) {
                throw new IllegalArgumentException("Cannot allocate employee from a different tenant");
            }

            // Check if employee is already allocated to this project
            List<Allocation> existing = allocationRepository.findByProjectProjectIdAndTenantId(request.getProjectId(),
                    tenantId);
            boolean alreadyAllocated = existing.stream()
                    .anyMatch(a -> a.getEmployeeId().equals(request.getEmployeeId()));
            if (alreadyAllocated) {
                throw new IllegalArgumentException("Employee ID " + getDisplayEmployeeId(request.getEmployeeId())
                        + " already assigned to this project.");
            }

            // ✅ Sync project approval details to employee_portal table
            syncProjectRolesToEmployee(employee, project);

            Allocation allocation = new Allocation();
            allocation.setProject(project);
            allocation.setEmployeeId(request.getEmployeeId());
            allocation.setStartDate(request.getStartDate());
            allocation.setEndDate(request.getEndDate());

            Allocation savedAllocation = allocationRepository.save(allocation);

            // Store allocation details for audit
            Map<String, Object> allocationDetails = new HashMap<>();
            allocationDetails.put(CONST_PROJECT_ID, request.getProjectId());
            allocationDetails.put(CONST_START_DATE, request.getStartDate());
            allocationDetails.put(CONST_END_DATE, request.getEndDate());

            // Log successful allocation creation
            auditService.logCustomAction(CONST_CREATE_ALLOCATION, CONST_ALLOCATION, CONST_ALLOCATION_LITERAL,
                    savedAllocation.getAllocationId(),
                    request.getEmployeeId(), CONST_EMPLOYEE,
                    "Allocation created successfully for project: " + project.getProjectName(),
                    null, allocationDetails, null, httpRequest);

            enrichAllocation(savedAllocation); // Enrich with employee name
            return savedAllocation;
        } catch (Exception e) {
            if (!(e instanceof IllegalArgumentException)) {
                auditService.logCustomAction(CONST_CREATE_ALLOCATION, CONST_ALLOCATION, CONST_ALLOCATION_LITERAL, null,
                        request.getEmployeeId(), CONST_EMPLOYEE,
                        "Failed to create allocation - Error: " + e.getMessage(), null, null, null, httpRequest);
            }
            throw e;
        }
    }

    // ✅ Bulk allocation
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> createBulkAllocations(@RequestBody AllocationBulkRequest request,
            HttpServletRequest httpRequest) {
        try {
            Project project = validateProjectForBulk(request, httpRequest);
            String tenantId = getCurrentUserTenantId();

            validateEmployeeIds(request.getEmployeeIds(), httpRequest);
            checkEmployeesExistAndTenant(request.getEmployeeIds(), tenantId);
            checkExistingAllocationsForBulk(request.getProjectId(), request.getEmployeeIds(), tenantId);

            List<Allocation> savedAllocations = new ArrayList<>();
            List<String> failedAllocations = new ArrayList<>();

            performBulkSaves(project, request.getEmployeeIds(), request.getStartDate(), request.getEndDate(),
                    savedAllocations, failedAllocations);

            Map<String, Object> response = new HashMap<>();
            response.put("successfulAllocations", savedAllocations);
            response.put("failedEmployeeIds", failedAllocations);
            response.put("message",
                    failedAllocations.isEmpty() ? "All employees allocated successfully" : "Some allocations failed");

            // Log bulk allocation result
            Map<String, Object> bulkResult = new HashMap<>();
            bulkResult.put("totalEmployees", request.getEmployeeIds().size());
            bulkResult.put("successfulAllocations", savedAllocations.size());
            bulkResult.put("failedAllocations", failedAllocations.size());
            bulkResult.put(CONST_PROJECT_ID, request.getProjectId());

            auditService.logCustomAction(CONST_BULK_CREATE_ALLOCATIONS, CONST_ALLOCATION, CONST_BULK_ALLOCATION, null,
                    CONST_SYSTEM, CONST_SYSTEM,
                    "Bulk allocation completed for project: " + project.getProjectName() + " - "
                            + response.get("message"),
                    null, bulkResult, null, httpRequest);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            if (!(e instanceof IllegalArgumentException)) {
                String errorMessage = e.getMessage() != null ? e.getMessage() : e.toString();
                try {
                    auditService.logCustomAction("BULK_CREATE_ALLOCATIONS_ERROR", CONST_ALLOCATION,
                            CONST_BULK_ALLOCATION, null, CONST_SYSTEM, CONST_SYSTEM,
                            "Failed bulk allocation - Error: " + errorMessage, null, null, null, httpRequest);
                } catch (Exception auditEx) {
                    // Secondary error ignored
                }
            }
            throw e;
        }
    }

    private Project validateProjectForBulk(AllocationBulkRequest request, HttpServletRequest httpRequest) {
        Optional<Project> projectOpt = projectRepository.findById(request.getProjectId());
        if (projectOpt.isEmpty()) {
            auditService.logCustomAction(CONST_BULK_CREATE_ALLOCATIONS, CONST_ALLOCATION, CONST_BULK_ALLOCATION, null,
                    CONST_SYSTEM, CONST_SYSTEM,
                    "Failed bulk allocation - Project not found with ID: " + request.getProjectId(), null, null, null,
                    httpRequest);
            throw new IllegalArgumentException("Project not found with ID: " + request.getProjectId());
        }
        Project project = projectOpt.get();

        String tenantId = getCurrentUserTenantId();
        if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(project.getTenantId())) {
            throw new IllegalArgumentException("Access denied to this project");
        }

        if (project.getProjectEndDate() != null
                && project.getProjectEndDate().isBefore(LocalDate.now(java.time.ZoneId.systemDefault()))) {
            auditService.logCustomAction(CONST_BULK_CREATE_ALLOCATIONS, CONST_ALLOCATION, CONST_BULK_ALLOCATION, null,
                    CONST_SYSTEM, CONST_SYSTEM,
                    "Failed bulk allocation - Project expired: " + project.getProjectEndDate(), null, null, null,
                    httpRequest);
            throw new IllegalArgumentException(
                    "Cannot allocate to an expired project. Project ended on: " + project.getProjectEndDate());
        }
        return project;
    }

    private void validateEmployeeIds(List<String> employeeIds, HttpServletRequest httpRequest) {
        if (employeeIds == null || employeeIds.isEmpty()) {
            auditService.logCustomAction(CONST_BULK_CREATE_ALLOCATIONS, CONST_ALLOCATION, CONST_BULK_ALLOCATION, null,
                    CONST_SYSTEM, CONST_SYSTEM,
                    "Failed bulk allocation - Employee ID list is empty", null, null, null, httpRequest);
            throw new IllegalArgumentException("Employee ID list must not be empty");
        }

        // Check for duplicates in the input request list
        Set<String> uniqueEmpIds = new HashSet<>();
        List<String> duplicatesInInput = new ArrayList<>();
        for (String empId : employeeIds) {
            if (!uniqueEmpIds.add(empId) && !duplicatesInInput.contains(empId)) {
                duplicatesInInput.add(empId);
            }
        }
        if (!duplicatesInInput.isEmpty()) {
            List<String> cleanDuplicates = duplicatesInInput.stream().map(this::getDisplayEmployeeId).toList();
            String msg = "Duplicate Employee ID" + (cleanDuplicates.size() > 1 ? "s" : "") + " "
                    + String.join(", ", cleanDuplicates) + " entered in input.";
            throw new IllegalArgumentException(msg);
        }
    }

    private void checkEmployeesExistAndTenant(List<String> employeeIds, String tenantId) {
        for (String empId : employeeIds) {
            Optional<Employee> empOpt = employeeRepository.findByEmployeeId(empId);
            if (empOpt.isEmpty()) {
                String cleanId = getDisplayEmployeeId(empId);
                throw new IllegalArgumentException(
                        "Employee ID " + cleanId + " is not existing in Database. Try to add a valid ID.");
            }
            Employee employee = empOpt.get();
            if (tenantId != null && !tenantId.isEmpty() && !tenantId.equals(employee.getTenantId())) {
                throw new IllegalArgumentException(
                        "Cannot allocate employee " + getDisplayEmployeeId(empId) + " from a different tenant");
            }
        }
    }

    private void checkExistingAllocationsForBulk(Long projectId, List<String> employeeIds, String tenantId) {
        List<Allocation> existing = allocationRepository.findByProjectProjectIdAndTenantId(projectId, tenantId);
        Set<String> existingEmpIds = new HashSet<>();
        for (Allocation a : existing) {
            existingEmpIds.add(a.getEmployeeId());
        }

        List<String> alreadyAllocated = new ArrayList<>();
        for (String empId : employeeIds) {
            if (existingEmpIds.contains(empId)) {
                alreadyAllocated.add(empId);
            }
        }
        if (!alreadyAllocated.isEmpty()) {
            List<String> cleanAlreadyAllocated = alreadyAllocated.stream().map(this::getDisplayEmployeeId).toList();
            String msg = "Employee ID" + (cleanAlreadyAllocated.size() > 1 ? "s" : "") + " "
                    + String.join(", ", cleanAlreadyAllocated) + " already assigned to this project.";
            throw new IllegalArgumentException(msg);
        }
    }

    private void performBulkSaves(Project project, List<String> employeeIds, LocalDate startDate, LocalDate endDate,
            List<Allocation> savedAllocations, List<String> failedAllocations) {
        for (String empId : employeeIds) {
            try {
                Employee employee = employeeRepository.findByEmployeeId(empId).orElseThrow();

                // Sync project approval details
                syncProjectRolesToEmployee(employee, project);

                Allocation allocation = new Allocation();
                allocation.setProject(project);
                allocation.setEmployeeId(empId);
                allocation.setStartDate(startDate);
                allocation.setEndDate(endDate);

                Allocation savedAllocation = allocationRepository.save(allocation);
                enrichAllocation(savedAllocation);
                savedAllocations.add(savedAllocation);
            } catch (Exception e) {
                failedAllocations.add(empId);
            }
        }
    }

    // ============================================================
    // ✅ Get allocations for an employee + status logic
    // ============================================================
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EmployeeAllocationResponse>> getAllocationsForEmployee(@PathVariable String employeeId,
            HttpServletRequest request) {
        try {
            String tenantId = getCurrentUserTenantId();
            List<Allocation> allocations = allocationRepository.findByEmployeeId(employeeId);
            if (tenantId != null && !tenantId.isEmpty()) {
                allocations = allocations.stream()
                        .filter(a -> a.getEmployeeId() != null && a.getEmployeeId().startsWith(tenantId + "_"))
                        .toList();
            }

            if (allocations.isEmpty()) {
                auditService.logCustomAction(CONST_VIEW_EMPLOYEE_ALLOCATIONS, CONST_ALLOCATION, CONST_EMPLOYEE_LITERAL,
                        null, employeeId, CONST_EMPLOYEE,
                        "Viewed allocations - No allocations found for employee", null, null, null, request);
                return ResponseEntity.ok(Collections.emptyList());
            }

            List<EmployeeAllocationResponse> responseList = new ArrayList<>();
            LocalDate today = LocalDate.now(java.time.ZoneId.systemDefault());

            for (Allocation alloc : allocations) {
                EmployeeAllocationResponse dto = mapAllocationToResponse(alloc, today);
                if (dto != null) {
                    responseList.add(dto);
                }
            }

            // Log successful view of employee allocations
            auditService.logCustomAction(CONST_VIEW_EMPLOYEE_ALLOCATIONS, CONST_ALLOCATION, CONST_EMPLOYEE_LITERAL,
                    null, employeeId, CONST_EMPLOYEE,
                    CONST_VIEWED + responseList.size() + " allocations for employee", null, null, null, request);

            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            auditService.logCustomAction(CONST_VIEW_EMPLOYEE_ALLOCATIONS, CONST_ALLOCATION, CONST_EMPLOYEE_LITERAL,
                    null, employeeId, CONST_EMPLOYEE,
                    "Failed to view allocations for employee - Error: " + e.getMessage(), null, null, null, request);
            throw e;
        }
    }

    private EmployeeAllocationResponse mapAllocationToResponse(Allocation alloc, LocalDate today) {
        Project project = alloc.getProject();
        if (project == null)
            return null;

        EmployeeAllocationResponse dto = new EmployeeAllocationResponse();

        dto.setProjectId(project.getProjectId());
        dto.setProjectName(project.getProjectName());

        if (project.getSow() != null && project.getSow().getCustomer() != null) {
            dto.setCustomerName(project.getSow().getCustomer().getCustomerName());
        }

        LocalDate start = alloc.getStartDate();
        LocalDate end = alloc.getEndDate();

        dto.setStartDate(start);
        dto.setEndDate(end);

        if (end.isBefore(today)) {
            dto.setAllocationStatus("PAST");
        } else if (start.isAfter(today)) {
            dto.setAllocationStatus("NEXT");
        } else {
            dto.setAllocationStatus(CONST_CURRENT);
        }

        Map<String, String> approvalDetails = employeeService.getEmployeeApprovalDetailsForAllocation(alloc);

        if (approvalDetails.get(CONST_MANAGER_ID) != null) {
            dto.setManagerId(approvalDetails.get(CONST_MANAGER_ID));
            employeeRepository.findByEmployeeId(approvalDetails.get(CONST_MANAGER_ID))
                    .ifPresent(mgr -> {
                        dto.setManagerFirstName(mgr.getFirstName());
                        dto.setManagerLastName(mgr.getLastName());
                    });
        }

        if (approvalDetails.get("hrId") != null) {
            dto.setHrId(approvalDetails.get("hrId"));
            employeeRepository.findByEmployeeId(approvalDetails.get("hrId"))
                    .ifPresent(hr -> {
                        dto.setHrFirstName(hr.getFirstName());
                        dto.setHrLastName(hr.getLastName());
                    });
        }

        if (approvalDetails.get(CONST_REVIEWER_ID) != null) {
            dto.setReviewerId(approvalDetails.get(CONST_REVIEWER_ID));
            employeeRepository.findByEmployeeId(approvalDetails.get(CONST_REVIEWER_ID))
                    .ifPresent(rv -> {
                        dto.setReviewerFirstName(rv.getFirstName());
                        dto.setReviewerLastName(rv.getLastName());
                    });
        }

        return dto;
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<Map<String, Object>>> getAllocationsForManager(@PathVariable String managerId,
            HttpServletRequest request) {
        try {
            String tenantId = getCurrentUserTenantId();
            List<Employee> employeeList = employeeRepository.findByAssignedManagerId(managerId);
            if (tenantId != null && !tenantId.isEmpty()) {
                employeeList = employeeList.stream().filter(e -> tenantId.equals(e.getTenantId())).toList();
            }

            if (employeeList.isEmpty()) {
                auditService.logCustomAction(CONST_VIEW_MANAGER_ALLOCATIONS, CONST_ALLOCATION, CONST_MANAGER_LITERAL,
                        null, managerId, CONST_MANAGER,
                        "Viewed allocations - No employees found for manager", null, null, null, request);
                return ResponseEntity.ok(Collections.emptyList());
            }

            List<String> employeeIds = employeeList.stream()
                    .map(Employee::getEmployeeId)
                    .toList();

            List<Allocation> allocations = allocationRepository.findByEmployeeIdIn(employeeIds);
            if (tenantId != null && !tenantId.isEmpty()) {
                allocations = allocations.stream()
                        .filter(a -> a.getEmployeeId() != null && a.getEmployeeId().startsWith(tenantId + "_"))
                        .toList();
            }

            List<Map<String, Object>> response = new ArrayList<>();
            LocalDate today = LocalDate.now(java.time.ZoneId.systemDefault());

            for (Allocation alloc : allocations) {
                response.add(mapAllocationToManagerMap(alloc, today));
            }

            // Log successful view of manager allocations
            auditService.logCustomAction(CONST_VIEW_MANAGER_ALLOCATIONS, CONST_ALLOCATION, CONST_MANAGER_LITERAL, null,
                    managerId, CONST_MANAGER,
                    CONST_VIEWED + response.size() + " allocations for manager's team", null, null, null, request);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            auditService.logCustomAction(CONST_VIEW_MANAGER_ALLOCATIONS, CONST_ALLOCATION, CONST_MANAGER_LITERAL, null,
                    managerId, CONST_MANAGER,
                    "Failed to view allocations for manager - Error: " + e.getMessage(), null, null, null, request);
            throw e;
        }
    }

    private Map<String, Object> mapAllocationToManagerMap(Allocation alloc, LocalDate today) {
        Map<String, Object> map = new HashMap<>();

        map.put(CONST_EMPLOYEE_ID, alloc.getEmployeeId());

        employeeRepository.findByEmployeeId(alloc.getEmployeeId())
                .ifPresent(emp -> {
                    map.put("employeeFirstName", emp.getFirstName());
                    map.put("employeeLastName", emp.getLastName());
                });

        Project project = alloc.getProject();
        if (project != null) {
            map.put(CONST_PROJECT_ID, project.getProjectId());
            map.put(CONST_PROJECT_NAME, project.getProjectName());

            if (project.getSow() != null && project.getSow().getCustomer() != null) {
                map.put("clientName", project.getSow().getCustomer().getCustomerName());
            }
        }

        map.put(CONST_START_DATE, alloc.getStartDate());
        map.put(CONST_END_DATE, alloc.getEndDate());

        if (alloc.getEndDate().isBefore(today)) {
            map.put(CONST_ALLOCATION_STATUS, "PAST");
        } else if (alloc.getStartDate().isAfter(today)) {
            map.put(CONST_ALLOCATION_STATUS, "NEXT");
        } else {
            map.put(CONST_ALLOCATION_STATUS, CONST_CURRENT);
        }
        return map;
    }

    @GetMapping("/employee/{employeeId}/date/{date}")
    public ResponseEntity<List<Map<String, Object>>> getAllocationsByEmployeeAndDate(
            @PathVariable String employeeId,
            @PathVariable LocalDate date,
            HttpServletRequest request) {
        try {
            String tenantId = getCurrentUserTenantId();
            List<Allocation> allocations = allocationRepository
                    .findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                            employeeId, date, date);
            if (tenantId != null && !tenantId.isEmpty()) {
                allocations = allocations.stream()
                        .filter(a -> a.getEmployeeId() != null && a.getEmployeeId().startsWith(tenantId + "_"))
                        .toList();
            }

            List<Map<String, Object>> response = new ArrayList<>();

            for (Allocation alloc : allocations) {
                Project project = alloc.getProject();
                if (project == null)
                    continue;

                Map<String, Object> map = new HashMap<>();
                map.put(CONST_PROJECT_ID, project.getProjectId());
                map.put(CONST_PROJECT_NAME, project.getProjectName());

                if (project.getSow() != null && project.getSow().getCustomer() != null) {
                    map.put(CONST_CUSTOMER_ID, project.getSow().getCustomer().getCustomerId());
                    map.put(CONST_CUSTOMER_NAME, project.getSow().getCustomer().getCustomerName());
                }

                response.add(map);
            }

            auditService.logCustomAction("VIEW_ALLOCATION_BY_DATE", CONST_ALLOCATION, CONST_EMPLOYEE_LITERAL, null,
                    employeeId, CONST_EMPLOYEE,
                    CONST_VIEWED + response.size() + " allocations for employee on date: " + date, null, null, null,
                    request);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            auditService.logCustomAction("VIEW_ALLOCATION_BY_DATE", CONST_ALLOCATION, CONST_EMPLOYEE_LITERAL, null,
                    employeeId, CONST_EMPLOYEE,
                    "Failed to view allocations by date - Error: " + e.getMessage(), null, null, null, request);
            throw e;
        }
    }

    @PutMapping("/{allocationId}")
    public Allocation updateAllocation(
            @PathVariable Long allocationId,
            @RequestBody AllocationCreateRequest request,
            HttpServletRequest httpRequest) {
        try {
            Allocation allocation = allocationRepository.findById(allocationId)
                    .orElseThrow(() -> new IllegalArgumentException("Allocation not found with ID: " + allocationId));

            String tenantId = getCurrentUserTenantId();
            if (tenantId != null && !tenantId.isEmpty()) {
                String allocTenantId = null;
                if (allocation.getEmployeeId() != null && allocation.getEmployeeId().contains("_")) {
                    allocTenantId = allocation.getEmployeeId().split("_")[0];
                }
                if (allocTenantId != null && !tenantId.equals(allocTenantId)) {
                    throw new IllegalArgumentException("Access denied to this allocation");
                }
            }

            // Store old values for audit
            Map<String, Object> oldValues = new HashMap<>();
            oldValues.put(CONST_START_DATE, allocation.getStartDate());
            oldValues.put(CONST_END_DATE, allocation.getEndDate());
            oldValues.put(CONST_PROJECT_ID, allocation.getProjectId());
            oldValues.put(CONST_EMPLOYEE_ID, allocation.getEmployeeId());

            allocation.setStartDate(request.getStartDate());
            allocation.setEndDate(request.getEndDate());

            Allocation updatedAllocation = allocationRepository.save(allocation);

            // Store new values for audit
            Map<String, Object> newValues = new HashMap<>();
            newValues.put(CONST_START_DATE, updatedAllocation.getStartDate());
            newValues.put(CONST_END_DATE, updatedAllocation.getEndDate());
            newValues.put(CONST_PROJECT_ID, updatedAllocation.getProjectId());
            newValues.put(CONST_EMPLOYEE_ID, updatedAllocation.getEmployeeId());

            // Log successful allocation update
            auditService.logCustomAction("UPDATE_ALLOCATION", CONST_ALLOCATION, CONST_ALLOCATION_LITERAL, allocationId,
                    allocation.getEmployeeId(), CONST_EMPLOYEE, "Allocation dates updated successfully",
                    oldValues, newValues, null, httpRequest);

            enrichAllocation(updatedAllocation); // Enrich with employee name
            return updatedAllocation;
        } catch (Exception e) {
            auditService.logCustomAction("UPDATE_ALLOCATION", CONST_ALLOCATION, CONST_ALLOCATION_LITERAL, allocationId,
                    null, CONST_EMPLOYEE,
                    "Failed to update allocation - Error: " + e.getMessage(), null, null, null, httpRequest);
            throw e;
        }
    }

    @GetMapping("/contract-report")
    public ResponseEntity<List<ContractReportResponse>> getContractManagementReport(
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate msaStartDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate msaEndDate,
            @RequestParam(required = false) String sowName,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate sowStartDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate sowEndDate,
            @RequestParam(required = false) Integer sowTotalEffort,
            @RequestParam(required = false) Double sowTotalCost,
            @RequestParam(required = false) String projectName,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate projectStartDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate projectEndDate,
            @RequestParam(required = false) Double projectTotalCost,
            @RequestParam(required = false) Double projectTotalEffort,
            @RequestParam(required = false) String managerId,
            @RequestParam(required = false) String reviewerId,
            @RequestParam(required = false) String hrId,
            @RequestParam(required = false) String financeId,
            @RequestParam(required = false) String adminId,
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate allocationStartDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate allocationEndDate,
            HttpServletRequest request) {

        ContractReportFilter filter = new ContractReportFilter();
        filter.customerName = customerName;
        filter.msaStartDate = msaStartDate;
        filter.msaEndDate = msaEndDate;
        filter.sowName = sowName;
        filter.sowStartDate = sowStartDate;
        filter.sowEndDate = sowEndDate;
        filter.sowTotalEffort = sowTotalEffort;
        filter.sowTotalCost = sowTotalCost;
        filter.projectName = projectName;
        filter.projectStartDate = projectStartDate;
        filter.projectEndDate = projectEndDate;
        filter.projectTotalCost = projectTotalCost;
        filter.projectTotalEffort = projectTotalEffort;
        filter.managerId = managerId;
        filter.reviewerId = reviewerId;
        filter.hrId = hrId;
        filter.financeId = financeId;
        filter.adminId = adminId;
        filter.employeeId = employeeId;
        filter.allocationStartDate = allocationStartDate;
        filter.allocationEndDate = allocationEndDate;

        List<Allocation> results = allocationRepository.findAll(buildContractSpecification(filter));

        List<ContractReportResponse> report = new ArrayList<>();
        for (Allocation alloc : results) {
            report.add(convertToContractReportResponse(alloc));
        }

        logContractReportAudit(filter, request);

        return ResponseEntity.ok(report);
    }

    private Specification<Allocation> buildContractSpecification(ContractReportFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            String tenantId = getCurrentUserTenantId();
            if (tenantId != null && !tenantId.trim().isEmpty()) {
                predicates.add(cb.like(root.get(CONST_EMPLOYEE_ID), tenantId + "_%"));
            }

            Join<Allocation, Project> projectJoin = root.join(CONST_PROJECT, JoinType.LEFT);
            Join<Project, com.register.example.entity.Sow> sowJoin = projectJoin.join("sow", JoinType.LEFT);
            Join<com.register.example.entity.Sow, com.register.example.entity.Customer> customerJoin = sowJoin
                    .join("customer", JoinType.LEFT);

            addCustomerPredicates(predicates, customerJoin, cb, filter);
            addSowPredicates(predicates, sowJoin, cb, filter);
            addProjectPredicates(predicates, projectJoin, cb, filter);
            addProjectRolePredicates(predicates, projectJoin, cb, filter);
            addAllocationPredicates(predicates, root, cb, filter);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void addCustomerPredicates(List<Predicate> predicates,
            Join<com.register.example.entity.Sow, com.register.example.entity.Customer> customer,
            jakarta.persistence.criteria.CriteriaBuilder cb, ContractReportFilter filter) {
        if (filter.customerName != null && !filter.customerName.trim().isEmpty()) {
            predicates.add(cb.like(cb.lower(customer.get(CONST_CUSTOMER_NAME)),
                    "%" + filter.customerName.toLowerCase().trim() + "%"));
        }
        if (filter.msaStartDate != null) {
            predicates.add(cb.equal(customer.get(CONST_START_DATE), filter.msaStartDate));
        }
        if (filter.msaEndDate != null) {
            predicates.add(cb.equal(customer.get(CONST_END_DATE), filter.msaEndDate));
        }
    }

    private void addSowPredicates(List<Predicate> predicates, Join<Project, com.register.example.entity.Sow> sow,
            jakarta.persistence.criteria.CriteriaBuilder cb, ContractReportFilter filter) {
        if (filter.sowName != null && !filter.sowName.trim().isEmpty()) {
            predicates.add(cb.like(cb.lower(sow.get("sowName")), "%" + filter.sowName.toLowerCase().trim() + "%"));
        }
        if (filter.sowStartDate != null) {
            predicates.add(cb.equal(sow.get("sowStartDate"), filter.sowStartDate));
        }
        if (filter.sowEndDate != null) {
            predicates.add(cb.equal(sow.get("sowEndDate"), filter.sowEndDate));
        }
        if (filter.sowTotalEffort != null) {
            predicates.add(cb.equal(sow.get("totalEffort"), filter.sowTotalEffort));
        }
        if (filter.sowTotalCost != null) {
            predicates.add(cb.equal(sow.get("totalCost"), filter.sowTotalCost));
        }
    }

    private void addProjectPredicates(List<Predicate> predicates, Join<Allocation, Project> project,
            jakarta.persistence.criteria.CriteriaBuilder cb, ContractReportFilter filter) {
        if (filter.projectName != null && !filter.projectName.trim().isEmpty()) {
            predicates.add(cb.like(cb.lower(project.get(CONST_PROJECT_NAME)),
                    "%" + filter.projectName.toLowerCase().trim() + "%"));
        }
        if (filter.projectStartDate != null) {
            predicates.add(cb.equal(project.get("projectStartDate"), filter.projectStartDate));
        }
        if (filter.projectEndDate != null) {
            predicates.add(cb.equal(project.get("projectEndDate"), filter.projectEndDate));
        }
        if (filter.projectTotalCost != null) {
            predicates.add(cb.equal(project.get("totalCost"), filter.projectTotalCost));
        }
        if (filter.projectTotalEffort != null) {
            predicates.add(cb.equal(project.get("totalEffort"), filter.projectTotalEffort));
        }
    }

    private void addProjectRolePredicates(List<Predicate> predicates, Join<Allocation, Project> project,
            jakarta.persistence.criteria.CriteriaBuilder cb, ContractReportFilter filter) {
        if (filter.managerId != null && !filter.managerId.trim().isEmpty()) {
            predicates.add(cb.equal(project.get("manager"), filter.managerId.trim()));
        }
        if (filter.reviewerId != null && !filter.reviewerId.trim().isEmpty()) {
            predicates.add(cb.equal(project.get("reviewer"), filter.reviewerId.trim()));
        }
        if (filter.hrId != null && !filter.hrId.trim().isEmpty()) {
            predicates.add(cb.equal(project.get("hr"), filter.hrId.trim()));
        }
        if (filter.financeId != null && !filter.financeId.trim().isEmpty()) {
            predicates.add(cb.equal(project.get("finance"), filter.financeId.trim()));
        }
        if (filter.adminId != null && !filter.adminId.trim().isEmpty()) {
            predicates.add(cb.equal(project.get("admin"), filter.adminId.trim()));
        }
    }

    private void addAllocationPredicates(List<Predicate> predicates, jakarta.persistence.criteria.Root<Allocation> root,
            jakarta.persistence.criteria.CriteriaBuilder cb, ContractReportFilter filter) {
        if (filter.employeeId != null && !filter.employeeId.trim().isEmpty()) {
            predicates.add(cb.equal(root.get(CONST_EMPLOYEE_ID), filter.employeeId.trim()));
        }
        if (filter.allocationStartDate != null) {
            predicates.add(cb.equal(root.get(CONST_START_DATE), filter.allocationStartDate));
        }
        if (filter.allocationEndDate != null) {
            predicates.add(cb.equal(root.get(CONST_END_DATE), filter.allocationEndDate));
        }
    }

    private ContractReportResponse convertToContractReportResponse(Allocation alloc) {
        ContractReportResponse dto = new ContractReportResponse();
        Project p = alloc.getProject();

        if (p != null) {
            dto.setProjectName(p.getProjectName());
            dto.setProjectStartDate(p.getProjectStartDate());
            dto.setProjectEndDate(p.getProjectEndDate());
            dto.setProjectTotalCost(p.getTotalCost());
            dto.setProjectTotalEffort(p.getTotalEffort());

            // Use dynamic approval details based on the allocation's project
            Map<String, String> approvalDetails = employeeService.getEmployeeApprovalDetailsForAllocation(alloc);

            dto.setManagerId(approvalDetails.get(CONST_MANAGER_ID));
            dto.setReviewerId(approvalDetails.get(CONST_REVIEWER_ID));
            dto.setHrId(approvalDetails.get("hrId"));
            dto.setFinanceId(approvalDetails.get(CONST_FINANCE_ID));
            dto.setAdminId(approvalDetails.get(CONST_ADMIN_ID));

            if (p.getSow() != null) {
                com.register.example.entity.Sow s = p.getSow();
                dto.setSowName(s.getSowName());
                dto.setSowStartDate(s.getSowStartDate());
                dto.setSowEndDate(s.getSowEndDate());
                dto.setSowTotalEffort(s.getTotalEffort());
                dto.setSowTotalCost(s.getTotalCost());

                if (s.getCustomer() != null) {
                    dto.setCustomerName(s.getCustomer().getCustomerName());
                    dto.setMsaStartDate(s.getCustomer().getStartDate());
                    dto.setMsaEndDate(s.getCustomer().getEndDate());
                }
            }
        }

        dto.setAllocatedEmployeeId(alloc.getEmployeeId());
        dto.setAllocationStartDate(alloc.getStartDate());
        dto.setAllocationEndDate(alloc.getEndDate());

        return dto;
    }

    private void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }

    private void logContractReportAudit(ContractReportFilter filter, HttpServletRequest request) {
        Map<String, Object> reportParams = new HashMap<>();
        putIfNotNull(reportParams, CONST_CUSTOMER_NAME, filter.customerName);
        putIfNotNull(reportParams, "msaStartDate", filter.msaStartDate);
        putIfNotNull(reportParams, "msaEndDate", filter.msaEndDate);
        putIfNotNull(reportParams, "sowName", filter.sowName);
        putIfNotNull(reportParams, "sowStartDate", filter.sowStartDate);
        putIfNotNull(reportParams, "sowEndDate", filter.sowEndDate);
        putIfNotNull(reportParams, "sowTotalEffort", filter.sowTotalEffort);
        putIfNotNull(reportParams, "sowTotalCost", filter.sowTotalCost);
        putIfNotNull(reportParams, CONST_PROJECT_NAME, filter.projectName);
        putIfNotNull(reportParams, "projectStartDate", filter.projectStartDate);
        putIfNotNull(reportParams, "projectEndDate", filter.projectEndDate);
        putIfNotNull(reportParams, "projectTotalCost", filter.projectTotalCost);
        putIfNotNull(reportParams, "projectTotalEffort", filter.projectTotalEffort);
        putIfNotNull(reportParams, CONST_MANAGER_ID, filter.managerId);
        putIfNotNull(reportParams, CONST_REVIEWER_ID, filter.reviewerId);
        putIfNotNull(reportParams, "hrId", filter.hrId);
        putIfNotNull(reportParams, CONST_FINANCE_ID, filter.financeId);
        putIfNotNull(reportParams, CONST_ADMIN_ID, filter.adminId);
        putIfNotNull(reportParams, CONST_EMPLOYEE_ID, filter.employeeId);
        putIfNotNull(reportParams, "allocationStartDate", filter.allocationStartDate);
        putIfNotNull(reportParams, "allocationEndDate", filter.allocationEndDate);

        auditService.logCustomAction("VIEW_CONTRACT_REPORT", CONST_ALLOCATION, "ContractReport", null, null,
                CONST_SYSTEM,
                "Contract report accessed with filters: " + reportParams.toString(), null, null, null, request);
    }

    private void syncProjectRolesToEmployee(Employee employee, Project project) {
        try {
            employee.setAssignedManagerId(project.getManager());
            employee.setReviewerId(project.getReviewer());
            employee.setAssignedHrId(project.getHr());
            employee.setAssignedFinanceId(project.getFinance());
            employee.setAssignedAdminId(project.getAdmin());
            employeeRepository.save(employee);
        } catch (Exception e) {
            logger.error("Failed to sync project roles to employee_portal during allocation: {}", e.getMessage());
        }
    }

    private void enrichAllocation(Allocation alloc) {
        if (alloc == null || alloc.getEmployeeId() == null)
            return;
        employeeRepository.findByEmployeeId(alloc.getEmployeeId())
                .ifPresent(e -> alloc.setEmployeeName(e.getFirstName() + " " + e.getLastName()));
    }

    public static class AllocationReportFilter {
        public String employeeId;
        public Long customerId;
        public Long projectId;
        public String managerId;
        public String hrId;
        public String reviewerId;
        public LocalDate startDate;
        public LocalDate endDate;
        public LocalDate fromDate;
        public LocalDate toDate;
    }

    public static class ContractReportFilter {
        public String customerName;
        public LocalDate msaStartDate;
        public LocalDate msaEndDate;
        public String sowName;
        public LocalDate sowStartDate;
        public LocalDate sowEndDate;
        public Integer sowTotalEffort;
        public Double sowTotalCost;
        public String projectName;
        public LocalDate projectStartDate;
        public LocalDate projectEndDate;
        public Double projectTotalCost;
        public Double projectTotalEffort;
        public String managerId;
        public String reviewerId;
        public String hrId;
        public String financeId;
        public String adminId;
        public String employeeId;
        public LocalDate allocationStartDate;
        public LocalDate allocationEndDate;
    }

}
