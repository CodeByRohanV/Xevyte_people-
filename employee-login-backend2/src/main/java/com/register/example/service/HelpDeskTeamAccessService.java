package com.register.example.service;

import com.register.example.entity.HelpDeskTeamAccess;
import com.register.example.repository.HelpDeskTeamAccessRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.entity.Employee;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HelpDeskTeamAccessService {

    private final HelpDeskTeamAccessRepository repo;
    private final EmployeeRepository employeeRepository;

    public HelpDeskTeamAccessService(HelpDeskTeamAccessRepository repo, EmployeeRepository employeeRepository) {
        this.repo = repo;
        this.employeeRepository = employeeRepository;
    }

    private String getCurrentTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String employeeId = auth.getName();
            if (employeeId != null) {
                if (employeeId.contains("_")) {
                    return employeeId.split("_")[0];
                }
                java.util.Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
                if (empOpt.isPresent()) {
                    return empOpt.get().getTenantId();
                }
            }
        }
        return null;
    }

    private String getCurrentTenantCode() {
        String tenantCode = null;
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                String tid = (String) request.getAttribute("X-Tenant-ID");
                if (tid != null && !tid.isEmpty()) {
                    tenantCode = tid;
                } else {
                    String tidNum = (String) request.getAttribute("X-Tenant-ID-Num");
                    if (tidNum != null && !tidNum.isEmpty()) {
                        tenantCode = tidNum;
                    }
                }
            }
        } catch (Exception ignored) {}
        if (tenantCode == null) {
            org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                String employeeId = auth.getName();
                java.util.Optional<Employee> empOpt = employeeRepository.findByEmployeeId(employeeId);
                if (empOpt.isPresent()) {
                    tenantCode = empOpt.get().getTenantId();
                } else if (employeeId != null && employeeId.contains("_")) {
                    tenantCode = employeeId.split("_")[0];
                }
            }
        }
        return tenantCode;
    }

    // Save or Update team access
    public HelpDeskTeamAccess saveTeamAccess(String teamName, List<String> employeeIds) {
        String tenantId = getCurrentTenantId();
        String tenantCode = getCurrentTenantCode();

        List<String> prefixedEmployeeIds = employeeIds.stream()
                .map(id -> {
                    if (id == null) return null;
                    String trimmed = id.trim();
                    if (tenantCode != null && !trimmed.contains("_") && !trimmed.startsWith(tenantCode)) {
                        return tenantCode + "_" + trimmed;
                    }
                    return trimmed;
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        HelpDeskTeamAccess existing = repo.findByRoleNameAndTenantId(teamName, tenantId).orElse(null);

        if (existing == null) {
            // Create new team with provided IDs
            String combinedIds = String.join(",", prefixedEmployeeIds);
            HelpDeskTeamAccess newAccess = new HelpDeskTeamAccess(teamName, combinedIds, tenantId);
            return repo.save(newAccess);
        }

        // TEAM EXISTS → REPLACE with new IDs (not append)
        String combinedIds = String.join(",", prefixedEmployeeIds);
        existing.setTeamIds(combinedIds);
        existing.setTenantId(tenantId);
        return repo.save(existing);
    }

    public List<String> getTeamsForEmployee(String employeeId) {
        String tenantId = getCurrentTenantId();
        List<String> teams = new ArrayList<>();
        List<HelpDeskTeamAccess> all = (tenantId != null) ? repo.findByTenantId(tenantId) : repo.findAll();

        for (HelpDeskTeamAccess t : all) {
            if (t.getTeamIds() != null) {
                String[] ids = t.getTeamIds().split(",");
                for (String id : ids) {
                    if (id.trim().equals(employeeId.trim())) {
                        teams.add(t.getRoleName());
                        break;
                    }
                }
            }
        }

        return teams; // Return ALL teams for employee
    }

    public boolean hasExactTeamAccess(String employeeId) {
        String tenantId = getCurrentTenantId();
        List<HelpDeskTeamAccess> all = (tenantId != null) ? repo.findByTenantId(tenantId) : repo.findAll();

        for (HelpDeskTeamAccess t : all) {
            if (t.getTeamIds() != null) {
                // Split comma-separated team IDs
                String[] ids = t.getTeamIds().split(",");
                // Exact match check
                for (String id : ids) {
                    if (id.trim().equals(employeeId)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public HelpDeskTeamAccess getTeamAccessByRoleName(String roleName) {
        String tenantId = getCurrentTenantId();
        return repo.findByRoleNameAndTenantId(roleName, tenantId).orElse(null);
    }

    public List<String> getAllTeamNames() {
        String tenantId = getCurrentTenantId();
        List<String> names = new ArrayList<>();
        List<HelpDeskTeamAccess> all = (tenantId != null) ? repo.findByTenantId(tenantId) : repo.findAll();
        for (HelpDeskTeamAccess t : all) {
            names.add(t.getRoleName());
        }
        return names;
    }

    /**
     * Get list of employee IDs that were removed from a team
     * by comparing old IDs with new IDs
     */
    public List<String> getRemovedEmployeeIds(String teamName, List<String> newIds) {
        String tenantId = getCurrentTenantId();
        String tenantCode = getCurrentTenantCode();

        List<String> prefixedNewIds = newIds.stream()
                .map(id -> {
                    if (id == null) return null;
                    String trimmed = id.trim();
                    if (tenantCode != null && !trimmed.contains("_") && !trimmed.startsWith(tenantCode)) {
                        return tenantCode + "_" + trimmed;
                    }
                    return trimmed;
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        List<String> removedIds = new ArrayList<>();

        HelpDeskTeamAccess existing = repo.findByRoleNameAndTenantId(teamName, tenantId).orElse(null);
        if (existing == null || existing.getTeamIds() == null || existing.getTeamIds().isEmpty()) {
            return removedIds; // No existing members, so no one was removed
        }

        // Get old IDs
        String[] oldIdsArray = existing.getTeamIds().split(",");
        List<String> oldIds = new ArrayList<>();
        for (String id : oldIdsArray) {
            if (id != null && !id.trim().isEmpty()) {
                oldIds.add(id.trim());
            }
        }

        // Find IDs that were in old list but not in new list
        for (String oldId : oldIds) {
            if (!prefixedNewIds.contains(oldId)) {
                removedIds.add(oldId);
            }
        }

        return removedIds;
    }

}
