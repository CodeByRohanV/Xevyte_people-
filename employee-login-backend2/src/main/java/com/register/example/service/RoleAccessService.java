package com.register.example.service;

import com.register.example.entity.RoleAccess;
import com.register.example.repository.RoleAccessRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.*;

@Service
public class RoleAccessService {

    @Autowired
    private RoleAccessRepository repo;

    @Autowired
    private com.register.example.repository.EmployeeRepository employeeRepository;

    private String resolveTenantPrefix() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String currentEmployeeId = auth.getName();
            if (currentEmployeeId != null) {
                if (currentEmployeeId.contains("_")) {
                    return currentEmployeeId.split("_")[0];
                }
                java.util.Optional<com.register.example.entity.Employee> currentEmpOpt = employeeRepository.findByEmployeeId(currentEmployeeId);
                if (currentEmpOpt.isPresent()) {
                    String tenantId = currentEmpOpt.get().getTenantId();
                    if (tenantId != null && !tenantId.isEmpty()) {
                        return tenantId;
                    }
                }
            }
        }
        return null;
    }

    private String ensurePrefixed(String id, String prefix) {
        if (id == null) return null;
        if ("ALL".equalsIgnoreCase(id.trim())) return "ALL";
        if (prefix == null || prefix.isEmpty()) return id.trim();
        
        String cleanId = id.trim();
        if (cleanId.startsWith(prefix + "_")) {
            return cleanId;
        }
        if (cleanId.startsWith(prefix + "-")) {
            return prefix + "_" + cleanId.substring(prefix.length() + 1);
        }
        if (cleanId.contains("_")) {
            cleanId = cleanId.substring(cleanId.lastIndexOf("_") + 1);
        } else if (cleanId.contains("-") && !cleanId.startsWith(prefix)) {
            cleanId = cleanId.substring(cleanId.lastIndexOf("-") + 1);
        }
        return prefix + "_" + cleanId;
    }

    private boolean isCurrentTenantId(String id, String prefix) {
        if (id == null) return false;
        if (prefix == null || prefix.isEmpty()) return true;
        return id.startsWith(prefix + "_") || id.startsWith(prefix + "-") || (!id.contains("_") && !id.contains("-"));
    }

    // ✅ CREATE or UPDATE role (REPLACE IDs — NOT MERGE)
    @Transactional
    public RoleAccess saveRoleAccess(String roleName, List<String> employeeIds) {

        RoleAccess access = repo.findByRoleName(roleName)
                .orElseGet(() -> {
                    RoleAccess r = new RoleAccess();
                    r.setRoleName(roleName);
                    return r;
                });

        String prefix = resolveTenantPrefix();

        // 1. Prefix and sanitize incoming IDs for the current tenant
        List<String> incomingPrefixedIds = employeeIds == null
                ? Collections.emptyList()
                : employeeIds.stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(id -> ensurePrefixed(id, prefix))
                    .toList();

        // 2. Keep existing IDs from other tenants
        Set<String> finalIds = new LinkedHashSet<>();
        String existing = access.getEmployeeIds();
        if (existing != null && !existing.trim().isEmpty()) {
            Arrays.stream(existing.split(","))
                    .map(String::trim)
                    .filter(id -> !id.isEmpty())
                    // If it belongs to another tenant, keep it!
                    .filter(id -> !isCurrentTenantId(id, prefix))
                    .forEach(finalIds::add);
        }

        // 3. Add current tenant's new IDs
        finalIds.addAll(incomingPrefixedIds);

        access.setEmployeeIds(String.join(",", finalIds));
        return repo.save(access);
    }

    // ✅ GET IDs for a role
    public List<String> getEmployeeIds(String roleName) {
        RoleAccess access = repo.findByRoleName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        if (access.getEmployeeIds() == null || access.getEmployeeIds().isBlank()) {
            return Collections.emptyList();
        }

        String prefix = resolveTenantPrefix();

        return Arrays.stream(access.getEmployeeIds().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                // Only return IDs that belong to the resolved tenant prefix!
                .filter(id -> isCurrentTenantId(id, prefix))
                .toList();
    }

    // ✅ CHECK role membership
    public boolean isEmployeeInRole(String roleName, String employeeId) {
        Optional<RoleAccess> access = repo.findByRoleName(roleName);
        if (access.isEmpty()) {
            return false; // Role doesn't exist, so employee can't be in it
        }

        String idsString = access.get().getEmployeeIds();
        if (idsString == null || idsString.isBlank()) {
            return false;
        }

        String prefix = resolveTenantPrefix();
        String prefixedEmployeeId = ensurePrefixed(employeeId, prefix);

        return Arrays.stream(idsString.split(","))
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .filter(id -> isCurrentTenantId(id, prefix))
                .map(id -> ensurePrefixed(id, prefix))
                .anyMatch(id -> id.equals(prefixedEmployeeId));
    }
    
    @Transactional
    public RoleAccess removeEmployeeId(String roleName, String employeeId) {

        RoleAccess access = repo.findByRoleName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        if (access.getEmployeeIds() == null || access.getEmployeeIds().isBlank()) {
            return access;
        }

        String prefix = resolveTenantPrefix();
        String prefixedEmployeeId = ensurePrefixed(employeeId, prefix);

        List<String> updatedIds = Arrays.stream(access.getEmployeeIds().split(","))
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .filter(id -> {
                    // Keep if it belongs to another tenant
                    if (!isCurrentTenantId(id, prefix)) {
                        return true;
                    }
                    // For current tenant, remove if it matches target ID
                    return !ensurePrefixed(id, prefix).equals(prefixedEmployeeId);
                })
                .toList();

        access.setEmployeeIds(String.join(",", updatedIds));
        return repo.save(access);
    }

}
