package com.register.example.controller;

import com.register.example.entity.AuditLog;
import com.register.example.repository.AuditLogRepository;
import com.register.example.service.AuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "*")
public class AuditController {

    private static final String CONST_TIMESTAMP = "timestamp";
    private static final String CONST_MESSAGE = "message";

    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;

    public AuditController(AuditLogRepository auditLogRepository, AuditService auditService) {
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> getAllAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = CONST_TIMESTAMP) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<AuditLog> auditLogs = auditLogRepository.findAll(pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') || #userId == authentication.principal")
    public ResponseEntity<Page<AuditLog>> getAuditLogsByUserId(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(CONST_TIMESTAMP).descending());
        Page<AuditLog> auditLogs = auditLogRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/module/{module}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> getAuditLogsByModule(
            @PathVariable String module,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(CONST_TIMESTAMP).descending());
        Page<AuditLog> auditLogs = auditLogRepository.findByModuleOrderByTimestampDesc(module, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/entity/{entityName}/{entityId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> getAuditLogsByEntity(
            @PathVariable String entityName,
            @PathVariable Long entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(CONST_TIMESTAMP).descending());
        Page<AuditLog> auditLogs = auditLogRepository.findByEntityNameAndEntityIdOrderByTimestampDesc(
            entityName, entityId, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> getAuditLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(CONST_TIMESTAMP).descending());
        Page<AuditLog> auditLogs = auditLogRepository.findByTimestampBetween(startDate, endDate, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/user/{userId}/date-range")
    @PreAuthorize("hasRole('ADMIN') || #userId == authentication.principal")
    public ResponseEntity<Page<AuditLog>> getAuditLogsByUserAndDateRange(
            @PathVariable String userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(CONST_TIMESTAMP).descending());
        Page<AuditLog> auditLogs = auditLogRepository.findByUserIdAndTimestampBetween(
            userId, startDate, endDate, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/module/{module}/date-range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> getAuditLogsByModuleAndDateRange(
            @PathVariable String module,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(CONST_TIMESTAMP).descending());
        Page<AuditLog> auditLogs = auditLogRepository.findByModuleAndTimestampBetween(
            module, startDate, endDate, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/reference/{referenceId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> getAuditLogsByReferenceId(@PathVariable String referenceId) {
        List<AuditLog> auditLogs = auditLogRepository.findByReferenceId(referenceId);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAuditStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        Long totalCount = auditLogRepository.countByTimestampBetween(startDate, endDate);
        List<Object[]> moduleCounts = auditLogRepository.countByModuleBetween(startDate, endDate);
        
        Map<String, Object> stats = Map.of(
            "totalCount", totalCount,
            "moduleBreakdown", moduleCounts
        );
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/login-attempts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> getLoginAttempts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(CONST_TIMESTAMP).descending());
        Page<AuditLog> auditLogs = auditLogRepository.findByActionTypeOrderByTimestampDesc("LOGIN", pageable);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/test-audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> testAuditLogging(HttpServletRequest request) {
        try {
            auditService.logCustomAction("TEST", "AUDIT", "TestEntity", null, 
                "test-user", "ADMIN", "Test audit logging", 
                null, "Test successful", null, request);
            
            return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Audit test logged successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(CONST_MESSAGE, "Failed to log audit test: " + e.getMessage()));
        }
    }

    @GetMapping("/test-claim-audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> testClaimAuditLogging(HttpServletRequest request) {
        try {
            auditService.logCustomAction("TEST_CLAIM", "CLAIM", "Claim", null, 
                "test-user", "ADMIN", "Test claim audit logging", 
                null, "Test claim successful", null, request);
            
            return ResponseEntity.ok(Map.of(CONST_MESSAGE, "Claim audit test logged successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(CONST_MESSAGE, "Failed to log claim audit test: " + e.getMessage()));
        }
    }

    @GetMapping("/failed-logins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> getFailedLogins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(CONST_TIMESTAMP).descending());
        Page<AuditLog> auditLogs = auditLogRepository.findByActionTypeOrderByTimestampDesc("LOGIN", pageable);
        
        // Filter for failed logins manually
        List<AuditLog> failedLoginsList = auditLogs.getContent().stream()
            .filter(log -> "FAILURE".equals(log.getStatus()))
            .toList();
        
        // Create a new Page with filtered results
        Page<AuditLog> failedLogins = new org.springframework.data.domain.PageImpl<>(
            failedLoginsList, 
            pageable, 
            failedLoginsList.size()
        );
        
        return ResponseEntity.ok(failedLogins);
    }
}
