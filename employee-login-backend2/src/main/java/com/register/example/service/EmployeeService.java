package com.register.example.service;

import com.register.example.payload.BulkOnboardResult;
import com.register.example.payload.BulkOnboardResult.FailureDetail;
import com.register.example.entity.Employee;
import com.register.example.entity.Applicant;
import com.register.example.repository.ApplicantRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.TenantRepository;
import com.register.example.annotation.AuditLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.time.format.ResolverStyle;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.Optional;
import java.io.InputStream;

// ⭐ NEW IMPORTS FOR APACHE POI (ASSUMED TO BE IN CLASSPATH) ⭐
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@Service
public class EmployeeService {

    private static final Random RANDOM = new Random();

    // Remains 16 columns for CSV and XLSX (Employee ID added as first column)
    private static final int EXPECTED_COLUMN_COUNT = 17;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-uuuu")
            .withResolverStyle(ResolverStyle.STRICT);

    // --- PLACEHOLDERS FOR EMAIL CONTENT ---

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private LeaveAssignmentService leaveAssignmentService;

    @Autowired
    private com.register.example.repository.CompensationDetailsRepository compensationRepository;

    @Autowired
    private ApplicantRepository applicantRepository;
    // <-- INJECT EMAIL SERVICE

    @Autowired
    private com.register.example.repository.AllocationRepository allocationRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${scaloz.api.url:https://apps.scaloz.com/api/tenant-users/sync-from-hrms}")
    private String scalozApiUrl;

    @Autowired
    private com.register.example.security.JwtTokenProvider jwtTokenProvider;

    // --- Custom Exceptions ---
    public static class DuplicateEmployeeIdException extends RuntimeException {
        public DuplicateEmployeeIdException(String message) {
            super(message);
        }
    }

    public static class DuplicateEmailException extends RuntimeException {
        public DuplicateEmailException(String message) {
            super(message);
        }
    }

    public static class DuplicateAadharNoException extends RuntimeException {
        public DuplicateAadharNoException(String message) {
            super(message);
        }
    }

    public static class DuplicatePanNoException extends RuntimeException {
        public DuplicatePanNoException(String message) {
            super(message);
        }
    }

    private static final Pattern PAN_REGEX = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]{1}$");

    // --- Get All Employees ---
    public List<Employee> getAllEmployees() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String currentEmployeeId = auth.getName();
            if (currentEmployeeId != null) {
                if (currentEmployeeId.contains("_")) {
                    String tenantId = currentEmployeeId.split("_")[0];
                    return employeeRepository.findByTenantId(tenantId);
                }
                java.util.Optional<Employee> currentEmpOpt = employeeRepository.findByEmployeeId(currentEmployeeId);
                if (currentEmpOpt.isPresent()) {
                    String tenantId = currentEmpOpt.get().getTenantId();
                    if (tenantId != null && !tenantId.isEmpty()) {
                        return employeeRepository.findByTenantId(tenantId);
                    }
                }
            }
        }
        return List.of();
    }

    // --- Get Employee by employeeId ---
    public Employee getEmployeeByEmployeeId(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId).orElse(null);
    }

    /**
     * Adds a new employee and sends a welcome email.
     * 
     * @param employee The employee object to save.
     * @return The saved Employee object.
     */
    @AuditLog(action = "CREATE", module = "EMPLOYEE", entityName = "Employee", 
              description = "Created new employee", logParameters = true)
    public Employee addNewEmployee(Employee employee) {
        // --- 1. Validate Employee ID (mandatory — entered manually during onboarding) ---
        String rawEmpId = employee.getEmployeeId();
        if (rawEmpId == null || rawEmpId.isBlank()) {
            throw new IllegalArgumentException("Employee ID is mandatory and must be provided manually.");
        }
        rawEmpId = rawEmpId.trim().toUpperCase();

        // Resolve tenant code from the request attributes set by JwtAuthenticationFilter
        String tenantCode = null;
        try {
            System.out.println("[TENANT-PREFIX] Attempting to resolve tenant code for new employee ID: " + rawEmpId);
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                String tid = (String) request.getAttribute("X-Tenant-ID");
                System.out.println("[TENANT-PREFIX] Extracted X-Tenant-ID from request attribute: " + tid);
                if (tid != null && !tid.isEmpty()) {
                    tenantCode = tid; // e.g. xevyte-0005
                } else {
                    String tidNum = (String) request.getAttribute("X-Tenant-ID-Num");
                    System.out.println("[TENANT-PREFIX] Extracted X-Tenant-ID-Num from request attribute: " + tidNum);
                    if (tidNum != null && !tidNum.isEmpty()) {
                        tenantCode = tidNum;
                    }
                }
            } else {
                System.out.println("[TENANT-PREFIX] RequestContextHolder returned null ServletRequestAttributes.");
            }
            
            // Fallback to SecurityContext if request attributes are not available
            if (tenantCode == null) {
                System.out.println("[TENANT-PREFIX] Falling back to SecurityContext to resolve tenant code.");
                org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    String currentEmployeeId = auth.getName();
                    System.out.println("[TENANT-PREFIX] Authenticated user name (usually employeeId): " + currentEmployeeId);
                    if (currentEmployeeId != null && currentEmployeeId.contains("_") && currentEmployeeId.contains("-")) {
                        tenantCode = currentEmployeeId.split("_")[0];
                        System.out.println("[TENANT-PREFIX] Extracted from auth name: " + tenantCode);
                    } else {
                        java.util.Optional<Employee> currentEmpOpt = employeeRepository.findByEmployeeId(currentEmployeeId);
                        if (currentEmpOpt.isPresent()) {
                            String dbTid = currentEmpOpt.get().getTenantId();
                            System.out.println("[TENANT-PREFIX] Found user in DB. DB tenantId is: " + dbTid);
                            if (dbTid != null && !dbTid.isEmpty()) {
                                tenantCode = dbTid;
                            }
                        } else {
                            System.out.println("[TENANT-PREFIX] Authenticated user not found in DB.");
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("[TENANT-PREFIX] Exception during tenant code resolution: " + e.getMessage());
        }
        
        if (tenantCode == null || tenantCode.isEmpty()) {
            tenantCode = employee.getTenantId();
            System.out.println("[TENANT-PREFIX] Resolved tenantCode fell back to employee.getTenantId(): " + tenantCode);
        }
        
        System.out.println("[TENANT-PREFIX] Final resolved tenantCode: " + tenantCode);

        // Prepend tenantCode_ only if not already prefixed
        if (tenantCode != null && !rawEmpId.contains("_") && !rawEmpId.startsWith(tenantCode)) {
            rawEmpId = tenantCode + "_" + rawEmpId;
            // Also ensure tenantId is set on the employee
            if (employee.getTenantId() == null || employee.getTenantId().isEmpty()) {
                employee.setTenantId(tenantCode);
            }
        }
        employee.setEmployeeId(rawEmpId);

        // --- Auto-assign Travel Admin from existing employees ---
        String newTenantId = employee.getTenantId();
        List<Employee> travelAdminSearchList;
        if (newTenantId != null && !newTenantId.isEmpty()) {
            travelAdminSearchList = employeeRepository.findByTenantId(newTenantId);
        } else {
            travelAdminSearchList = employeeRepository.findAll();
        }
        travelAdminSearchList.stream()
                .filter(e -> e.getTravelAdmin() != null && !e.getTravelAdmin().isBlank())
                .findFirst()
                .ifPresent(e -> employee.setTravelAdmin(e.getTravelAdmin()));

        // --- 2. Validate unique fields ---
        if (employeeRepository.existsById(employee.getEmployeeId())) {
            throw new DuplicateEmployeeIdException("Employee ID '" + employee.getEmployeeId() + "' already exists.");
        }

        if (employee.getAadharNo() != null && !employee.getAadharNo().isEmpty() &&
                employeeRepository.existsByAadharNo(employee.getAadharNo())) {
            throw new DuplicateAadharNoException("Aadhaar No '" + employee.getAadharNo() + "' already exists.");
        }

        // ⭐ NEW — Work Email Unique Check ⭐
        if (employee.getEmail() != null && !employee.getEmail().isEmpty()) {
            if (employeeRepository.existsByEmail(employee.getEmail())) {
                throw new DuplicateEmailException("Work Email '" + employee.getEmail() + "' already exists.");
            }
        }

        if (employee.getPanNo() != null && !employee.getPanNo().isEmpty()) {
            String uppercasePan = employee.getPanNo().toUpperCase();
            employee.setPanNo(uppercasePan);
            if (employeeRepository.existsByPanNo(uppercasePan)) {
                throw new DuplicatePanNoException("PAN No '" + uppercasePan + "' already exists.");
            }
        }

        // ⭐ NEW - Personal Email Check
        if (employee.getPersonalMail() != null && !employee.getPersonalMail().isEmpty()) {
            if (employeeRepository.existsByPersonalMail(employee.getPersonalMail())) {
                throw new IllegalArgumentException(
                        "Personal Email '" + employee.getPersonalMail() + "' already exists.");
            }
        }

        // ⭐ NEW - Contact Number Check
        if (employee.getContactNo() != null && !employee.getContactNo().isEmpty()) {
            if (employeeRepository.existsByContactNo(employee.getContactNo())) {
                throw new IllegalArgumentException("Contact Number '" + employee.getContactNo() + "' already exists.");
            }
        }

        // --- 3. Set Defaults (Use the hashed password) ---
        String rawPassword = generateRandomPassword();
        employee.setPassword(passwordEncoder.encode(rawPassword));
        employee.setMustChangePassword(true);

        employee.setActive("yes");
        employee.setAccountLocked(false);
        employee.setFailedAttempts(0);
        employee.setMustChangePassword(true);

        // --- 4. Save Employee ---
        Employee savedEmployee = employeeRepository.save(employee);

        // --- Auto-add to Compensation Details ---
        try {
            Optional<com.register.example.entity.CompensationDetails> existing = compensationRepository
                    .findByEmployeeId(savedEmployee.getEmployeeId());
            com.register.example.entity.CompensationDetails comp = existing
                    .orElse(new com.register.example.entity.CompensationDetails());

            comp.setEmployeeId(savedEmployee.getEmployeeId());

            boolean needsSync = false;
            if (!existing.isPresent()) {
                needsSync = true;
            } else {
                Double current = comp.getCurrentFixedCtc();
                if (current == null || current == 0.0) {
                    needsSync = true;
                }
            }

            if (needsSync) {
                double fixedCtc = 0.0;
                double variablePay = 0.0;

                // --- Fetch data from Applicant if applicantId is present ---
                if (savedEmployee.getApplicantId() != null && !savedEmployee.getApplicantId().isEmpty()) {
                    Optional<Applicant> applicantOpt = applicantRepository.findByApplicantId(savedEmployee.getApplicantId());
                    if (applicantOpt.isPresent()) {
                        Applicant applicant = applicantOpt.get();
                        
                        // Parse fixed_ctc
                        if (applicant.getFixedCtc() != null && !applicant.getFixedCtc().isEmpty()) {
                            try {
                                String fixedStr = applicant.getFixedCtc().replaceAll("[^0-9.]", "");
                                if (!fixedStr.isEmpty()) {
                                    fixedCtc = Double.parseDouble(fixedStr);
                                }
                            } catch (Exception e) {
                                System.err.println("Warning: Could not parse fixed_ctc for applicant: " + savedEmployee.getApplicantId());
                            }
                        }
                        
                        // Parse variable_pay
                        if (applicant.getVariablePay() != null && !applicant.getVariablePay().isEmpty()) {
                            try {
                                String varStr = applicant.getVariablePay().replaceAll("[^0-9.]", "");
                                if (!varStr.isEmpty()) {
                                    variablePay = Double.parseDouble(varStr);
                                }
                            } catch (Exception e) {
                                System.err.println("Warning: Could not parse variable_pay for applicant: " + savedEmployee.getApplicantId());
                            }
                        }
                    }
                }

                comp.setCurrentFixedCtc(fixedCtc);
                comp.setCurrentVariablePay(variablePay);
                comp.setHikePercentage(0.0);
                comp.setFixedHikePercentage(0.0);
                comp.setVariableHikePercentage(0.0);
                comp.setTotalProposedCtc(fixedCtc + variablePay);
                comp.setApprovalStatus("DETAILS");
                comp.setApprovalStage(4);
            }
            compensationRepository.save(comp);
        } catch (Exception e) {
            System.err.println("Failed to auto-sync compensation details for: " + savedEmployee.getEmployeeId()
                    + ". Error: " + e.getMessage());
        }

        leaveAssignmentService.assignLeavesByMonth(savedEmployee.getEmployeeId());

        // --- 5. Send Welcome Email ---
        sendWelcomeEmail(savedEmployee, rawPassword);

        // --- 6. Sync to Scaloz Tenant Portal (bidirectional) ---
        syncToTenantPortal(savedEmployee, rawPassword);

        return savedEmployee;
    }

    // --- Helper method to construct and send the welcome email ---
    private void sendWelcomeEmail(Employee employee, String rawPassword) {

        String recipientEmail = employee.getEmail();
        if (recipientEmail == null || recipientEmail.isEmpty()) {
            System.err.println("Warning: Cannot send welcome email for Employee ID "
                    + employee.getEmployeeId() + ". Work email is missing.");
            return;
        }

        // Resolve branding from the tenant record — no hardcoded values
        String tenantId = employee.getTenantId();
        com.register.example.entity.Tenant tenant = tenantRepository.findByTenantId(tenantId).orElse(null);

        String resolvedCompanyName = (tenant != null && tenant.getTenantName() != null)
                ? tenant.getTenantName()
                : (tenantId != null ? tenantId : "");

        String resolvedPortalLink = emailService.getTenantFrontendUrl(tenantId);

        String resolvedSupportEmail = (tenant != null && tenant.getAdminEmail() != null)
                ? tenant.getAdminEmail()
                : fromEmail;  // fall back to the system sender address

        // Extract short employee ID without tenant prefix for email display
        String displayEmpId = employee.getEmployeeId();
        if (displayEmpId != null && displayEmpId.contains("_")) {
            displayEmpId = displayEmpId.substring(displayEmpId.lastIndexOf('_') + 1);
        }

        String subject = "Welcome to " + resolvedCompanyName + " - Your Onboarding Credentials";

        String body = String.format(
                """
                        Dear %s,

                        Congratulations and welcome to %s! We're thrilled to have you onboard.

                        Your onboarding process has been successfully completed. Below are your credentials to access the Company Portal:

                        Employee ID: %s
                        Portal Link: %s
                        Temporary Password: %s

                        👉 Next Steps:
                        1. Log in to the portal using the credentials above.
                        2. You'll be prompted to change your password for security purposes.
                        3. Complete your remaining profile information and explore available resources.

                        If you face any login issues, please contact us at %s.

                        Best regards,
                        %s
                        """,
                employee.getFirstName() + " " + employee.getLastName(),
                resolvedCompanyName,
                displayEmpId,
                resolvedPortalLink,
                rawPassword,
                resolvedSupportEmail,
                resolvedCompanyName);

        try {
            emailService.sendEmail(recipientEmail, subject, body);
        } catch (Exception e) {
            System.err.println("Warning: Failed to send welcome email to " + recipientEmail + ". Error: " + e.getMessage());
        }
    }

    // --- Sync newly created HRMS employee to Scaloz Tenant Portal ---
    private void syncToTenantPortal(Employee employee, String rawPassword) {
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            String jwtToken = jwtTokenProvider.generateToken("system_sync", java.util.Map.of("role", "SYSTEM"));
            headers.set("Authorization", "Bearer " + jwtToken);

            // The short employee ID (without tenant prefix) goes into tenant_users.employee_id
            String shortEmpId = employee.getEmployeeId();
            if (shortEmpId != null && shortEmpId.contains("_")) {
                shortEmpId = shortEmpId.substring(shortEmpId.lastIndexOf('_') + 1);
            }

            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("employeeId", shortEmpId);
            payload.put("firstName", employee.getFirstName());
            payload.put("lastName", employee.getLastName());
            payload.put("email", employee.getEmail());
            payload.put("role", employee.getRole() != null ? employee.getRole() : "Employee");
            payload.put("tenantCode", employee.getTenantId());
            payload.put("workLocation", employee.getWorkLocation());
            payload.put("personalEmail", employee.getPersonalMail());
            payload.put("gender", employee.getGender());
            payload.put("dateOfBirth", employee.getDateOfBirth() != null ? employee.getDateOfBirth().toString() : null);
            payload.put("aadharNo", employee.getAadharNo());
            payload.put("panNo", employee.getPanNo());
            payload.put("presentAddress", employee.getPresentAddress());
            payload.put("permanentAddress", employee.getAddress());
            payload.put("contactNo", employee.getContactNo());
            payload.put("bloodGroup", employee.getBloodGroup());
            payload.put("joiningDate", employee.getJoiningDate() != null ? employee.getJoiningDate().toString() : null);
            payload.put("password", rawPassword); // raw password — scaloz backend will hash it

            org.springframework.http.HttpEntity<java.util.Map<String, Object>> requestEntity =
                new org.springframework.http.HttpEntity<>(payload, headers);

            System.out.println("[HRMS→Scaloz] Syncing employee " + shortEmpId + " to tenant portal: " + scalozApiUrl);
            org.springframework.http.ResponseEntity<String> response =
                restTemplate.postForEntity(scalozApiUrl, requestEntity, String.class);
            System.out.println("[HRMS→Scaloz] Sync response: " + response.getStatusCode());
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(EmployeeService.class)
                .error("[HRMS→Scaloz] Sync failed with exception", e);
            System.err.println("[HRMS→Scaloz] Warning: Could not sync employee to tenant portal: " + e.getMessage());
            // Non-fatal — employee is already saved in HRMS
        }
    }

    // --- Bulk Upload Method (Entry point for both CSV and XLSX) ---
    @AuditLog(action = "BULK_CREATE", module = "EMPLOYEE", entityName = "Employee", 
              description = "Bulk employee creation from file upload")
    public BulkOnboardResult addNewEmployeesBulk(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("File name is missing.");
        }

        if (filename.toLowerCase().endsWith(".csv")) {
            return processCsvFile(file);
        } else if (filename.toLowerCase().endsWith(".xlsx")) {
            return processExcelFile(file);
        } else {
            throw new IllegalArgumentException("Unsupported file format. Please upload a CSV or XLSX file.");
        }
    }

    // --- Helper Method to Process CSV ---
    private BulkOnboardResult processCsvFile(MultipartFile file) throws Exception {
        List<FailureDetail> failureDetails = new ArrayList<>();
        int successCount = 0;
        int totalRecords = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            reader.readLine(); // Skip header

            String line;
            int rowNumber = 2; // Start row number from 2 (after header)

            while ((line = reader.readLine()) != null) {
                totalRecords++;
                String[] columns = line.split(",", -1);

                // ⭐ Call the common row processing method
                Optional<String> failureReason = processEmployeeRow(columns, rowNumber, failureDetails);

                if (failureReason.isEmpty()) {
                    successCount++;
                }

                rowNumber++;
            }

        } catch (Exception e) {
            throw new Exception("Error reading CSV file: " + e.getMessage());
        }

        return new BulkOnboardResult(totalRecords, successCount, failureDetails);
    }

    private BulkOnboardResult processExcelFile(MultipartFile file) throws Exception {
        List<FailureDetail> failureDetails = new ArrayList<>();
        int successCount = 0;
        int totalRecords = 0;

        try (InputStream is = file.getInputStream();
                Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            // Skip header
            if (rowIterator.hasNext())
                rowIterator.next();

            int rowNumber = 2;

            DataFormatter formatter = new DataFormatter();

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                totalRecords++;

                String[] columns = new String[EXPECTED_COLUMN_COUNT];

                for (int i = 0; i < EXPECTED_COLUMN_COUNT; i++) {
                    Cell cell = row.getCell(i, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);

                    // ⭐ FIX: Convert Excel date (numeric) → dd-MM-yyyy
                    if (i == 4 || i == 12) { // JoiningDate=col4, DOB=col12 after shift
                        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                            LocalDate date = cell.getLocalDateTimeCellValue().toLocalDate();
                            columns[i] = date.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                        } else {
                            columns[i] = formatter.formatCellValue(cell).trim();
                        }
                    } else {
                        columns[i] = formatter.formatCellValue(cell).trim();
                    }
                }

                Optional<String> failureReason = processEmployeeRow(columns, rowNumber, failureDetails);
                if (failureReason.isEmpty())
                    successCount++;

                rowNumber++;
            }

        } catch (Exception e) {
            throw new Exception("Error reading Excel file: " + e.getMessage());
        }

        return new BulkOnboardResult(totalRecords, successCount, failureDetails);
    }

    // ⭐ COMMON ROW PROCESSING AND VALIDATION METHOD ⭐
    private Optional<String> processEmployeeRow(String[] columns, int rowNumber, List<FailureDetail> failureDetails) {
        String employeeId = null; // Stays null until generated

        try {
            if (columns.length < EXPECTED_COLUMN_COUNT) {
                throw new IllegalArgumentException(
                        "Missing required columns. Expected " + EXPECTED_COLUMN_COUNT);
            }

            // Auto-generate ID is no longer used — ID comes from the bulk column
            employeeId = "PENDING"; // placeholder until parsed from columns

            // Map columns — Employee ID is now column[0], all other cols shifted by 1
            String empIdInput = columns[0].trim().toUpperCase();
            String firstName = columns[1].trim();
            String lastName = columns[2].trim();
            String designation = columns[3].trim();
            String joiningDateStr = columns[4].trim();
            String workLocation = columns[5].trim();
            String email = columns[6].trim().toLowerCase();
            String personalMail = columns[7].trim().toLowerCase();
            String contactNo = columns[8].trim().replaceAll("[^0-9]", "");
            String emergencyContactNumber = columns[9].trim().replaceAll("[^0-9]", "");
            String gender = columns[10].trim();
            String bloodGroup = columns[11].trim().toUpperCase();
            String dobStr = columns[12].trim();
            String aadharNo = columns[13].trim().replaceAll("\\s", "");
            String panNo = columns[14].trim().toUpperCase().replaceAll("\\s", "");
            String address = columns[15].trim();
            String presentAddress = columns[16].trim();

            if (empIdInput.isEmpty())
                throw new IllegalArgumentException("Employee ID is mandatory");

            // -------------------------------
            // 🔥 Mandatory field checks (Same as before)
            // -------------------------------
            if (firstName.isEmpty())
                throw new IllegalArgumentException("First Name is mandatory");
            if (lastName.isEmpty())
                throw new IllegalArgumentException("Last Name is mandatory");
            if (designation.isEmpty())
                throw new IllegalArgumentException("Designation is mandatory");
            if (joiningDateStr.isEmpty())
                throw new IllegalArgumentException("Joining Date is mandatory");
            if (workLocation.isEmpty())
                throw new IllegalArgumentException("Work Location is mandatory");
            if (email.isEmpty())
                throw new IllegalArgumentException("Work Mail ID is mandatory");
            if (gender.isEmpty())
                throw new IllegalArgumentException("Gender is mandatory");
            if (bloodGroup.isEmpty())
                throw new IllegalArgumentException("Blood Group is mandatory");
            if (dobStr.isEmpty())
                throw new IllegalArgumentException("Date of Birth is mandatory");
            if (aadharNo.isEmpty())
                throw new IllegalArgumentException("Aadhaar Number is mandatory");
            if (panNo.isEmpty())
                throw new IllegalArgumentException("PAN Number is mandatory");

            // -------------------------------
            // 🔥 Strict Validation (Same as before)
            // -------------------------------
            // Email: accept any valid email format (no domain restriction)
            if (!email.matches("^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$")) {
                throw new IllegalArgumentException("Invalid Work Mail ID format: " + email);
            }

            if (aadharNo.length() != 12) {
                throw new IllegalArgumentException("Aadhaar Number must be 12 digits");
            }

            if (!PAN_REGEX.matcher(panNo).matches()) {
                throw new IllegalArgumentException("Invalid PAN format (ABCDE1234F)");
            }

            // Optional field length checks (optional fields are allowed to be empty)
            if (!contactNo.isEmpty() && contactNo.length() != 10) {
                throw new IllegalArgumentException("Contact Number must be 10 digits if provided");
            }
            if (!emergencyContactNumber.isEmpty() && emergencyContactNumber.length() != 10) {
                throw new IllegalArgumentException("Emergency Contact Number must be 10 digits if provided");
            }

            // Date parsing
            LocalDate joiningDate;
            try {
                joiningDate = LocalDate.parse(joiningDateStr, DATE_FORMATTER);
            } catch (Exception e) {
                throw new IllegalArgumentException(
                        "Invalid Joining Date: " + joiningDateStr + ". Enter a valid DD-MM-YYYY date.");
            }

            // ⭐ NEW - Duplicate Checks for Bulk Upload
            if (!email.isEmpty() && employeeRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Duplicate entry found: The Work Email '" + email
                        + "' is already associated with another employee.");
            }

            if (!personalMail.isEmpty() && employeeRepository.existsByPersonalMail(personalMail)) {
                throw new IllegalArgumentException(
                        "Duplicate entry found: The Personal Email '" + personalMail + "' is already in use.");
            }

            if (!contactNo.isEmpty() && employeeRepository.existsByContactNo(contactNo)) {
                throw new IllegalArgumentException(
                        "Duplicate entry found: The Contact Number '" + contactNo + "' is already registered.");
            }

            if (!aadharNo.isEmpty() && employeeRepository.existsByAadharNo(aadharNo)) {
                throw new IllegalArgumentException(
                        "Duplicate entry found: The Aadhaar Number '" + aadharNo + "' is already in our records.");
            }

            if (!panNo.isEmpty() && employeeRepository.existsByPanNo(panNo)) {
                throw new IllegalArgumentException(
                        "Duplicate entry found: The PAN Number '" + panNo + "' is already in our records.");
            }
            // End of Duplicate Checks

            LocalDate dob;
            try {
                dob = LocalDate.parse(dobStr, DATE_FORMATTER);
            } catch (Exception e) {
                throw new IllegalArgumentException(
                        "Invalid Date of Birth: " + dobStr + ". Enter a valid DD-MM-YYYY date.");
            }

            // Set employee ID from bulk column (will be tenant-prefixed by addNewEmployee)
            employeeId = empIdInput;
            // Build Employee Object
            Employee emp = new Employee();
            emp.setEmployeeId(employeeId);
            emp.setFirstName(firstName);
            emp.setLastName(lastName);

            emp.setRole(designation);
            emp.setEmail(email);
            emp.setJoiningDate(joiningDate);
            emp.setAadharNo(aadharNo);
            emp.setPanNo(panNo);
            emp.setContactNo(contactNo.isEmpty() ? null : contactNo);
            emp.setAddress(address.isEmpty() ? null : address);
            emp.setPresentAddress(
                    presentAddress.isEmpty() ? null : presentAddress);

            emp.setWorkLocation(workLocation);
            emp.setPersonalMail(personalMail.isEmpty() ? null : personalMail);
            emp.setEmergencyContactNumber(
                    emergencyContactNumber.isEmpty() ? null : emergencyContactNumber);
            emp.setGender(gender);
            emp.setBloodGroup(bloodGroup);
            emp.setDateOfBirth(dob);

            // Save employee using common method (handles database unique constraint checks
            // & email)
            this.addNewEmployee(emp);

            // Return Optional.empty() for success
            return Optional.empty();

        } catch (Exception e) {
            // Capture validation errors, duplicate errors, etc.
            failureDetails.add(new FailureDetail(rowNumber, employeeId, e.getMessage()));
            return Optional.of(e.getMessage()); // Return the reason for failure
        }
    }

    // ... (Existing methods: updateEmployeeBankDetails, updateEmployeeProfile,
    // updateEmployeeInsuranceDetails remain the same) ...

    @AuditLog(action = "UPDATE", module = "EMPLOYEE", entityName = "Employee", 
              description = "Updated employee bank details", logParameters = true)
    public Employee updateEmployeeBankDetails(String employeeId, Employee updatedFields) {
        Employee existing = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        // === Bank Details ===
        // Only update if currently empty or null
        if (existing.getAccountHolderName() == null || existing.getAccountHolderName().isEmpty()) {
            if (updatedFields.getAccountHolderName() != null) {
                existing.setAccountHolderName(updatedFields.getAccountHolderName());
            }
        }
        
        if (existing.getBankName() == null || existing.getBankName().isEmpty()) {
            if (updatedFields.getBankName() != null) {
                existing.setBankName(updatedFields.getBankName());
            }
        }

        if (existing.getBankAccountNumber() == null || existing.getBankAccountNumber().isEmpty()) {
            if (updatedFields.getBankAccountNumber() != null) {
                existing.setBankAccountNumber(updatedFields.getBankAccountNumber());
            }
        }

        if (existing.getBankIfscCode() == null || existing.getBankIfscCode().isEmpty()) {
            if (updatedFields.getBankIfscCode() != null) {
                existing.setBankIfscCode(updatedFields.getBankIfscCode().toUpperCase());
            }
        }

        // === Statutory Details (PF & ESI) ===
        if (existing.getUanNumber() == null || existing.getUanNumber().isEmpty()) {
            if (updatedFields.getUanNumber() != null) {
                existing.setUanNumber(updatedFields.getUanNumber());
            }
        }

        if (existing.getPfMemberId() == null || existing.getPfMemberId().isEmpty()) {
            if (updatedFields.getPfMemberId() != null) {
                existing.setPfMemberId(updatedFields.getPfMemberId());
            }
        }

        if (existing.getEsiNumber() == null || existing.getEsiNumber().isEmpty()) {
            if (updatedFields.getEsiNumber() != null) {
                existing.setEsiNumber(updatedFields.getEsiNumber());
            }
        }

        if (existing.getEsiDispensary() == null || existing.getEsiDispensary().isEmpty()) {
            if (updatedFields.getEsiDispensary() != null) {
                existing.setEsiDispensary(updatedFields.getEsiDispensary());
            }
        }

        return employeeRepository.save(existing);
    }

    @AuditLog(action = "UPDATE", module = "EMPLOYEE", entityName = "Employee", 
              description = "Updated employee profile", logParameters = true)
    public Employee updateEmployeeProfile(String employeeId, Employee updatedFields) {

        Employee existing = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // ✅ Update ONLY when value is NOT null

        if (updatedFields.getFirstName() != null)
            existing.setFirstName(updatedFields.getFirstName());

        if (updatedFields.getLastName() != null)
            existing.setLastName(updatedFields.getLastName());

        if (updatedFields.getContactNo() != null)
            existing.setContactNo(updatedFields.getContactNo());

        if (updatedFields.getAadharNo() != null)
            existing.setAadharNo(updatedFields.getAadharNo());

        if (updatedFields.getPanNo() != null)
            existing.setPanNo(updatedFields.getPanNo());

        if (updatedFields.getAddress() != null)
            existing.setAddress(updatedFields.getAddress());

        if (updatedFields.getPresentAddress() != null)
            existing.setPresentAddress(updatedFields.getPresentAddress());

        if (updatedFields.getPersonalMail() != null)
            existing.setPersonalMail(updatedFields.getPersonalMail());

        if (updatedFields.getEmergencyContactNumber() != null)
            existing.setEmergencyContactNumber(updatedFields.getEmergencyContactNumber());

        // 🔒 CRITICAL FIX (YOUR 4 BUG FIELDS)
        if (updatedFields.getGender() != null)
            existing.setGender(updatedFields.getGender());

        if (updatedFields.getBloodGroup() != null)
            existing.setBloodGroup(updatedFields.getBloodGroup());

        if (updatedFields.getDateOfBirth() != null)
            existing.setDateOfBirth(updatedFields.getDateOfBirth());

        if (updatedFields.getWorkLocation() != null)
            existing.setWorkLocation(updatedFields.getWorkLocation());

        return employeeRepository.save(existing);
    }

    private String generateRandomPassword() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghijkmnpqrstuvwxyz";
        String numbers = "23456789";
        String special = "@#$%&*!";
        String allChars = upper + lower + numbers + special;

        StringBuilder password = new StringBuilder();

        // ✅ Ensure at least one from each category
        password.append(upper.charAt(RANDOM.nextInt(upper.length())));
        password.append(lower.charAt(RANDOM.nextInt(lower.length())));
        password.append(numbers.charAt(RANDOM.nextInt(numbers.length())));
        password.append(special.charAt(RANDOM.nextInt(special.length())));

        // ✅ Fill remaining characters (total length = 10)
        for (int i = 4; i < 10; i++) {
            password.append(allChars.charAt(RANDOM.nextInt(allChars.length())));
        }

        // ✅ Shuffle to remove predictability
        List<Character> chars = new ArrayList<>();
        for (char c : password.toString().toCharArray()) {
            chars.add(c);
        }
        Collections.shuffle(chars);

        StringBuilder finalPassword = new StringBuilder();
        for (char c : chars) {
            finalPassword.append(c);
        }

        return finalPassword.toString();
    }

    public boolean checkEmployeeIdsExist(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return false;
        }

        for (String id : ids) {
            // Repository returns Optional<Employee>
            if (!employeeRepository.findByEmployeeId(id).isPresent()) {
                return false; // One ID is missing → validation fails
            }
        }
        return true; // All IDs exist
    }

    public List<Employee> getMasterDataReport(List<String> employeeIds, String role, String workLocation, String gender,
            String contactNo, LocalDate start, LocalDate end) {
        String tenantId = getCurrentTenantId();
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
        }

        List<String> ids = null;
        if (employeeIds != null && !employeeIds.isEmpty()) {
            ids = new ArrayList<>();
            for (String id : employeeIds) {
                String trimmed = id.trim();
                if (!trimmed.isEmpty()) {
                    ids.add(trimmed);
                    if (tenantCode != null) {
                        ids.add(tenantCode + "_" + trimmed);
                    }
                    if (tenantId != null) {
                        ids.add(tenantId + "_" + trimmed);
                    }
                }
            }
            if (ids.isEmpty()) ids = null;
        }

        // Map empty values to null for the query
        String r = (role == null || role.isBlank()) ? null : role;
        String wl = (workLocation == null || workLocation.isBlank()) ? null : workLocation;
        String g = (gender == null || gender.isBlank()) ? null : gender;
        String c = (contactNo == null || contactNo.isBlank()) ? null : contactNo;

        return employeeRepository.getMasterDataReport(ids, r, wl, g, c, start, end, tenantId);
    }

    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            java.util.Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            if (empOpt.isPresent()) {
                return empOpt.get().getTenantId();
            }
        }
        return null;
    }

    public List<String> getDistinctGenders() {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return employeeRepository.findDistinctGendersOnlyByTenantId(tenantId);
        }
        return employeeRepository.findDistinctGendersOnly();
    }

    public List<String> getDistinctRoles() {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return employeeRepository.findDistinctRolesByTenantId(tenantId);
        }
        return employeeRepository.findDistinctRoles();
    }

    public List<String> getDistinctWorkLocations() {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return employeeRepository.findDistinctWorkLocationsByTenantId(tenantId);
        }
        return employeeRepository.findDistinctWorkLocations();
    }

    public List<String> getDistinctDepartments() {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return employeeRepository.findDistinctDepartmentsByTenantId(tenantId);
        }
        return employeeRepository.findDistinctDepartments();
    }

    /**
     * Dynamically determines employee approval details based on active allocation for a given date.
     * If no active allocation exists for the date, returns the employee's stored approval details.
     * 
     * @param employeeId The employee ID
     * @param date The date to check for active allocation (defaults to today if null)
     * @return Map containing managerId, reviewerId, hrId, financeId, adminId
     */
    public Map<String, String> getEmployeeApprovalDetailsForDate(String employeeId, LocalDate date) {
        Map<String, String> approvalDetails = new HashMap<>();
        
        if (date == null) {
            date = LocalDate.now();
        }
        
        // Find active allocation for the given date
        List<com.register.example.entity.Allocation> activeAllocations = 
            allocationRepository.findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                employeeId, date, date);
        
        if (!activeAllocations.isEmpty()) {
            // Use the first active allocation's project approval details
            com.register.example.entity.Allocation allocation = activeAllocations.get(0);
            com.register.example.entity.Project project = allocation.getProject();
            
            if (project != null) {
                approvalDetails.put("managerId", project.getManager());
                approvalDetails.put("reviewerId", project.getReviewer());
                approvalDetails.put("hrId", project.getHr());
                approvalDetails.put("financeId", project.getFinance());
                approvalDetails.put("adminId", project.getAdmin());
                return approvalDetails;
            }
        }
        
        // Fallback to employee's stored approval details if no active allocation
        Employee employee = employeeRepository.findByEmployeeId(employeeId).orElse(null);
        if (employee != null) {
            approvalDetails.put("managerId", employee.getAssignedManagerId());
            approvalDetails.put("reviewerId", employee.getReviewerId());
            approvalDetails.put("hrId", employee.getAssignedHrId());
            approvalDetails.put("financeId", employee.getAssignedFinanceId());
            approvalDetails.put("adminId", employee.getAssignedAdminId());
        }
        
        return approvalDetails;
    }

    /**
     * Dynamically determines employee approval details based on the allocation's project.
     * This is used when displaying allocation details - it returns the approval details
     * from the project associated with the specific allocation.
     * 
     * @param allocation The allocation object
     * @return Map containing managerId, reviewerId, hrId, financeId, adminId
     */
    public Map<String, String> getEmployeeApprovalDetailsForAllocation(com.register.example.entity.Allocation allocation) {
        Map<String, String> approvalDetails = new HashMap<>();
        
        if (allocation != null && allocation.getProject() != null) {
            com.register.example.entity.Project project = allocation.getProject();
            approvalDetails.put("managerId", project.getManager());
            approvalDetails.put("reviewerId", project.getReviewer());
            approvalDetails.put("hrId", project.getHr());
            approvalDetails.put("financeId", project.getFinance());
            approvalDetails.put("adminId", project.getAdmin());
            return approvalDetails;
        }
        
        // Fallback to employee's stored approval details if no project
        if (allocation != null) {
            Employee employee = employeeRepository.findByEmployeeId(allocation.getEmployeeId()).orElse(null);
            if (employee != null) {
                approvalDetails.put("managerId", employee.getAssignedManagerId());
                approvalDetails.put("reviewerId", employee.getReviewerId());
                approvalDetails.put("hrId", employee.getAssignedHrId());
                approvalDetails.put("financeId", employee.getAssignedFinanceId());
                approvalDetails.put("adminId", employee.getAssignedAdminId());
            }
        }
        
        return approvalDetails;
    }
}
