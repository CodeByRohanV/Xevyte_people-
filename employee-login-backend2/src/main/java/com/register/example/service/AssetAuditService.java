package com.register.example.service;

import com.register.example.entity.AssetAuditLog;
import com.register.example.repository.AssetAuditLogRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AssetAuditService {

    @Autowired
    private AssetAuditLogRepository auditLogRepository;

    public void log(String actionType, Long assetId, String assetTag, String userId, String oldValue, String newValue) {
        log(actionType, assetId, assetTag, userId, oldValue, newValue, null);
    }

    public void log(String actionType, Long assetId, String assetTag, String userId, String oldValue, String newValue, String tenantId) {
        AssetAuditLog log = new AssetAuditLog();
        log.setActionType(actionType);
        log.setAssetId(assetId);
        log.setAssetTag(assetTag);
        log.setUserId(userId);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setTimestamp(LocalDateTime.now());
        // log.setIpAddress(...); // Could be set if available in context
        auditLogRepository.save(log);
    }

    public java.util.List<java.util.Map<String, Object>> getRecentLogs(int limit) {
        return auditLogRepository.findTop5ByOrderByTimestampDesc().stream().map(log -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", log.getId());
            map.put("actionDate", log.getTimestamp());
            map.put("assetTag", log.getAssetTag());
            map.put("action", log.getActionType());
            map.put("performedBy", log.getUserId());
            map.put("oldStatus", log.getOldValue());
            map.put("newStatus", log.getNewValue());
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    public java.util.List<java.util.Map<String, Object>> getRecentLogs(int limit, String tenantId) {
        return auditLogRepository.findTop5ByUserIdStartingWithOrderByTimestampDesc(tenantId + "_").stream().map(log -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", log.getId());
            map.put("actionDate", log.getTimestamp());
            map.put("assetTag", log.getAssetTag());
            map.put("action", log.getActionType());
            map.put("performedBy", log.getUserId());
            map.put("oldStatus", log.getOldValue());
            map.put("newStatus", log.getNewValue());
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void deleteAuditLog(Long logId, String userId, String tenantId) {
        AssetAuditLog log = auditLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Audit log not found"));
        
        if (tenantId != null) {
            String logTenantId = null;
            if (log.getUserId() != null && log.getUserId().contains("_")) {
                logTenantId = log.getUserId().split("_")[0];
            }
            if (logTenantId != null && !tenantId.equals(logTenantId)) {
                throw new RuntimeException("Audit log not found");
            }
        }
        
        auditLogRepository.delete(log);
    }

    @Transactional
    public void deleteAllAuditLogs(String userId, String tenantId) {
        // Need to delete by tenant
        List<AssetAuditLog> logs = auditLogRepository.findAll().stream()
                .filter(log -> log.getUserId() != null && log.getUserId().startsWith(tenantId + "_"))
                .collect(java.util.stream.Collectors.toList());
        auditLogRepository.deleteAll(logs);
    }

    @Transactional
    public void deleteAuditLogsOlderThan(int days, String userId, String tenantId) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
        List<AssetAuditLog> logsToDelete = auditLogRepository.findByTimestampBeforeAndUserIdStartingWith(cutoffDate, tenantId + "_");
        auditLogRepository.deleteAll(logsToDelete);
    }
}
