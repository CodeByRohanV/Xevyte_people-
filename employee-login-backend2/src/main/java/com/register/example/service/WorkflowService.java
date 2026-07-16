package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.EmployeeDocument;
import com.register.example.entity.Tenant;
import com.register.example.payload.WorkflowUploadRequest;
import com.register.example.repository.EmployeeDocumentRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WorkflowService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmployeeDocumentRepository documentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private TenantRepository tenantRepository;

    @Value("${file.storage.base.dir:./uploads/workflow}")
    private String fileStorageBaseDir;

    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            if (employeeId != null) {
                String prefix = null;
                if (employeeId.contains("_")) {
                    prefix = employeeId.split("_")[0];
                }
                if (prefix != null && !prefix.isEmpty()) {
                    if (prefix.matches("\\d+")) {
                        return prefix;
                    }
                    Optional<Tenant> tOpt = tenantRepository.findByTenantId(prefix);
                    if (tOpt.isPresent()) return tOpt.get().getTenantId();
                }
                Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
                if (empOpt.isPresent()) {
                    String empTid = empOpt.get().getTenantId();
                    if (empTid != null && !empTid.isEmpty()) {
                        // If it's a subdomain (non-numeric), resolve to numeric ID
                        if (!empTid.matches("\\d+")) {
                            Optional<Tenant> tOpt = tenantRepository.findByTenantId(empTid);
                            if (tOpt.isPresent()) return tOpt.get().getTenantId();
                        }
                        return empTid;
                    }
                }
            }
        }
        return null;
    }

    private String getCurrentTenantCode() {
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            // Check if employeeId itself is prefixed like "xevyte-0005_H100663"
            if (employeeId != null && employeeId.contains("_")) {
                return employeeId.split("_")[0];
            }
            Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            if (empOpt.isPresent()) {
                String empTid = empOpt.get().getTenantId();
                if (empTid != null && !empTid.isEmpty()) {
                    if (empTid.matches("\\d+")) {
                        Optional<Tenant> tOpt = tenantRepository.findByTenantId(empTid);
                        if (tOpt.isPresent()) return tOpt.get().getTenantId();
                    } else {
                        return empTid; // already a subdomain code
                    }
                }
            }
        }
        return null;
    }

    /**
     * Prefix a clean employee ID (e.g. H100663) with tenantCode_ (e.g. xevyte-0005_H100663).
     * If already prefixed correctly, return as-is.
     */
    private String prefixWithTenantCode(String id, String tenantCode) {
        if (id == null) return null;
        String trimmed = id.trim();
        if (tenantCode == null || tenantCode.isEmpty()) return trimmed;
        if (trimmed.startsWith(tenantCode + "_")) return trimmed;
        // If already has any prefix (e.g. old numeric prefix), strip it
        if (trimmed.contains("_")) {
            String actualId = trimmed.split("_", 2)[1];
            return tenantCode + "_" + actualId;
        }
        return tenantCode + "_" + trimmed;
    }

    /**
     * Fetch all active employee IDs filtered by tenantId if available
     */
    private List<String> getAllEmployeeIds(String tenantId) {
        List<Employee> employees;
        if (tenantId != null && !tenantId.isEmpty()) {
            employees = employeeRepository.findByTenantId(tenantId);
        } else {
            employees = List.of();
        }
        return employees.stream()
                .filter(e -> {
                    if (e.getActive() == null)
                        return false;
                    String val = e.getActive().trim().toLowerCase();
                    return val.equals("yes") || val.equals("y") ||
                            val.equals("true") || val.equals("1") ||
                            val.equals("active");
                })
                .map(Employee::getEmployeeId)
                .collect(Collectors.toList());
    }

    /**
     * Handles workflow document uploads
     */
    public void processWorkflowUpload(WorkflowUploadRequest request) throws Exception {

        MultipartFile file = request.getFile();
        String employeeIdsInput = request.getEmployeeIds();
        String category = request.getCategory(); // NOW STRING BASED
        Integer year = request.getYear(); // ⭐ read year from request
        String adminUploaderId = "SYSTEM_ADMIN_ID";

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty.");
        }

        if (category == null || category.trim().isEmpty()) {
            throw new IllegalArgumentException("Category cannot be empty.");
        }

        if (year == null) {
            throw new IllegalArgumentException("Year cannot be empty.");
        }

        String tenantId = getCurrentTenantId();
        String tenantCode = getCurrentTenantCode();

        // 1. Resolve employee list
        List<String> targetEmployeeIds;

        if ("ALL_EMPLOYEES".equalsIgnoreCase(employeeIdsInput)) {
            // For policy uploads, use all employees of this tenant (already prefixed in DB)
            targetEmployeeIds = getAllEmployeeIds(tenantId);
        } else {
            // For individual uploads, prefix each clean ID with tenantCode_
            targetEmployeeIds = Arrays.stream(employeeIdsInput.split(","))
                    .map(String::trim)
                    .filter(id -> !id.isEmpty())
                    .map(id -> prefixWithTenantCode(id, tenantCode))
                    .collect(Collectors.toList());
        }

        if (targetEmployeeIds.isEmpty()) {
            throw new IllegalArgumentException("No valid employee IDs provided.");
        }

        // 2. Store file (use category string)
        String cleanCategory = category.replaceAll("\\s+", "_").toUpperCase();
        String uniqueFileName = cleanCategory + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        String storagePath = uniqueFileName;

        Path targetLocation = Paths.get(fileStorageBaseDir).resolve(uniqueFileName);
        java.nio.file.Files.createDirectories(targetLocation.getParent());
        java.nio.file.Files.copy(
                file.getInputStream(),
                targetLocation,
                java.nio.file.StandardCopyOption.REPLACE_EXISTING);

        System.out.println("Workflow Document Saved at: " + targetLocation);

        // 3. Save DB entry for each employee
        for (String employeeId : targetEmployeeIds) {

            EmployeeDocument doc = new EmployeeDocument();
            doc.setEmployeeId(employeeId);
            doc.setDocumentCategory(category);
            doc.setStoragePath(storagePath);
            doc.setDocumentName(file.getOriginalFilename());
            doc.setUploadedBy(adminUploaderId);
            doc.setYear(year); // ⭐ store selected year



            documentRepository.save(doc);

            // Send notification
            String message = "You have received a new document in category: " + category;
            notificationService.sendWorkflowNotification(employeeId, message);
        }
    }

    /**
     * Fetch ALL documents for logged-in employee (no year filter)
     * - used by existing /documents endpoint
     */
    public List<EmployeeDocument> getDocumentsByEmployeeId(String employeeId) {
        if (employeeId == null || employeeId.trim().isEmpty()) {
            throw new IllegalArgumentException("Employee ID cannot be empty.");
        }
        return documentRepository.findByEmployeeId(employeeId);
    }

    /**
     * Fetch documents for employee filtered by year
     * - you can use this in a new endpoint later if needed
     */
    public List<EmployeeDocument> getDocumentsByEmployeeIdAndYear(String employeeId, Integer year) {
        if (employeeId == null || employeeId.trim().isEmpty()) {
            throw new IllegalArgumentException("Employee ID cannot be empty.");
        }
        if (year == null) {
            throw new IllegalArgumentException("Year cannot be empty.");
        }
        return documentRepository.findByEmployeeIdAndYear(employeeId, year);
    }

    /**
     * Load PDF as Resource
     */
    public Resource getDocumentFile(Long documentId) throws IOException {

        EmployeeDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new FileNotFoundException("Document not found: " + documentId));

        Path baseLocation = Paths.get(fileStorageBaseDir).toAbsolutePath().normalize();
        Path filePath = baseLocation.resolve(doc.getStoragePath()).normalize();

        if (!java.nio.file.Files.exists(filePath)) {
            throw new FileNotFoundException("File not found: " + filePath);
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new FileNotFoundException("File unreadable: " + filePath);

        } catch (MalformedURLException e) {
            throw new FileNotFoundException("Invalid file path: " + doc.getStoragePath());
        }
    }

    /**
     * Validate employee ID list (case-insensitive and trimmed).
     * Accepts clean IDs (e.g. H100663) and also tries tenantCode_ID form.
     */
    public Map<String, Object> validateEmployeeIds(List<String> ids) {
        if (ids == null) {
            return Map.of(
                    "valid", true,
                    "existing", java.util.Collections.emptyList(),
                    "missing", java.util.Collections.emptyList());
        }

        String tenantCode = getCurrentTenantCode();

        List<String> cleanedIds = ids.stream()
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .collect(Collectors.toList());

        // Build a list that includes both the raw ID and the tenantCode-prefixed form for lookup
        List<String> lookupIds = cleanedIds.stream()
                .flatMap(id -> {
                    List<String> variants = new ArrayList<>();
                    variants.add(id.toLowerCase());
                    if (tenantCode != null && !tenantCode.isEmpty()) {
                        variants.add(prefixWithTenantCode(id, tenantCode).toLowerCase());
                    }
                    return variants.stream();
                })
                .distinct()
                .collect(Collectors.toList());

        List<String> existingLower = employeeRepository.findExistingEmployeeIds(lookupIds);

        List<String> missing = new ArrayList<>();
        List<String> existing = new ArrayList<>();

        for (String originalId : cleanedIds) {
            String rawLower = originalId.toLowerCase();
            String prefixedLower = tenantCode != null ?
                    prefixWithTenantCode(originalId, tenantCode).toLowerCase() : rawLower;
            if (existingLower.contains(rawLower) || existingLower.contains(prefixedLower)) {
                existing.add(originalId);
            } else {
                missing.add(originalId);
            }
        }

        boolean allValid = missing.isEmpty();

        return Map.of(
                "valid", allValid,
                "existing", existing,
                "missing", missing);
    }

    /**
     * Legacy Bulk Upload Notification Method (used nowhere but kept)
     */
    public String uploadDocument(String employeeIds, String category, MultipartFile file) {

        String message = "You have received a new document in category: " + category;

        if (!employeeIds.equals("ALL_EMPLOYEES")) {

            List<String> empList = Arrays.asList(employeeIds.split(","));
            notificationService.sendWorkflowBulkNotification(empList, message);

            return "Uploaded successfully & notified " + empList.size() + " employee(s).";
        } else {

            List<String> allEmpIds = employeeRepository.findAll()
                    .stream()
                    .map(Employee::getEmployeeId)
                    .toList();

            notificationService.sendWorkflowBulkNotification(allEmpIds, message);

            return "Uploaded successfully & notified ALL employees.";
        }
    }

    /**
     * Delete document from DB and disk
     */
    public void deleteDocument(Long documentId) throws IOException {
        EmployeeDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new FileNotFoundException("Document not found: " + documentId));

        Path baseLocation = Paths.get(fileStorageBaseDir).toAbsolutePath().normalize();
        Path filePath = baseLocation.resolve(doc.getStoragePath()).normalize();

        // Delete from disk
        java.nio.file.Files.deleteIfExists(filePath);

        // Delete from DB
        documentRepository.deleteById(documentId);
    }
}
