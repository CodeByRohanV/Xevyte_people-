package com.register.example.controller;

import com.register.example.entity.PerformanceDepartment;
import com.register.example.repository.PerformanceDepartmentRepository;
import com.register.example.service.EmployeeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/performance/departments")
@CrossOrigin(origins = "*")
public class PerformanceDepartmentController {

    private static final String CONST_MESSAGE = "message";

    @Autowired
    private PerformanceDepartmentRepository departmentRepository;

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private HttpServletRequest servletRequest;

    private String getCurrentUserTenantId() {
        try {
            Object tenantIdAttr = servletRequest.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                return tenantIdAttr.toString();
            }
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null) {
                String employeeId = auth.getPrincipal().toString();
                com.register.example.entity.Employee emp = employeeService.getEmployeeByEmployeeId(employeeId);
                if (emp != null) {
                    return emp.getTenantId();
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    /**
     * GET /api/performance/departments
     * Returns all custom departments for the current tenant.
     */
    @GetMapping
    public ResponseEntity<List<PerformanceDepartment>> getAllDepartments() {
        String tenantId = getCurrentUserTenantId();
        List<PerformanceDepartment> departments;
        if (tenantId != null && !tenantId.isEmpty()) {
            departments = departmentRepository.findByTenantId(tenantId);
        } else {
            departments = departmentRepository.findAll();
        }
        return ResponseEntity.ok(departments);
    }

    /**
     * POST /api/performance/departments
     * Creates a new custom department. Body: { "name": "Innovation Labs" }
     */
    @PostMapping
    public ResponseEntity<Object> createDepartment(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(CONST_MESSAGE, "Department name is required."));
        }
        name = name.trim();

        String tenantId = getCurrentUserTenantId();

        // Check for duplicate
        Optional<PerformanceDepartment> existing;
        if (tenantId != null && !tenantId.isEmpty()) {
            existing = departmentRepository.findByNameAndTenantId(name, tenantId);
        } else {
            existing = departmentRepository.findByName(name);
        }

        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(CONST_MESSAGE, "Department '" + name + "' already exists."));
        }

        PerformanceDepartment dept = new PerformanceDepartment();
        dept.setName(name);
        dept.setTenantId(tenantId);

        PerformanceDepartment saved = departmentRepository.save(dept);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * DELETE /api/performance/departments/{id}
     * Deletes a custom department by id.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteDepartment(@PathVariable Long id) {
        if (!departmentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        departmentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Department deleted successfully."));
    }
}
