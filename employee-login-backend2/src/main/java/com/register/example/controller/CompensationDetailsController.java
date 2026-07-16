package com.register.example.controller;

import com.register.example.entity.CompensationDetails;
import com.register.example.repository.CompensationDetailsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import com.register.example.service.NotificationService;
import com.register.example.service.EmailService;
import com.register.example.repository.CompensationTemplateRepository;
import com.register.example.service.HikeLetterService;
import com.register.example.entity.Employee;
import com.register.example.entity.CompensationTemplate;
import com.register.example.entity.EmployeeDocument;
import com.register.example.repository.EmployeeDocumentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import com.register.example.dto.CalcComponentDTO;

@RestController
@RequestMapping("/api/compensation")
public class CompensationDetailsController {

    private static final String CONST_ERROR = "error";
    private static final String CONST_CREATED_AT = "createdAt";
    private static final String CONST_EMPLOYEE_ID = "employeeId";
    private static final String CONST_EMPLOYEE_NAME = "employeeName";
    private static final String CONST_DEPARTMENT = "department";
    private static final String CONST_DESIGNATION = "designation";
    private static final String CONST_CURRENT_FIXED_CTC = "currentFixedCtc";
    private static final String CONST_CURRENT_VARIABLE_PAY = "currentVariablePay";
    private static final String CONST_EFFECTIVE_DATE = "effectiveDate";
    private static final String CONST_HIKE_PERCENTAGE = "hikePercentage";
    private static final String CONST_FIXED_HIKE_PERCENTAGE = "fixedHikePercentage";
    private static final String CONST_VARIABLE_HIKE_PERCENTAGE = "variableHikePercentage";
    private static final String CONST_PROPOSED_FIXED_CTC = "proposedFixedCtc";
    private static final String CONST_PROPOSED_VARIABLE_PAY = "proposedVariablePay";
    private static final String CONST_TOTAL_PROPOSED_CTC = "totalProposedCtc";
    private static final String CONST_APPROVAL_STATUS = "approvalStatus";
    private static final String CONST_APPROVAL_STAGE = "approvalStage";
    private static final String CONST_MANAGER_COMMENTS = "managerComments";
    private static final String CONST_FINANCE_COMMENTS = "financeComments";
    private static final String CONST_HR_COMMENTS = "hrComments";
    private static final String CONST_UPDATED_AT = "updatedAt";
    private static final String CONST_PROPOSED_DESIGNATION = "proposedDesignation";
    private static final String CONST_REVISION_TYPE = "revisionType";
    private static final String CONST_INITIATOR_ID = "initiatorId";
    private static final String CONST_APPROVED = "APPROVED";
    private static final String CONST_AS_APPLICABLE = "As applicable";
    private static final String CONST_PER_MONTH = "perMonth";
    private static final String CONST_PER_ANNUM = "perAnnum";

    // Removed duplicate logger field

    @Autowired
    private CompensationDetailsRepository compensationRepository;

    @GetMapping("/ytd-report")
    public ResponseEntity<Object> getProxyYtdReport() {
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("x-api-key", "XEV-PAYROLL-SECURE-2024");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

            return restTemplate.exchange(
                "https://xevbook.xevyte.com/api/payroll/calculate/ytd-report/all",
                org.springframework.http.HttpMethod.GET,
                entity,
                Object.class
            );
        } catch (Exception e) {
            logger.error("Error fetching YTD report via proxy: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of(CONST_ERROR, "Error fetching YTD report: " + e.getMessage()));
        }
    }

    @Autowired
    private com.register.example.repository.EmployeeRepository employeeRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private CompensationTemplateRepository templateRepository;

    @Autowired
    private HikeLetterService hikeLetterService;

    @Autowired
    private EmployeeDocumentRepository documentRepository;

    @Autowired
    private com.register.example.repository.DesignationCategoryRepository designationCategoryRepository;

    @Autowired
    private com.register.example.service.CalcStructureService calcStructureService;

    @Autowired
    private com.register.example.repository.ApplicantRepository applicantRepository;

    @Value("${file.storage.base.dir:./uploads/workflow}")
    private String fileStorageBaseDir;

    // Designation Categories Endpoints
    @GetMapping("/designation-categories")
    public ResponseEntity<List<Map<String, Object>>> getDesignationCategories() {
        try {
            List<Map<String, Object>> categories = designationCategoryRepository.findAll().stream()
                    .map(category -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", category.getId());
                        map.put("name", category.getName());
                        map.put(CONST_CREATED_AT, category.getCreatedAt());
                        return map;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            logger.error("Error fetching designation categories: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/designation-categories")
    public ResponseEntity<Map<String, Object>> createDesignationCategory(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(CONST_ERROR, "Category name is required"));
            }

            com.register.example.entity.DesignationCategory category = new com.register.example.entity.DesignationCategory();
            category.setName(name.trim());
            category.setCreatedAt(java.time.LocalDateTime.now());
            
            com.register.example.entity.DesignationCategory saved = designationCategoryRepository.save(category);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("name", saved.getName());
            response.put("message", "Designation category created successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error creating designation category: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(CONST_ERROR, "Failed to create designation category"));
        }
    }

    @DeleteMapping("/designation-categories/{id}")
    public ResponseEntity<Void> deleteDesignationCategory(@PathVariable Long id) {
        try {
            if (!designationCategoryRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            designationCategoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting designation category: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    @Transactional
    public ResponseEntity<Object> getAllCompensationDetails() {
        logger.info("Entering getAllCompensationDetails");
        try {
            // Automatically sync on fetch to ensure all employees are physically present in
            // the compensation table
            logger.info("Calling syncEmployees");
            syncEmployees();

            // Source of truth for the dashboard remains the Employee Repository (portal)
            logger.info("Fetching all employees");
            String tenantId = getCurrentTenantId();
            List<com.register.example.entity.Employee> allEmployees;
            if (tenantId != null && !tenantId.isEmpty()) {
                allEmployees = employeeRepository.findByTenantId(tenantId);
            } else {
                allEmployees = employeeRepository.findAll();
            }
            logger.info("Found {} employees", allEmployees.size());

            List<Map<String, Object>> result = allEmployees.stream()
                    .filter(emp -> emp.getEmployeeId() != null && !emp.getEmployeeId().isEmpty())
                    .map(emp -> {
                        try {
                            Map<String, Object> map = new HashMap<>();
                            map.put(CONST_EMPLOYEE_ID, emp.getEmployeeId());
                            String fullName = (emp.getFirstName() != null ? emp.getFirstName() : "") + " "
                                    + (emp.getLastName() != null ? emp.getLastName() : "");
                            map.put(CONST_EMPLOYEE_NAME, fullName.trim());
                            map.put(CONST_DEPARTMENT, emp.getDepartment());
                            map.put(CONST_DESIGNATION, emp.getRole());
                            map.put("workLocation", emp.getWorkLocation());
                            map.put("employeeType", emp.getEmployeeType());
                            map.put("probationStatus", emp.getProbationStatus());
                            map.put("gender", emp.getGender());
                            map.put("taxRegime", emp.getTaxRegime());
                            map.put("joiningDate", emp.getJoiningDate());

                            Optional<CompensationDetails> compOpt = compensationRepository
                                    .findTopByEmployeeIdOrderByIdDesc(emp.getEmployeeId());
                            if (compOpt.isPresent()) {
                                CompensationDetails comp = compOpt.get();
                                map.put("id", comp.getId());
                                map.put(CONST_CURRENT_FIXED_CTC, comp.getCurrentFixedCtc());
                                map.put(CONST_CURRENT_VARIABLE_PAY, comp.getCurrentVariablePay());
                                map.put(CONST_EFFECTIVE_DATE, comp.getEffectiveDate());
                                map.put("year", comp.getYear());
                                map.put(CONST_HIKE_PERCENTAGE, comp.getHikePercentage());
                                map.put(CONST_FIXED_HIKE_PERCENTAGE, comp.getFixedHikePercentage());
                                map.put(CONST_VARIABLE_HIKE_PERCENTAGE, comp.getVariableHikePercentage());
                                map.put(CONST_PROPOSED_FIXED_CTC, comp.getProposedFixedCtc());
                                map.put(CONST_PROPOSED_VARIABLE_PAY, comp.getProposedVariablePay());
                                map.put(CONST_TOTAL_PROPOSED_CTC, comp.getTotalProposedCtc());
                                map.put(CONST_APPROVAL_STATUS, comp.getApprovalStatus());
                                map.put(CONST_APPROVAL_STAGE, comp.getApprovalStage());
                                map.put("currentApproverId", comp.getCurrentApproverId());
                                map.put(CONST_MANAGER_COMMENTS, comp.getManagerComments());
                                map.put(CONST_FINANCE_COMMENTS, comp.getFinanceComments());
                                map.put(CONST_HR_COMMENTS, comp.getHrComments());
                                map.put(CONST_UPDATED_AT, comp.getUpdatedAt());
                                map.put(CONST_PROPOSED_DESIGNATION, comp.getProposedDesignation());
                                map.put(CONST_REVISION_TYPE, comp.getRevisionType());
                            } else {
                                map.put(CONST_CURRENT_FIXED_CTC, 0.0);
                                map.put(CONST_CURRENT_VARIABLE_PAY, 0.0);
                                map.put(CONST_HIKE_PERCENTAGE, 0.0);
                                map.put(CONST_TOTAL_PROPOSED_CTC, 0.0);
                            }
                            return map;
                        } catch (Exception ex) {
                            logger.error("Error processing employee {}", emp.getEmployeeId(), ex);
                            throw new RuntimeException("Error processing employee " + emp.getEmployeeId(), ex);
                        }
                    }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error in getAllCompensationDetails: ", e);
            e.printStackTrace(); // Print to stderr as well
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching compensation details: " + e.getMessage());
        }
    }

    @GetMapping("/history/{employeeId}")
    public ResponseEntity<Object> getEmployeeHistory(@PathVariable String employeeId) {
        try {
            List<CompensationDetails> historyList = compensationRepository.findAllByEmployeeId(employeeId);

            List<Map<String, Object>> result = historyList.stream()
                    .sorted((c1, c2) -> {
                        // Sort by effective date descending, then ID descending
                        if (c2.getEffectiveDate() != null && c1.getEffectiveDate() != null) {
                            int dateComp = c2.getEffectiveDate().compareTo(c1.getEffectiveDate());
                            if (dateComp != 0)
                                return dateComp;
                        }
                        return Long.compare(c2.getId(), c1.getId());
                    })
                    .map(comp -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", comp.getId());
                        map.put(CONST_EMPLOYEE_ID, comp.getEmployeeId());
                        map.put(CONST_CURRENT_FIXED_CTC, comp.getCurrentFixedCtc());
                        map.put(CONST_CURRENT_VARIABLE_PAY, comp.getCurrentVariablePay());
                        map.put(CONST_PROPOSED_FIXED_CTC, comp.getProposedFixedCtc());
                        map.put(CONST_PROPOSED_VARIABLE_PAY, comp.getProposedVariablePay());
                        map.put(CONST_EFFECTIVE_DATE, comp.getEffectiveDate());
                        map.put(CONST_HIKE_PERCENTAGE, comp.getHikePercentage());
                        map.put(CONST_FIXED_HIKE_PERCENTAGE, comp.getFixedHikePercentage());
                        map.put(CONST_VARIABLE_HIKE_PERCENTAGE, comp.getVariableHikePercentage());
                        map.put(CONST_TOTAL_PROPOSED_CTC, comp.getTotalProposedCtc());
                        map.put(CONST_APPROVAL_STATUS, comp.getApprovalStatus());
                        map.put(CONST_APPROVAL_STAGE, comp.getApprovalStage());
                        map.put("approverComments", comp.getApproverComments());
                        map.put(CONST_MANAGER_COMMENTS, comp.getManagerComments());
                        map.put(CONST_FINANCE_COMMENTS, comp.getFinanceComments());
                        map.put(CONST_HR_COMMENTS, comp.getHrComments());
                        map.put(CONST_UPDATED_AT, comp.getUpdatedAt());
                        map.put(CONST_CREATED_AT, comp.getCreatedAt());
                        map.put(CONST_INITIATOR_ID, comp.getInitiatorId());
                        map.put(CONST_PROPOSED_DESIGNATION, comp.getProposedDesignation());
                        map.put(CONST_REVISION_TYPE, comp.getRevisionType());

                        employeeRepository.findByEmployeeId(comp.getEmployeeId()).ifPresent(e -> {
                            map.put(CONST_EMPLOYEE_NAME, e.getFirstName() + " " + e.getLastName());
                            map.put(CONST_DESIGNATION, e.getRole());
                            map.put(CONST_DEPARTMENT, e.getDepartment());
                        });

                        return map;
                    }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error fetching history for employee {}: ", employeeId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching history: " + e.getMessage());
        }
    }

    @GetMapping("/approver/{approverId}")
    public ResponseEntity<Object> getPendingTasks(@PathVariable String approverId) {
        logger.info("Entering getPendingTasks for approverId: {}", approverId);
        try {
            List<CompensationDetails> tasks = compensationRepository.findByCurrentApproverIdAndApprovalStatusNot(
                    approverId,
                    CONST_APPROVED);
            logger.info("Found {} pending tasks", tasks.size());

            List<Map<String, Object>> result = tasks.stream().map(comp -> {
                try {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", comp.getId());
                    map.put(CONST_EMPLOYEE_ID, comp.getEmployeeId());
                    map.put(CONST_CURRENT_FIXED_CTC, comp.getCurrentFixedCtc());
                    map.put(CONST_CURRENT_VARIABLE_PAY, comp.getCurrentVariablePay());
                    map.put(CONST_PROPOSED_FIXED_CTC, comp.getProposedFixedCtc());
                    map.put(CONST_PROPOSED_VARIABLE_PAY, comp.getProposedVariablePay());
                    map.put(CONST_EFFECTIVE_DATE, comp.getEffectiveDate());
                    map.put(CONST_HIKE_PERCENTAGE, comp.getHikePercentage());
                    map.put(CONST_FIXED_HIKE_PERCENTAGE, comp.getFixedHikePercentage());
                    map.put(CONST_VARIABLE_HIKE_PERCENTAGE, comp.getVariableHikePercentage());
                    map.put("status", comp.getApprovalStatus());
                    map.put("stage", comp.getApprovalStage());
                    map.put(CONST_PROPOSED_DESIGNATION, comp.getProposedDesignation());
                    map.put(CONST_REVISION_TYPE, comp.getRevisionType());

                    employeeRepository.findByEmployeeId(comp.getEmployeeId()).ifPresent(e -> {
                        map.put(CONST_EMPLOYEE_NAME, e.getFirstName() + " " + e.getLastName());
                        map.put(CONST_DESIGNATION, e.getRole());
                    });
                    return map;
                } catch (Exception ex) {
                    logger.error("Error processing task for compId {}", comp.getId(), ex);
                    throw new RuntimeException("Error processing task for compId " + comp.getId(), ex);
                }
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error in getPendingTasks: ", e);
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching pending tasks: " + e.getMessage());
        }
    }

    @GetMapping("/history")
    public List<Map<String, Object>> getHistory() {
        String tenantId = getCurrentTenantId();
        List<CompensationDetails> allHistory = compensationRepository.findAll();

        return allHistory.stream().filter(comp -> {
            if (tenantId == null || tenantId.isEmpty()) return true;
            return employeeRepository.findByEmployeeId(comp.getEmployeeId())
                    .map(emp -> tenantId.equals(emp.getTenantId()))
                    .orElse(false);
        }).map(comp -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", comp.getId());
            map.put(CONST_EMPLOYEE_ID, comp.getEmployeeId());
            map.put(CONST_CURRENT_FIXED_CTC, comp.getCurrentFixedCtc());
            map.put(CONST_CURRENT_VARIABLE_PAY, comp.getCurrentVariablePay());
            map.put(CONST_PROPOSED_FIXED_CTC, comp.getProposedFixedCtc());
            map.put(CONST_PROPOSED_VARIABLE_PAY, comp.getProposedVariablePay());
            map.put(CONST_EFFECTIVE_DATE, comp.getEffectiveDate());
            map.put(CONST_HIKE_PERCENTAGE, comp.getHikePercentage());
            map.put(CONST_FIXED_HIKE_PERCENTAGE, comp.getFixedHikePercentage());
            map.put(CONST_VARIABLE_HIKE_PERCENTAGE, comp.getVariableHikePercentage());
            map.put(CONST_TOTAL_PROPOSED_CTC, comp.getTotalProposedCtc());
            map.put(CONST_APPROVAL_STATUS, comp.getApprovalStatus());
            map.put(CONST_APPROVAL_STAGE, comp.getApprovalStage());
            map.put(CONST_UPDATED_AT, comp.getUpdatedAt());
            map.put(CONST_PROPOSED_DESIGNATION, comp.getProposedDesignation());
            map.put(CONST_REVISION_TYPE, comp.getRevisionType());

            employeeRepository.findByEmployeeId(comp.getEmployeeId()).ifPresent(emp -> {
                String fullName = (emp.getFirstName() != null ? emp.getFirstName() : "") + " "
                        + (emp.getLastName() != null ? emp.getLastName() : "");
                map.put(CONST_EMPLOYEE_NAME, fullName.trim());
                map.put(CONST_DEPARTMENT, emp.getDepartment());
                map.put(CONST_DESIGNATION, emp.getRole());
            });

            return map;
        }).collect(Collectors.toList());
    }

    @GetMapping("/sync")
    @Transactional
    public ResponseEntity<String> manualSync() {
        syncEmployees();
        return ResponseEntity.ok("Compensation details synced with employee portal.");
    }

    private String getCurrentTenantId() {
        try {
            org.springframework.web.context.request.RequestAttributes requestAttributes = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (requestAttributes instanceof org.springframework.web.context.request.ServletRequestAttributes) {
                jakarta.servlet.http.HttpServletRequest request = ((org.springframework.web.context.request.ServletRequestAttributes) requestAttributes).getRequest();
                Object tenantIdAttr = request.getAttribute("X-Tenant-ID-Num");
                if (tenantIdAttr != null) {
                    return tenantIdAttr.toString();
                }
            }
        } catch (Exception e) {}

        try {
            org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null && !"anonymousUser".equals(auth.getPrincipal())) {
                String empId = auth.getName();
                Optional<Employee> empOpt = employeeRepository.findByEmployeeId(empId);
                if (empOpt.isPresent()) {
                    return empOpt.get().getTenantId();
                }
            }
        } catch (Exception e) {}
        
        return null;
    }

    private static final Logger logger = LoggerFactory.getLogger(CompensationDetailsController.class);

    private void cleanupGarbageCompensationRecords(List<CompensationDetails> allExistingComp) {
        for (CompensationDetails comp : allExistingComp) {
            if (comp.getEmployeeId() == null || comp.getEmployeeId().isBlank()) {
                logger.warn("Deleting invalid compensation record with ID: {}", comp.getId());
                compensationRepository.delete(comp);
            }
        }
    }

    private double parseApplicantAmount(String amountStr, String fieldName, String applicantId) {
        if (amountStr != null && !amountStr.isEmpty()) {
            try {
                String cleanStr = amountStr.replaceAll("[^0-9.]", "");
                if (!cleanStr.isEmpty()) {
                    return Double.parseDouble(cleanStr);
                }
            } catch (Exception e) {
                logger.warn("Could not parse {} for applicant: {}", fieldName, applicantId);
            }
        }
        return 0.0;
    }

    private void syncSingleEmployee(com.register.example.entity.Employee emp, String empId) {
        if (compensationRepository.findTopByEmployeeIdOrderByIdDesc(empId).isPresent()) {
            return;
        }
        logger.info("Creating initial compensation record for Employee ID: {}", empId);
        CompensationDetails details = new CompensationDetails();
        details.setEmployeeId(empId);

        double fixedCtc = 0.0;
        double variablePay = 0.0;

        if (emp.getApplicantId() != null && !emp.getApplicantId().isEmpty()) {
            Optional<com.register.example.entity.Applicant> applicantOpt = applicantRepository.findByApplicantId(emp.getApplicantId());
            if (applicantOpt.isPresent()) {
                com.register.example.entity.Applicant applicant = applicantOpt.get();
                fixedCtc = parseApplicantAmount(applicant.getFixedCtc(), "fixed_ctc", emp.getApplicantId());
                variablePay = parseApplicantAmount(applicant.getVariablePay(), "variable_pay", emp.getApplicantId());
            }
        }

        details.setCurrentFixedCtc(fixedCtc);
        details.setCurrentVariablePay(variablePay);
        details.setHikePercentage(0.0);
        details.setFixedHikePercentage(0.0);
        details.setVariableHikePercentage(0.0);
        details.setTotalProposedCtc(fixedCtc + variablePay);
        details.setApprovalStatus("DETAILS");
        details.setApprovalStage(4);
        compensationRepository.saveAndFlush(details);
    }

    private void syncEmployees() {
        logger.info("Starting syncEmployees...");
        List<CompensationDetails> allExistingComp = compensationRepository.findAll();
        logger.info("Found {} existing compensation records.", allExistingComp.size());
        cleanupGarbageCompensationRecords(allExistingComp);

        String tenantId = getCurrentTenantId();
        List<com.register.example.entity.Employee> allEmployees;
        if (tenantId != null && !tenantId.isEmpty()) {
            allEmployees = employeeRepository.findByTenantId(tenantId);
        } else {
            allEmployees = employeeRepository.findAll();
        }
        logger.info("Found {} employees in repository.", allEmployees.size());

        for (com.register.example.entity.Employee emp : allEmployees) {
            String empId = emp.getEmployeeId() != null ? emp.getEmployeeId().trim() : null;
            if (empId == null || empId.isBlank()) {
                logger.debug("Skipping employee with empty/null ID: {}", emp.getId());
                continue;
            }
            syncSingleEmployee(emp, empId);
        }
        logger.info("syncEmployees completed.");
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<Map<String, Object>> getByEmployeeId(@PathVariable String employeeId) {
        Optional<CompensationDetails> detailsOpt = compensationRepository.findTopByEmployeeIdOrderByIdDesc(employeeId);
        if (!detailsOpt.isPresent())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);

        CompensationDetails comp = detailsOpt.get();
        Map<String, Object> map = new HashMap<>();
        map.put("id", comp.getId());
        map.put(CONST_EMPLOYEE_ID, comp.getEmployeeId());
        map.put(CONST_CURRENT_FIXED_CTC, comp.getCurrentFixedCtc());
        map.put(CONST_CURRENT_VARIABLE_PAY, comp.getCurrentVariablePay());
        map.put(CONST_EFFECTIVE_DATE, comp.getEffectiveDate());
        map.put(CONST_HIKE_PERCENTAGE, comp.getHikePercentage());
        map.put(CONST_FIXED_HIKE_PERCENTAGE, comp.getFixedHikePercentage());
        map.put(CONST_VARIABLE_HIKE_PERCENTAGE, comp.getVariableHikePercentage());
        map.put(CONST_PROPOSED_FIXED_CTC, comp.getProposedFixedCtc());
        map.put(CONST_PROPOSED_VARIABLE_PAY, comp.getProposedVariablePay());
        map.put(CONST_TOTAL_PROPOSED_CTC, comp.getTotalProposedCtc());
        map.put(CONST_APPROVAL_STATUS, comp.getApprovalStatus());
        map.put(CONST_APPROVAL_STAGE, comp.getApprovalStage());
        map.put("currentApproverId", comp.getCurrentApproverId());
        map.put(CONST_INITIATOR_ID, comp.getInitiatorId());
        map.put(CONST_MANAGER_COMMENTS, comp.getManagerComments());
        map.put(CONST_FINANCE_COMMENTS, comp.getFinanceComments());
        map.put(CONST_HR_COMMENTS, comp.getHrComments());
        map.put(CONST_CREATED_AT, comp.getCreatedAt());
        map.put(CONST_UPDATED_AT, comp.getUpdatedAt());
        map.put(CONST_PROPOSED_DESIGNATION, comp.getProposedDesignation());
        map.put(CONST_REVISION_TYPE, comp.getRevisionType());

        employeeRepository.findByEmployeeId(comp.getEmployeeId()).ifPresent(emp -> {
            String fullName = (emp.getFirstName() != null ? emp.getFirstName() : "") + " "
                    + (emp.getLastName() != null ? emp.getLastName() : "");
            map.put(CONST_EMPLOYEE_NAME, fullName.trim());
            map.put(CONST_DEPARTMENT, emp.getDepartment());
            map.put(CONST_DESIGNATION, emp.getRole());
            map.put("joiningDate", emp.getJoiningDate());
        });

        return ResponseEntity.ok(map);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<CompensationDetails> saveOrUpdate(@RequestBody Map<String, Object> payload) {
        logger.info("Incoming Salary Revision Payload: {}", payload);
        String employeeId = payload.get(CONST_EMPLOYEE_ID) != null ? payload.get(CONST_EMPLOYEE_ID).toString() : null;
        String initiatorId = payload.get(CONST_INITIATOR_ID) != null ? payload.get(CONST_INITIATOR_ID).toString() : null;
        java.time.LocalDate effectiveDate = parseLocalDate(payload.get(CONST_EFFECTIVE_DATE));

        if (employeeId == null || effectiveDate == null) {
            logger.error("Failed to save revision: employeeId or effectiveDate is null. Payload: {}", payload);
            return ResponseEntity.badRequest().build();
        }

        employeeId = employeeId.trim();

        List<CompensationDetails> allForEmp = compensationRepository.findAllByEmployeeId(employeeId);
        final java.time.LocalDate targetDate = effectiveDate;

        Optional<CompensationDetails> existingOpt = allForEmp.stream()
                .filter(c -> c.getEffectiveDate() != null && c.getEffectiveDate().isEqual(targetDate))
                .findFirst();

        CompensationDetails comp;
        if (existingOpt.isPresent()) {
            logger.info("Found existing revision for date {}. Updating it.", effectiveDate);
            comp = existingOpt.get();
        } else {
            logger.info("No revision found for date {}. Creating NEW record.", effectiveDate);
            comp = new CompensationDetails();
            comp.setEmployeeId(employeeId);
        }

        comp.setCurrentFixedCtc(parseDouble(payload.get(CONST_CURRENT_FIXED_CTC)));
        comp.setCurrentVariablePay(parseDouble(payload.get(CONST_CURRENT_VARIABLE_PAY)));

        comp.setProposedFixedCtc(parseDouble(payload.get(CONST_PROPOSED_FIXED_CTC)));
        comp.setProposedVariablePay(parseDouble(payload.get(CONST_PROPOSED_VARIABLE_PAY)));
        comp.setEffectiveDate(effectiveDate);
        comp.setYear(java.time.LocalDate.now().getYear());
        comp.setHikePercentage(parseDouble(payload.get(CONST_HIKE_PERCENTAGE)));
        comp.setFixedHikePercentage(parseDouble(payload.get(CONST_FIXED_HIKE_PERCENTAGE)));
        comp.setVariableHikePercentage(parseDouble(payload.get(CONST_VARIABLE_HIKE_PERCENTAGE)));
        comp.setTotalProposedCtc(parseDouble(payload.get(CONST_TOTAL_PROPOSED_CTC)));
        comp.setRevisionType(payload.get(CONST_REVISION_TYPE) != null ? payload.get(CONST_REVISION_TYPE).toString() : null);
        comp.setProposedDesignation(
                payload.get(CONST_PROPOSED_DESIGNATION) != null ? payload.get(CONST_PROPOSED_DESIGNATION).toString() : null);

        comp.setInitiatorId(initiatorId);
        comp.setApprovalStatus("PENDING_MANAGER");
        comp.setApprovalStage(1);

        Optional<Employee> targetEmp = employeeRepository.findByEmployeeId(employeeId);
        if (targetEmp.isPresent()) {
            String managerId = targetEmp.get().getAssignedManagerId();
            comp.setCurrentApproverId(managerId);

            if (managerId != null && !managerId.isBlank()) {
                notificationService.sendWorkflowNotification(managerId,
                        "Salary revision request for " + targetEmp.get().getFirstName() + " is pending your approval.");
                employeeRepository.findByEmployeeId(managerId).ifPresent(mgr -> {
                    emailService.sendEmail(mgr.getEmail(), "Action Required: Salary Revision Approval",
                            "Dear " + mgr.getFirstName() + ",\n\nA salary revision for "
                                    + targetEmp.get().getFirstName()
                                     + " " + targetEmp.get().getLastName()
                                    + " has been submitted and is pending your approval.\n\nPlease log in to the portal to review.");
                });
            }
        }

        try {
            return ResponseEntity.ok(compensationRepository.save(comp));
        } catch (Exception e) {
            logger.error("Error saving compensation record for employee {}: {}", employeeId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/approve")
    public ResponseEntity<String> approve(@RequestBody Map<String, Object> payload) {
        Long id = payload.containsKey("id") && payload.get("id") != null ? Long.parseLong(payload.get("id").toString())
                : null;
        String empId = (String) payload.get(CONST_EMPLOYEE_ID);
        String comments = (String) payload.get("comments");

        Optional<CompensationDetails> compOpt = (id != null) ? compensationRepository.findById(id)
                : compensationRepository.findTopByEmployeeIdOrderByIdDesc(empId);

        if (!compOpt.isPresent())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Record not found");

        CompensationDetails comp = compOpt.get();
        Optional<Employee> targetEmp = employeeRepository.findByEmployeeId(comp.getEmployeeId());

        if (!targetEmp.isPresent())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Employee not found");

        int stage = comp.getApprovalStage();

        if (stage == 1) {
            comp.setManagerComments(comments);
            comp.setApprovalStage(2);
            comp.setApprovalStatus("PENDING_FINANCE");
            comp.setCurrentApproverId("EMP003");

            notifyNext("EMP003", "Finance", targetEmp.get());
        } else if (stage == 2) {
            comp.setFinanceComments(comments);
            comp.setApprovalStage(3);
            comp.setApprovalStatus("PENDING_HR");
            comp.setCurrentApproverId("EMP004");

            notifyNext("EMP004", "HR", targetEmp.get());
        } else if (stage == 3) {
            comp.setHrComments(comments);
            comp.setApprovalStage(4);
            comp.setApprovalStatus(CONST_APPROVED);
            comp.setCurrentApproverId(null);

            comp.setCurrentFixedCtc(comp.getProposedFixedCtc());
            comp.setCurrentVariablePay(comp.getProposedVariablePay());
        }

        compensationRepository.save(comp);
        return ResponseEntity.ok("Approved successfully");
    }

    @PostMapping("/reject")
    public ResponseEntity<String> reject(@RequestBody Map<String, Object> payload) {
        Long id = payload.containsKey("id") && payload.get("id") != null ? Long.parseLong(payload.get("id").toString())
                : null;
        String empId = (String) payload.get(CONST_EMPLOYEE_ID);
        String comments = (String) payload.get("comments");

        Optional<CompensationDetails> compOpt = (id != null) ? compensationRepository.findById(id)
                : compensationRepository.findTopByEmployeeIdOrderByIdDesc(empId);

        if (!compOpt.isPresent())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Record not found");

        CompensationDetails comp = compOpt.get();
        Optional<Employee> targetEmp = employeeRepository.findByEmployeeId(comp.getEmployeeId());

        if (!targetEmp.isPresent())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Employee not found");

        comp.setApprovalStatus("REJECTED");
        comp.setApproverComments(comments);
        comp.setCurrentApproverId(null);

        compensationRepository.save(comp);
        return ResponseEntity.ok("Rejected successfully");
    }

    private void notifyNext(String nextApproverId, String roleName, Employee emp) {
        // Notifications removed for compensation approval workflow
    }

    @PostMapping("/finalize")
    @Transactional
    public ResponseEntity<Object> finalizeCompensation(@RequestBody Map<String, Object> payload) {
        try {
            Object rawTerm = payload.get("id");
            if (rawTerm == null) {
                return ResponseEntity.badRequest().body("ID is required.");
            }
            String term = rawTerm.toString();

            Optional<CompensationDetails> compOpt = Optional.empty();
            try {
                Long id = Long.parseLong(term);
                compOpt = compensationRepository.findById(id);
            } catch (NumberFormatException e) {
                compOpt = compensationRepository.findTopByEmployeeIdOrderByIdDesc(term);
            }

            if (compOpt.isPresent()) {
                CompensationDetails comp = compOpt.get();
                if ("PENDING_FINALIZATION".equals(comp.getApprovalStatus())
                        || "PENDING_MANAGER".equals(comp.getApprovalStatus())) {
                    comp.setCurrentFixedCtc(comp.getProposedFixedCtc());
                    comp.setCurrentVariablePay(comp.getProposedVariablePay());

                    comp.setApprovalStatus(CONST_APPROVED);
                    comp.setApprovalStage(4);
                    comp.setUpdatedAt(java.time.LocalDateTime.now());

                    if (comp.getProposedDesignation() != null && !comp.getProposedDesignation().isBlank()) {
                        employeeRepository.findByEmployeeId(comp.getEmployeeId()).ifPresent(emp -> {
                            emp.setRole(comp.getProposedDesignation());
                            employeeRepository.save(emp);
                        });
                    }

                    compensationRepository.save(comp);
                    return ResponseEntity.ok("Compensation finalized successfully.");
                } else {
                    return ResponseEntity.badRequest().body("Record is not in pending finalization state.");
                }
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error finalizing compensation: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error finalizing: " + e.getMessage());
        }
    }

    @GetMapping("/templates")
    public ResponseEntity<List<CompensationTemplate>> getTemplates() {
        return ResponseEntity.ok(templateRepository.findAll());
    }

    private double parseProposedFixedCtc(Object ctcValue) {
        if (ctcValue instanceof String) {
            return Double.parseDouble((String) ctcValue);
        } else if (ctcValue instanceof Number) {
            return ((Number) ctcValue).doubleValue();
        }
        return 0.0;
    }

    private Map<String, Object> buildComponentMap(CalcComponentDTO component) {
        Map<String, Object> compMap = new HashMap<>();
        compMap.put("name", component.getComponentName());

        boolean isAsApplicable = "AS_APPLICABLE".equalsIgnoreCase(component.getComponentType()) || 
                               CONST_AS_APPLICABLE.equalsIgnoreCase(component.getDisplayPerMonth());

        if (isAsApplicable) {
            compMap.put(CONST_PER_MONTH, CONST_AS_APPLICABLE);
            compMap.put(CONST_PER_ANNUM, CONST_AS_APPLICABLE);
        } else {
            compMap.put(CONST_PER_MONTH, component.getComputedPerMonth() != null ? component.getComputedPerMonth() : 0.0);
            compMap.put(CONST_PER_ANNUM, component.getComputedPerMonth() != null ? component.getComputedPerMonth() * 12 : 0.0);
        }

        compMap.put("section", component.getSection());
        compMap.put("componentType", component.getComponentType());
        compMap.put("displayPerMonth", component.getDisplayPerMonth());
        compMap.put("sequenceOrder", component.getSequenceOrder());
        return compMap;
    }

    private Map<String, Object> calculateSalaryBreakup(Long calcTemplateId, CompensationDetails comp, Map<String, Object> fallbackBreakup) {
        if (calcTemplateId == null || comp.getProposedFixedCtc() == null) {
            return fallbackBreakup;
        }
        try {
            double proposedFixedCtc = parseProposedFixedCtc(comp.getProposedFixedCtc());
            var structureDTO = calcStructureService.executeCalculation(calcTemplateId, proposedFixedCtc);
            
            if (structureDTO != null && structureDTO.getComponents() != null) {
                Map<String, Object> calculatedBreakup = new HashMap<>();
                
                Map<String, Object> earningsMap = new HashMap<>();
                structureDTO.getComponents().stream()
                    .filter(c -> "EARNINGS".equals(c.getSection()))
                    .forEach(component -> {
                        earningsMap.put(component.getComponentName().toLowerCase().replaceAll("[^a-z]", ""), buildComponentMap(component));
                    });
                calculatedBreakup.put("earnings", earningsMap);
                
                Map<String, Object> deductionsMap = new HashMap<>();
                structureDTO.getComponents().stream()
                    .filter(c -> "DEDUCTIONS".equals(c.getSection()))
                    .forEach(component -> {
                        deductionsMap.put(component.getComponentName().toLowerCase().replaceAll("[^a-z]", ""), buildComponentMap(component));
                    });
                calculatedBreakup.put("deductions", deductionsMap);
                
                calculatedBreakup.put("totalEarnings", structureDTO.getComponents().stream()
                    .filter(c -> "EARNINGS".equals(c.getSection()))
                    .mapToDouble(c -> c.getComputedPerMonth() != null ? c.getComputedPerMonth() : 0.0)
                    .sum());
                calculatedBreakup.put("totalDeductions", structureDTO.getComponents().stream()
                    .filter(c -> "DEDUCTIONS".equals(c.getSection()))
                    .mapToDouble(c -> c.getComputedPerMonth() != null ? c.getComputedPerMonth() : 0.0)
                    .sum());
                
                return calculatedBreakup;
            }
        } catch (Exception e) {
            logger.error("Error calculating salary breakup from template: ", e);
        }
        return fallbackBreakup;
    }

    private String saveEmployeeDocument(CompensationDetails comp, String revisionType, byte[] pdfBytes) throws IOException {
        String trimmedRevisionType = revisionType != null ? revisionType.trim() : "Revision";
        String fileName = trimmedRevisionType.replace(" ", "_") + "_Letter.pdf";
        int year = LocalDate.now().getYear();

        EmployeeDocument latestDoc = documentRepository
                .findTopByEmployeeIdAndDocumentCategoryAndDocumentNameOrderByIdDesc(
                        comp.getEmployeeId(), "COMPENSATION", fileName);

        EmployeeDocument doc;
        if (latestDoc != null && latestDoc.getUploadedAt() != null &&
                latestDoc.getUploadedAt().toLocalDate().isEqual(LocalDate.now())) {
            logger.info("Found existing document from today for {} ({}). Overriding.", comp.getEmployeeId(), fileName);
            doc = latestDoc;
        } else {
            logger.info("No document from today found for {} ({}). Creating new entry.", comp.getEmployeeId(), fileName);
            doc = new EmployeeDocument();
            doc.setEmployeeId(comp.getEmployeeId());
            doc.setDocumentCategory("COMPENSATION");
            doc.setDocumentName(fileName);
        }

        String uniqueFileName = "COMPENSATION_" + System.currentTimeMillis() + "_" + fileName;
        Path targetLocation = Paths.get(fileStorageBaseDir).resolve(uniqueFileName);
        Files.createDirectories(targetLocation.getParent());
        Files.write(targetLocation, pdfBytes);

        doc.setStoragePath(uniqueFileName);
        doc.setUploadedBy("SYSTEM");
        doc.setYear(year);

        documentRepository.save(doc);
        return fileName;
    }

    private void sendHikeNotificationAndEmail(CompensationDetails comp, String revisionType, byte[] pdfBytes, String fileName) {
        String notifyMsg = "You have received a new document in category: COMPENSATION";
        notificationService.sendWorkflowNotification(comp.getEmployeeId(), notifyMsg);

        Optional<Employee> empOpt = employeeRepository.findByEmployeeId(comp.getEmployeeId());
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();

            String subject = "Important: Compensation Revision - " + revisionType;
            String body = "Dear " + emp.getFirstName() + ",\n\n" +
                    "We are pleased to inform you that your compensation has been revised as part of the "
                    + revisionType + " process.\n\n" +
                    "Details of your revised compensation:\n" +
                    "- Revised Fixed CTC: \u20b9"
                    + (comp.getProposedFixedCtc() != null ? String.format("%.2f", comp.getProposedFixedCtc()) : "0.00")
                    + "\n" +
                    "- Effective Date: "
                    + (comp.getEffectiveDate() != null ? comp.getEffectiveDate().toString() : "N/A") + "\n\n" +
                    "Please find the attached letter for your reference. You can also view this document in your 'My Documents' hub.\n\n" + "Best Regards,\n" +
                    "Human Resources Team";

            emailService.sendEmailWithAttachment(emp.getEmail(), subject, body, pdfBytes, fileName);
        }
    }

    @PostMapping("/finalize-with-doc")
    @Transactional
    public ResponseEntity<Object> finalizeWithDoc(@RequestBody Map<String, Object> payload) {
        try {
            logger.info("=== FINALIZE WITH DOC START ===");
            logger.info("Payload received: {}", payload);
            
            Long recordId = Long.parseLong(payload.get("id").toString());
            Long templateId = Long.parseLong(payload.get("templateId").toString());
            String revisionType = payload.get(CONST_REVISION_TYPE).toString();
            
            Long calcTemplateId = null;
            if (payload.get("calcTemplateId") != null) {
                calcTemplateId = Long.parseLong(payload.get("calcTemplateId").toString());
            }

            logger.info("Processing finalize - RecordId: {}, TemplateId: {}, RevisionType: {}, CalcTemplateId: {}", 
                recordId, templateId, revisionType, calcTemplateId);

            Optional<CompensationDetails> compOpt = compensationRepository.findById(recordId);
            Optional<CompensationTemplate> tmpOpt = templateRepository.findById(templateId);

            if (compOpt.isEmpty() || tmpOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Record or Template not found.");
            }

            CompensationDetails comp = compOpt.get();
            CompensationTemplate template = tmpOpt.get();
            
            logger.info("Compensation details - CurrentFixed: {}, ProposedFixed: {}, ProposedVariable: {}", 
                comp.getCurrentFixedCtc(), comp.getProposedFixedCtc(), comp.getProposedVariablePay());

            Map<String, Object> salaryBreakup = (Map<String, Object>) payload.get("salaryBreakup");
            salaryBreakup = calculateSalaryBreakup(calcTemplateId, comp, salaryBreakup);
            
            logger.info("SalaryBreakup to use: {}", salaryBreakup);

            byte[] pdfBytes = hikeLetterService.generateHikeLetterPdf(comp, template, salaryBreakup);

            comp.setCurrentFixedCtc(comp.getProposedFixedCtc());
            comp.setCurrentVariablePay(comp.getProposedVariablePay());
            comp.setApprovalStatus(CONST_APPROVED);
            comp.setApprovalStage(4);
            comp.setUpdatedAt(java.time.LocalDateTime.now());
            comp.setRevisionType(revisionType);

            if (comp.getProposedDesignation() != null && !comp.getProposedDesignation().isBlank()) {
                employeeRepository.findByEmployeeId(comp.getEmployeeId()).ifPresent(emp -> {
                    emp.setRole(comp.getProposedDesignation());
                    employeeRepository.save(emp);
                });
            }

            compensationRepository.save(comp);

            String fileName = saveEmployeeDocument(comp, revisionType, pdfBytes);
            sendHikeNotificationAndEmail(comp, revisionType, pdfBytes, fileName);

            return ResponseEntity.ok("Compensation finalized, document generated and email sent successfully.");

        } catch (Exception e) {
            logger.error("Error in finalize-with-doc: ", e);
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/upload-template")
    public ResponseEntity<Object> uploadTemplate(
            @RequestParam("name") String name,
            @RequestParam("category") String category,
            @RequestParam("file") MultipartFile file) {
        try {
            CompensationTemplate template = new CompensationTemplate();
            template.setTemplateName(name);
            template.setCategory(category);
            template.setContent(file.getBytes());
            templateRepository.save(template);
            return ResponseEntity.ok("Template uploaded successfully.");
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Error uploading template: " + e.getMessage());
        }
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        templateRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/templates/{id}/preview")
    public ResponseEntity<byte[]> previewTemplate(@PathVariable Long id) {
        logger.info("Preview request received for template ID: {}", id);
        try {
            Optional<CompensationTemplate> templateOpt = templateRepository.findById(id);
            if (templateOpt.isEmpty()) {
                logger.warn("Template not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
            
            CompensationTemplate template = templateOpt.get();
            logger.info("Found template: {} with content length: {} bytes", 
                template.getTemplateName(), 
                template.getContent() != null ? template.getContent().length : 0);
            
            if (template.getContent() == null || template.getContent().length == 0) {
                logger.error("Template content is null or empty for ID: {}", id);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
            
            return ResponseEntity.ok()
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                    .header("Content-Disposition", "inline; filename=\"" + template.getTemplateName() + ".docx\"")
                    .body(template.getContent());
        } catch (Exception e) {
            logger.error("Error previewing template {}: ", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void saveBulkForSingleEmployee(String employeeId, java.time.LocalDate effectiveDate, Double fixedHikePct, Double variableHikePct, String initiatorId, String revisionType, int currentYear) {
        Optional<CompensationDetails> exactRecordOpt = compensationRepository
                .findByEmployeeIdAndEffectiveDate(employeeId, effectiveDate);

        CompensationDetails comp;
        Double currentFixed = null;
        Double currentVariable = null;

        if (exactRecordOpt.isPresent()) {
            logger.info("Updating existing record for {} on date {}", employeeId, effectiveDate);
            comp = exactRecordOpt.get();
            currentFixed = comp.getCurrentFixedCtc();
            currentVariable = comp.getCurrentVariablePay();
        } else {
            Optional<CompensationDetails> latestOpt = compensationRepository
                    .findTopByEmployeeIdOrderByIdDesc(employeeId);

            if (latestOpt.isPresent()) {
                logger.info("Creating new record for {} based on latest record baseline", employeeId);
                CompensationDetails latest = latestOpt.get();
                comp = new CompensationDetails();
                comp.setEmployeeId(employeeId);
                currentFixed = latest.getCurrentFixedCtc();
                currentVariable = latest.getCurrentVariablePay();
            } else {
                logger.info("Creating initial record for {}", employeeId);
                comp = new CompensationDetails();
                comp.setEmployeeId(employeeId);
                currentFixed = 0.0;
                currentVariable = 0.0;
            }
        }

        if (currentFixed == null)
            currentFixed = 0.0;
        if (currentVariable == null)
            currentVariable = 0.0;

        Double proposedFixed = Math.round(currentFixed * (1 + (fixedHikePct / 100)) * 100.0) / 100.0;
        Double proposedVariable = Math.round(currentVariable * (1 + (variableHikePct / 100)) * 100.0) / 100.0;
        Double totalProposed = proposedFixed + proposedVariable;

        Double currentTotal = currentFixed + currentVariable;
        Double hikePercentage = (currentTotal > 0)
                ? Math.round(((totalProposed - currentTotal) / currentTotal) * 100 * 100.0) / 100.0
                : 0.0;

        comp.setCurrentFixedCtc(currentFixed);
        comp.setCurrentVariablePay(currentVariable);
        comp.setProposedFixedCtc(proposedFixed);
        comp.setProposedVariablePay(proposedVariable);
        comp.setEffectiveDate(effectiveDate);
        comp.setYear(currentYear);
        comp.setHikePercentage(hikePercentage);
        comp.setFixedHikePercentage(fixedHikePct);
        comp.setVariableHikePercentage(variableHikePct);
        comp.setTotalProposedCtc(totalProposed);
        comp.setInitiatorId(initiatorId);
        comp.setRevisionType(revisionType);

        employeeRepository.findByEmployeeId(employeeId).ifPresent(e -> {
            if (comp.getProposedDesignation() == null || comp.getProposedDesignation().isBlank()) {
                comp.setProposedDesignation(e.getRole());
            }
        });

        comp.setApprovalStatus("PENDING_FINALIZATION");
        comp.setApprovalStage(3);

        compensationRepository.save(comp);
    }

    @PostMapping("/bulk")
    @Transactional
    public ResponseEntity<Object> saveBulk(@RequestBody Map<String, Object> payload) {
        System.out.println("DEBUG: Entering saveBulk with payload: " + payload);
        try {
            Object rawIds = payload.get("employeeIds");
            if (!(rawIds instanceof List)) {
                return ResponseEntity.badRequest().body("employeeIds must be a list.");
            }
            List<?> rawList = (List<?>) rawIds;
            List<String> employeeIds = rawList.stream()
                    .map(Object::toString)
                    .collect(Collectors.toList());

            Double fixedHikePct = parseDouble(payload.get(CONST_FIXED_HIKE_PERCENTAGE));
            Double variableHikePct = parseDouble(payload.get(CONST_VARIABLE_HIKE_PERCENTAGE));
            java.time.LocalDate effectiveDate = parseLocalDate(payload.get(CONST_EFFECTIVE_DATE));
            String initiatorId = payload.get(CONST_INITIATOR_ID) != null ? payload.get(CONST_INITIATOR_ID).toString() : null;
            String revisionType = payload.get(CONST_REVISION_TYPE) != null ? payload.get(CONST_REVISION_TYPE).toString() : "Hike";
            int currentYear = java.time.LocalDate.now().getYear();

            if (employeeIds.isEmpty() || effectiveDate == null) {
                return ResponseEntity.badRequest().body("Employee IDs and Effective Date are required.");
            }

            int count = 0;
            for (String employeeId : employeeIds) {
                saveBulkForSingleEmployee(employeeId, effectiveDate, fixedHikePct, variableHikePct, initiatorId, revisionType, currentYear);
                count++;
            }

            return ResponseEntity.ok("Bulk salary revision submitted for " + count + " employees.");
        } catch (Exception e) {
            e.printStackTrace();
            logger.error("Error processing bulk salary revision: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal Server Error: " + e.getMessage());
        }
    }

    private Double parseDouble(Object val) {
        if (val == null)
            return 0.0;
        try {
            return Double.parseDouble(val.toString());
        } catch (Exception e) {
            return 0.0;
        }
    }

    private java.time.LocalDate parseLocalDate(Object val) {
        if (val == null)
            return null;
        String s = val.toString().trim();
        if (s.isEmpty())
            return null;
        try {
            // Standard ISO YYYY-MM-DD
            return java.time.LocalDate.parse(s);
        } catch (Exception e) {
            try {
                // Common display format DD/MM/YYYY
                java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
                return java.time.LocalDate.parse(s, dtf);
            } catch (Exception e2) {
                try {
                    // Another common format DD-MM-YYYY
                    java.time.format.DateTimeFormatter dtf2 = java.time.format.DateTimeFormatter
                            .ofPattern("dd-MM-yyyy");
                    return java.time.LocalDate.parse(s, dtf2);
                } catch (Exception e3) {
                    logger.warn("Unable to parse date string: {}", s);
                    return null;
                }
            }
        }
    }
}
