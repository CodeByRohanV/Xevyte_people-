package com.register.example.service;

import com.register.example.entity.AuditLog;
import com.register.example.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    @Lazy
    private AuditService self;

    // Cache for deduplication - stores last action timestamp per user+action+module
    private final ConcurrentHashMap<String, LocalDateTime> actionCache = new ConcurrentHashMap<>();
    
    // Time window for deduplication (in seconds)
    private static final int DEDUPLICATION_WINDOW_SECONDS = 5;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(String actionType, String module, String entityName, Long entityId,
                         String userId, String userType, String description,
                         Object oldValue, Object newValue, String ipAddress,
                         String userAgent, String status, String errorMessage,
                         String referenceId) {
        
        // Ensure userId is not null (as it is likely required by DB and entity)
        String finalUserId = (userId != null && !userId.trim().isEmpty()) ? userId : "SYSTEM";
        
        // Create deduplication key
        String dedupeKey = finalUserId + "|" + actionType + "|" + module + "|" + (entityId != null ? entityId.toString() : "null");
        
        // Check for recent duplicate action
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastActionTime = actionCache.get(dedupeKey);
        
        if (lastActionTime != null && ChronoUnit.SECONDS.between(lastActionTime, now) < DEDUPLICATION_WINDOW_SECONDS) {
            // Skip logging duplicate action within time window
            return;
        }
        
        // Update cache with current timestamp
        actionCache.put(dedupeKey, now);
        
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setActionType(actionType);
            auditLog.setModule(module);
            auditLog.setEntityName(entityName);
            auditLog.setEntityId(entityId);
            auditLog.setUserId(finalUserId);
            auditLog.setUserType(userType);
            auditLog.setDescription(description);
            auditLog.setTimestamp(now);
            auditLog.setIpAddress(ipAddress);
            auditLog.setUserAgent(userAgent);
            auditLog.setStatus(status);
            auditLog.setErrorMessage(errorMessage);
            auditLog.setReferenceId(referenceId);

            if (oldValue != null) {
                auditLog.setOldValue(objectMapper.writeValueAsString(oldValue));
            }
            if (newValue != null) {
                auditLog.setNewValue(objectMapper.writeValueAsString(newValue));
            }

            auditLogRepository.save(auditLog);
            auditLogRepository.flush(); // Force flush to catch and handle DB constraints within this try-catch
        } catch (Exception e) {
            logger.error("Failed to log audit entry - constraint or other DB error: {}", e.getMessage());
            // Don't re-throw to avoid breaking the main business flow
        }
    }

    public void logCreate(String module, String entityName, Long entityId, String userId,
                         String userType, String description, Object newValue,
                         HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        
        self.logAction("CREATE", module, entityName, entityId, userId, userType, description,
                 null, newValue, ipAddress, userAgent, "SUCCESS", null, null);
    }

    public void logUpdate(String module, String entityName, Long entityId, String userId,
                         String userType, String description, Object oldValue, Object newValue,
                         HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        
        self.logAction("UPDATE", module, entityName, entityId, userId, userType, description,
                 oldValue, newValue, ipAddress, userAgent, "SUCCESS", null, null);
    }

    public void logDelete(String module, String entityName, Long entityId, String userId,
                         String userType, String description, Object oldValue,
                         HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        
        self.logAction("DELETE", module, entityName, entityId, userId, userType, description,
                 oldValue, null, ipAddress, userAgent, "SUCCESS", null, null);
    }

    public void logLogin(String userId, String userType, String status, String errorMessage,
                         HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        
        self.logAction("LOGIN", "AUTH", "User", null, userId, userType,
                 "User login attempt", null, null, ipAddress, userAgent, status, errorMessage, null);
    }

    public void logLogout(String userId, String userType, HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        
        self.logAction("LOGOUT", "AUTH", "User", null, userId, userType,
                 "User logout", null, null, ipAddress, userAgent, "SUCCESS", null, null);
    }

    public void logApprove(String module, String entityName, Long entityId, String userId,
                          String userType, String description, String referenceId,
                          HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        
        self.logAction("APPROVE", module, entityName, entityId, userId, userType, description,
                 null, null, ipAddress, userAgent, "SUCCESS", null, referenceId);
    }

    public void logReject(String module, String entityName, Long entityId, String userId,
                         String userType, String description, String referenceId,
                         HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        
        self.logAction("REJECT", module, entityName, entityId, userId, userType, description,
                 null, null, ipAddress, userAgent, "SUCCESS", null, referenceId);
    }

    public void logCustomAction(String actionType, String module, String entityName, Long entityId,
                               String userId, String userType, String description,
                               Object oldValue, Object newValue, String referenceId,
                               HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        
        self.logAction(actionType, module, entityName, entityId, userId, userType, description,
                 oldValue, newValue, ipAddress, userAgent, "SUCCESS", null, referenceId);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) return null;
        
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsByUserId(String userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId, null).getContent();
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsByModule(String module) {
        return auditLogRepository.findByModuleOrderByTimestampDesc(module, null).getContent();
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsByEntity(String entityName, Long entityId) {
        return auditLogRepository.findByEntityNameAndEntityIdOrderByTimestampDesc(entityName, entityId, null).getContent();
    }
}
