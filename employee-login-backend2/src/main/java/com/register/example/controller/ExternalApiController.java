package com.register.example.controller;
 
import com.register.example.entity.Employee;
import com.register.example.payload.ApplicantExternalDto;
import com.register.example.payload.CompensationExternalDto;
import com.register.example.payload.EmployeeExternalDto;
import com.register.example.payload.ITDeclarationExternalDto;
import com.register.example.payload.PayrollExternalDto;
import com.register.example.service.ExternalApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
 
/**
* External API Controller for Server-to-Server Communication
* All endpoints require X-API-Key header for authentication
* Base path: /api/external
*/
@RestController
@RequestMapping("/api/external")
public class ExternalApiController {
 
    private static final String CONST_SUCCESS = "success";
    private static final String CONST_MESSAGE = "message";
    private static final String CONST_DATA = "data";
    private static final String CONST_ERROR = "error";
    private static final String CONST_COUNT = "count";

    @Autowired
    private ExternalApiService externalApiService;
 
    // ==================== HEALTH CHECK ====================
 
    /**
     * Health check endpoint
     * GET /api/external/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put(CONST_MESSAGE, "External API is running");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
 
    // ==================== APPLICANT ENDPOINTS ====================
 
    /**
     * Get all applicants
     * GET /api/external/applicants
     */
    @GetMapping("/applicants")
    public ResponseEntity<Map<String, Object>> getAllApplicants() {
        try {
            List<ApplicantExternalDto> applicants = externalApiService.getAllApplicants();
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, applicants.size());
            response.put(CONST_DATA, applicants);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get applicant by ID
     * GET /api/external/applicants/{applicantId}
     */
    @GetMapping("/applicants/{applicantId}")
    public ResponseEntity<Map<String, Object>> getApplicantById(@PathVariable String applicantId) {
        try {
            Optional<ApplicantExternalDto> applicant = externalApiService.getApplicantById(applicantId);
            Map<String, Object> response = new HashMap<>();
 
            if (applicant.isPresent()) {
                response.put(CONST_SUCCESS, true);
                response.put(CONST_DATA, applicant.get());
                return ResponseEntity.ok(response);
            } else {
                response.put(CONST_SUCCESS, false);
                response.put(CONST_MESSAGE, "Applicant not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get applicants by status
     * GET /api/external/applicants/status/{status}
     */
    @GetMapping("/applicants/status/{status}")
    public ResponseEntity<Map<String, Object>> getApplicantsByStatus(@PathVariable String status) {
        try {
            List<ApplicantExternalDto> applicants = externalApiService.getApplicantsByStatus(status);
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, applicants.size());
            response.put(CONST_DATA, applicants);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    // ==================== EMPLOYEE ENDPOINTS ====================
 
    /**
     * Create or update employee from central DB onboarding/login
     * POST /api/external/employees
     */
    @PostMapping("/employees")
    public ResponseEntity<Map<String, Object>> saveOrUpdateEmployee(@RequestBody Map<String, Object> payload) {
        try {
            Employee saved = externalApiService.saveOrUpdateEmployee(payload);
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_DATA, saved);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get all active employees
     * GET /api/external/employees
     */
    @GetMapping("/employees")
    public ResponseEntity<Map<String, Object>> getAllActiveEmployees() {
        try {
            List<EmployeeExternalDto> employees = externalApiService.getAllActiveEmployees();
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, employees.size());
            response.put(CONST_DATA, employees);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get all employees (including inactive)
     * GET /api/external/employees/all
     */
    @GetMapping("/employees/all")
    public ResponseEntity<Map<String, Object>> getAllEmployees() {
        try {
            List<EmployeeExternalDto> employees = externalApiService.getAllEmployees();
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, employees.size());
            response.put(CONST_DATA, employees);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get all employees with sensitive fields (password, PAN, Aadhar) for migration
     * GET /api/external/employees/migration
     * This endpoint returns all fields including sensitive data for internal migration use only
     */
    @GetMapping("/employees/migration")
    public ResponseEntity<Map<String, Object>> getAllEmployeesForMigration() {
        try {
            List<Employee> employees = externalApiService.getAllEmployeesWithSensitiveData();
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, employees.size());
            response.put(CONST_DATA, employees);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get employee by ID
     * GET /api/external/employees/{employeeId}
     */
    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<Map<String, Object>> getEmployeeById(@PathVariable String employeeId) {
        try {
            Optional<EmployeeExternalDto> employee = externalApiService.getEmployeeById(employeeId);
            Map<String, Object> response = new HashMap<>();
 
            if (employee.isPresent()) {
                response.put(CONST_SUCCESS, true);
                response.put(CONST_DATA, employee.get());
                return ResponseEntity.ok(response);
            } else {
                response.put(CONST_SUCCESS, false);
                response.put(CONST_MESSAGE, "Employee not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get employees by department
     * GET /api/external/employees/department/{department}
     */
    @GetMapping("/employees/department/{department}")
    public ResponseEntity<Map<String, Object>> getEmployeesByDepartment(@PathVariable String department) {
        try {
            List<EmployeeExternalDto> employees = externalApiService.getEmployeesByDepartment(department);
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, employees.size());
            response.put(CONST_DATA, employees);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    // ==================== PAYROLL ENDPOINTS ====================
 
    /**
     * Get all payroll records
     * GET /api/external/payroll
     */
    @GetMapping("/payroll")
    public ResponseEntity<Map<String, Object>> getAllPayrollRecords() {
        try {
            List<PayrollExternalDto> payrolls = externalApiService.getAllPayrollRecords();
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, payrolls.size());
            response.put(CONST_DATA, payrolls);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get payroll by employee ID
     * GET /api/external/payroll/employee/{employeeId}
     */
    @GetMapping("/payroll/employee/{employeeId}")
    public ResponseEntity<Map<String, Object>> getPayrollByEmployeeId(@PathVariable String employeeId) {
        try {
            List<PayrollExternalDto> payrolls = externalApiService.getPayrollByEmployeeId(employeeId);
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, payrolls.size());
            response.put(CONST_DATA, payrolls);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get payroll by month
     * GET /api/external/payroll/month/{month}
     * Example: /api/external/payroll/month/2026-02
     */
    @GetMapping("/payroll/month/{month}")
    public ResponseEntity<Map<String, Object>> getPayrollByMonth(@PathVariable String month) {
        try {
            List<PayrollExternalDto> payrolls = externalApiService.getPayrollByMonth(month);
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, payrolls.size());
            response.put(CONST_DATA, payrolls);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    // ==================== COMPENSATION ENDPOINTS ====================
 
    /**
     * Get all compensation records
     * GET /api/external/compensation
     */
    @GetMapping("/compensation")
    public ResponseEntity<Map<String, Object>> getAllCompensationRecords() {
        try {
            List<CompensationExternalDto> compensations = externalApiService.getAllCompensationRecords();
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, compensations.size());
            response.put(CONST_DATA, compensations);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get compensation records by employee ID
     * GET /api/external/compensation/employee/{employeeId}
     */
    @GetMapping("/compensation/employee/{employeeId}")
    public ResponseEntity<Map<String, Object>> getCompensationByEmployeeId(@PathVariable String employeeId) {
        try {
            List<CompensationExternalDto> compensations = externalApiService.getCompensationByEmployeeId(employeeId);
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, compensations.size());
            response.put(CONST_DATA, compensations);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get latest compensation record by employee ID
     * GET /api/external/compensation/employee/{employeeId}/latest
     */
    @GetMapping("/compensation/employee/{employeeId}/latest")
    public ResponseEntity<Map<String, Object>> getLatestCompensationByEmployeeId(@PathVariable String employeeId) {
        try {
            Optional<CompensationExternalDto> compensation = externalApiService
                    .getLatestCompensationByEmployeeId(employeeId);
            Map<String, Object> response = new HashMap<>();
 
            if (compensation.isPresent()) {
                response.put(CONST_SUCCESS, true);
                response.put(CONST_DATA, compensation.get());
                return ResponseEntity.ok(response);
            } else {
                response.put(CONST_SUCCESS, false);
                response.put(CONST_MESSAGE, "Compensation record not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    // ==================== IT DECLARATION ENDPOINTS ====================
 
    /**
     * Get all IT declaration records for all employees
     * GET /api/external/it-declarations
     */
    @GetMapping("/it-declarations")
    public ResponseEntity<Map<String, Object>> getAllITDeclarations() {
        try {
            List<ITDeclarationExternalDto> declarations = externalApiService.getAllITDeclarations();
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, declarations.size());
            response.put(CONST_DATA, declarations);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get all IT declaration records for an employee
     * GET /api/external/it-declarations/employee/{employeeId}
     */
    @GetMapping("/it-declarations/employee/{employeeId}")
    public ResponseEntity<Map<String, Object>> getITDeclarationsByEmployeeId(@PathVariable String employeeId) {
        try {
            List<ITDeclarationExternalDto> declarations = externalApiService.getITDeclarationsByEmployeeId(employeeId);
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_COUNT, declarations.size());
            response.put(CONST_DATA, declarations);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Get latest IT declaration record for an employee
     * GET /api/external/it-declarations/employee/{employeeId}/latest
     */
    @GetMapping("/it-declarations/employee/{employeeId}/latest")
    public ResponseEntity<Map<String, Object>> getLatestITDeclarationByEmployeeId(@PathVariable String employeeId) {
        try {
            Optional<ITDeclarationExternalDto> declaration = externalApiService
                    .getLatestITDeclarationByEmployeeId(employeeId);
            Map<String, Object> response = new HashMap<>();
 
            if (declaration.isPresent()) {
                response.put(CONST_SUCCESS, true);
                response.put(CONST_DATA, declaration.get());
                return ResponseEntity.ok(response);
            } else {
                response.put(CONST_SUCCESS, false);
                response.put(CONST_MESSAGE, "IT Declaration not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
 
    /**
     * Create or update tenant metadata
     * POST /api/external/tenants
     */
    @PostMapping("/tenants")
    public ResponseEntity<Map<String, Object>> saveOrUpdateTenant(@RequestBody Map<String, Object> payload) {
        try {
            com.register.example.entity.Tenant saved = externalApiService.saveOrUpdateTenant(payload);
            Map<String, Object> response = new HashMap<>();
            response.put(CONST_SUCCESS, true);
            response.put(CONST_DATA, saved);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(CONST_SUCCESS, false);
            errorResponse.put(CONST_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}