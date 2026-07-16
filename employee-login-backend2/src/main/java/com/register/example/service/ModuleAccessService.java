package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.ModuleAccess;
import com.register.example.entity.Tenant;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.ModuleAccessRepository;
import com.register.example.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ModuleAccessService {

    @Autowired
    private ModuleAccessRepository repository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private String resolveTenantPrefix() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String currentEmployeeId = auth.getName();
            if (currentEmployeeId != null) {
                if (currentEmployeeId.contains("_")) {
                    return currentEmployeeId.split("_")[0];
                }
                java.util.Optional<Employee> currentEmpOpt = employeeRepository.findByEmployeeId(currentEmployeeId);
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

    // =====================================================
    // ✅ SAVE / UPDATE MODULE ACCESS
    // =====================================================
    @Transactional
    public ModuleAccess saveAccess(String moduleKey, List<String> incomingIds) {

        ModuleAccess access = repository.findByModuleKeySafe(moduleKey)
                .orElseGet(() -> {
                    ModuleAccess m = new ModuleAccess();
                    m.setModuleKey(moduleKey);
                    m.setEmployeeIds("");
                    return m;
                });

        // ✅ ALL case (override everything)
        if (incomingIds.size() == 1 && "ALL".equalsIgnoreCase(incomingIds.get(0))) {
            access.setEmployeeIds("ALL");
            return repository.save(access);
        }

        String prefix = resolveTenantPrefix();
        Set<String> finalIds = new LinkedHashSet<>();

        // existing IDs
        String existing = access.getEmployeeIds();
        if (existing != null && !existing.trim().isEmpty() && !"ALL".equalsIgnoreCase(existing)) {
            Arrays.stream(existing.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(id -> {
                        if (isCurrentTenantId(id, prefix)) {
                            finalIds.add(ensurePrefixed(id, prefix));
                        } else {
                            finalIds.add(id);
                        }
                    });
        }

        // incoming IDs
        incomingIds.stream()
                .map(String::trim)
                .filter(id -> !id.isEmpty() && !"ALL".equalsIgnoreCase(id))
                .map(id -> ensurePrefixed(id, prefix))
                .forEach(finalIds::add);

        access.setEmployeeIds(finalIds.isEmpty() ? "" : String.join(",", finalIds));
        return repository.save(access);
    }

    // =====================================================
    // ✅ FETCH IDS FOR MODULE (CRITICAL FIX)
    // =====================================================
    public List<String> getEmployeeIdsByModule(String moduleKey) {

        return repository.findByModuleKeySafe(moduleKey)
                .map(m -> {
                    String empIds = m.getEmployeeIds();

                    // 🔥 NULL / EMPTY → return empty list
                    if (empIds == null || empIds.trim().isEmpty()) {
                        return Collections.<String>emptyList();
                    }

                    // 🔥 ALL
                    if ("ALL".equalsIgnoreCase(empIds.trim())) {
                        return List.of("ALL");
                    }

                    String prefix = resolveTenantPrefix();

                    // 🔥 NORMAL CASE
                    return Arrays.stream(empIds.split(","))
                            .map(String::trim)
                            .filter(id -> !id.isEmpty())
                            .filter(id -> isCurrentTenantId(id, prefix))
                            .toList();
                })
                .orElse(Collections.emptyList());
    }

    // =====================================================
    // ✅ SIDEBAR ACCESS CHECK
    // =====================================================
    public Map<String, Boolean> getAccessForEmployee(String employeeId) {
        Map<String, Boolean> map = new HashMap<>();

        String prefix = resolveTenantPrefix();
        String prefixedEmployeeId = ensurePrefixed(employeeId, prefix);

        // Fetch employee to check their tenant
        Employee employee = employeeRepository.findByEmployeeId(prefixedEmployeeId).orElse(null);
        
        boolean isAdminOrSubAdmin = false;
        if (employee != null && employee.getRole() != null) {
            String r = employee.getRole().trim().toUpperCase();
            if (r.equals("ADMIN") || r.equals("SUB ADMIN") || r.equals("SUB_ADMIN")) {
                isAdminOrSubAdmin = true;
            }
        }

        for (ModuleAccess m : repository.findAll()) {
            String moduleKey = m.getModuleKey().toUpperCase();

            if ("ADMIN".equals(moduleKey) && isAdminOrSubAdmin) {
                map.put(m.getModuleKey(), true);
                continue;
            }

            // 2. Employee Level Check (Existing logic)
            String empIds = m.getEmployeeIds();

            if ("ALL".equalsIgnoreCase(empIds)) {
                map.put(m.getModuleKey(), true);
            } else if (empIds != null && !empIds.trim().isEmpty()) {
                List<String> ids = Arrays.stream(empIds.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(id -> ensurePrefixed(id, prefix))
                        .toList();
                map.put(m.getModuleKey(), ids.contains(prefixedEmployeeId));
            } else {
                map.put(m.getModuleKey(), false);
            }
        }

        if (isAdminOrSubAdmin) {
            map.put("ADMIN", true);
            map.put("Admin", true);
        }

        return map;
    }

    // =====================================================
    // ✅ DELETE SINGLE EMPLOYEE FROM MODULE (FIXED)
    // =====================================================
    @Transactional
    public void removeEmployeeFromModule(String moduleKey, String employeeId) {

        ModuleAccess access = repository.findByModuleKeySafe(moduleKey)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        String empIds = access.getEmployeeIds();

        if (empIds == null || empIds.trim().isEmpty()) {
            return;
        }

        if ("ALL".equalsIgnoreCase(empIds.trim())) {
            access.setEmployeeIds("");
            repository.save(access);
            return;
        }

        String prefix = resolveTenantPrefix();
        String prefixedEmployeeId = ensurePrefixed(employeeId, prefix);
        List<String> remaining = new ArrayList<>();

        for (String id : empIds.split(",")) {
            String clean = id.trim();
            if (!clean.isEmpty()) {
                if (!isCurrentTenantId(clean, prefix)) {
                    remaining.add(clean);
                } else {
                    String prefixedClean = ensurePrefixed(clean, prefix);
                    if (!prefixedClean.equalsIgnoreCase(prefixedEmployeeId)) {
                        remaining.add(prefixedClean);
                    }
                }
            }
        }

        access.setEmployeeIds(remaining.isEmpty() ? "" : String.join(",", remaining));
        repository.save(access);
    }
}
