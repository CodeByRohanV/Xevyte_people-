package com.register.example.service;
 
import com.register.example.entity.Applicant;
import com.register.example.entity.Employee;
import com.register.example.entity.PayrollManagement;
import com.register.example.entity.CompensationDetails;
import com.register.example.entity.ITDeclaration;
import com.register.example.entity.ITDeclarationField;
import com.register.example.payload.ApplicantExternalDto;
import com.register.example.payload.EmployeeExternalDto;
import com.register.example.payload.PayrollExternalDto;
import com.register.example.payload.CompensationExternalDto;
import com.register.example.payload.ITDeclarationExternalDto;
import com.register.example.payload.ITDeclarationComponentDto;
import com.register.example.payload.ITDeclarationSectionDto;
import com.register.example.repository.ApplicantRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.PayrollManagementRepository;
import com.register.example.repository.CompensationDetailsRepository;
import com.register.example.repository.ITDeclarationRepository;
import com.register.example.repository.ITDeclarationFieldRepository;
import com.register.example.repository.ITDeclarationCardRepository;
import com.register.example.repository.TenantRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
 
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
 
/**
* Service for handling external API requests
* Provides data transformation and business logic for external applications
*/
@Service
public class ExternalApiService {
 
    private static final Logger logger = LoggerFactory.getLogger(ExternalApiService.class);
 
    @Autowired
    private TenantRepository tenantRepository;
 
    @Autowired
    private PasswordEncoder passwordEncoder;
 
    @Autowired
    private ApplicantRepository applicantRepository;
 
    @Autowired
    private EmployeeRepository employeeRepository;
 
    @Autowired
    private PayrollManagementRepository payrollManagementRepository;
 
    @Autowired
    private CompensationDetailsRepository compensationDetailsRepository;
 
    @Autowired
    private ITDeclarationRepository itDeclarationRepository;
 
    @Autowired
    private ITDeclarationFieldRepository itDeclarationFieldRepository;
 
    @Autowired
    private ITDeclarationCardRepository itDeclarationCardRepository;
 
    // ==================== APPLICANT METHODS ====================
 
    /**
     * Get all applicants
     */
    public List<ApplicantExternalDto> getAllApplicants() {
        List<Applicant> applicants = applicantRepository.findAll();
        return applicants.stream()
                .map(this::convertToApplicantDto)
                .collect(Collectors.toList());
    }
 
    /**
     * Get applicant by ID
     */
    public Optional<ApplicantExternalDto> getApplicantById(String applicantId) {
        return applicantRepository.findById(applicantId)
                .map(this::convertToApplicantDto);
    }
 
    /**
     * Get applicants by status
     */
    public List<ApplicantExternalDto> getApplicantsByStatus(String status) {
        List<Applicant> applicants = applicantRepository.findByStatus(status);
        return applicants.stream()
                .map(this::convertToApplicantDto)
                .collect(Collectors.toList());
    }
 
    // ==================== EMPLOYEE METHODS ====================
 
    /**
     * Get all active employees
     */
    public List<EmployeeExternalDto> getAllActiveEmployees() {
        List<Employee> employees = employeeRepository.findByActive("yes");
        return employees.stream()
                .map(this::convertToEmployeeDto)
                .collect(Collectors.toList());
    }
 
    /**
     * Get all employees (active and inactive)
     */
    public List<EmployeeExternalDto> getAllEmployees() {
        List<Employee> employees = employeeRepository.findAll();
        return employees.stream()
                .map(this::convertToEmployeeDto)
                .collect(Collectors.toList());
    }
 
    /**
     * Get all employees with sensitive data (password, PAN, Aadhar) for migration
     * Returns full Employee entities including sensitive fields
     */
    public List<Employee> getAllEmployeesWithSensitiveData() {
        return employeeRepository.findAll();
    }
 
    /**
     * Get employee by ID
     */
    public Optional<EmployeeExternalDto> getEmployeeById(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId)
                .map(this::convertToEmployeeDto);
    }
 
    /**
     * Get employees by department
     */
    public List<EmployeeExternalDto> getEmployeesByDepartment(String department) {
        List<Employee> employees = employeeRepository.findByDepartment(department);
        return employees.stream()
                .map(this::convertToEmployeeDto)
                .collect(Collectors.toList());
    }
 
    // ==================== PAYROLL METHODS ====================
 
    /**
     * Get all payroll records
     */
    public List<PayrollExternalDto> getAllPayrollRecords() {
        List<PayrollManagement> payrolls = payrollManagementRepository.findAll();
        return payrolls.stream()
                .map(this::convertToPayrollDto)
                .collect(Collectors.toList());
    }
 
    /**
     * Get payroll by employee ID
     */
    public List<PayrollExternalDto> getPayrollByEmployeeId(String employeeId) {
        List<PayrollManagement> payrolls = payrollManagementRepository.findByEmployeeId(employeeId);
        return payrolls.stream()
                .map(this::convertToPayrollDto)
                .collect(Collectors.toList());
    }
 
    /**
     * Get payroll by month
     */
    public List<PayrollExternalDto> getPayrollByMonth(String month) {
        List<PayrollManagement> payrolls = payrollManagementRepository.findByPayableMonth(month);
        return payrolls.stream()
                .map(this::convertToPayrollDto)
                .collect(Collectors.toList());
    }
 
    // ==================== COMPENSATION METHODS ====================
 
    /**
     * Get all compensation records
     */
    public List<CompensationExternalDto> getAllCompensationRecords() {
        List<CompensationDetails> compensations = compensationDetailsRepository.findAll();
        return compensations.stream()
                .map(this::convertToCompensationDto)
                .collect(Collectors.toList());
    }
 
    /**
     * Get compensation records by employee ID
     */
    public List<CompensationExternalDto> getCompensationByEmployeeId(String employeeId) {
        List<CompensationDetails> compensations = compensationDetailsRepository.findAllByEmployeeId(employeeId);
        return compensations.stream()
                .map(this::convertToCompensationDto)
                .collect(Collectors.toList());
    }
 
    /**
     * Get latest compensation record by employee ID
     */
    public Optional<CompensationExternalDto> getLatestCompensationByEmployeeId(String employeeId) {
        return compensationDetailsRepository.findTopByEmployeeIdOrderByIdDesc(employeeId)
                .map(this::convertToCompensationDto);
    }
 
    // ==================== IT DECLARATION METHODS ====================
 
    /**
     * Get all IT declaration records for all employees
     */
    public List<ITDeclarationExternalDto> getAllITDeclarations() {
        List<ITDeclaration> declarations = itDeclarationRepository.findAll();
        return declarations.stream()
                .map(this::convertToITDeclarationDto)
                .collect(Collectors.toList());
    }
 
    /**
     * Get all IT declaration records for an employee
     */
    public List<ITDeclarationExternalDto> getITDeclarationsByEmployeeId(String employeeId) {
        List<ITDeclaration> declarations = itDeclarationRepository.findByEmployee_EmployeeId(employeeId);
        return declarations.stream()
                .map(this::convertToITDeclarationDto)
                .collect(Collectors.toList());
    }
 
    /**
     * Get latest IT declaration record for an employee
     */
    public Optional<ITDeclarationExternalDto> getLatestITDeclarationByEmployeeId(String employeeId) {
        return itDeclarationRepository.findFirstByEmployee_EmployeeIdOrderByFinancialYearDesc(employeeId)
                .map(this::convertToITDeclarationDto);
    }
 
    // ==================== CONVERSION METHODS ====================
 
    /**
     * Convert Applicant entity to DTO (excludes sensitive data)
     */
    private ApplicantExternalDto convertToApplicantDto(Applicant applicant) {
        ApplicantExternalDto dto = new ApplicantExternalDto();
        dto.setApplicantId(applicant.getApplicantId());
        dto.setFirstName(applicant.getFirstName());
        dto.setLastName(applicant.getLastName());
        dto.setEmail(applicant.getEmail());
        dto.setPhone(applicant.getPhone());
        dto.setPosition(applicant.getPosition());
        dto.setClient(applicant.getClient());
        dto.setStatus(applicant.getStatus());
        dto.setTimestamp(applicant.getTimestamp());
        dto.setAmId(applicant.getAmId());
        dto.setHrId(applicant.getHrId());
        dto.setFinanceId(applicant.getFinanceId());
        dto.setFixedCtc(applicant.getFixedCtc());
        dto.setApprovedLocation(applicant.getApprovedLocation());
        dto.setApprovedDoj(applicant.getApprovedDoj());
        dto.setVariablePay(applicant.getVariablePay());
        return dto;
    }
 
    /**
     * Convert Employee entity to DTO (excludes only password, PAN, and Aadhar)
     */
    private EmployeeExternalDto convertToEmployeeDto(Employee employee) {
        EmployeeExternalDto dto = new EmployeeExternalDto();
 
        // Basic fields
        dto.setId(employee.getId());
        dto.setEmployeeId(employee.getEmployeeId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setEmail(employee.getEmail());
 
        // Role and assignment fields
        dto.setRole(employee.getRole());
        dto.setAssignedManagerId(employee.getAssignedManagerId());
        dto.setAssignedHrId(employee.getAssignedHrId());
        dto.setAssignedFinanceId(employee.getAssignedFinanceId());
        dto.setAssignedAdminId(employee.getAssignedAdminId());
        dto.setTravelAdmin(employee.getTravelAdmin());
        dto.setReviewerId(employee.getReviewerId());
 
        // Employment details
        dto.setDepartment(employee.getDepartment());
        dto.setEmployeeType(employee.getEmployeeType());
        dto.setProbationStatus(employee.getProbationStatus());
        dto.setActive(employee.getActive());
        dto.setJoiningDate(employee.getJoiningDate());
        dto.setTaxRegime(employee.getTaxRegime());
 
        // Account status
        dto.setFailedAttempts(employee.getFailedAttempts());
        dto.setAccountLocked(employee.isAccountLocked());
        dto.setMustChangePassword(employee.getMustChangePassword());
 
        // Personal details
        dto.setDateOfBirth(employee.getDateOfBirth());
        dto.setGender(employee.getGender());
        dto.setBloodGroup(employee.getBloodGroup());
        dto.setContactNo(employee.getContactNo());
        dto.setPersonalMail(employee.getPersonalMail());
        dto.setEmergencyContactNumber(employee.getEmergencyContactNumber());
        dto.setAddress(employee.getAddress());
        dto.setPresentAddress(employee.getPresentAddress());
        dto.setWorkLocation(employee.getWorkLocation());
        dto.setProfilePic(employee.getProfilePic());
 
        // Bank details
        dto.setAccountHolderName(employee.getAccountHolderName());
        dto.setBankName(employee.getBankName());
        dto.setBankAccountNumber(employee.getBankAccountNumber());
        dto.setBankIfscCode(employee.getBankIfscCode());
 
        // Statutory details
        dto.setUanNumber(employee.getUanNumber());
        dto.setPfMemberId(employee.getPfMemberId());
        dto.setEsiNumber(employee.getEsiNumber());
        dto.setEsiDispensary(employee.getEsiDispensary());
 
        // Excluded for security: password, panNo, aadharNo
 
        return dto;
    }
 
    /**
     * Convert PayrollManagement entity to DTO
     */
    private PayrollExternalDto convertToPayrollDto(PayrollManagement payroll) {
        PayrollExternalDto dto = new PayrollExternalDto();
        dto.setId(payroll.getId());
        dto.setEmployeeId(payroll.getEmployeeId());
        dto.setEmployeeName(payroll.getEmployeeName());
        dto.setPayableDays(payroll.getPayableDays());
        dto.setPayableMonth(payroll.getPayableMonth());
        dto.setLopDays(payroll.getLopDays());
        return dto;
    }
 
    /**
     * Convert CompensationDetails entity to DTO
     */
    private CompensationExternalDto convertToCompensationDto(CompensationDetails comp) {
        CompensationExternalDto dto = new CompensationExternalDto();
        dto.setId(comp.getId());
        dto.setEmployeeId(comp.getEmployeeId());
        dto.setCurrentFixedCtc(comp.getCurrentFixedCtc());
        dto.setCurrentVariablePay(comp.getCurrentVariablePay());
        dto.setProposedFixedCtc(comp.getProposedFixedCtc());
        dto.setProposedVariablePay(comp.getProposedVariablePay());
        dto.setEffectiveDate(comp.getEffectiveDate());
        dto.setYear(comp.getYear());
        dto.setHikePercentage(comp.getHikePercentage());
        dto.setFixedHikePercentage(comp.getFixedHikePercentage());
        dto.setVariableHikePercentage(comp.getVariableHikePercentage());
        dto.setTotalProposedCtc(comp.getTotalProposedCtc());
        dto.setApprovalStatus(comp.getApprovalStatus());
        dto.setRevisionType(comp.getRevisionType());
        dto.setProposedDesignation(comp.getProposedDesignation());
        return dto;
    }
 
/**
     * Convert ITDeclaration entity to DTO (includes dynamic values as a map)
     */
    private ITDeclarationExternalDto convertToITDeclarationDto(ITDeclaration declaration) {
        ITDeclarationExternalDto dto = new ITDeclarationExternalDto();
        dto.setEmployeeId(declaration.getEmployee().getEmployeeId());
        dto.setFinancialYear(declaration.getFinancialYear());
        dto.setStatus(declaration.getStatus());
        dto.setTaxRegime(declaration.getTaxRegime());
        dto.setSubmissionDate(declaration.getSubmissionDate());
 
        // Map dynamic values to a flat map for easier external consumption
        Map<String, String> data = declaration.getDynamicValues().stream()
                .collect(Collectors.toMap(
                        val -> val.getFieldId(),
                        val -> val.getFieldValue() != null ? val.getFieldValue() : "",
                        (v1, v2) -> v1 // Handle duplicates if any
                ));
        dto.setDeclarationData(data);
 
        // Fetch and include component metadata with max limits
        List<ITDeclarationField> fields = itDeclarationFieldRepository.findAllByFinancialYear(declaration.getFinancialYear());
        List<ITDeclarationComponentDto> componentMetadata = fields.stream()
                .map(field -> new ITDeclarationComponentDto(
                        field.getFieldId(),
                        field.getFieldLabel(),
                        field.getDataType(),
                        field.getMaxLimit(),
                        field.getRequired(),
                        field.getPlaceholder(),
                        field.getDisplayOrder(),
                        field.getCard() != null ? field.getCard().getTitle() : null
                ))
                .collect(Collectors.toList());
        dto.setComponentMetadata(componentMetadata);
 
        // Fetch and include section metadata with section max limits and total declared
        List<com.register.example.entity.ITDeclarationCard> cards = itDeclarationCardRepository.findAllByFinancialYearOrderByDisplayOrderAsc(declaration.getFinancialYear());
        
        // Create a map of fieldId to card title for calculating totals per section
        Map<String, String> fieldToSectionMap = fields.stream()
                .collect(Collectors.toMap(
                        ITDeclarationField::getFieldId,
                        field -> field.getCard() != null ? field.getCard().getTitle() : "Other",
                        (v1, v2) -> v1 // Handle duplicates
                ));
        
        // Calculate total declared per section
        Map<String, Double> sectionTotals = declaration.getDynamicValues().stream()
                .collect(Collectors.groupingBy(
                        val -> fieldToSectionMap.getOrDefault(val.getFieldId(), "Other"),
                        Collectors.summingDouble(val -> {
                            try {
                                return Double.parseDouble(val.getFieldValue() != null ? val.getFieldValue() : "0");
                            } catch (Exception e) {
                                return 0.0;
                            }
                        })
                ));
        
        List<ITDeclarationSectionDto> sectionMetadata = cards.stream()
                .map(card -> new ITDeclarationSectionDto(
                        card.getTitle(),
                        card.getSectionMaxLimit(),
                        sectionTotals.getOrDefault(card.getTitle(), 0.0),
                        card.getDescription(),
                        card.getDisplayOrder()
                ))
                .collect(Collectors.toList());
        dto.setSectionMetadata(sectionMetadata);
 
        return dto;
    }
 
    @org.springframework.transaction.annotation.Transactional
    public Employee saveOrUpdateEmployee(Map<String, Object> payload) {
        String employeeId = (String) payload.get("employeeId");
        if (employeeId == null || employeeId.trim().isEmpty()) {
            throw new IllegalArgumentException("Employee ID is required");
        }
 
        String tenantId = (String) payload.get("tenantId");
        String tenantName = (String) payload.get("tenantName");
        String tenantCode = (String) payload.get("tenantCode");
 
        // ── Auto-provision Tenant if missing ──
        if (tenantId != null) {
            try {
                if (!tenantRepository.findByTenantId(tenantId).isPresent()) {
                    logger.info("External API: Tenant not found in HRMS database. Auto-creating tenant: id={}, name={}, subdomain={}", tenantId, tenantName, tenantCode);
                    com.register.example.entity.Tenant newTenant = new com.register.example.entity.Tenant();
                    newTenant.setTenantId(tenantId);
                    newTenant.setTenantName(tenantName != null ? tenantName : ("Tenant " + tenantId));
                    String adminEmail = (String) payload.get("adminEmail");
                    if (adminEmail == null) {
                        adminEmail = (String) payload.get("admin_email");
                    }
                    if (adminEmail != null) {
                        newTenant.setAdminEmail(adminEmail);
                    }
                    tenantRepository.save(newTenant);
                }
            } catch (Exception e) {
                logger.error("External API: Failed to auto-provision tenant metadata in DB:", e);
            }
        }
 
        // ── Save or Update Employee ──
        Optional<Employee> existingOpt = employeeRepository.findByEmployeeId(employeeId);
        Employee emp;
        if (existingOpt.isPresent()) {
            emp = existingOpt.get();
            if (payload.containsKey("password")) {
                String rawPassword = (String) payload.get("password");
                if (rawPassword != null && !rawPassword.isBlank()) {
                    emp.setPassword(passwordEncoder.encode(rawPassword));
                }
            }
        } else {
            emp = new Employee();
            emp.setEmployeeId(employeeId);
            if (payload.containsKey("password")) {
                String rawPassword = (String) payload.get("password");
                if (rawPassword != null && !rawPassword.isBlank()) {
                    emp.setPassword(passwordEncoder.encode(rawPassword));
                } else {
                    emp.setPassword(passwordEncoder.encode("SSO_BYPASS_DUMMY_PASSWORD_" + java.util.UUID.randomUUID().toString()));
                }
            } else {
                emp.setPassword(passwordEncoder.encode("SSO_BYPASS_DUMMY_PASSWORD_" + java.util.UUID.randomUUID().toString()));
            }
            emp.setActive("yes");
            emp.setMustChangePassword(false);
            emp.setAccountLocked(false);
            emp.setFailedAttempts(0);
        }
 
        // Map basic fields
        if (payload.containsKey("firstName")) emp.setFirstName((String) payload.get("firstName"));
        if (payload.containsKey("lastName")) emp.setLastName((String) payload.get("lastName"));
        if (payload.containsKey("email")) emp.setEmail((String) payload.get("email"));
        if (payload.containsKey("role")) emp.setRole((String) payload.get("role"));
        if (tenantId != null) emp.setTenantId(tenantId);
 
        // Map onboarding fields
        if (payload.containsKey("workLocation")) emp.setWorkLocation((String) payload.get("workLocation"));
        if (payload.containsKey("personalEmail")) emp.setPersonalMail((String) payload.get("personalEmail"));
        if (payload.containsKey("gender")) emp.setGender((String) payload.get("gender"));
        if (payload.containsKey("aadharNo")) emp.setAadharNo((String) payload.get("aadharNo"));
        if (payload.containsKey("panNo")) {
            String pan = (String) payload.get("panNo");
            emp.setPanNo(pan != null ? pan.toUpperCase() : null);
        }
        if (payload.containsKey("presentAddress")) emp.setPresentAddress((String) payload.get("presentAddress"));
        if (payload.containsKey("permanentAddress")) emp.setAddress((String) payload.get("permanentAddress"));
        if (payload.containsKey("contactNo")) emp.setContactNo((String) payload.get("contactNo"));
        if (payload.containsKey("bloodGroup")) emp.setBloodGroup((String) payload.get("bloodGroup"));
 
        // Dates
        if (payload.containsKey("dateOfBirth")) {
            emp.setDateOfBirth(parseDateSafely((String) payload.get("dateOfBirth")));
        }
        if (payload.containsKey("joiningDate")) {
            emp.setJoiningDate(parseDateSafely((String) payload.get("joiningDate")));
        }
 
        return employeeRepository.save(emp);
    }
 
    @org.springframework.transaction.annotation.Transactional
    public com.register.example.entity.Tenant saveOrUpdateTenant(Map<String, Object> payload) {
        String tenantId = (String) payload.get("tenantId");
        if (tenantId == null || tenantId.trim().isEmpty()) {
            throw new IllegalArgumentException("Tenant ID is required");
        }
        String tenantName = (String) payload.get("tenantName");
 
        Optional<com.register.example.entity.Tenant> existingOpt = tenantRepository.findByTenantId(tenantId);
        com.register.example.entity.Tenant tenant;
        if (existingOpt.isPresent()) {
            tenant = existingOpt.get();
        } else {
            tenant = new com.register.example.entity.Tenant();
            tenant.setTenantId(tenantId);
        }
        tenant.setTenantName(tenantName != null ? tenantName : ("Tenant " + tenantId));
        String adminEmail = (String) payload.get("adminEmail");
        if (adminEmail == null) {
            adminEmail = (String) payload.get("admin_email");
        }
        if (adminEmail != null) {
            tenant.setAdminEmail(adminEmail);
        }
        return tenantRepository.save(tenant);
    }
 
    private java.time.LocalDate parseDateSafely(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            // Try standard ISO-8601 (YYYY-MM-DD)
            return java.time.LocalDate.parse(dateStr);
        } catch (Exception e) {
            // Try common formats like DD-MM-YYYY or DD/MM/YYYY
            try {
                String clean = dateStr.replace("/", "-");
                java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy");
                return java.time.LocalDate.parse(clean, dtf);
            } catch (Exception ex) {
                logger.warn("External API: Failed to parse date string: {}", dateStr);
                return null;
            }
        }
    }
}