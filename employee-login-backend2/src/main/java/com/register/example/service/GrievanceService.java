package com.register.example.service;
 
import com.register.example.payload.GrievanceCreateResponse;
import com.register.example.payload.GrievanceUpdateRequest;
import com.register.example.payload.GrievanceViewResponse;
import com.register.example.entity.Grievance;
// import com.register.example.entity.AllCategories;
import com.register.example.repository.GrievanceRepository;
import com.register.example.repository.AllocationRepository;
import com.register.example.entity.Allocation;
// import com.register.example.repository.AllCategoriesRepository;
 
import com.register.example.repository.EmployeeRepository;
import com.register.example.entity.Employee;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
 
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
 
@Service
public class GrievanceService {
 
    private final GrievanceRepository repository;
    private final AllocationRepository allocationRepository;
    private final EmployeeRepository employeeRepository;
 
    public GrievanceService(
            GrievanceRepository repository,
            AllocationRepository allocationRepository,
            EmployeeRepository employeeRepository
    ) {
        this.repository = repository;
        this.allocationRepository = allocationRepository;
        this.employeeRepository = employeeRepository;
    }
 
    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            java.util.Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            if (empOpt.isPresent()) {
                return empOpt.get().getTenantId();
            }
        }
        return null;
    }
 
    private String resolveTenantId(String employeeId) {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes =
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                String tidNum = (String) request.getAttribute("X-Tenant-ID-Num");
                if (tidNum != null && !tidNum.isEmpty()) {
                    return tidNum;
                }
                String tid = (String) request.getAttribute("X-Tenant-ID");
                if (tid != null && !tid.isEmpty()) {
                    return tid;
                }
            }
        } catch (Exception ignored) {}
 
        if (employeeId != null && !employeeId.isEmpty()) {
            Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
            if (empOpt.isPresent()) {
                return empOpt.get().getTenantId();
            }
        }
 
        return getCurrentTenantId();
    }
 
    /* ========================= CREATE ANONYMOUS ============================ */
    public GrievanceCreateResponse submitAnonymous(
            String category,
            String type,
            String subject,
            String description,
            MultipartFile attachment,
            String employeeId) throws IOException {
 
        validateProjectAssignment(employeeId);
 
        validateCategory(category);
        validateType(type);
        validateSubject(subject);
        validateDescription(description);
        validateAttachment(attachment);
 
        String grievanceId = generateNextGrievanceId();
        String anonymousToken = UUID.randomUUID().toString();
        String tenantId = resolveTenantId(employeeId);
 
        Grievance grievance = new Grievance();
        grievance.setGrievanceId(grievanceId);
        grievance.setAnonymousToken(anonymousToken);
        grievance.setCategory(category);
        grievance.setType(type);
        grievance.setSubject(subject);
        grievance.setDescription(description);
        grievance.setStatus("Submitted");
        grievance.setCreatedDate(LocalDateTime.now());
        grievance.setUpdatedDate(LocalDateTime.now());
        grievance.setTenantId(tenantId);
 
        if (attachment != null && !attachment.isEmpty()) {
            grievance.setAttachmentData(attachment.getBytes());
            grievance.setAttachmentName(attachment.getOriginalFilename());
            grievance.setAttachmentContentType(attachment.getContentType());
        }
 
        repository.save(grievance);
        return new GrievanceCreateResponse(grievanceId,
                "Your feedback has been submitted anonymously.");
    }
 
    /* ========================= USER VIEW ============================ */
 
    public GrievanceViewResponse getForUser(String grievanceId) {
        String tenantId = getCurrentTenantId();
        return repository.findById(grievanceId)
                .filter(g -> tenantId == null || tenantId.equals(g.getTenantId()))
                .map(g -> toViewResponse(g, false))
                .orElse(null);
    }
 
    /* ========================= ADMIN LIST ============================ */
 
    public Page<GrievanceViewResponse> listForAdmin(String status, String category, int page, int size, String sort) {
        String tenantId = getCurrentTenantId();
 
        String[] sortParams = sort.split(",");
        String sortField = sortParams[0];
 
        Sort.Direction direction = (sortParams.length > 1 && "desc".equalsIgnoreCase(sortParams[1]))
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
 
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
 
        Page<Grievance> result;
 
        // Check which filters are provided
        boolean hasStatus = status != null && !status.isBlank();
        boolean hasCategory = category != null && !category.isBlank();
 
        if (hasStatus && hasCategory) {
            // Both filters provided
            if ("Other".equalsIgnoreCase(category)) {
                result = repository.findByStatusAndCategoryStartingWithAndTenantId(status, "Other", tenantId, pageable);
            } else {
                result = repository.findByStatusAndCategoryAndTenantId(status, category, tenantId, pageable);
            }
        } else if (hasStatus) {
            // Only status filter
            result = repository.findByStatusAndTenantId(status, tenantId, pageable);
        } else if (hasCategory) {
            // Only category filter
            if ("Other".equalsIgnoreCase(category)) {
                result = repository.findByCategoryStartingWithAndTenantId("Other", tenantId, pageable);
            } else {
                result = repository.findByCategoryAndTenantId(category, tenantId, pageable);
            }
        } else {
            // No filters - return all for tenant
            result = repository.findByTenantId(tenantId, pageable);
        }
 
        List<GrievanceViewResponse> responses = result.getContent()
                .stream()
                .map(g -> toViewResponse(g, true))
                .collect(Collectors.toList());
 
        return new PageImpl<>(responses, pageable, result.getTotalElements());
    }
 
    public List<GrievanceViewResponse> getGrievanceReport(String category, String type, String status, LocalDate start,
            LocalDate end) {
        String tenantId = getCurrentTenantId();
        LocalDateTime startDt = (start != null) ? start.atStartOfDay() : null;
        LocalDateTime endDt = (end != null) ? end.atTime(23, 59, 59) : null;
 
        List<Grievance> list = repository.getFilteredGrievances(
                (category == null || category.isBlank()) ? null : category,
                (type == null || type.isBlank()) ? null : type,
                (status == null || status.isBlank()) ? null : status,
                startDt, endDt, tenantId);
        return list.stream()
                .map(g -> toViewResponse(g, true))
                .collect(Collectors.toList());
    }
 
    /* ========================= ADMIN VIEW ============================ */
 
    public GrievanceViewResponse getForAdmin(String grievanceId) {
        String tenantId = getCurrentTenantId();
        return repository.findById(grievanceId)
                .filter(g -> tenantId == null || tenantId.equals(g.getTenantId()))
                .map(g -> toViewResponse(g, true))
                .orElse(null);
    }
 
    /* ========================= ADMIN UPDATE ============================ */
 
    public GrievanceViewResponse updateForAdmin(String grievanceId, GrievanceUpdateRequest request) {
        String tenantId = getCurrentTenantId();
        Optional<Grievance> optional = repository.findById(grievanceId);
        if (optional.isEmpty())
            return null;
 
        Grievance grievance = optional.get();
        if (tenantId != null && !tenantId.equals(grievance.getTenantId())) {
            throw new RuntimeException("Unauthorized grievance access");
        }
 
        grievance.setStatus(request.getStatus());
        grievance.setInvestigationNotes(request.getInvestigationNotes());
        grievance.setAdminResponse(request.getAdminResponse());
        grievance.setUpdatedDate(LocalDateTime.now());
 
        repository.save(grievance);
        return toViewResponse(grievance, true);
    }
 
    public byte[] getAttachmentData(String grievanceId) {
        String tenantId = getCurrentTenantId();
        return repository.findById(grievanceId)
                .filter(g -> tenantId == null || tenantId.equals(g.getTenantId()))
                .map(Grievance::getAttachmentData)
                .orElse(null);
    }
 
    public String getAttachmentName(String grievanceId) {
        String tenantId = getCurrentTenantId();
        return repository.findById(grievanceId)
                .filter(g -> tenantId == null || tenantId.equals(g.getTenantId()))
                .map(Grievance::getAttachmentName)
                .orElse(null);
    }
 
    public String getAttachmentContentType(String grievanceId) {
        String tenantId = getCurrentTenantId();
        return repository.findById(grievanceId)
                .filter(g -> tenantId == null || tenantId.equals(g.getTenantId()))
                .map(Grievance::getAttachmentContentType)
                .orElse(null);
    }
 
    /* ========================= VALIDATION ============================ */
 
    private void validateCategory(String category) {
 
        if (category == null || category.isBlank()) {
            throw new IllegalArgumentException("Category is required");
        }
 
        // Allow any category since AllCategories is commented out
        // if (category.startsWith("Other:"))
        //     return;
 
        // List<String> validCategories = categoriesRepository.findAll()
        //         .stream()
        //         .map(AllCategories::getGrievanceCategory)
        //         .filter(Objects::nonNull)
        //         .collect(Collectors.toList());
 
        // if (!validCategories.contains(category)) {
        //     throw new IllegalArgumentException("Invalid category: " + category);
        // }
    }
 
    private void validateType(String type) {
        if (type == null || type.isBlank())
            return;
 
        // Allow any type since AllCategories is commented out
        // List<String> validTypes = categoriesRepository.findAll()
        //         .stream()
        //         .map(AllCategories::getGrievanceType)
        //         .filter(Objects::nonNull)
        //         .collect(Collectors.toList());
 
        // if (!validTypes.contains(type)) {
        //     throw new IllegalArgumentException("Invalid type: " + type);
        // }
    }
 
    private void validateSubject(String subject) {
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Subject is required");
        }
        if (subject.length() > 150) {
            throw new IllegalArgumentException("Subject must be at most 150 characters");
        }
    }
 
    private void validateDescription(String description) {
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (description.length() < 10 || description.length() > 2000) {
            throw new IllegalArgumentException("Description must be between 10 and 2000 characters");
        }
    }
 
    private void validateAttachment(MultipartFile attachment) {
        if (attachment == null || attachment.isEmpty())
            return;
 
        if (attachment.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Attachment must be at most 5 MB");
        }
 
        String type = attachment.getContentType();
        if (type == null ||
                (!type.equalsIgnoreCase("application/pdf") &&
                        !type.equalsIgnoreCase("image/jpeg") &&
                        !type.equalsIgnoreCase("image/png"))) {
            throw new IllegalArgumentException("Attachment must be PDF, JPG, or PNG");
        }
    }
 
    /* ========================= ID GENERATION ============================ */
 
    private String generateNextGrievanceId() {
        int year = LocalDate.now().getYear();
        String prefix = "GRV-" + year + "-";
 
        Optional<Grievance> last = repository.findLastByPrefix(prefix);
 
        long nextNumber = 1;
 
        if (last.isPresent()) {
            String lastId = last.get().getGrievanceId();
            String numericPart = lastId.substring(prefix.length());
            try {
                nextNumber = Long.parseLong(numericPart) + 1;
            } catch (Exception ignored) {
                nextNumber = 1;
            }
        }
 
        return prefix + nextNumber;
    }
 
    /* ========================= RESPONSE MAPPER ============================ */
    private GrievanceViewResponse toViewResponse(Grievance grievance, boolean includeInternal) {
        GrievanceViewResponse response = new GrievanceViewResponse();
 
        response.setGrievanceId(grievance.getGrievanceId());
        response.setCategory(grievance.getCategory());
        response.setType(grievance.getType());
        response.setSubject(grievance.getSubject());
        response.setDescription(grievance.getDescription());
        response.setStatus(grievance.getStatus());
        response.setHasAttachment(grievance.getAttachmentData() != null && grievance.getAttachmentData().length > 0);
        response.setCreatedDate(grievance.getCreatedDate());
        response.setUpdatedDate(grievance.getUpdatedDate());
 
        if (includeInternal) {
            response.setInvestigationNotes(grievance.getInvestigationNotes());
            response.setAdminResponse(grievance.getAdminResponse());
        }
 
        return response;
    }
 
    private void validateProjectAssignment(String employeeId) {
        if (employeeId == null)
            return;
        java.time.LocalDate today = java.time.LocalDate.now();
        List<Allocation> allocations = allocationRepository
                .findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        employeeId, today, today);
 
        if (allocations == null || allocations.isEmpty()) {
            throw new RuntimeException("You are not assigned to any project , please contact your manager or admin");
        }
    }
}
 