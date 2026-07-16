package com.register.example.controller;

import com.register.example.payload.BulkOnboardResult;
import com.register.example.entity.Employee;
import com.register.example.repository.PerformanceDepartmentRepository;
import com.register.example.service.EmployeeService;
import com.register.example.service.EmployeeService.DuplicateAadharNoException;
import com.register.example.service.EmployeeService.DuplicateEmployeeIdException;
import com.register.example.service.EmployeeService.DuplicatePanNoException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import com.register.example.payload.EmployeeValidationRequest;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private PerformanceDepartmentRepository performanceDepartmentRepository;

    // --- Get all employees ---
    @GetMapping
    public List<Employee> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    // --- Get employee by employeeId (for profile view) ---
    @GetMapping("/{employeeId}")
    public ResponseEntity<Object> getEmployeeByEmployeeId(@PathVariable String employeeId) {
        Employee employee = employeeService.getEmployeeByEmployeeId(employeeId);
        if (employee != null) {
            return new ResponseEntity<>(employee, HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Employee not found", HttpStatus.NOT_FOUND);
        }
    }

    // --- Add new employee (Single Entry) ---
    @PostMapping
    public ResponseEntity<Object> addEmployee(@RequestBody Employee employee, jakarta.servlet.http.HttpServletRequest request) {
        try {
            String tenantCode = (String) request.getAttribute("X-Tenant-ID");
            if (tenantCode == null) {
                tenantCode = (String) request.getAttribute("X-Tenant-ID-Num");
            }
            if (tenantCode != null && !tenantCode.isBlank()) {
                employee.setTenantId(tenantCode);
            }
            Employee newEmployee = employeeService.addNewEmployee(employee);
            return new ResponseEntity<>(newEmployee, HttpStatus.CREATED);
        } catch (DuplicateEmployeeIdException
                | DuplicateAadharNoException
                | DuplicatePanNoException
                | EmployeeService.DuplicateEmailException
                | IllegalArgumentException e) {

            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);

        } catch (Exception e) {
            return new ResponseEntity<>(
                    "Failed to create employee due to an unexpected error: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // --- Bulk Upload Endpoint ---
    @PostMapping("/bulk-onboard")
    public ResponseEntity<Object> bulkOnboardEmployees(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()
                || (!file.getOriginalFilename().endsWith(".csv") && !file.getOriginalFilename().endsWith(".xlsx"))) {
            return new ResponseEntity<>("Please upload a valid CSV or XLSX file.", HttpStatus.BAD_REQUEST);
        }
        try {
            BulkOnboardResult result = employeeService.addNewEmployeesBulk(file);
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to process bulk file: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // --- Update Employee Profile (Profile Settings) ---
    @PutMapping("/{employeeId}")
    public ResponseEntity<Object> updateEmployeeProfile(
            @PathVariable String employeeId,
            @RequestBody Employee updatedFields) {
        try {
            Employee updated = employeeService.updateEmployeeProfile(employeeId, updatedFields);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update employee: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // --- NEW: Update Employee Bank & Statutory Details ---
    /**
     * Handles updates specifically for bank and statutory details by calling the
     * dedicated service method.
     * This endpoint is separate from the general profile update to allow for
     * targeted updates.
     */
    @PutMapping("/{employeeId}/bank-details") // <-- Dedicated endpoint mapping
    public ResponseEntity<Object> updateEmployeeBankDetails(
            @PathVariable String employeeId,
            @RequestBody Employee updatedFields) {
        try {
            // Calls the dedicated service method that only updates bank/statutory fields
            Employee updated = employeeService.updateEmployeeBankDetails(employeeId, updatedFields);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (RuntimeException e) {
            // Catches "Employee not found" or other specific exceptions from the service
            // layer
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update bank details: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<Object> validateEmployeeIds(@RequestBody EmployeeValidationRequest request) {
        try {
            boolean allExist = employeeService.checkEmployeeIdsExist(request.getEmployeeIds());
            return ResponseEntity.ok().body(new ValidationResponse(allExist));
        } catch (Exception e) {
            return new ResponseEntity<>("Validation failed: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/master-data-report")
    public ResponseEntity<List<Employee>> getMasterDataReport(
            @RequestParam(value = "employeeIds", required = false) List<String> employeeIds,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "workLocation", required = false) String workLocation,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "contactNo", required = false) String contactNo,
            @RequestParam(value = "startDate", required = false) @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate endDate) {
        return ResponseEntity.ok(employeeService.getMasterDataReport(employeeIds, role, workLocation, gender, contactNo,
                startDate, endDate));
    }

    @GetMapping("/distinct-roles")
    public ResponseEntity<List<String>> getDistinctRoles() {
        return ResponseEntity.ok(employeeService.getDistinctRoles());
    }

    @GetMapping("/distinct-locations")
    public ResponseEntity<List<String>> getDistinctWorkLocations() {
        return ResponseEntity.ok(employeeService.getDistinctWorkLocations());
    }

    @GetMapping("/distinct-genders")
    public ResponseEntity<List<String>> getDistinctGenders() {
        return ResponseEntity.ok(employeeService.getDistinctGenders());
    }

    /**
     * GET /api/employees/distinct-departments
     * Returns a merged, deduplicated, sorted list of:
     *  - departments derived from existing employee records
     *  - custom departments created in the Performance Admin module
     */
    @GetMapping("/distinct-departments")
    public ResponseEntity<List<String>> getDistinctDepartments(HttpServletRequest request) {
        // 1. Employee-based departments (already distinct + sorted)
        List<String> empDepts = employeeService.getDistinctDepartments();

        // 2. Custom performance departments
        String tenantId = null;
        try {
            Object tenantIdAttr = request.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                tenantId = tenantIdAttr.toString();
            } else {
                org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() != null) {
                    String empId = auth.getPrincipal().toString();
                    Employee emp = employeeService.getEmployeeByEmployeeId(empId);
                    if (emp != null) tenantId = emp.getTenantId();
                }
            }
        } catch (Exception ignored) {}

        List<String> customDepts;
        if (tenantId != null && !tenantId.isEmpty()) {
            customDepts = performanceDepartmentRepository.findNamesByTenantId(tenantId);
        } else {
            customDepts = performanceDepartmentRepository.findAllNames();
        }

        // 3. Merge, deduplicate, sort
        Set<String> merged = new LinkedHashSet<>(empDepts);
        merged.addAll(customDepts);
        List<String> result = merged.stream().sorted(String.CASE_INSENSITIVE_ORDER).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    public static class ValidationResponse {
        public boolean valid;

        public ValidationResponse(boolean valid) {
            this.valid = valid;
        }
    }

}