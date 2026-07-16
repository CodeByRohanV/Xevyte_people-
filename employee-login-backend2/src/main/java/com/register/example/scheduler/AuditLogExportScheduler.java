package com.register.example.scheduler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.register.example.entity.AssetAuditLog;
import com.register.example.entity.AuditLog;
import com.register.example.repository.AssetAuditLogRepository;
import com.register.example.repository.AuditLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@Slf4j
public class AuditLogExportScheduler {

    private final AuditLogRepository auditLogRepository;
    private final AssetAuditLogRepository assetAuditLogRepository;
    private final S3Client s3Client;
    private final ObjectMapper objectMapper;

    @Value("${aws.s3.bucket-name:}")
    private String bucketName;

    public AuditLogExportScheduler(AuditLogRepository auditLogRepository,
                                   AssetAuditLogRepository assetAuditLogRepository,
                                   S3Client s3Client) {
        this.auditLogRepository = auditLogRepository;
        this.assetAuditLogRepository = assetAuditLogRepository;
        this.s3Client = s3Client;
        this.objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    // For testing, we export EVERYTHING up to the current second. 
    // (In production, we usually keep today's logs for quick lookup)
    @Scheduled(cron = "0 * * * * ?")
    public void exportLogsToS3() {
        if (bucketName == null || bucketName.trim().isEmpty()) {
            log.warn("S3 bucket name not configured. Skipping audit log export.");
            return;
        }
        log.info("Starting audit log export to S3...");
        
        LocalDateTime now = LocalDateTime.now();
        
        exportAuditLogs(now);
        exportAssetAuditLogs(now);
        
        log.info("Audit log export completed.");
    }

    private void exportAuditLogs(LocalDateTime cutoffDate) {
        try {
            List<AuditLog> logs = auditLogRepository.findByTimestampBefore(cutoffDate);
            if (logs.isEmpty()) {
                log.info("No general audit logs to export for period before {}", cutoffDate);
                return;
            }

            String datePath = cutoffDate.format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
            String fileName = String.format("app-audit-logs-%s-%d.json", 
                    cutoffDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")), 
                    System.currentTimeMillis());
            String s3Key = "audit-logs/" + datePath + "/" + fileName;

            String jsonContent = objectMapper.writeValueAsString(logs);
            
            uploadToS3(s3Key, jsonContent);
            
            auditLogRepository.deleteAll(logs);
            log.info("Successfully exported and deleted {} general audit logs to S3: {}", logs.size(), s3Key);
            
        } catch (Exception e) {
            log.error("Error during general audit log export: {}", e.getMessage(), e);
        }
    }

    private void exportAssetAuditLogs(LocalDateTime cutoffDate) {
        try {
            List<AssetAuditLog> logs = assetAuditLogRepository.findByTimestampBefore(cutoffDate);
            if (logs.isEmpty()) {
                log.info("No asset audit logs to export for period before {}", cutoffDate);
                return;
            }

            String datePath = cutoffDate.format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
            String fileName = String.format("asset-audit-logs-%s-%d.json", 
                    cutoffDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")), 
                    System.currentTimeMillis());
            String s3Key = "audit-logs/" + datePath + "/" + fileName;

            String jsonContent = objectMapper.writeValueAsString(logs);
            
            uploadToS3(s3Key, jsonContent);
            
            assetAuditLogRepository.deleteAll(logs);
            log.info("Successfully exported and deleted {} asset audit logs to S3: {}", logs.size(), s3Key);
            
        } catch (Exception e) {
            log.error("Error during asset audit log export: {}", e.getMessage(), e);
        }
    }

    private void uploadToS3(String key, String content) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("application/json")
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromString(content));
    }
}
