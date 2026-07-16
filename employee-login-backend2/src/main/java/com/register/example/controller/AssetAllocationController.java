package com.register.example.controller;

import com.register.example.entity.AssetAllocation;
import com.register.example.entity.AssetMaster;
import com.register.example.service.AssetAllocationService;
import com.register.example.service.AuditService;
import com.register.example.repository.AssetAllocationRepository;

import java.util.Map;
import java.util.HashMap;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/assets/allocations")
@CrossOrigin(origins = "*")
public class AssetAllocationController {

    private static final String CONST_ALLOCATION_DATE = "allocationDate";
    private static final String CONST_RETURN_DATE = "returnDate";
    private static final String CONST_ALLOCATION_ID = "allocationId";
    private static final String CONST_EXPECTED_RETURN_DATE = "expectedReturnDate";
    private static final String CONST_CONDITION_AT_ISSUE = "conditionAtIssue";
    private static final String CONST_ACCESSORIES_ISSUED = "accessoriesIssued";
    private static final String CONST_CONDITION_AT_RETURN = "conditionAtReturn";
    private static final String CONST_DAMAGE_NOTES = "damageNotes";
    private static final String CONST_VERIFIED_BY = "verifiedBy";
    private static final String CONST_ASSET = "asset";
    private static final String CONST_EMPLOYEE_ID = "employeeId";
    private static final String CONST_EMPLOYEE = "employee";
    private static final String CONST_RETURN_IMAGE = "returnImage";
    private static final String CONST_ASSET_ALLOCATION = "AssetAllocation";
    private static final String CONST_ASSET_ALLOCATION_UPPER = "ASSET_ALLOCATION";
    private static final String CONST_DELETE_ASSET_ALLOCATION = "DELETE_ASSET_ALLOCATION";

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AssetAllocationController.class);

    private final AssetAllocationService allocationService;
    private final AssetAllocationRepository allocationRepository;
    private final AuditService auditService;
    private final com.register.example.service.EmployeeService employeeService;

    public AssetAllocationController(
            AssetAllocationService allocationService,
            AssetAllocationRepository allocationRepository,
            AuditService auditService,
            com.register.example.service.EmployeeService employeeService) {
        this.allocationService = allocationService;
        this.allocationRepository = allocationRepository;
        this.auditService = auditService;
        this.employeeService = employeeService;
    }

    private String getCurrentUserTenantId(HttpServletRequest request) {
        try {
            Object tenantIdAttr = request.getAttribute("X-Tenant-ID-Num");
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
    public org.springframework.data.domain.Page<java.util.Map<String, Object>> getAllAllocations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            HttpServletRequest request) {
        try {
            // Validate sort field to prevent SQL injection
            java.util.Set<String> allowedSortFields = java.util.Set.of("id", CONST_ALLOCATION_ID, CONST_ALLOCATION_DATE, CONST_RETURN_DATE, "active");
            if (!allowedSortFields.contains(sortBy)) {
                sortBy = "id";
            }
            
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, size, 
                sortDir.equalsIgnoreCase("desc") ? 
                    org.springframework.data.domain.Sort.by(sortBy).descending() : 
                    org.springframework.data.domain.Sort.by(sortBy).ascending()
            );
            
            String tenantId = getCurrentUserTenantId(request);
            org.springframework.data.domain.Page<AssetAllocation> allocations = allocationService.getAllocationsPaginated(pageable, search, tenantId);
            
            return allocations.map(this::convertAllocationToMap);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    private java.util.Map<String, Object> convertAllocationToMap(AssetAllocation a) {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", a.getId());
        map.put(CONST_ALLOCATION_ID, a.getAllocationId());
        map.put(CONST_ALLOCATION_DATE, a.getAllocationDate() != null ? a.getAllocationDate().toString() : null);
        map.put(CONST_EXPECTED_RETURN_DATE, a.getExpectedReturnDate() != null ? a.getExpectedReturnDate().toString() : null);
        map.put(CONST_CONDITION_AT_ISSUE, a.getConditionAtIssue());
        map.put(CONST_ACCESSORIES_ISSUED, a.getAccessoriesIssued());
        map.put("active", a.isActive());
        map.put(CONST_RETURN_DATE, a.getReturnDate() != null ? a.getReturnDate().toString() : null);
        map.put(CONST_CONDITION_AT_RETURN, a.getConditionAtReturn());
        map.put(CONST_DAMAGE_NOTES, a.getDamageNotes());
        map.put(CONST_VERIFIED_BY, a.getVerifiedBy());
        
        if (a.getAsset() != null) {
            java.util.Map<String, Object> assetMap = new java.util.HashMap<>();
            assetMap.put("id", a.getAsset().getId());
            assetMap.put("assetTag", a.getAsset().getAssetTag());
            assetMap.put("serialNumber", a.getAsset().getSerialNumber());
            assetMap.put("status", a.getAsset().getStatus());
            assetMap.put("location", a.getAsset().getLocation());
            assetMap.put("dynamicValues", a.getAsset().getDynamicValues());
            
            if (a.getAsset().getCategory() != null) {
                java.util.Map<String, Object> catMap = new java.util.HashMap<>();
                catMap.put("id", a.getAsset().getCategory().getId());
                catMap.put("name", a.getAsset().getCategory().getName());
                assetMap.put("category", catMap);
            }
            
            if (a.getAsset().getSubCategory() != null) {
                java.util.Map<String, Object> subMap = new java.util.HashMap<>();
                subMap.put("id", a.getAsset().getSubCategory().getId());
                subMap.put("name", a.getAsset().getSubCategory().getName());
                assetMap.put("subCategory", subMap);
            }
            
            map.put(CONST_ASSET, assetMap);
        }
        
        if (a.getEmployee() != null) {
            java.util.Map<String, Object> employeeMap = new java.util.HashMap<>();
            employeeMap.put(CONST_EMPLOYEE_ID, a.getEmployee().getEmployeeId());
            employeeMap.put("firstName", a.getEmployee().getFirstName());
            employeeMap.put("lastName", a.getEmployee().getLastName());
            employeeMap.put("email", a.getEmployee().getEmail()); // Add email as well
            map.put(CONST_EMPLOYEE, employeeMap);
        }

        // Add visual evidence images
        map.put("issuedImage", a.getIssuedImageForJson());
        map.put(CONST_RETURN_IMAGE, a.getReturnImageForJson());
        
        return map;
    }

    @PostMapping
    public ResponseEntity<Object> allocateAsset(@RequestBody Map<String, Object> requestBody,
            @RequestParam String userId, HttpServletRequest request) {
        try {
            String tenantId = getCurrentUserTenantId(request);

            // Store request details for audit
            Map<String, Object> auditRequest = new HashMap<>();
            auditRequest.put(CONST_ASSET, requestBody.get(CONST_ASSET));
            auditRequest.put(CONST_EMPLOYEE, requestBody.get(CONST_EMPLOYEE));
            auditRequest.put(CONST_CONDITION_AT_ISSUE, requestBody.get(CONST_CONDITION_AT_ISSUE));
            auditRequest.put(CONST_ACCESSORIES_ISSUED, requestBody.get(CONST_ACCESSORIES_ISSUED));
            auditRequest.put(CONST_EXPECTED_RETURN_DATE, requestBody.get(CONST_EXPECTED_RETURN_DATE));
            
            // Manual mapping from Map to AssetAllocation since it contains an image string
            AssetAllocation allocation = new AssetAllocation();

            // Extract basic fields
            Object assetObj = requestBody.get(CONST_ASSET);
            if (assetObj instanceof Map) {
                Map<String, Object> assetMap = (Map<String, Object>) assetObj;
                AssetMaster asset = new AssetMaster();
                asset.setId(Long.valueOf(assetMap.get("id").toString()));
                allocation.setAsset(asset);
            } else if (assetObj != null) {
                AssetMaster asset = new AssetMaster();
                asset.setId(Long.valueOf(assetObj.toString()));
                allocation.setAsset(asset);
            }

            Object employeeObj = requestBody.get(CONST_EMPLOYEE);
            if (employeeObj instanceof Map) {
                Map<String, Object> employeeMap = (Map<String, Object>) employeeObj;
                com.register.example.entity.Employee employee = new com.register.example.entity.Employee();
                employee.setEmployeeId(employeeMap.get(CONST_EMPLOYEE_ID).toString());
                allocation.setEmployee(employee);
            } else if (employeeObj != null) {
                com.register.example.entity.Employee employee = new com.register.example.entity.Employee();
                employee.setEmployeeId(employeeObj.toString());
                allocation.setEmployee(employee);
            }

            allocation.setConditionAtIssue(
                    requestBody.get(CONST_CONDITION_AT_ISSUE) != null ? requestBody.get(CONST_CONDITION_AT_ISSUE).toString()
                            : null);
            allocation.setAccessoriesIssued(
                    requestBody.get(CONST_ACCESSORIES_ISSUED) != null ? requestBody.get(CONST_ACCESSORIES_ISSUED).toString()
                            : null);

            // Map expectedReturnDate (sent as "yyyy-MM-dd" string from frontend)
            if (requestBody.get(CONST_EXPECTED_RETURN_DATE) != null
                    && !requestBody.get(CONST_EXPECTED_RETURN_DATE).toString().isEmpty()) {
                allocation
                        .setExpectedReturnDate(
                                java.time.LocalDate.parse(requestBody.get(CONST_EXPECTED_RETURN_DATE).toString()));
            }

            String issuedImageBase64 = (String) requestBody.get("issuedImage");

            AssetAllocation result = allocationService.allocateAsset(allocation, issuedImageBase64, userId, tenantId);
            
            // Log successful asset allocation
            HashMap<String, Object> allocationResult = new HashMap<>();
            allocationResult.put(CONST_ALLOCATION_ID, result.getId());
            allocationResult.put("assetId", result.getAsset().getId());
            allocationResult.put(CONST_EMPLOYEE_ID, result.getEmployee().getEmployeeId());
            allocationResult.put(CONST_EXPECTED_RETURN_DATE, result.getExpectedReturnDate());
            
            auditService.logCustomAction("ALLOCATE_ASSET", CONST_ASSET_ALLOCATION_UPPER, CONST_ASSET_ALLOCATION, result.getId(), 
                    userId, "USER", "Asset allocated successfully", auditRequest, allocationResult, null, request);

            java.util.Map<String, Object> responseMap = new java.util.HashMap<>();
            responseMap.put("id", result.getId());
            responseMap.put("message", "Success");
            return ResponseEntity.ok(responseMap);
        } catch (Exception e) {
            e.printStackTrace();
            try {
                auditService.logCustomAction("ALLOCATE_ASSET", CONST_ASSET_ALLOCATION_UPPER, CONST_ASSET_ALLOCATION, null, 
                        userId, "USER", "Failed to allocate asset - Error: " + e.getMessage(), requestBody, null, null, request);
            } catch (Exception auditEx) {
                logger.error("Audit log failed: {}", auditEx.getMessage());
            }
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<Object> processReturn(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> returnData,
            HttpServletRequest request) {

        String conditionAtReturn = returnData.get(CONST_CONDITION_AT_RETURN);
        String returnImage = returnData.get(CONST_RETURN_IMAGE);
        String damageNotes = returnData.get(CONST_DAMAGE_NOTES);
        String verifiedBy = returnData.get(CONST_VERIFIED_BY);
        String userId = returnData.get("userId");

        try {
            // Store return data for audit
            HashMap<String, Object> returnRequest = new HashMap<>();
            returnRequest.put(CONST_CONDITION_AT_RETURN, conditionAtReturn);
            returnRequest.put(CONST_DAMAGE_NOTES, damageNotes);
            returnRequest.put(CONST_VERIFIED_BY, verifiedBy);
            returnRequest.put(CONST_RETURN_IMAGE, returnImage != null ? "[IMAGE_DATA]" : null);

            AssetAllocation result = allocationService.processReturn(id, conditionAtReturn, returnImage, damageNotes, verifiedBy, userId);
            
            // Log successful asset return
            HashMap<String, Object> returnResult = new HashMap<>();
            returnResult.put(CONST_ALLOCATION_ID, result.getId());
            returnResult.put(CONST_RETURN_DATE, result.getReturnDate());
            returnResult.put(CONST_CONDITION_AT_RETURN, result.getConditionAtReturn());
            returnResult.put(CONST_DAMAGE_NOTES, result.getDamageNotes());
            returnResult.put(CONST_VERIFIED_BY, result.getVerifiedBy());
            
            auditService.logCustomAction("RETURN_ASSET", CONST_ASSET_ALLOCATION_UPPER, CONST_ASSET_ALLOCATION, id, 
                    userId, "USER", "Asset returned successfully", returnRequest, returnResult, null, request);

            java.util.Map<String, Object> responseMap = new java.util.HashMap<>();
            responseMap.put("id", result.getId());
            responseMap.put("message", "Success");
            return ResponseEntity.ok(responseMap);
        } catch (Exception e) {
            auditService.logCustomAction("RETURN_ASSET", CONST_ASSET_ALLOCATION_UPPER, CONST_ASSET_ALLOCATION, id, 
                    userId, "USER", "Failed to return asset - Error: " + e.getMessage(), returnData, null, null, request);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAllocation(
            @PathVariable Long id,
            @RequestParam String userId,
            HttpServletRequest request) {
        try {
            // Get allocation details before deletion for audit
            AssetAllocation allocation = allocationRepository.findById(id).orElse(null);
            
            if (allocation == null) {
                auditService.logCustomAction(CONST_DELETE_ASSET_ALLOCATION, CONST_ASSET_ALLOCATION_UPPER, CONST_ASSET_ALLOCATION, id, 
                        userId, "USER", "Failed to delete asset allocation - Allocation not found", null, null, null, request);
                return ResponseEntity.notFound().build();
            }
            
            HashMap<String, Object> deletedAllocation = new HashMap<>();
            deletedAllocation.put(CONST_ALLOCATION_ID, allocation.getId());
            deletedAllocation.put(CONST_ALLOCATION_DATE, allocation.getAllocationDate());
            deletedAllocation.put("assetId", allocation.getAsset().getId());
            deletedAllocation.put(CONST_EMPLOYEE_ID, allocation.getEmployee().getEmployeeId());
            deletedAllocation.put(CONST_CONDITION_AT_ISSUE, allocation.getConditionAtIssue());
            
            allocationService.deleteAllocation(id, userId);
            
            // Log successful allocation deletion
            auditService.logCustomAction(CONST_DELETE_ASSET_ALLOCATION, CONST_ASSET_ALLOCATION_UPPER, CONST_ASSET_ALLOCATION, id, 
                    userId, "USER", "Asset allocation deleted successfully", deletedAllocation, null, null, request);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            auditService.logCustomAction(CONST_DELETE_ASSET_ALLOCATION, CONST_ASSET_ALLOCATION_UPPER, CONST_ASSET_ALLOCATION, id, 
                    userId, "USER", "Failed to delete asset allocation - Error: " + e.getMessage(), null, null, null, request);
            throw e;
        }
    }
}
