package com.register.example.controller;

import com.register.example.entity.AssetMaster;
import com.register.example.service.AssetBulkService;
import com.register.example.service.AssetMasterService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetMasterController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AssetMasterController.class);

    private final AssetMasterService assetMasterService;
    private final AssetBulkService assetBulkService;
    private final jakarta.servlet.http.HttpServletRequest servletRequest;
    private final com.register.example.service.EmployeeService employeeService;

    public AssetMasterController(
            AssetMasterService assetMasterService,
            AssetBulkService assetBulkService,
            jakarta.servlet.http.HttpServletRequest servletRequest,
            com.register.example.service.EmployeeService employeeService) {
        this.assetMasterService = assetMasterService;
        this.assetBulkService = assetBulkService;
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

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate(@RequestParam(required = false) List<String> columns) {
        try {
            byte[] report = assetBulkService.generateTemplate(columns, getCurrentUserTenantId());
            return ResponseEntity.ok()
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .header("Content-Disposition", "attachment; filename=asset_template.xlsx")
                    .body(report);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/import")
    public ResponseEntity<Object> importAssets(@RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam String userId) {
        try {
            return assetBulkService.importAssets(file, userId, getCurrentUserTenantId());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Import failed: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<Object> getAllAssets() {
        String tenantId = getCurrentUserTenantId();
        List<AssetMaster> assets = assetMasterService.getAllAssets(tenantId);
        logger.info("Controller: retrieved {} assets for tenant: {}", assets.size(), tenantId);
        return ResponseEntity.ok(assets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getAssetById(@PathVariable Long id) {
        AssetMaster asset = assetMasterService.getAssetById(id);
        if (asset == null) {
            return ResponseEntity.status(404).body("Asset not found with id: " + id);
        }
        return ResponseEntity.ok(asset);
    }

    @PostMapping
    public ResponseEntity<Object> createAsset(@RequestBody com.register.example.payload.AssetMasterDTO assetDto, @RequestParam String userId) {
        String tenantId = getCurrentUserTenantId();
        AssetMaster asset = convertToEntity(assetDto);
        logger.info("Controller: creating asset with tag: {} for tenant: {}", asset.getAssetTag(), tenantId);
        AssetMaster created = assetMasterService.createAsset(asset, userId, tenantId);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetMaster> updateAsset(@PathVariable Long id, @RequestBody com.register.example.payload.AssetMasterDTO assetDto,
            @RequestParam String userId) {
        logger.info("Controller: Received PUT request for asset ID: {} from user: {}", id, userId);
        AssetMaster asset = convertToEntity(assetDto);
        return ResponseEntity.ok(assetMasterService.updateAsset(id, asset, userId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id, @RequestParam String status,
            @RequestParam String userId) {
        assetMasterService.updateStatus(id, status, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<java.util.Map<String, Long>> getSummary() {
        return ResponseEntity.ok(assetMasterService.getSummary(getCurrentUserTenantId()));
    }

    @GetMapping("/dashboard-data")
    public ResponseEntity<Object> getDashboardData() {
        return ResponseEntity.ok(assetMasterService.getDashboardData(getCurrentUserTenantId()));
    }

    @GetMapping("/available")
    public ResponseEntity<List<Map<String, Object>>> getAvailableAssets() {
        return ResponseEntity.ok(assetMasterService.getAvailableAssets(getCurrentUserTenantId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id, @RequestParam String userId) {
        assetMasterService.deleteAsset(id, userId);
        return ResponseEntity.ok().build();
    }

    private AssetMaster convertToEntity(com.register.example.payload.AssetMasterDTO dto) {
        if (dto == null) {
            return null;
        }
        AssetMaster entity = new AssetMaster();
        entity.setId(dto.getId());
        entity.setAssetId(dto.getAssetId());
        entity.setAssetTag(dto.getAssetTag());
        entity.setSerialNumber(dto.getSerialNumber());
        entity.setStatus(dto.getStatus());
        entity.setConditionAtStock(dto.getConditionAtStock());
        entity.setPrice(dto.getPrice());
        entity.setLocation(dto.getLocation());
        entity.setNotes(dto.getNotes());
        entity.setActive(!Boolean.FALSE.equals(dto.getActive()));
        entity.setCreatedBy(dto.getCreatedBy());
        entity.setSourceSystem(dto.getSourceSystem());
        entity.setExternalAssetId(dto.getExternalAssetId());
        if (dto.getCreationMode() != null) {
            try {
                entity.setCreationMode(AssetMaster.CreationMode.valueOf(dto.getCreationMode()));
            } catch (Exception e) {
                entity.setCreationMode(AssetMaster.CreationMode.MANUAL);
            }
        }
        if (dto.getDynamicValues() != null) {
            entity.setDynamicValues(dto.getDynamicValues());
        }

        // Category mapping
        if (dto.getCategoryId() != null) {
            com.register.example.entity.AssetCategory category = new com.register.example.entity.AssetCategory();
            category.setId(dto.getCategoryId());
            entity.setCategory(category);
        }

        // Subcategory mapping
        if (dto.getSubCategoryId() != null) {
            com.register.example.entity.AssetCategory subCategory = new com.register.example.entity.AssetCategory();
            subCategory.setId(dto.getSubCategoryId());
            entity.setSubCategory(subCategory);
        }

        // Employee mapping
        if (dto.getAssignedToEmployeeId() != null) {
            com.register.example.entity.Employee emp = new com.register.example.entity.Employee();
            emp.setEmployeeId(dto.getAssignedToEmployeeId());
            entity.setAssignedToEmployee(emp);
        }

        return entity;
    }
}
