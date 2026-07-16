package com.register.example.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.register.example.service.AssetAuditService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assets/audit-logs")
@CrossOrigin(origins = "*")
public class AssetAuditController {

    private final AssetAuditService auditService;
    private final jakarta.servlet.http.HttpServletRequest servletRequest;
    private final com.register.example.service.EmployeeService employeeService;

    public AssetAuditController(
            AssetAuditService auditService,
            jakarta.servlet.http.HttpServletRequest servletRequest,
            com.register.example.service.EmployeeService employeeService) {
        this.auditService = auditService;
        this.servletRequest = servletRequest;
        this.employeeService = employeeService;
    }

    private String getCurrentUserTenantId() {
        try {
            Object tenantIdAttr = servletRequest.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                return tenantIdAttr.toString();
            }
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
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

    @GetMapping
    public List<Map<String, Object>> getRecentLogs(@RequestParam(defaultValue = "5") int limit) {
        return auditService.getRecentLogs(limit, getCurrentUserTenantId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteAuditLog(@PathVariable Long id, @RequestParam String userId) {
        try {
            auditService.deleteAuditLog(id, userId, getCurrentUserTenantId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/all")
    public ResponseEntity<Object> deleteAllAuditLogs(@RequestParam String userId) {
        try {
            auditService.deleteAllAuditLogs(userId, getCurrentUserTenantId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/older-than")
    public ResponseEntity<Object> deleteAuditLogsOlderThan(@RequestParam int days, @RequestParam String userId) {
        try {
            auditService.deleteAuditLogsOlderThan(days, userId, getCurrentUserTenantId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
