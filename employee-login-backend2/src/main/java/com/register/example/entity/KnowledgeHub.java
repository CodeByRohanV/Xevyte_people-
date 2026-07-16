package com.register.example.entity;
 
import jakarta.persistence.*;
import java.time.LocalDateTime;
 
@Entity
@Table(name = "knowledge_hub")
public class KnowledgeHub {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(nullable = false)
    private String fileName;
 
    @Column(nullable = false)
    private String originalFileName;
 
    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] fileData;
 
    @Column(nullable = false)
    private LocalDateTime uploadedAt;
 
    @Column(name = "file_url")
    private String fileUrl;
 
    @Column(name = "category")
    private String category;
 
    @Column(name = "tenant_id")
    private String tenantId;
 
    @PrePersist
    public void initTimestamp() {
        this.uploadedAt = LocalDateTime.now();
    }
 
    // === Getters & Setters ===
 
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
 
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
 
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
 
    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }
 
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
 
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
 
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
 
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}
