package com.register.example.controller;

import com.register.example.entity.AssetCategory;
import com.register.example.service.AssetCategoryService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/assets/categories")
@CrossOrigin(origins = "*")
public class AssetCategoryController {

    private final AssetCategoryService categoryService;
    private final jakarta.servlet.http.HttpServletRequest servletRequest;
    private final com.register.example.service.EmployeeService employeeService;

    public AssetCategoryController(
            AssetCategoryService categoryService,
            jakarta.servlet.http.HttpServletRequest servletRequest,
            com.register.example.service.EmployeeService employeeService) {
        this.categoryService = categoryService;
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

    @GetMapping
    public List<AssetCategory> getAllCategories() {
        return categoryService.getAllCategories(getCurrentUserTenantId());
    }

    @GetMapping("/roots")
    public List<AssetCategory> getParentCategories() {
        return categoryService.getParentCategories(getCurrentUserTenantId());
    }

    @PostMapping
    public ResponseEntity<Object> createCategory(@RequestBody com.register.example.payload.AssetCategoryDTO categoryDto) {
        try {
            AssetCategory category = convertToEntity(categoryDto);
            return ResponseEntity.ok(categoryService.createCategory(category, getCurrentUserTenantId()));
        } catch (RuntimeException e) {
            if ("Category already exists".equals(e.getMessage())) {
                return ResponseEntity.status(409).body(java.util.Map.of("message", "Category with this name already exists."));
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<AssetCategory>> createCategories(@RequestBody List<com.register.example.payload.AssetCategoryDTO> categoriesDto) {
        List<AssetCategory> categories = categoriesDto.stream().map(this::convertToEntity).toList();
        return ResponseEntity.ok(categoryService.createCategories(categories, getCurrentUserTenantId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> updateCategory(@PathVariable Long id, @RequestBody com.register.example.payload.AssetCategoryDTO categoryDto) {
        try {
            AssetCategory category = convertToEntity(categoryDto);
            return ResponseEntity.ok(categoryService.updateCategory(id, category, getCurrentUserTenantId()));
        } catch (RuntimeException e) {
            if ("Category already exists".equals(e.getMessage())) {
                return ResponseEntity.status(409).body(java.util.Map.of("message", "Category with this name already exists."));
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteCategory(@PathVariable Long id, @RequestParam String userId) {
        try {
            categoryService.deleteCategory(id, userId, getCurrentUserTenantId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private AssetCategory convertToEntity(com.register.example.payload.AssetCategoryDTO dto) {
        if (dto == null) {
            return null;
        }
        AssetCategory entity = new AssetCategory();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setActive(!Boolean.FALSE.equals(dto.getActive()));
        entity.setTenantId(dto.getTenantId());

        if (dto.getParentCategory() != null) {
            AssetCategory parent = new AssetCategory();
            parent.setId(dto.getParentCategory().getId());
            parent.setName(dto.getParentCategory().getName());
            parent.setActive(!Boolean.FALSE.equals(dto.getParentCategory().getActive()));
            parent.setTenantId(dto.getParentCategory().getTenantId());
            entity.setParentCategory(parent);
        }

        if (dto.getFieldConfigs() != null) {
            entity.setFieldConfigs(mapFieldConfigs(dto.getFieldConfigs(), entity));
        }

        return entity;
    }

    private java.util.List<com.register.example.entity.AssetFieldConfig> mapFieldConfigs(
            java.util.List<com.register.example.payload.AssetCategoryDTO.AssetFieldConfigDTO> configsDto,
            AssetCategory category) {
        java.util.List<com.register.example.entity.AssetFieldConfig> configs = new java.util.ArrayList<>();
        for (com.register.example.payload.AssetCategoryDTO.AssetFieldConfigDTO configDto : configsDto) {
            com.register.example.entity.AssetFieldConfig config = new com.register.example.entity.AssetFieldConfig();
            config.setId(configDto.getId());
            config.setFieldName(configDto.getFieldName());
            config.setFieldType(configDto.getFieldType());
            config.setMandatory(Boolean.TRUE.equals(configDto.getMandatory()));
            config.setUniqueField(Boolean.TRUE.equals(configDto.getUniqueField()));
            config.setDisplayOrder(configDto.getDisplayOrder());
            config.setActive(!Boolean.FALSE.equals(configDto.getActive()));
            config.setTenantId(configDto.getTenantId());
            config.setCategory(category);
            configs.add(config);
        }
        return configs;
    }
}
