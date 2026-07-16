package com.register.example.service;

import com.register.example.entity.AdminAccess;
import com.register.example.repository.AdminAccessRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.register.example.entity.DocumentCategory;
import com.register.example.repository.DocumentCategoryRepository;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import com.register.example.entity.Employee;
import com.register.example.entity.TravelRequest;
import com.register.example.entity.Tenant;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.TravelRequestRepository;
import com.register.example.repository.TenantRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;

@Service
public class AdminAccessService {

    @Autowired
    private AdminAccessRepository repo;

    @Autowired
    private DocumentCategoryRepository categoryRepo;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TravelRequestRepository travelRequestRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Transactional
    public void updateTravelAdmin(List<String> newAdminIds) {
        String tenantId = getCurrentTenantId();
        String tenantCode = getCurrentTenantCode();
 
        String resolvedTenantCode = resolveTenantCode(tenantId, tenantCode);
 
        List<String> prefixedAdminIds = newAdminIds.stream()
                .map(id -> prefixAdminId(id, resolvedTenantCode, tenantId))
                .filter(s -> s != null && !s.trim().isEmpty())
                .collect(Collectors.toList());
 
        String newAdminIdsStr = String.join(",", prefixedAdminIds);
 
        // Fetch only current tenant employees
        String resolvedTenant = (resolvedTenantCode != null && !resolvedTenantCode.isEmpty()) ? resolvedTenantCode : tenantId;
        List<Employee> tenantEmployees;
        if (resolvedTenant != null && !resolvedTenant.isEmpty()) {
            tenantEmployees = employeeRepository.findByTenantId(resolvedTenant);
        } else {
            tenantEmployees = List.of();
        }
 
        // 2. Update tenant employees with the new list
        for (Employee emp : tenantEmployees) {
            emp.setTravelAdmin(newAdminIdsStr);
        }
        employeeRepository.saveAll(tenantEmployees);
 
        // 3. Move ALL non-terminal requests that belong to this tenant's employees to the new admin pool.
        //    Terminal statuses (Booked, Rejected, Cancelled, Downloaded) should NOT be reassigned.
        java.util.Set<String> terminalStatuses = java.util.Set.of(
                "booked", "rejected", "cancelled", "downloaded"
        );
 
        if (!newAdminIdsStr.isEmpty() && !tenantEmployees.isEmpty()) {
            java.util.Set<String> tenantEmployeeIds = tenantEmployees.stream()
                    .map(Employee::getEmployeeId)
                    .collect(Collectors.toSet());
 
            List<TravelRequest> requestsToMigrate = getRequestsToMigrate(tenantEmployeeIds, terminalStatuses, newAdminIdsStr);
 
            for (TravelRequest req : requestsToMigrate) {
                req.setTravelAdmin(newAdminIdsStr);
            }
            travelRequestRepository.saveAll(requestsToMigrate);
 
            System.out.println("[TravelAdmin] Migrated " + requestsToMigrate.size()
                    + " request(s) for tenant employees to new admin(s) " + newAdminIdsStr);
        }
    }

    private String resolveTenantCode(String tenantId, String tenantCode) {
        if (tenantCode == null || tenantCode.isEmpty()) {
            if (tenantId != null && !tenantId.isEmpty()) {
                if (tenantId.matches("\\d+")) {
                    try {
                        java.util.Optional<com.register.example.entity.Tenant> tOpt = tenantRepository.findById(Long.parseLong(tenantId));
                        if (tOpt.isPresent()) {
                            return tOpt.get().getTenantId();
                        }
                    } catch (Exception ignored) {}
                } else {
                    return tenantId;
                }
            }
        }
        return tenantCode;
    }

    private String prefixAdminId(String id, String finalTenantCode, String tenantId) {
        if (id == null) return null;
        String trimmed = id.trim();
        if (finalTenantCode == null || finalTenantCode.isEmpty()) {
            if (tenantId != null && !trimmed.contains("_") && !trimmed.startsWith(tenantId)) {
                return tenantId + "_" + trimmed;
            }
            return trimmed;
        }
        if (trimmed.startsWith(finalTenantCode + "_")) {
            return trimmed;
        }
        if (trimmed.contains("_")) {
            String actualId = trimmed.split("_", 2)[1];
            return finalTenantCode + "_" + actualId;
        }
        return finalTenantCode + "_" + trimmed;
    }

    private List<TravelRequest> getRequestsToMigrate(java.util.Set<String> tenantEmployeeIds, java.util.Set<String> terminalStatuses, String newAdminIdsStr) {
        return travelRequestRepository.findAll().stream()
                .filter(r -> {
                    // Skip terminal records
                    if (r.getStatus() == null) return false;
                    if (terminalStatuses.contains(r.getStatus().toLowerCase())) return false;
                    
                    // Check if this request belongs to the current tenant
                    if (!tenantEmployeeIds.contains(r.getEmployeeId())) return false;
                    
                    // Check if the request's travelAdmin is different from the new admin string
                    String assigned = r.getTravelAdmin();
                    return assigned == null || !assigned.trim().equals(newAdminIdsStr.trim());
                })
                .collect(Collectors.toList());
    }
 
 
    public AdminAccess saveAdminAccess(String roleName, List<String> employeeIds) {
        String tenantId = getCurrentTenantId();
        String tenantCode = getCurrentTenantCode();
        
        List<String> prefixedEmployeeIds = employeeIds.stream()
                .map(id -> {
                    if (id == null) return null;
                    String trimmed = id.trim();
                    if (tenantCode == null || tenantCode.isEmpty()) {
                        if (tenantId != null && !trimmed.contains("_") && !trimmed.startsWith(tenantId)) {
                            return tenantId + "_" + trimmed;
                        }
                        return trimmed;
                    }
                    
                    if (trimmed.startsWith(tenantCode + "_")) {
                        return trimmed;
                    }
                    
                    if (trimmed.contains("_")) {
                        String actualId = trimmed.split("_", 2)[1];
                        return tenantCode + "_" + actualId;
                    }
                    
                    return tenantCode + "_" + trimmed;
                })
                .filter(s -> s != null && !s.trim().isEmpty())
                .collect(Collectors.toList());
 
        AdminAccess access = repo.findByRoleNameAndTenantId(roleName, tenantId)
                .orElse(new AdminAccess());
 
        access.setRoleName(roleName);
        access.setEmployeeIds(String.join(",", prefixedEmployeeIds));
        access.setTenantId(tenantId);
 
        return repo.save(access);
    }
 
    public List<String> getAdminIds(String roleName) {
        String tenantId = getCurrentTenantId();
        return repo.findByRoleNameAndTenantId(roleName, tenantId)
                .map(a -> Arrays.asList(a.getEmployeeIds().split(",")))
                .orElse(Collections.emptyList());
    }
 
    public boolean isAdmin(String roleName, String employeeId) {
        String tenantId = getCurrentTenantId();
        return repo.findByRoleNameAndTenantId(roleName, tenantId)
                .map(a -> {
                    List<String> list = Arrays.asList(a.getEmployeeIds().split(","));
                    if (list.contains(employeeId)) {
                        return true;
                    }
                    return matchCleanId(list, employeeId);
                })
                .orElse(false);
    }

    private boolean matchCleanId(List<String> list, String employeeId) {
        if (employeeId == null) {
            return false;
        }
        String cleanId = employeeId.contains("_") ? employeeId.split("_", 2)[1] : employeeId;
        for (String idInDb : list) {
            String cleanDbId = idInDb.contains("_") ? idInDb.split("_", 2)[1] : idInDb;
            if (cleanId.equalsIgnoreCase(cleanDbId)) {
                return true;
            }
        }
        return false;
    }
 
    // --------------------- WORKFLOW CATEGORIES ---------------------
 
    private String getCurrentTenantId() {
        String tenantIdNum = getTenantIdFromRequest();
        if (tenantIdNum == null) {
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                String employeeId = auth.getName();
                tenantIdNum = getTenantIdFromEmployee(employeeId);
            }
        }
        return tenantIdNum;
    }

    private String getTenantIdFromRequest() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                String tidNum = (String) request.getAttribute("X-Tenant-ID-Num");
                if (tidNum != null && !tidNum.isEmpty()) {
                    return tidNum;
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String getTenantIdFromEmployee(String employeeId) {
        if (employeeId == null) {
            return null;
        }
        java.util.Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
        if (empOpt.isPresent()) {
            String empTid = empOpt.get().getTenantId();
            if (empTid != null && !empTid.isEmpty()) {
                if (empTid.matches("\\d+")) {
                    return empTid;
                }
                java.util.Optional<Tenant> tOpt = tenantRepository.findByTenantId(empTid);
                if (tOpt.isPresent()) {
                    return tOpt.get().getTenantId();
                }
            }
        }
        if (employeeId.contains("_")) {
            String prefix = employeeId.split("_")[0];
            if (prefix.matches("\\d+")) {
                return prefix;
            }
            if (prefix.contains("-")) {
                java.util.Optional<Tenant> tOpt = tenantRepository.findByTenantId(prefix);
                if (tOpt.isPresent()) {
                    return tOpt.get().getTenantId();
                }
            }
        }
        return null;
    }
 
    private String getCurrentTenantCode() {
        String tenantCode = getTenantCodeFromRequest();
        if (tenantCode == null) {
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                String employeeId = auth.getName();
                tenantCode = getTenantCodeFromEmployee(employeeId);
            }
        }
        return tenantCode;
    }

    private String getTenantCodeFromRequest() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                String tid = (String) request.getAttribute("X-Tenant-ID");
                if (tid != null && !tid.isEmpty()) {
                    return tid;
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String getTenantCodeFromEmployee(String employeeId) {
        if (employeeId == null) {
            return null;
        }
        if (employeeId.contains("_") && employeeId.contains("-")) {
            return employeeId.split("_")[0];
        }
        java.util.Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
        if (empOpt.isPresent()) {
            String empTid = empOpt.get().getTenantId();
            if (empTid != null && !empTid.isEmpty()) {
                if (empTid.contains("-") || !empTid.matches("\\d+")) {
                    return empTid;
                }
                java.util.Optional<Tenant> tOpt = tenantRepository.findByTenantId(empTid);
                if (tOpt.isPresent()) {
                    return tOpt.get().getTenantId();
                }
            }
        }
        return null;
    }

    // Add category using only LABEL (auto generate key)
    public DocumentCategory saveCategory(String label) {

        if (label == null || label.trim().isEmpty()) {
            throw new RuntimeException("Category label cannot be empty");
        }

        DocumentCategory c = new DocumentCategory();
        c.setCategoryLabel(label.trim());

        // Auto-generate KEY
        String key = label.trim()
                .toUpperCase()
                .replaceAll("[^A-Z0-9 ]", "") // remove special characters
                .replace(" ", "_"); // replace spaces with underscore

        c.setCategoryKey(key);

        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            c.setTenantId(tenantId);
        }

        return categoryRepo.save(c);
    }

    public List<DocumentCategory> getAllCategories() {
        String tenantId = getCurrentTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return categoryRepo.findByTenantId(tenantId);
        }
        return categoryRepo.findAll();
    }

    public void deleteCategory(Long id) {
        categoryRepo.deleteById(id);
    }
}
