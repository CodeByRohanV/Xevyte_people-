package com.register.example.controller;

import com.register.example.entity.AssetDropdownOption;
import com.register.example.service.AssetDropdownOptionService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/assets/options")
@CrossOrigin(origins = "*")
public class AssetDropdownOptionController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AssetDropdownOptionController.class);

    private final AssetDropdownOptionService service;
    private final jakarta.servlet.http.HttpServletRequest servletRequest;
    private final com.register.example.service.EmployeeService employeeService;

    public AssetDropdownOptionController(
            AssetDropdownOptionService service,
            jakarta.servlet.http.HttpServletRequest servletRequest,
            com.register.example.service.EmployeeService employeeService) {
        this.service = service;
        this.servletRequest = servletRequest;
        this.employeeService = employeeService;
    }

    private String getCurrentUserTenantId() {
        try {
            Object tenantIdAttr = servletRequest.getAttribute("X-Tenant-ID-Num");
            if (tenantIdAttr != null) {
                return tenantIdAttr.toString();
            }
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() != null) {
                String employeeId = auth.getPrincipal().toString();
                com.register.example.entity.Employee emp = employeeService.getEmployeeByEmployeeId(employeeId);
                if (emp != null) {
                    return emp.getTenantId();
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        return null;
    }

    @GetMapping("/{type}")
    public List<AssetDropdownOption> getOptions(@PathVariable String type) {
        return service.getOptionsByType(type.toUpperCase(), getCurrentUserTenantId());
    }

    @GetMapping("/batch")
    public Map<String, List<AssetDropdownOption>> getBatchOptions(@RequestParam List<String> types) {
        Map<String, List<AssetDropdownOption>> results = new HashMap<>();
        String tenantId = getCurrentUserTenantId();
        for (String type : types) {
            results.put(type.toUpperCase(), service.getOptionsByType(type.toUpperCase(), tenantId));
        }
        return results;
    }

    @PostMapping("/{type}")
    public ResponseEntity<Object> addOption(@PathVariable String type, @RequestBody Object payload) {
        try {
            String cleanValue;
            Boolean mandatory = false;
            
            if (payload instanceof String payloadStr) {
                // Backward compatibility - old format (just string value)
                cleanValue = payloadStr.replace("\"", "").trim();
            } else if (payload instanceof Map<?, ?> payloadMap) {
                // New format - JSON object with value and mandatory
                cleanValue = String.valueOf(payloadMap.get("value")).replace("\"", "").trim();
                mandatory = Boolean.valueOf(String.valueOf(payloadMap.get("mandatory")));
            } else {
                return ResponseEntity.badRequest().build();
            }
            
            if (cleanValue.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            return ResponseEntity.ok(service.addOption(type.toUpperCase(), cleanValue, mandatory, getCurrentUserTenantId()));
        } catch (RuntimeException e) {
            if ("Option already exists".equals(e.getMessage())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "This option already exists.");
                return ResponseEntity.status(409).body(error);
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error adding option: {}", e.getMessage(), e);
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOption(@PathVariable Long id) {
        service.deleteOption(id, getCurrentUserTenantId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> updateOption(@PathVariable Long id, @RequestBody com.register.example.payload.AssetDropdownOptionDTO optionDto) {
        try {
            logger.debug("DEBUG: Controller - Received update request for ID: {}", id);
            logger.debug("DEBUG: Controller - Received option DTO: {}", optionDto);
            AssetDropdownOption option = convertToEntity(optionDto);
            logger.debug("DEBUG: Controller - Received sortOrder: {}", option.getSortOrder());
            return ResponseEntity.ok(service.updateOption(id, option, getCurrentUserTenantId()));
        } catch (RuntimeException e) {
            if ("Option already exists".equals(e.getMessage())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "This option already exists.");
                return ResponseEntity.status(409).body(error);
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    private AssetDropdownOption convertToEntity(com.register.example.payload.AssetDropdownOptionDTO dto) {
        if (dto == null) {
            return null;
        }
        AssetDropdownOption entity = new AssetDropdownOption();
        entity.setId(dto.getId());
        entity.setType(dto.getType());
        entity.setValue(dto.getValue());
        entity.setSortOrder(dto.getSortOrder());
        entity.setMandatory(Boolean.TRUE.equals(dto.getMandatory()));
        entity.setShowInInventory(!Boolean.FALSE.equals(dto.getShowInInventory()));
        entity.setTenantId(dto.getTenantId());
        return entity;
    }
}
